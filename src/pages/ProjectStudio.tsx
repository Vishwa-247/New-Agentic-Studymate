import ProjectStudioDemo from "@/components/landing/ProjectStudioDemo";

const ProjectStudio = () => {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Project Studio</h1>
        <p className="text-muted-foreground">
          Autonomous multi-agent swarm for end-to-end software development.
        </p>
      </div>
      <ProjectStudioDemo />
    </div>
  );
};

export default ProjectStudio;
