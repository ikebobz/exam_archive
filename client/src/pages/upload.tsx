import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Upload as UploadIcon, 
  FileSpreadsheet, 
  Download, 
  AlertCircle,
  CheckCircle,
  X,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Subject, Exam } from "@shared/schema";

interface ParsedQuestion {
  questionText: string;
  year?: number;
  difficulty?: string;
  topic?: string;
  answers: {
    answerText: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  error?: string;
}

interface UploadResult {
  success: boolean;
  questionsUploaded: number;
  errors: string[];
}

export default function BulkUploadPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const { data: subjects } = useQuery<(Subject & { exam: Exam })[]>({
    queryKey: ["/api/subjects"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { subjectId: number; questions: ParsedQuestion[] }) => {
      const response = await apiRequest("POST", "/api/questions/bulk", data);
      return response.json();
    },
    onSuccess: (result: UploadResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (result.success) {
        toast({
          title: "Upload successful",
          description: `${result.questionsUploaded} questions have been uploaded.`,
        });
        resetForm();
      } else {
        toast({
          title: "Partial upload",
          description: `Some questions failed to upload. Check the error details.`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setSelectedSubject("");
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);
    } catch (error) {
      toast({
        title: "Parse error",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const getCol = (name: string) => {
        const idx = headers.indexOf(name);
        return idx >= 0 ? values[idx]?.trim() : "";
      };

      const questionText = getCol("question") || getCol("question_text");
      if (!questionText) {
        questions.push({
          questionText: "",
          answers: [],
          error: `Row ${i + 1}: Missing question text`,
        });
        continue;
      }

      const answers = [];
      for (let j = 1; j <= 6; j++) {
        const answerText = getCol(`answer_${j}`) || getCol(`answer${j}`);
        if (answerText) {
          const isCorrect = 
            getCol("correct_answer")?.toLowerCase() === String.fromCharCode(96 + j) ||
            getCol("correct_answer") === j.toString() ||
            getCol(`correct_${j}`)?.toLowerCase() === "true";
          answers.push({
            answerText,
            isCorrect,
            explanation: getCol(`explanation_${j}`) || "",
          });
        }
      }

      if (answers.length === 0) {
        const answerA = getCol("answer_a") || getCol("a");
        const answerB = getCol("answer_b") || getCol("b");
        const answerC = getCol("answer_c") || getCol("c");
        const answerD = getCol("answer_d") || getCol("d");
        const correctAnswer = getCol("correct_answer")?.toLowerCase() || getCol("correct")?.toLowerCase();

        [answerA, answerB, answerC, answerD].forEach((text, idx) => {
          if (text) {
            const letter = String.fromCharCode(97 + idx);
            answers.push({
              answerText: text,
              isCorrect: correctAnswer === letter,
              explanation: "",
            });
          }
        });
      }

      questions.push({
        questionText,
        year: parseInt(getCol("year")) || undefined,
        difficulty: getCol("difficulty") || undefined,
        topic: getCol("topic") || undefined,
        answers,
        error: answers.length === 0 ? `Row ${i + 1}: No answers found` : undefined,
      });
    }

    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validQuestions = parsedData.filter((q) => !q.error);
  const invalidQuestions = parsedData.filter((q) => q.error);

  const handleUpload = () => {
    if (!selectedSubject || validQuestions.length === 0) {
      toast({
        title: "Cannot upload",
        description: "Please select a subject and ensure there are valid questions.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      subjectId: parseInt(selectedSubject),
      questions: validQuestions,
    });
  };

  const downloadTemplate = () => {
    const template = `question,answer_a,answer_b,answer_c,answer_d,correct_answer,year,difficulty,topic
"What is 2 + 2?","2","3","4","5","c",2023,"Easy","Arithmetic"
"What is the capital of France?","London","Paris","Berlin","Madrid","b",2023,"Easy","Geography"`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Upload</h1>
        <p className="text-muted-foreground text-sm">
          Import questions from a spreadsheet file
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with questions and answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[300px]" data-testid="select-upload-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.exam?.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-testid="input-file-upload"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    {isParsing ? (
                      <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
                    ) : (
                      <UploadIcon className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {file ? file.name : "Drop your file here or click to browse"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports CSV and Excel files
                    </p>
                  </div>
                </div>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setParsedData([]);
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    {validQuestions.length} valid questions, {invalidQuestions.length} with errors
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validQuestions.length} Valid
                  </Badge>
                  {invalidQuestions.length > 0 && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {invalidQuestions.length} Errors
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead className="w-[100px]">Answers</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((question, index) => (
                        <TableRow key={index} data-testid={`row-preview-${index}`}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-2">
                              {question.questionText || "Missing question text"}
                            </p>
                            {question.topic && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Topic: {question.topic}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {question.answers.length} answers
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {question.error ? (
                              <Badge variant="destructive" className="text-xs">
                                Error
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs">
                                Valid
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Required Columns</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code className="bg-muted px-1 rounded">question</code> - Question text</li>
                  <li>• <code className="bg-muted px-1 rounded">answer_a</code> to <code className="bg-muted px-1 rounded">answer_d</code> - Answer options</li>
                  <li>• <code className="bg-muted px-1 rounded">correct_answer</code> - Letter (a, b, c, d)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Optional Columns</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code className="bg-muted px-1 rounded">year</code> - Exam year</li>
                  <li>• <code className="bg-muted px-1 rounded">difficulty</code> - Easy, Medium, Hard</li>
                  <li>• <code className="bg-muted px-1 rounded">topic</code> - Question topic</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {parsedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  disabled={!selectedSubject || validQuestions.length === 0 || uploadMutation.isPending}
                  onClick={handleUpload}
                  data-testid="button-upload-questions"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload {validQuestions.length} Questions
                    </>
                  )}
                </Button>
                {!selectedSubject && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Please select a subject first
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
