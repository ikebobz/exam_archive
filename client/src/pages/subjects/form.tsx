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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Subject, Exam } from "@shared/schema";
import { Link } from "wouter";

const subjectFormSchema = z.object({
  examId: z.string().min(1, "Please select an exam"),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  code: z.string().min(1, "Code is required").max(50, "Code is too long"),
  description: z.string().optional(),
});

type SubjectFormData = z.infer<typeof subjectFormSchema>;

export default function SubjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: subject, isLoading: isLoadingSubject } = useQuery<Subject>({
    queryKey: ["/api/subjects", id],
    enabled: isEditing,
  });

  const { data: exams, isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      examId: "",
      name: "",
      code: "",
      description: "",
    },
  });

  useEffect(() => {
    if (subject) {
      form.reset({
        examId: subject.examId.toString(),
        name: subject.name,
        code: subject.code,
        description: subject.description || "",
      });
    }
  }, [subject, form]);

  const createMutation = useMutation({
    mutationFn: async (data: SubjectFormData) => {
      const response = await apiRequest("POST", "/api/subjects", {
        ...data,
        examId: parseInt(data.examId),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Subject created",
        description: "The subject has been successfully created.",
      });
      setLocation("/subjects");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SubjectFormData) => {
      const response = await apiRequest("PATCH", `/api/subjects/${id}`, {
        ...data,
        examId: parseInt(data.examId),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", id] });
      toast({
        title: "Subject updated",
        description: "The subject has been successfully updated.",
      });
      setLocation("/subjects");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubjectFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if ((isEditing && isLoadingSubject) || isLoadingExams) {
    return <FormSkeleton />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/subjects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Subject" : "Create New Subject"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isEditing
            ? "Update the subject details below"
            : "Fill in the details to create a new subject"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="examId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-exam">
                          <SelectValue placeholder="Select an exam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exams?.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id.toString()}>
                            {exam.name} ({exam.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The exam this subject belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Mathematics"
                        {...field}
                        data-testid="input-subject-name"
                      />
                    </FormControl>
                    <FormDescription>
                      The full name of the subject
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
                        placeholder="e.g., MATH"
                        {...field}
                        data-testid="input-subject-code"
                      />
                    </FormControl>
                    <FormDescription>
                      A short unique code for the subject
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
                        placeholder="Enter a description for this subject..."
                        className="resize-none min-h-[100px]"
                        {...field}
                        data-testid="input-subject-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the subject
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  data-testid="button-submit-subject"
                >
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Update Subject" : "Create Subject"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/subjects">Cancel</Link>
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
