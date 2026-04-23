import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileJson, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface JsonUploaderProps {
  subjectId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface UploadResponse {
  success: boolean;
  questionsUploaded: number;
  errors: string[];
}

export default function JsonUploader({ subjectId, onSuccess, onClose }: JsonUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const fileContent = await file.text();
      const response = await apiRequest("POST", "/api/questions/upload-json", {
        subjectId,
        fileContent,
        fileName: file.name,
      });

      return (await response.json()) as UploadResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: `${data.questionsUploaded} questions uploaded successfully.`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

        setSelectedFile(null);
        onSuccess?.();
      }

      if (data.errors.length > 0) {
        toast({
          title: "Upload completed with warnings",
          description: `${data.errors.length} item(s) had issues.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload JSON file",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".json") || file.type === "application/json") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please select a JSON file (.json)",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      toast({
        title: "Invalid file",
        description: "Please select a JSON file (.json)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Load Questions from JSON</CardTitle>
        <CardDescription>
          Upload a JSON file containing question objects mapped to the current question model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supported JSON structure</AlertTitle>
          <AlertDescription>
            <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">{`{
  "topic": "Synonyms",
  "question_text": "The Director's speech was quite recondite...",
  "options": ["A. Brief", "B. Obscure", "C. Interesting", "D. Insightful"],
  "correct_option": "B",
  "explanation": "..."
}`}</pre>
            <p className="mt-2 text-xs text-muted-foreground">
              You can upload a single object, an array of objects, or an object with a questions array.
            </p>
          </AlertDescription>
        </Alert>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />

          {!selectedFile ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <FileJson className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Drag and drop your JSON file here</p>
                <p className="text-sm text-muted-foreground">or</p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground">Supported format: .json</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
              {!uploadMutation.isPending && (
                <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex gap-3">
            <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="flex-1">
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Questions
                </>
              )}
            </Button>
            {!uploadMutation.isPending && (
              <Button
                variant="outline"
                onClick={() => {
                  handleRemoveFile();
                  onClose?.();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {uploadMutation.data?.errors && uploadMutation.data.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                {uploadMutation.data.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {uploadMutation.data.errors.length > 5 && (
                  <li>...and {uploadMutation.data.errors.length - 5} more issues</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
