import { 
  waitlist, type Waitlist, type InsertWaitlist,
  users, type User, type InsertUser,
  articles, type Article, type InsertArticle,
  comments, type Comment, type InsertComment,
  follows, bookmarks, readingHistory, userPreferences,
  badges, userBadges, supportTickets
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

export interface IStorage {
  // User management
  addToWaitlist(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;

  // Article management
  createArticle(article: InsertArticle): Promise<Article>;
  getArticleById(id: number): Promise<Article | undefined>;
  getUserArticles(userId: number): Promise<Article[]>;
  updateArticle(id: number, data: Partial<Article>): Promise<Article>;
  incrementArticleViews(id: number): Promise<void>;
  getAllArticles(): Promise<Article[]>;

  // Social features
  followUser(followerId: number, followingId: number): Promise<void>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getArticleComments(articleId: number): Promise<Comment[]>;
  getReplies(commentId: number): Promise<Comment[]>;
  likeComment(commentId: number): Promise<void>;
  getCommentWithReplies(commentId: number): Promise<Comment & { replies: Comment[] }>;

  // Bookmarks and History
  addBookmark(userId: number, articleId: number): Promise<void>;
  removeBookmark(userId: number, articleId: number): Promise<void>;
  getUserBookmarks(userId: number): Promise<Article[]>;
  addToReadingHistory(userId: number, articleId: number): Promise<void>;
  getUserReadingHistory(userId: number): Promise<Article[]>;
}

class Storage implements IStorage {
  // User management
  async addToWaitlist(entry: InsertWaitlist): Promise<Waitlist> {
    const [result] = await db.insert(waitlist).values(entry).returning();
    return result;
  }

  async getWaitlistCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(waitlist);
    return Number(result[0].count);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Article management
  async createArticle(article: InsertArticle): Promise<Article> {
    const [result] = await db.insert(articles).values(article).returning();
    return result;
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getUserArticles(userId: number): Promise<Article[]> {
    return db.select().from(articles).where(eq(articles.authorId, userId));
  }

  async updateArticle(id: number, data: Partial<Article>): Promise<Article> {
    const [article] = await db
      .update(articles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async incrementArticleViews(id: number): Promise<void> {
    await db
      .update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(eq(articles.id, id));
  }

  async getAllArticles(): Promise<Article[]> {
    const result = await db
      .select({
        article: articles,
        author: users,
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .orderBy(desc(articles.createdAt));

    return result.map(r => ({
      ...r.article,
      author: r.author,
    }));
  }

  // Social features
  async followUser(followerId: number, followingId: number): Promise<void> {
    await db.insert(follows).values({ followerId, followingId });
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
  }

  async getFollowers(userId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followerId))
      .where(eq(follows.followingId, userId));

    return result.map(r => r.user);
  }

  async getFollowing(userId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followingId))
      .where(eq(follows.followerId, userId));

    return result.map(r => r.user);
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return !!result;
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const [result] = await db.insert(comments).values(comment).returning();
    return result;
  }

  async getArticleComments(articleId: number): Promise<Comment[]> {
    const result = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(and(eq(comments.articleId, articleId), sql`${comments.parentId} IS NULL`))
      .orderBy(desc(comments.createdAt));

    return result.map(r => ({
      ...r.comment,
      user: r.user,
    }));
  }

  async getReplies(commentId: number): Promise<Comment[]> {
    const result = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(eq(comments.parentId, commentId))
      .orderBy(desc(comments.createdAt));

    return result.map(r => ({
      ...r.comment,
      user: r.user,
    }));
  }

  async getCommentWithReplies(commentId: number): Promise<Comment & { replies: Comment[] }> {
    const [comment] = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(eq(comments.id, commentId));

    if (!comment) {
      throw new Error("Comment not found");
    }

    const replies = await this.getReplies(commentId);

    return {
      ...comment.comment,
      user: comment.user,
      replies,
    };
  }

  async likeComment(commentId: number): Promise<void> {
    await db
      .update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, commentId));
  }

  // Bookmarks and History
  async addBookmark(userId: number, articleId: number): Promise<void> {
    await db.insert(bookmarks).values({ userId, articleId });
  }

  async removeBookmark(userId: number, articleId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.articleId, articleId)
        )
      );
  }

  async getUserBookmarks(userId: number): Promise<Article[]> {
    const result = await db
      .select({
        article: articles
      })
      .from(bookmarks)
      .innerJoin(articles, eq(articles.id, bookmarks.articleId))
      .where(eq(bookmarks.userId, userId));

    return result.map(r => r.article);
  }

  async addToReadingHistory(userId: number, articleId: number): Promise<void> {
    await db.insert(readingHistory).values({ userId, articleId });
  }

  async getUserReadingHistory(userId: number): Promise<Article[]> {
    const result = await db
      .select({
        article: articles
      })
      .from(readingHistory)
      .innerJoin(articles, eq(articles.id, readingHistory.articleId))
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.readAt));

    return result.map(r => r.article);
  }
}

export const storage = new Storage();