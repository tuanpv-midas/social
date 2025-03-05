import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type InsertWaitlist, insertWaitlistSchema, type Article, type User } from "@shared/schema";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Clock, Eye, Heart } from "lucide-react";

interface WaitlistCount {
  count: number;
}

interface ArticleWithAuthor extends Article {
  author: User;
}

export default function Home() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<InsertWaitlist>({
    resolver: zodResolver(insertWaitlistSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const { data: waitlistCount } = useQuery<WaitlistCount>({
    queryKey: ["/api/waitlist/count"],
  });

  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    retry: false
  });

  // Only fetch articles if user is authenticated
  const { data: articles } = useQuery<ArticleWithAuthor[]>({
    queryKey: ["/api/articles"],
    enabled: !!user, // Only run query if user is authenticated
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InsertWaitlist) => {
      await apiRequest("POST", "/api/waitlist", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "You've been added to the waitlist.",
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

  // Non-authenticated user view - Waitlist Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative bg-primary/5 py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl font-bold leading-tight mb-6">
                  The Future of Content Creation and Community
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Join our growing community of writers, readers, and creators. Be the first to experience our platform when we launch.
                </p>
                <div className="flex items-center gap-2 text-muted-foreground mb-8">
                  <span className="text-lg font-semibold text-primary">
                    {waitlistCount?.count || 0}
                  </span>{" "}
                  people already joined
                </div>
                <div className="space-y-6">
                  {!submitted ? (
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit((data) => mutate(data))}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Full Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isPending}
                        >
                          {isPending ? "Joining..." : "Join Waitlist"}
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center bg-primary/10 p-6 rounded-lg"
                    >
                      <h3 className="text-xl font-semibold text-primary mb-2">
                        Thank you for joining!
                      </h3>
                      <p className="text-muted-foreground">
                        We'll keep you updated on our progress.
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Why Join Us?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Community-Driven Platform</h3>
                      <p className="text-muted-foreground">Connect with like-minded creators and build meaningful relationships.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Advanced Features</h3>
                      <p className="text-muted-foreground">Enjoy powerful writing tools, rich media support, and seamless collaboration.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Engagement & Growth</h3>
                      <p className="text-muted-foreground">Build your audience with our engagement features and analytics tools.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user view - Blog/CMS Dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Featured Articles */}
        {articles && articles.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Featured Stories</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {articles.slice(0, 2).map((article) => (
                <Card key={article.id} className="group">
                  <CardHeader className="space-y-4">
                    <Link href={`/articles/${article.id}`}>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link href={`/profile/${article.authorId}`} className="hover:text-primary">
                        {article.author.fullName}
                      </Link>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {article.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {article.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" /> {article.likes}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Latest Articles */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Latest Stories</h2>
            <Link href="/articles/new">
              <Button>Write a Story</Button>
            </Link>
          </div>

          <div className="grid gap-8">
            {articles?.slice(2).map((article) => (
              <Card key={article.id} className="group">
                <CardHeader>
                  <Link href={`/articles/${article.id}`}>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${article.authorId}`} className="hover:text-primary">
                      {article.author.fullName}
                    </Link>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 mb-4">
                    {article.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" /> {article.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" /> {article.likes}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}