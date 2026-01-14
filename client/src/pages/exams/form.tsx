import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Exam } from "@shared/schema";
import { Link } from "wouter";

const examFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  code: z.string().min(1, "Code is required").max(50, "Code is too long"),
  description: z.string().optional(),
});

type ExamFormData = z.infer<typeof examFormSchema>;

export default function ExamFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: exam, isLoading: isLoadingExam } = useQuery<Exam>({
    queryKey: ["/api/exams", id],
    enabled: isEditing,
  });

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  useEffect(() => {
    if (exam) {
      form.reset({
        name: exam.name,
        code: exam.code,
        description: exam.description || "",
      });
    }
  }, [exam, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const response = await apiRequest("POST", "/api/exams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Exam created",
        description: "The exam has been successfully created.",
      });
      setLocation("/exams");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const response = await apiRequest("PATCH", `/api/exams/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams", id] });
      toast({
        title: "Exam updated",
        description: "The exam has been successfully updated.",
      });
      setLocation("/exams");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update exam. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExamFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingExam) {
    return <FormSkeleton />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/exams">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Exam" : "Create New Exam"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isEditing
            ? "Update the exam details below"
            : "Fill in the details to create a new exam"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., West African Senior School Certificate Examination"
                        {...field}
                        data-testid="input-exam-name"
                      />
                    </FormControl>
                    <FormDescription>
                      The full name of the examination
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., WASSCE"
                        {...field}
                        data-testid="input-exam-code"
                      />
                    </FormControl>
                    <FormDescription>
                      A short unique code for the examination
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this exam..."
                        className="resize-none min-h-[100px]"
                        {...field}
                        data-testid="input-exam-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the examination
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  data-testid="button-submit-exam"
                >
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Update Exam" : "Create Exam"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/exams">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
