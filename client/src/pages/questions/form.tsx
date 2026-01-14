import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ArrowLeft, Loader2, Plus, Trash2, Upload, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Question, Subject, Exam, Answer } from "@shared/schema";
import { Link } from "wouter";

const answerSchema = z.object({
  answerText: z.string().min(1, "Answer text is required"),
  isCorrect: z.boolean().default(false),
  explanation: z.string().optional(),
});

const questionFormSchema = z.object({
  subjectId: z.string().min(1, "Please select a subject"),
  questionText: z.string().min(1, "Question text is required"),
  imageUrl: z.string().optional(),
  year: z.string().optional(),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  answers: z.array(answerSchema).min(1, "At least one answer is required"),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

type QuestionWithAnswers = Question & { answers: Answer[] };

export default function QuestionFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      form.setValue("imageUrl", response.objectPath);
      setImagePreview(response.objectPath);
      toast({
        title: "Image uploaded",
        description: "The image has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: question, isLoading: isLoadingQuestion } = useQuery<QuestionWithAnswers>({
    queryKey: ["/api/questions", id],
    enabled: isEditing,
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<(Subject & { exam: Exam })[]>({
    queryKey: ["/api/subjects"],
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      subjectId: "",
      questionText: "",
      imageUrl: "",
      year: "",
      difficulty: "",
      topic: "",
      answers: [{ answerText: "", isCorrect: false, explanation: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  useEffect(() => {
    if (question) {
      form.reset({
        subjectId: question.subjectId.toString(),
        questionText: question.questionText,
        imageUrl: question.imageUrl || "",
        year: question.year?.toString() || "",
        difficulty: question.difficulty || "",
        topic: question.topic || "",
        answers: question.answers?.length > 0
          ? question.answers.map((a) => ({
              answerText: a.answerText,
              isCorrect: a.isCorrect,
              explanation: a.explanation || "",
            }))
          : [{ answerText: "", isCorrect: false, explanation: "" }],
      });
      if (question.imageUrl) {
        setImagePreview(question.imageUrl);
      }
    }
  }, [question, form]);

  const createMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("POST", "/api/questions", {
        subjectId: parseInt(data.subjectId),
        questionText: data.questionText,
        imageUrl: data.imageUrl || null,
        year: data.year ? parseInt(data.year) : null,
        difficulty: data.difficulty || null,
        topic: data.topic || null,
        answers: data.answers,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Question created",
        description: "The question has been successfully created.",
      });
      setLocation("/questions");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("PATCH", `/api/questions/${id}`, {
        subjectId: parseInt(data.subjectId),
        questionText: data.questionText,
        imageUrl: data.imageUrl || null,
        year: data.year ? parseInt(data.year) : null,
        difficulty: data.difficulty || null,
        topic: data.topic || null,
        answers: data.answers,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions", id] });
      toast({
        title: "Question updated",
        description: "The question has been successfully updated.",
      });
      setLocation("/questions");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }
      await uploadFile(file);
    }
  };

  const removeImage = () => {
    form.setValue("imageUrl", "");
    setImagePreview(null);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if ((isEditing && isLoadingQuestion) || isLoadingSubjects) {
    return <FormSkeleton />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/questions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Question" : "Create New Question"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isEditing
            ? "Update the question and answers below"
            : "Fill in the details to create a new question with answers"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name} ({subject.exam?.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The subject this question belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the question..."
                        className="resize-none min-h-[120px]"
                        {...field}
                        data-testid="input-question-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Image (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Question image preview"
                              className="max-w-full max-h-48 rounded-md border border-border object-contain"
                              data-testid="img-question-preview"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={removeImage}
                              data-testid="button-remove-image"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <label
                              className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border cursor-pointer hover:bg-muted transition-colors"
                              data-testid="label-upload-image"
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              <span className="text-sm">
                                {isUploading ? "Uploading..." : "Upload Image"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                                data-testid="input-image-upload"
                              />
                            </label>
                            <span className="text-xs text-muted-foreground">
                              or paste an image URL below
                            </span>
                          </div>
                        )}
                        <Input
                          placeholder="Or enter image URL..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value) {
                              setImagePreview(e.target.value);
                            }
                          }}
                          data-testid="input-image-url"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload an image or provide a URL for visual questions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 2023"
                          {...field}
                          data-testid="input-question-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Algebra"
                          {...field}
                          data-testid="input-question-topic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Answers</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ answerText: "", isCorrect: false, explanation: "" })}
                data-testid="button-add-answer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Answer
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No answers added yet. Click "Add Answer" to add one.
                </p>
              )}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 rounded-lg border border-border space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-medium shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name={`answers.${index}.answerText`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Enter the answer text..."
                                className="resize-none min-h-[80px]"
                                {...field}
                                data-testid={`input-answer-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`answers.${index}.explanation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Explanation (optional)"
                                {...field}
                                data-testid={`input-explanation-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between">
                        <FormField
                          control={form.control}
                          name={`answers.${index}.isCorrect`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid={`checkbox-correct-${index}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                Mark as correct answer
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-remove-answer-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {form.formState.errors.answers?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.answers.message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={isPending || isUploading}
              data-testid="button-submit-question"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Question" : "Create Question"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/questions">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
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
