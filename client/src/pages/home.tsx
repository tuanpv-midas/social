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
import { Card } from "@/components/ui/card";
import { type InsertWaitlist, insertWaitlistSchema } from "@shared/schema";

interface WaitlistCount {
  count: number;
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
        <div className="grid gap-16 md:grid-cols-2 md:gap-24">
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

            <div className="mt-12">
              <img
                src="https://images.unsplash.com/photo-1542744095-fcf48d80b0fd"
                alt="Modern Office Space"
                className="rounded-lg object-cover shadow-xl"
                width="600"
                height="400"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold">Join the Waitlist</h2>
                <p className="mt-2 text-muted-foreground">
                  Be among the first to experience the future of work.
                </p>
              </div>

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

            <div className="mt-8">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
                alt="Abstract Tech Pattern"
                className="rounded-lg object-cover shadow-xl"
                width="600"
                height="300"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}