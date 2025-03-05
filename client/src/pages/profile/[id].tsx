import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { type Article, type User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface UserProfile extends User {
  _count: {
    followers: number;
    following: number;
    articles: number;
  };
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: [`/api/users/${id}`],
  });

  const { data: articles } = useQuery<Article[]>({
    queryKey: [`/api/users/${id}/articles`],
  });

  const { data: bookmarks } = useQuery<Article[]>({
    queryKey: ["/api/me/bookmarks"],
  });

  const { data: readingHistory } = useQuery<Article[]>({
    queryKey: ["/api/me/reading-history"],
  });

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{profile.fullName}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{profile._count.articles} Articles</span>
                <span>{profile._count.followers} Followers</span>
                <span>{profile._count.following} Following</span>
                <span>{profile.points} Points</span>
              </div>
            </div>
            <Button>Follow</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="history">Reading History</TabsTrigger>
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

        <TabsContent value="bookmarks">
          <div className="grid gap-6">
            {bookmarks?.map((article) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-6">
            {readingHistory?.map((article) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
