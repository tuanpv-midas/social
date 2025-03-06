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
import { Clock, Eye, Heart, ArrowRight } from "lucide-react";

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
    enabled: !!user,
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
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

          <div className="relative">
            <div className="container mx-auto px-4 py-24">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div className="inline-block">
                    <div className="inline-flex items-center rounded-full px-4 py-1 text-sm bg-primary/10 text-primary mb-4">
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  <h1 className="text-6xl font-bold leading-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Where Ideas Meet Community
                  </h1>

                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Join our thriving community of writers, readers, and creators. Share your knowledge, 
                    connect with like-minded individuals, and be part of something extraordinary.
                  </p>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="text-2xl font-bold text-primary">
                      {waitlistCount?.count || 0}
                    </span>
                    <span className="text-lg">people already joined</span>
                  </div>

                  {!submitted ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit((data) => mutate(data))}
                          className="space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row gap-4">
                            <FormField
                              control={form.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input 
                                      placeholder="Full Name" 
                                      {...field}
                                      className="h-12 text-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder="Email"
                                      {...field}
                                      className="h-12 text-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              size="lg"
                              className="w-full sm:w-auto"
                              disabled={isPending}
                            >
                              {isPending ? (
                                "Joining..."
                              ) : (
                                <span className="flex items-center gap-2">
                                  Join Waitlist
                                  <ArrowRight className="h-4 w-4" />
                                </span>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary/10 border border-primary/20 rounded-lg p-8 text-center"
                    >
                      <h3 className="text-2xl font-semibold text-primary mb-2">
                        Thank you for joining!
                      </h3>
                      <p className="text-muted-foreground">
                        We'll keep you updated on our progress and let you know when we launch.
                      </p>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-8"
                >
                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardHeader>
                      <CardTitle className="text-2xl">Why Join Us?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Vibrant Community</h3>
                          <p className="text-muted-foreground">Connect with passionate creators, share ideas, and grow together in a supportive environment.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Powerful Tools</h3>
                          <p className="text-muted-foreground">Access state-of-the-art writing and publishing tools designed for modern content creators.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Growth & Analytics</h3>
                          <p className="text-muted-foreground">Track your impact with detailed analytics and grow your audience effectively.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
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
                <Card key={article.id} className="group hover:shadow-lg transition-shadow duration-200">
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
              <Button>
                <span className="flex items-center gap-2">
                  Write a Story
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>

          <div className="grid gap-8">
            {articles?.slice(2).map((article) => (
              <Card key={article.id} className="group hover:shadow-lg transition-shadow duration-200">
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