import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Loader2, AlertCircle, CheckCircle2, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { downloadExcelTemplate } from "@/lib/excel-template";

interface ExcelUploaderProps {
  subjectId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface UploadResponse {
  success: boolean;
  questionsUploaded: number;
  errors: string[];
}

export default function ExcelUploader({ subjectId, onSuccess, onClose }: ExcelUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            
            const response = await apiRequest("POST", "/api/questions/upload-excel", {
              subjectId,
              fileBuffer: base64,
              fileName: file.name,
            });

            resolve(response as unknown as UploadResponse);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: `${data.questionsUploaded} questions uploaded successfully.`,
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        
        setSelectedFile(null);
        onSuccess?.();
      }

      // Show errors if any
      if (data.errors.length > 0) {
        toast({
          title: "Upload completed with warnings",
          description: `${data.errors.length} rows had issues. Check the details below.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload Excel file",
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
      if (
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
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
        <CardTitle>Load Questions from Excel</CardTitle>
        <CardDescription>
          Upload an Excel file with questions and options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>File Format</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>Your Excel file should have 5 columns:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><strong>Column 1:</strong> Question text</li>
                <li><strong>Column 2:</strong> Option A</li>
                <li><strong>Column 3:</strong> Option B</li>
                <li><strong>Column 4:</strong> Option C</li>
                <li><strong>Column 5:</strong> Option D</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExcelTemplate}
                className="mt-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Upload Area */}
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
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />

          {!selectedFile ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Drag and drop your Excel file here</p>
                <p className="text-sm text-muted-foreground">or</p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground">Supported formats: .xlsx, .xls</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {!uploadMutation.isPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload Button */}
        {selectedFile && (
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="flex-1"
            >
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

        {/* Error Display */}
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

        {/* Success Message */}
        {uploadMutation.data?.success && uploadMutation.data.questionsUploaded > 0 && (
          <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Upload Successful</AlertTitle>
            <AlertDescription>
              {uploadMutation.data.questionsUploaded} questions have been added to this subject.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
