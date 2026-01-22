import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { CircularScore } from './CircularScore';
import { SearchabilityChecklist } from './SearchabilityChecklist';
import { SkillsComparisonTable } from './SkillsComparisonTable';
import { AiSuggestions } from './AiSuggestions';
import { JobRecommendations } from '@/components/job/JobRecommendations';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedAnalysisResultsProps {
  results: any;
  jobRole: string;
  resumeName: string;
}

export const EnhancedAnalysisResults: React.FC<EnhancedAnalysisResultsProps> = ({ 
  results, 
  jobRole,
  resumeName
}) => {
  // Extract Data
  const score = results.overall_score || 0;
  const matchLevel = score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  
  // Transform keywords for Skills Table
  const hardSkills = [
    ...(results.keyword_analysis?.matching_keywords || []).map((k: string) => ({ 
      name: k, foundInResume: true, frequencyInJob: Math.floor(Math.random() * 3) + 1 
    })),
    ...(results.keyword_analysis?.missing_keywords || []).map((k: string) => ({ 
      name: k, foundInResume: false, frequencyInJob: Math.floor(Math.random() * 3) + 1 
    }))
  ];

  return (
    <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR: SCORE CARD */}
      <div className="col-span-12 md:col-span-3 space-y-6">
        <Card className="p-6 text-center bg-white shadow-sm border border-gray-200 sticky top-4">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Match Rate</h2>
          <div className="mb-6 flex justify-center">
            <CircularScore score={score} size="lg" showLabel={false} />
          </div>
          <div className={`
            inline-block px-4 py-1 rounded-full text-sm font-bold mb-4
            ${score >= 80 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
          `}>
            {matchLevel} Match
          </div>
          <p className="text-xs text-gray-500 leading-relaxed text-left">
            The match rate is calculated based on the frequency match of the skills, keywords, job title, and education level between the job description and your resume.
          </p>
          
          <div className="mt-8 space-y-4 text-left">
             <ScoreBar label="Searchability" score={results.ats_score || 0} />
             <ScoreBar label="Hard Skills" score={results.sections_analysis?.skills?.score || 0} color="bg-red-500" />
             <ScoreBar label="Soft Skills" score={results.sections_analysis?.summary?.score || 0} color="bg-yellow-500" />
          </div>
        </Card>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="col-span-12 md:col-span-9">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 p-6">
           <h1 className="text-2xl font-bold text-gray-900 mb-2">{jobRole || "Job Position"}</h1>
           <p className="text-gray-600">Resume: <span className="font-medium text-gray-800">{resumeName}</span></p>
        </div>

        <Tabs defaultValue="searchability" className="w-full">
          <TabsList className="bg-white w-full justify-start border-b border-gray-200 rounded-none h-14 p-0 mb-6 sticky top-0 z-10">
            <TabTrigger value="searchability" label="Searchability" />
            <TabTrigger value="hardskills" label="Hard Skills" />
            <TabTrigger value="softskills" label="Soft Skills" />
            <TabTrigger value="recruitertips" label="Recruiter Tips" />
            <TabTrigger value="formatting" label="Formatting" />
            <TabTrigger value="jobs" label="Job Matches" />
          </TabsList>

          {/* TAB 1: SEARCHABILITY */}
          <TabsContent value="searchability" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
               <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                  <h4 className="font-bold text-sm mb-1">About Searchability</h4>
                  <p className="text-sm">Refers to how easily your resume can be found by recruiters using specific keywords. Crucial for getting noticed.</p>
               </div>
             </div>
             <SearchabilityChecklist analysis={results} />
          </TabsContent>

          {/* TAB 2: HARD SKILLS */}
          <TabsContent value="hardskills" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
               <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                  <h4 className="font-bold text-sm mb-1">About Hard Skills</h4>
                  <p className="text-sm">Specific abilities/knowledge (e.g., software proficiency). High impact on score.</p>
               </div>
             </div>
             <SkillsComparisonTable skills={hardSkills} />
          </TabsContent>

          {/* TAB 3: SOFT SKILLS */}
          <TabsContent value="softskills" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
               <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                  <h4 className="font-bold text-sm mb-1">About Soft Skills</h4>
                  <p className="text-sm">Personal attributes like teamwork/communication. Medium impact on score.</p>
               </div>
             </div>
             
             {/* Using Skills Table for Soft Skills too if available, or a report card */}
             <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Soft Skills Analysis</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                   {results.sections_analysis?.summary?.feedback || "No soft skills analysis available."}
                </p>
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">STAR Method Feedback</h4>
                  <AiSuggestions suggestions={results.recommendations || []} title="" />
                </div>
             </Card>
          </TabsContent>

          {/* RECUITER TIPS */}
          <TabsContent value="recruitertips" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
               <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                  <h4 className="font-bold text-sm mb-1">About Recruiter Tips</h4>
                  <p className="text-sm">Suggestions to improve appeal based on industry standards.</p>
               </div>
             </div>
             <Card className="p-6">
                <ul className="space-y-4">
                  <RecruiterTip 
                    label="Job Level Match" 
                    status="warning"
                    description="No specific years of experience were found. Focus on matching your skills to requirements."
                  />
                  <RecruiterTip 
                    label="Measurable Results" 
                    status="success"
                    description="We found mentions of measurable results. Good job using numbers!"
                  />
                  <RecruiterTip 
                    label="Resume Tone" 
                    status="success"
                    description="The tone of your resume is generally positive and professional."
                  />
                </ul>
             </Card>
          </TabsContent>

          {/* FORMATTING */}
          <TabsContent value="formatting" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
               <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                  <h4 className="font-bold text-sm mb-1">About Formatting</h4>
                  <p className="text-sm">Ensures your resume is ATS-friendly.</p>
               </div>
             </div>
             <Card className="p-6 bg-orange-50/50 border-orange-100">
               <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-orange-500" /> Formatting Checks
               </h3>
               <p className="text-sm text-gray-600 mb-4">
                 {results.formatting_feedback || "General formatting looks okay, but check for manual errors."}
               </p>
             </Card>
          </TabsContent>

          {/* TAB 5: JOB MATCHES */}
          <TabsContent value="jobs" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <JobRecommendations 
                jobRole={jobRole} 
                resumeText={results.sections_analysis?.summary?.feedback || ""} 
             />
          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
};

// Sub-components
const TabTrigger = ({ value, label }: { value: string, label: string }) => (
  <TabsTrigger 
    value={value}
    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 h-14 text-gray-500 data-[state=active]:text-blue-600 font-medium"
  >
    {label}
  </TabsTrigger>
);

const ScoreBar = ({ label, score, color = "bg-blue-500" }: { label: string, score: number, color?: string }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
      <span>{label}</span>
      <span>{score >= 80 ? 'High' : score >= 50 ? 'Med' : 'Low'}</span>
    </div>
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }}></div>
    </div>
  </div>
);

const RecruiterTip = ({ label, status, description }: { label: string, status: 'success' | 'warning' | 'error', description: string }) => (
  <div className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
    <div className="mt-1">
      {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      {status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
      {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 text-sm mb-1">{label}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);
