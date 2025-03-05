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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type InsertWaitlist, insertWaitlistSchema, type Article, type User } from "@shared/schema";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

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

  const { data: articles } = useQuery<ArticleWithAuthor[]>({
    queryKey: ["/api/articles"],
  });

  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    retry: false
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {!user && (
          <div className="grid gap-16 md:grid-cols-2 md:gap-24 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl xl:text-6xl">
                The Future of Work is Here
              </h1>
              <p className="mt-4 text-xl text-muted-foreground">
                Join thousands of forward-thinking professionals revolutionizing the
                way we collaborate and create.
              </p>
              <div className="mt-8 flex items-center gap-2 text-muted-foreground">
                <span className="text-lg font-semibold text-primary">
                  {waitlistCount?.count || 0}
                </span>{" "}
                people already joined
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-6 md:p-8">
                {!submitted ? (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((data) => mutate(data))}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@example.com"
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
                    className="text-center"
                  >
                    <h3 className="text-xl font-semibold text-primary">
                      Thank you for joining!
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      We'll keep you updated on our progress.
                    </p>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold">Latest Articles</h2>
          {user && (
            <Link href="/articles/new">
              <Button>Write Article</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6">
          {articles?.map((article) => (
            <Card key={article.id}>
              <CardHeader>
                <Link href={`/articles/${article.id}`}>
                  <CardTitle className="text-xl hover:text-primary cursor-pointer">
                    {article.title}
                  </CardTitle>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href={`/profile/${article.authorId}`} className="hover:text-primary">
                    {article.author.fullName}
                  </Link>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
                </div>
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
      </div>
    </div>
  );
}