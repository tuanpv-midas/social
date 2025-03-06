import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { passport } from "./auth";
import type { User } from "@shared/schema";
import type { IVerifyOptions } from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import pgSession from "connect-pg-simple";

const PostgresqlStore = pgSession(session);

export async function registerRoutes(app: Express) {
  // Session setup
  app.use(
    session({
      store: new PostgresqlStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
      }),
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(data.email);

      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: IVerifyOptions | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu." });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...user } = req.user as any;
    res.json(user);
  });

  // Article management
  app.post("/api/articles", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const authorId = (req.user as any).id;
      
      // Validate article data
      const { title, content, tags } = req.body;
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Title is required and must be a string" });
      }
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required and must be a string" });
      }

      // Validate tags if provided
      const validatedTags = Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string') : [];

      const article = await storage.createArticle({
        title, // Use original title with HTML
        content,
        authorId,
        status: "published",
        views: 0,
        likes: 0,
        likedBy: [],
        bookmarkedBy: [],
        viewedBy: [],
        tags: validatedTags,
      });

      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Social features
  app.post("/api/users/:id/follow", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const followerId = (req.user as any).id;
      const followingId = parseInt(req.params.id);

      await storage.followUser(followerId, followingId);
      res.json({ message: "Successfully followed user" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/unfollow", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const followerId = (req.user as any).id;
      const followingId = parseInt(req.params.id);

      await storage.unfollowUser(followerId, followingId);
      res.json({ message: "Successfully unfollowed user" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New endpoint to check if current user is following a specific user
  app.get("/api/users/:id/following/check", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const followerId = (req.user as any).id;
      const followingId = parseInt(req.params.id);

      const isFollowing = await storage.isFollowing(followerId, followingId);
      res.json(isFollowing);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comments
  app.post("/api/articles/:id/comments", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const articleId = parseInt(req.params.id);
      const { content, parentId } = req.body;

      const comment = await storage.createComment({
        content,
        articleId,
        userId,
        parentId: parentId || null,
      });

      // If this is a reply, get the entire comment thread
      if (parentId) {
        const parentComment = await storage.getCommentWithReplies(parentId);
        res.json(parentComment);
      } else {
        res.json(comment);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/articles/:id/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const comments = await storage.getArticleComments(articleId);

      // For each comment, get its replies
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await storage.getReplies(comment.id);
          return { ...comment, replies };
        })
      );

      res.json(commentsWithReplies);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/comments/:id/like", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const commentId = parseInt(req.params.id);
      await storage.likeComment(commentId);
      res.json({ message: "Comment liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Like/unlike article
  app.post("/api/articles/:id/like", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const articleId = parseInt(req.params.id);

      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check if user has already liked the article
      const likedBy = (article.likedBy as number[]) || [];
      const userIndex = likedBy.indexOf(userId);
      
      if (userIndex === -1) {
        // User hasn't liked the article yet, add like
        likedBy.push(userId);
        await storage.updateArticle(articleId, { 
          likedBy,
          likes: (article.likes || 0) + 1
        });
        res.json({ message: "Article liked successfully" });
      } else {
        // User already liked the article, remove like
        likedBy.splice(userIndex, 1);
        await storage.updateArticle(articleId, { 
          likedBy,
          likes: Math.max(0, (article.likes || 0) - 1)
        });
        res.json({ message: "Article unliked successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bookmarks
  app.post("/api/articles/:id/bookmark", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const articleId = parseInt(req.params.id);

      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check if user has already bookmarked the article
      const bookmarkedBy = (article.bookmarkedBy as number[]) || [];
      const userIndex = bookmarkedBy.indexOf(userId);
      
      if (userIndex === -1) {
        // User hasn't bookmarked the article yet, add bookmark
        bookmarkedBy.push(userId);
        await storage.updateArticle(articleId, { bookmarkedBy });
        await storage.addBookmark(userId, articleId);
        res.json({ message: "Article bookmarked successfully" });
      } else {
        // User already bookmarked the article, remove bookmark
        bookmarkedBy.splice(userIndex, 1);
        await storage.updateArticle(articleId, { bookmarkedBy });
        await storage.removeBookmark(userId, articleId);
        res.json({ message: "Bookmark removed successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.get("/api/me/bookmarks", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reading History
  app.post("/api/articles/:id/view", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const articleId = parseInt(req.params.id);

      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check if user has already viewed the article
      const viewedBy = (article.viewedBy as number[]) || [];
      if (!viewedBy.includes(userId)) {
        viewedBy.push(userId);
        await storage.updateArticle(articleId, { viewedBy });
        await storage.incrementArticleViews(articleId);
        await storage.addToReadingHistory(userId, articleId);
      }
      
      res.json({ message: "View count updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/me/reading-history", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const history = await storage.getUserReadingHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const data = insertWaitlistSchema.parse(req.body);
      const entry = await storage.addToWaitlist(data);
      res.json(entry);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/waitlist/count", async (_req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return createServer(app);
}