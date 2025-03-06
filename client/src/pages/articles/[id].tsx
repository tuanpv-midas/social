import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Article, type Comment, type User } from "@shared/schema";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, AtSign, Share2 } from "lucide-react";

interface ArticleResponse extends Article {
  author: User;
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

  const { data: article, isLoading } = useQuery<ArticleResponse>({
    queryKey: [`/api/articles/${id}`],
  });

  const { data: comments } = useQuery<CommentResponse[]>({
    queryKey: [`/api/articles/${id}/comments`],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

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
        <div className="max-w-3xl mx-auto">
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

  return (
    <div className="min-h-screen bg-background">
      <article className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold leading-tight mb-8">{article.title}</h1>

            <div className="flex items-center gap-4 mb-12">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {article.author?.fullName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{article.author?.fullName || 'Unknown Author'}</p>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="ml-auto">
                <Button variant="outline" size="icon" title="Share article">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="mb-12 whitespace-pre-wrap leading-relaxed">
                {article.content}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-16 border-t pt-12">
              <h2 className="text-3xl font-bold mb-8">Discussion</h2>

              {currentUser && (
                <div className="mb-12 bg-card rounded-lg p-6 border">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {currentUser.fullName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Start a discussion..."}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px] mb-4"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => addComment({ content: comment, parentId: replyTo?.id })}
                          disabled={!comment.trim()}
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
                {comments?.map((comment) => (
                  <Card key={comment.id} className="border-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
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
                                className="hover:bg-primary/5"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Reply
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => likeComment(comment.id)}
                                className="hover:bg-primary/5"
                              >
                                <Heart className="h-4 w-4 mr-2" />
                                {comment.likes} Likes
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies?.map((reply) => (
                        <div key={reply.id} className="ml-12 mt-6 pl-6 border-l">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarFallback>
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
                                    className="hover:bg-primary/5"
                                  >
                                    <Heart className="h-4 w-4 mr-2" />
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}