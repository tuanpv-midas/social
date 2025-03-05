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
import { MessageSquare, Bookmark, Heart } from "lucide-react";

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

  const { data: article } = useQuery<ArticleResponse>({
    queryKey: [`/api/articles/${id}`],
  });

  const { data: comments } = useQuery<CommentResponse[]>({
    queryKey: [`/api/articles/${id}/comments`],
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

  const { mutate: bookmark } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/articles/${id}/bookmark`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article bookmarked",
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

  const { mutate: markAsRead } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/articles/${id}/read`);
    },
  });

  if (!article) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <Avatar>
            <AvatarFallback>
              {article.author.fullName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{article.author.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="mb-8 whitespace-pre-wrap">{article.content}</div>

        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => bookmark()}>
            <Bookmark className="h-5 w-5 mr-2" />
            Bookmark
          </Button>
          <Button variant="ghost">
            <Heart className="h-5 w-5 mr-2" />
            {article.likes} Likes
          </Button>
          <span className="text-muted-foreground">
            {article.views} views
          </span>
        </div>
      </article>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>
        
        <div className="mb-8">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-4"
          />
          <Button
            onClick={() => addComment({ content: comment })}
            disabled={!comment.trim()}
          >
            Post Comment
          </Button>
        </div>

        <div className="space-y-6">
          {comments?.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {comment.user.fullName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{comment.user.fullName}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mb-4">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        {comment.likes} Likes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
