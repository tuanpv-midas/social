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
import { MessageSquare, Heart, AtSign } from "lucide-react";

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
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center gap-4 mb-8">
          <Avatar>
            <AvatarFallback>
              {article.author?.fullName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{article.author?.fullName || 'Unknown Author'}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="mb-8 whitespace-pre-wrap">{article.content}</div>
      </article>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>

        {currentUser && (
          <div className="mb-8">
            <div className="flex gap-2 mb-2">
              <Textarea
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Add a comment..."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mb-4"
              />
              {replyTo && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleMention}
                  title="Mention user"
                >
                  <AtSign className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addComment({ content: comment, parentId: replyTo?.id })}
                disabled={!comment.trim()}
              >
                Post Comment
              </Button>
              {replyTo && (
                <Button variant="outline" onClick={() => setReplyTo(null)}>
                  Cancel Reply
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {comments?.map((comment) => (
            <Card key={comment.id}>
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
                    <p className="text-sm mb-4">{comment.content}</p>
                    {currentUser && (
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyTo({ id: comment.id, username: comment.user.fullName })}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeComment(comment.id)}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          {comment.likes} Likes
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="ml-12 mt-4">
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
                        <p className="text-sm mb-4">{reply.content}</p>
                        {currentUser && (
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likeComment(reply.id)}
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
  );
}