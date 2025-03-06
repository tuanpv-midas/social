import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Article, type Comment, type User } from "@shared/schema";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, AtSign, Share2, Eye, Clock, ArrowRight, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface ArticleResponse extends Article {
  author: User;
  likedBy: number[];
  bookmarkedBy: number[];
  viewedBy: number[];
}

interface CommentResponse extends Comment {
  user: User;
  replies?: CommentResponse[];
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Fetch article
  const { data: article, isLoading } = useQuery<ArticleResponse>({
    queryKey: [`/api/articles/${id}`],
  });

  // Fetch comments
  const { data: comments } = useQuery<CommentResponse[]>({
    queryKey: [`/api/articles/${id}/comments`],
  });

  // Update like and bookmark state when article data changes
  useEffect(() => {
    if (article && currentUser) {
      // Check if user has liked or bookmarked this article
      setIsLiked(article.likedBy?.includes(currentUser.id) || false);
      setIsBookmarked(article.bookmarkedBy?.includes(currentUser.id) || false);
    }
  }, [article, currentUser]);

  // Increment view count when the article is loaded
  useEffect(() => {
    if (article && currentUser) {
      // Only increment view if not already viewed by this user
      const viewedBy = article.viewedBy as number[] | undefined;
      if (!viewedBy?.includes(currentUser.id)) {
        incrementView();
      }
    }
  }, [article, currentUser]);
  
