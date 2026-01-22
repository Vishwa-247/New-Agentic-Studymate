import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, Sparkles, History, Search, Check, AlertCircle } from "lucide-react";
import { AnalysisHistory } from "@/components/resume/AnalysisHistory";
import { EnhancedAnalysisResults } from "@/components/resume/EnhancedAnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ResumeAnalyzer() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  // Input States
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Analysis States
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      setSelectedFile(file);
      setSelectedResumeId(null);
      setSelectedResumeName(file.name);
      toast({
        title: "Resume Uploaded",
        description: `Ready to analyze: ${file.name}`,
      });
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedResumeId(null);
      setSelectedResumeName(file.name);
    }
  };

  // Trigger Analysis
  const handleAnalyze = async () => {
    if ((!selectedFile && !selectedResumeId) || !jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please provide both a resume and a job description.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      toast({
        title: "Analysis Starting",
        description: "Analyzing your resume against the job description...",
      });
      
      const formData = new FormData();
      if (selectedFile) {
        formData.append('resume', selectedFile);
      } else if (selectedResumeId) {
        formData.append('resume_id', selectedResumeId);
      }
      
      formData.append('job_role', jobRole || "Candidate");
      formData.append('job_description', jobDescription);
      if (user?.id) {
        formData.append('user_id', user.id);
      }

       const token = (() => {
         try {
           return localStorage.getItem('gateway_access_token');
         } catch {
           return null;
         }
       })();

      const signal = (AbortSignal as any)?.timeout ? (AbortSignal as any).timeout(120000) : undefined;

      const response = await fetch('http://localhost:8000/resume/analyze', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        ...(signal ? { signal } : {}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResults(data.analysis);
      setAnalysisComplete(true);
      
      toast({
        title: "Scan Complete",
        description: "Your comprehensive match report is ready.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your resume.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (resume: any) => {
    setSelectedResumeId(resume.id);
    setSelectedFile(null);
    setSelectedResumeName(resume.file_name || "Existing Resume");
    setIsHistoryOpen(false); // Close modal
    toast({
      title: "Resume Selected",
      description: `Using previously uploaded: ${resume.file_name}`,
    });
  };

  // If analysis is done, show results (Dashboard View)
  if (analysisComplete && analysisResults) {
    return (
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
        <Button 
          variant="ghost" 
          onClick={() => setAnalysisComplete(false)}
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
        >
          ← Start New Scan
        </Button>
        <EnhancedAnalysisResults 
          results={analysisResults} 
          jobRole={jobRole}
          resumeName={selectedResumeName || "Uploaded Resume"}
        />
      </div>
    );
  }

  // Default: Input View (Structure & Theme Consistent)
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Optimize Your Resume</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Compare your resume against any job description regarding ATS & skills.
            </p>
          </div>
          
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History className="w-4 h-4" /> History
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Analysis History</DialogTitle>
                <DialogDescription>
                  Select a previously analyzed resume to use again.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                 <AnalysisHistory onSelectAnalysis={handleSelectHistory} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Resume Upload */}
          <Card className="flex flex-col h-full border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</div>
                Upload Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-6">
              
              <div 
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                  ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}
                  ${selectedFile || selectedResumeId ? 'border-green-500/50 bg-green-50/50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-colors
                    ${selectedFile || selectedResumeId ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}
                  `}>
                    {selectedFile || selectedResumeId ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>
                  
                  {selectedFile || selectedResumeId ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">
                        {selectedResumeName}
                      </p>
                      <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1.5">
                        <Check className="w-3 h-3" /> Ready for scan
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setSelectedResumeId(null);
                          setSelectedResumeName(null);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs mt-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-foreground">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground">PDF or DOCX (Max 5MB)</p>
                      <input 
                        id="file-upload"
                        type="file" 
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.docx"
                      />
                    </>
                  )}
                </div>
              </div>
              
              <div className="rounded-md bg-blue-50/50 border border-blue-100 p-4">
                <div className="flex gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">Pro Tip</p>
                    <p className="text-sm text-blue-700 leading-snug">
                       Use a text-based PDF/DOCX. Scanned images cannot be read by ATS software.
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Card 2: Job Description */}
          <Card className="flex flex-col h-full border-border shadow-sm">
             <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</div>
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Job Title <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                  </label>
                  <Input 
                    placeholder="e.g. Senior Frontend Developer" 
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-sm font-medium text-foreground">
                    Job Description <span className="text-destructive">*</span>
                  </label>
                  <Textarea 
                    placeholder="Paste the full job description here..." 
                    className="min-h-[200px] flex-1 font-mono text-xs bg-background resize-none focus-visible:ring-primary"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
            </CardContent>
          </Card>

        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={loading || !jobDescription || (!selectedFile && !selectedResumeId)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 shadow-sm transition-all text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Scan & Match Findings <Search className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
        </div>

      </div>
    </div>
  );
}
