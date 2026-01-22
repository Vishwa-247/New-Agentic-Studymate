import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Briefcase, Search, Loader2 } from 'lucide-react';
import { CircularScore } from '../resume/CircularScore';
import { motion } from 'framer-motion';

interface JobMatch {
    title: string;
    company: string;
    url: string;
    match_score: number;
    reasoning: string;
}

interface JobRecommendationsProps {
    jobRole: string;
    resumeText?: string;
}

export const JobRecommendations: React.FC<JobRecommendationsProps> = ({ jobRole, resumeText }) => {
    const [jobs, setJobs] = useState<JobMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [notConfigured, setNotConfigured] = useState(false);

    const getGatewayToken = () => {
        try {
            return localStorage.getItem('gateway_access_token');
        } catch {
            return null;
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setSearched(false);
        setErrorMessage(null);
        setNotConfigured(false);
        try {
            // Get token if authenticated (optional, depends on gateway setup)
            const token = getGatewayToken();
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            };

            const response = await fetch('http://localhost:8000/api/job-search/search-and-match', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    query: `${jobRole} jobs`,
                    resume_text: resumeText,
                    limit: 5
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const detail = String((data as any)?.detail || (data as any)?.message || 'Search failed');
                const lower = detail.toLowerCase();
                if (lower.includes('api key') && lower.includes('not') && lower.includes('configured')) {
                    setNotConfigured(true);
                    setErrorMessage(detail);
                    setJobs([]);
                    setSearched(true);
                    return;
                }
                throw new Error(detail);
            }

            setJobs(data.matches || []);
            setSearched(true);
        } catch (error) {
            console.error("Job search error:", error);
            setJobs([]);
            setSearched(true);
            setErrorMessage(error instanceof Error ? error.message : 'Job search failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        AI Job Recommendations
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Find jobs that match your resume profile and skills.
                    </p>
                </div>
                <Button onClick={handleSearch} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Searching...' : 'Find Matches'}
                </Button>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 bg-muted/40 rounded-xl" />
                    ))}
                </div>
            )}

            {!loading && searched && notConfigured && (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">
                        Job Search is not configured (missing API keys). You can still use the Resume Analyzer.
                    </p>
                    {errorMessage ? (
                        <p className="text-xs text-muted-foreground mt-2">{errorMessage}</p>
                    ) : null}
                </div>
            )}

            {!loading && searched && !notConfigured && errorMessage && (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">{errorMessage}</p>
                </div>
            )}

            {!loading && searched && !notConfigured && !errorMessage && jobs.length === 0 && (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No matching jobs found via Firecrawl.</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {jobs.map((job, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary/50 group">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="shrink-0">
                                     <CircularScore score={job.match_score} size="sm" showLabel={false} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                {job.title}
                                            </h4>
                                            <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
                                        </div>
                                        <Badge variant={job.match_score > 75 ? "default" : "secondary"}>
                                            {job.match_score}% Match
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground italic border-l-2 pl-3 py-1 bg-muted/10 rounded-r">
                                        "{job.reasoning}"
                                    </p>
                                    
                                    <div className="pt-2">
                                        <Button size="sm" variant="outline" className="gap-2 h-8" asChild>
                                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                                                Apply Now <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
