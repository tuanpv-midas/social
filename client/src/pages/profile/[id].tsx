import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Article, type User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface UserProfile extends User {
  _count: {
    followers: number;
    following: number;
    articles: number;
  };
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: [`/api/users/${id}`],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: articles } = useQuery<Article[]>({
    queryKey: [`/api/users/${id}/articles`],
  });

  const { data: isFollowing } = useQuery<boolean>({
    queryKey: [`/api/users/${id}/following/check`],
    enabled: !!currentUser,
  });

  const { mutate: follow } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${id}/follow`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You are now following this user",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}/following/check`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const { mutate: unfollow } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${id}/unfollow`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have unfollowed this user",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}/following/check`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!profile) {
    return <div>Loading...</div>;
  }

  const isOwnProfile = currentUser?.id === parseInt(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{profile.fullName}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{profile._count.articles} Articles</span>
                <Link href={`/profile/${id}/followers`} className="hover:text-primary">
                  <span>{profile._count.followers} Followers</span>
                </Link>
                <Link href={`/profile/${id}/following`} className="hover:text-primary">
                  <span>{profile._count.following} Following</span>
                </Link>
              </div>
            </div>
            {!isOwnProfile && currentUser && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={() => (isFollowing ? unfollow() : follow())}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <div className="grid gap-6">
            {articles?.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <Link href={`/articles/${article.id}`}>
                    <CardTitle className="text-xl hover:text-primary cursor-pointer">
                      {article.title}
                    </CardTitle>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {article.content}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{article.views} views</span>
                    <span>{article.likes} likes</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}