  // Handle scroll for reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { mutate: addComment } = useMutation({
    mutationFn: async (data: { content: string; parentId?: number }) => {
      await apiRequest("POST", `/api/articles/${id}/comments`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      setComment("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Like article mutation
  const { mutate: likeArticle } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/articles/${id}/like`);
    },
    onSuccess: () => {
      // Toggle the local state for immediate UI feedback
      setIsLiked(!isLiked);
      
      // Invalidate both the article detail and articles list queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      
      toast({
        title: isLiked ? "Unliked" : "Liked",
        description: isLiked ? "Article unliked" : "Article liked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Bookmark article mutation
  const { mutate: bookmarkArticle } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/articles/${id}/bookmark`);
    },
    onSuccess: () => {
      // Toggle the local state for immediate UI feedback
      setIsBookmarked(!isBookmarked);
      
      // Invalidate both the article detail and articles list queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Bookmarked",
        description: isBookmarked 
          ? "Article removed from your bookmarks" 
          : "Article added to your bookmarks",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Increment view count
  const { mutate: incrementView } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/articles/${id}/view`);
    },
    onSuccess: () => {
      // Invalidate both the article detail and articles list queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
    onError: (error: Error) => {
      console.error("Failed to increment view count:", error);
    },
  });

  // Like comment mutation
  const { mutate: likeComment } = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("POST", `/api/comments/${commentId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleMention = () => {
    if (!replyTo) return;
    const mention = `@${replyTo.username} `;
    if (!comment.includes(mention)) {
      setComment(mention + comment);
    }
  };

  if (isLoading || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-3/4"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create a simple table of contents from the content
  const generateTableOfContents = () => {
    if (!article?.content) return [];
    
    // This is a simplified approach - in a real app, you'd parse the content more carefully
    const paragraphs = article.content.split('\n\n').filter((p: string) => p.trim().length > 0);
    const firstFewParagraphs = paragraphs.slice(0, Math.min(5, paragraphs.length));
    
    return firstFewParagraphs.map((p: string, i: number) => {
      // Get first 30 chars as a "heading"
      const text = p.substring(0, 30).trim() + (p.length > 30 ? '...' : '');
      return { id: `section-${i}`, text };
    });
  };
  
  const tableOfContents = generateTableOfContents();

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-300 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
      
      <article className="relative pt-16 pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-background" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-16">
              <div className="flex items-center gap-2 text-sm text-primary/80 mb-4">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span>/</span>
                <span>Article</span>
              </div>
              
              <h1 
                className="text-5xl font-bold leading-tight mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                dangerouslySetInnerHTML={{ __html: article.title }}
              />

              <div className="flex items-center gap-4 mb-8 pb-8 border-b">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {article.author?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/profile/${article.authorId}`} className="font-medium text-lg hover:text-primary transition-colors">
                    {article.author?.fullName || 'Unknown Author'}
                  </Link>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title={isLiked ? "Unlike article" : "Like article"} 
                    className={`rounded-full ${isLiked ? 'bg-primary/10' : ''}`}
                    onClick={() => likeArticle()}
                    disabled={!currentUser}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title={isBookmarked ? "Remove bookmark" : "Bookmark article"} 
                    className={`rounded-full ${isBookmarked ? 'bg-primary/10' : ''}`}
                    onClick={() => bookmarkArticle()}
                    disabled={!currentUser}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'text-primary fill-primary' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" title="Share article" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Article Stats */}
              <div className="flex items-center justify-between mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{article.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>{article.likes} likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{comments?.length || 0} comments</span>
                  </div>
                </div>
                <div>
                  {/* Estimated read time - simplified calculation */}
                  <span>{Math.max(1, Math.ceil(article.content.length / 1000))} min read</span>
                </div>
              </div>
            </header>
            
            <div className="flex gap-8">
              {/* Table of Contents - Desktop */}
              <aside className="hidden lg:block w-64 sticky top-24 self-start">
                <div className="bg-card/50 backdrop-blur rounded-lg p-6 border border-primary/10">
                  <h3 className="font-medium mb-4 text-primary">In this article</h3>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <a 
                        key={item.id} 
                        href={`#${item.id}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
              
              {/* Main Content */}
              <div className="flex-1">
                <div className="prose prose-lg max-w-none">
                <div 
                  className="mb-12 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-12">
                  {['Technology', 'Programming', 'Web Development'].map((tag) => (
                    <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-16 border-t pt-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-3xl font-bold">Discussion</h2>
              </div>

              {currentUser && (
                <div className="mb-12 bg-card/50 backdrop-blur rounded-lg p-8 border border-primary/10 shadow-sm">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {currentUser.fullName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{currentUser.fullName}</p>
                      <Textarea
                        placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Share your thoughts..."}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[120px] mb-4 bg-background/80 focus:bg-background transition-colors"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => addComment({ content: comment, parentId: replyTo?.id })}
                          disabled={!comment.trim()}
                          className="shadow-sm"
                        >
                          {replyTo ? "Post Reply" : "Post Comment"}
                        </Button>
                        {replyTo && (
                          <>
                            <Button variant="outline" onClick={() => setReplyTo(null)}>
                              Cancel Reply
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleMention}
                              title="Mention user"
                            >
                              <AtSign className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {comments?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments?.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-primary/10 overflow-hidden">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {comment.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{comment.user?.fullName || 'Unknown User'}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-base mb-4">{comment.content}</p>
                              {currentUser && (
                                <div className="flex items-center gap-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyTo({ id: comment.id, username: comment.user.fullName })}
                                    className="hover:bg-primary/5 rounded-full"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Reply
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => likeComment(comment.id)}
                                    className="hover:bg-primary/5 rounded-full"
                                  >
                                    <Heart className={`h-4 w-4 mr-2 ${comment.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                                    {comment.likes} Likes
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Replies */}
                          {comment.replies?.map((reply) => (
                            <div key={reply.id} className="ml-12 mt-6 pl-6 border-l border-primary/10">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {reply.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">{reply.user?.fullName || 'Unknown User'}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-base mb-4">{reply.content}</p>
                                  {currentUser && (
                                    <div className="flex items-center gap-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => likeComment(reply.id)}
                                        className="hover:bg-primary/5 rounded-full"
                                      >
                                        <Heart className={`h-4 w-4 mr-2 ${reply.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                                        {reply.likes} Likes
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
            
            {/* Related Articles */}
            <div className="mt-16 pt-12 border-t">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-3xl font-bold">Related Articles</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="group hover:shadow-md transition-all duration-300 border-primary/10 hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        Discover more articles like this one
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        Explore our collection of articles on similar topics to continue your reading journey.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" /> 5 min read
                        </div>
                        <Button variant="ghost" size="sm" className="group-hover:text-primary group-hover:bg-primary/5">
                          Explore <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}