import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  HelpCircle,
  MoreHorizontal,
  Eye,
  ImageIcon,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Question, Subject, Exam, Answer } from "@shared/schema";
import ExcelUploader from "@/components/ExcelUploader";
import JsonUploader from "@/components/JsonUploader";

type QuestionWithRelations = Question & { 
  subject: Subject & { exam: Exam }; 
  answers: Answer[];
};

export default function QuestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [deleteQuestion, setDeleteQuestion] = useState<QuestionWithRelations | null>(null);
  const [viewQuestion, setViewQuestion] = useState<QuestionWithRelations | null>(null);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [selectedSubjectForUpload, setSelectedSubjectForUpload] = useState<number | null>(null);
  const [showJsonUploader, setShowJsonUploader] = useState(false);
  const [selectedSubjectForJsonUpload, setSelectedSubjectForJsonUpload] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<QuestionWithRelations[]>({
    queryKey: ["/api/questions"],
  });

  const { data: subjects } = useQuery<(Subject & { exam: Exam })[]>({
    queryKey: ["/api/subjects"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });
      setDeleteQuestion(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredQuestions = questions?.filter((question) => {
    const matchesSearch =
      question.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesSubject =
      subjectFilter === "all" || question.subjectId.toString() === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "hard":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Questions</h1>
          <p className="text-muted-foreground text-sm">
            Manage exam questions and answers
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowExcelUploader(true)}
            data-testid="button-import-excel"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowJsonUploader(true)}
            data-testid="button-import-json"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import JSON
          </Button>
          <Button asChild data-testid="button-add-question">
            <Link href="/questions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-questions"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[250px]" data-testid="select-subject-filter">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name} ({subject.exam?.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingQuestions ? (
            <QuestionsTableSkeleton />
          ) : filteredQuestions && filteredQuestions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Question</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="hidden md:table-cell">Year</TableHead>
                    <TableHead className="hidden lg:table-cell">Answers</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {question.imageUrl ? (
                            <img 
                              src={question.imageUrl} 
                              alt="Question"
                              className="h-9 w-9 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                              <HelpCircle className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm line-clamp-2">
                              {question.questionText}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {question.topic && (
                                <p className="text-xs text-muted-foreground">
                                  Topic: {question.topic}
                                </p>
                              )}
                              {question.imageUrl && (
                                <Badge variant="outline" className="text-xs">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Image
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {question.subject?.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {question.subject?.exam?.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getDifficultyColor(question.difficulty)}
                        >
                          {question.difficulty || "Not set"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {question.year || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary">
                          {question.answers?.length || 0} answers
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-question-actions-${question.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewQuestion(question)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/questions/${question.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteQuestion(question)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This will also delete 
              all answers associated with this question. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuestion && deleteMutation.mutate(deleteQuestion.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewQuestion} onOpenChange={() => setViewQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          {viewQuestion && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Question</h4>
                <p className="text-sm">{viewQuestion.questionText}</p>
                {viewQuestion.imageUrl && (
                  <div className="mt-3">
                    <img 
                      src={viewQuestion.imageUrl} 
                      alt="Question image"
                      className="max-w-full max-h-64 rounded-md border border-border object-contain"
                      data-testid="img-question-view"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Subject</h4>
                  <p className="text-sm">{viewQuestion.subject?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Exam</h4>
                  <p className="text-sm">{viewQuestion.subject?.exam?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Difficulty</h4>
                  <Badge className={getDifficultyColor(viewQuestion.difficulty)}>
                    {viewQuestion.difficulty || "Not set"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Year</h4>
                  <p className="text-sm">{viewQuestion.year || "Not specified"}</p>
                </div>
                {viewQuestion.topic && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Topic</h4>
                    <p className="text-sm">{viewQuestion.topic}</p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Answers</h4>
                {viewQuestion.answers && viewQuestion.answers.length > 0 ? (
                  <div className="space-y-3">
                    {viewQuestion.answers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className={`p-3 rounded-lg border ${
                          answer.isCorrect 
                            ? "border-green-500/50 bg-green-500/10" 
                            : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-sm font-medium ${
                            answer.isCorrect ? "text-green-600 dark:text-green-400" : ""
                          }`}>
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm">{answer.answerText}</p>
                            {answer.explanation && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {answer.explanation}
                              </p>
                            )}
                          </div>
                          {answer.isCorrect && (
                            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                              Correct
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No answers added yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Upload Dialog */}
      <Dialog open={showExcelUploader} onOpenChange={setShowExcelUploader}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Questions from Excel</DialogTitle>
          </DialogHeader>
          
          {!selectedSubjectForUpload ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                First, select which subject you want to import questions into:
              </p>
              <div className="space-y-2">
                {subjects && subjects.length > 0 ? (
                  <Select 
                    value={selectedSubjectForUpload?.toString() || ""} 
                    onValueChange={(value) => setSelectedSubjectForUpload(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.exam?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No subjects available. Please create a subject first.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <ExcelUploader
              subjectId={selectedSubjectForUpload}
              onSuccess={() => {
                setShowExcelUploader(false);
                setSelectedSubjectForUpload(null);
              }}
              onClose={() => {
                setShowExcelUploader(false);
                setSelectedSubjectForUpload(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* JSON Upload Dialog */}
      <Dialog open={showJsonUploader} onOpenChange={setShowJsonUploader}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Questions from JSON</DialogTitle>
          </DialogHeader>

          {!selectedSubjectForJsonUpload ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                First, select which subject you want to import questions into:
              </p>
              <div className="space-y-2">
                {subjects && subjects.length > 0 ? (
                  <Select
                    value={selectedSubjectForJsonUpload?.toString() || ""}
                    onValueChange={(value) => setSelectedSubjectForJsonUpload(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.exam?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No subjects available. Please create a subject first.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <JsonUploader
              subjectId={selectedSubjectForJsonUpload}
              onSuccess={() => {
                setShowJsonUploader(false);
                setSelectedSubjectForJsonUpload(null);
              }}
              onClose={() => {
                setShowJsonUploader(false);
                setSelectedSubjectForJsonUpload(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <HelpCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-1">No questions found</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by creating your first question
      </p>
      <Button asChild>
        <Link href="/questions/new">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Link>
      </Button>
    </div>
  );
}

function QuestionsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}
