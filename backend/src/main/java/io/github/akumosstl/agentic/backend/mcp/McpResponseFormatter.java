package io.github.akumosstl.agentic.backend.mcp;

import io.github.akumosstl.agentic.backend.model.*;
import io.modelcontextprotocol.spec.McpSchema;

import java.util.List;
import java.util.stream.Collectors;

public final class McpResponseFormatter {

    private McpResponseFormatter() {
    }

    public static McpSchema.TextContent text(String text) {
        return new McpSchema.TextContent(text);
    }

    public static String formatProject(Project p) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Project: ").append(p.getName()).append("\n");
        sb.append("- **ID**: ").append(p.getId()).append("\n");
        sb.append("- **Status**: ").append(p.getStatus()).append("\n");
        if (p.getDescription() != null) {
            sb.append("- **Description**: ").append(p.getDescription()).append("\n");
        }
        if (p.getPath() != null) {
            sb.append("- **Path**: ").append(p.getPath()).append("\n");
        }
        if (p.getTarget() != null) {
            sb.append("- **Target**: ").append(p.getTarget()).append("\n");
        }
        sb.append("- **Created**: ").append(p.getCreatedAt()).append("\n");
        if (p.getAgents() != null && !p.getAgents().isEmpty()) {
            sb.append("- **Agents**: ").append(p.getAgents().stream()
                    .map(a -> a.getName() + (a.getNamespace() != null ? " (" + a.getNamespace() + ")" : ""))
                    .collect(Collectors.joining(", "))).append("\n");
        }
        if (p.getScripts() != null && !p.getScripts().isEmpty()) {
            sb.append("- **Scripts**: ").append(p.getScripts().stream()
                    .map(s -> s.getName() + (s.getNamespace() != null ? " (" + s.getNamespace() + ")" : ""))
                    .collect(Collectors.joining(", "))).append("\n");
        }
        return sb.toString();
    }

    public static String formatProjectWithPipelines(Project p, List<Pipeline> pipelines) {
        StringBuilder sb = new StringBuilder();
        sb.append(formatProject(p));
        if (pipelines != null && !pipelines.isEmpty()) {
            sb.append("\n### Pipelines (").append(pipelines.size()).append(")\n");
            sb.append("| # | Name | Status | Steps | Type |\n");
            sb.append("|---|------|--------|-------|------|\n");
            for (int i = 0; i < pipelines.size(); i++) {
                Pipeline pl = pipelines.get(i);
                int stepCount = pl.getSteps() != null ? pl.getSteps().size() : 0;
                sb.append("| ").append(i + 1).append(" | ")
                        .append(pl.getName()).append(" | ")
                        .append(pl.getStatus()).append(" | ")
                        .append(stepCount).append(" | ")
                        .append(pl.getType() != null ? pl.getType() : "-").append(" |\n");
            }
        } else {
            sb.append("\n### Pipelines: None\n");
        }
        return sb.toString();
    }

    public static String formatProjectsList(List<Project> projects) {
        if (projects.isEmpty()) {
            return "No projects found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Projects (").append(projects.size()).append(")\n\n");
        for (Project p : projects) {
            sb.append(formatProject(p)).append("\n");
        }
        return sb.toString();
    }

    public static String formatPipeline(Pipeline p) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Pipeline: ").append(p.getName()).append("\n");
        sb.append("- **ID**: ").append(p.getId()).append("\n");
        sb.append("- **Project ID**: ").append(p.getProjectId()).append("\n");
        sb.append("- **Status**: ").append(p.getStatus()).append("\n");
        if (p.getDescription() != null) {
            sb.append("- **Description**: ").append(p.getDescription()).append("\n");
        }
        if (p.getType() != null) {
            sb.append("- **Type**: ").append(p.getType()).append("\n");
        }
        if (p.getOutputExtension() != null) {
            sb.append("- **Output Extension**: ").append(p.getOutputExtension()).append("\n");
        }
        sb.append("- **Created**: ").append(p.getCreatedAt()).append("\n");
        return sb.toString();
    }

    public static String formatPipelinesList(List<Pipeline> pipelines) {
        if (pipelines.isEmpty()) {
            return "No pipelines found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Pipelines (").append(pipelines.size()).append(")\n\n");
        for (Pipeline p : pipelines) {
            sb.append(formatPipeline(p)).append("\n");
        }
        return sb.toString();
    }

    public static String formatPipelineRun(PipelineRun r) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Pipeline Run #").append(r.getId()).append("\n");
        sb.append("- **Execution ID**: ").append(r.getExecutionId()).append("\n");
        sb.append("- **Pipeline**: ").append(r.getPipelineName()).append(" (ID: ").append(r.getPipelineId()).append(")\n");
        sb.append("- **Project**: ").append(r.getProjectName()).append(" (ID: ").append(r.getProjectId()).append(")\n");
        sb.append("- **Status**: ").append(r.getStatus()).append("\n");
        sb.append("- **Started**: ").append(r.getStartedAt()).append("\n");
        sb.append("- **Completed**: ").append(r.getCompletedAt()).append("\n");
        if (r.getRunDir() != null) {
            sb.append("- **Run Dir**: ").append(r.getRunDir()).append("\n");
        }
        if (r.getSteps() != null && !r.getSteps().isEmpty()) {
            sb.append("\n### Steps\n");
            sb.append("| # | Agent/Script | Status |\n");
            sb.append("|---|-------------|--------|\n");
            for (PipelineRunStep step : r.getSteps()) {
                String name = step.getAgentName() != null ? step.getAgentName() :
                        (step.getScriptName() != null ? step.getScriptName() : "-");
                sb.append("| ").append(step.getStepOrder()).append(" | ")
                        .append(name).append(" | ")
                        .append(step.getStatus()).append(" |\n");
            }
        }
        return sb.toString();
    }

    public static String formatPipelineRunsList(List<PipelineRun> runs) {
        if (runs.isEmpty()) {
            return "No pipeline runs found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Pipeline Runs (").append(runs.size()).append(")\n\n");
        sb.append("| # | ID | Pipeline | Project | Status | Started |\n");
        sb.append("|---|----|----------|---------|--------|---------|\n");
        for (int i = 0; i < runs.size(); i++) {
            PipelineRun r = runs.get(i);
            sb.append("| ").append(i + 1).append(" | ")
                    .append(r.getId()).append(" | ")
                    .append(r.getPipelineName()).append(" | ")
                    .append(r.getProjectName()).append(" | ")
                    .append(r.getStatus()).append(" | ")
                    .append(r.getStartedAt()).append(" |\n");
        }
        return sb.toString();
    }

    public static String formatPipelineStep(PipelineStep s) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Step #").append(s.getStepOrder()).append("\n");
        sb.append("- **ID**: ").append(s.getId()).append("\n");
        sb.append("- **Pipeline ID**: ").append(s.getPipelineId()).append("\n");
        sb.append("- **Type**: ").append(s.getType()).append("\n");
        sb.append("- **Status**: ").append(s.getStatus()).append("\n");
        if (s.getAgentId() != null) {
            sb.append("- **Agent ID**: ").append(s.getAgentId()).append("\n");
        }
        if (s.getScriptId() != null) {
            sb.append("- **Script ID**: ").append(s.getScriptId()).append("\n");
        }
        if (s.getCli() != null) {
            sb.append("- **CLI**: ").append(s.getCli()).append("\n");
            if (s.getParameters() != null) sb.append("- **Parameters**: ").append(s.getParameters()).append("\n");
            if (s.getArguments() != null) sb.append("- **Arguments**: ").append(s.getArguments()).append("\n");
            if (s.getRuntime() != null) sb.append("- **Runtime**: ").append(s.getRuntime()).append("\n");
        }
        return sb.toString();
    }

    public static String formatPipelineStepsList(List<PipelineStep> steps) {
        if (steps.isEmpty()) {
            return "No steps found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Pipeline Steps (").append(steps.size()).append(")\n\n");
        for (PipelineStep s : steps) {
            sb.append(formatPipelineStep(s)).append("\n");
        }
        return sb.toString();
    }

    public static String formatAgent(Agent a) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Agent: ").append(a.getName()).append("\n");
        sb.append("- **ID**: ").append(a.getId()).append("\n");
        if (a.getNamespace() != null) sb.append("- **Namespace**: ").append(a.getNamespace()).append("\n");
        if (a.getCategory() != null) sb.append("- **Category**: ").append(a.getCategory()).append("\n");
        if (a.getDescription() != null) sb.append("- **Description**: ").append(a.getDescription()).append("\n");
        if (a.getPath() != null) sb.append("- **Path**: ").append(a.getPath()).append("\n");
        sb.append("- **Created**: ").append(a.getCreatedAt()).append("\n");
        return sb.toString();
    }

    public static String formatAgentsList(List<Agent> agents) {
        if (agents.isEmpty()) {
            return "No agents found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Agents (").append(agents.size()).append(")\n\n");
        sb.append("| # | ID | Name | Namespace | Category |\n");
        sb.append("|---|----|------|-----------|----------|\n");
        for (int i = 0; i < agents.size(); i++) {
            Agent a = agents.get(i);
            sb.append("| ").append(i + 1).append(" | ")
                    .append(a.getId()).append(" | ")
                    .append(a.getName()).append(" | ")
                    .append(a.getNamespace() != null ? a.getNamespace() : "-").append(" | ")
                    .append(a.getCategory() != null ? a.getCategory() : "-").append(" |\n");
        }
        return sb.toString();
    }

    public static String formatScript(Script s) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Script: ").append(s.getName()).append("\n");
        sb.append("- **ID**: ").append(s.getId()).append("\n");
        sb.append("- **Namespace**: ").append(s.getNamespace()).append("\n");
        if (s.getCategory() != null) sb.append("- **Category**: ").append(s.getCategory()).append("\n");
        if (s.getDescription() != null) sb.append("- **Description**: ").append(s.getDescription()).append("\n");
        if (s.getPath() != null) sb.append("- **Path**: ").append(s.getPath()).append("\n");
        sb.append("- **Scope**: ").append(s.getScope()).append("\n");
        sb.append("- **Created**: ").append(s.getCreatedAt()).append("\n");
        return sb.toString();
    }

    public static String formatScriptsList(List<Script> scripts) {
        if (scripts.isEmpty()) {
            return "No scripts found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Scripts (").append(scripts.size()).append(")\n\n");
        sb.append("| # | ID | Name | Namespace | Scope |\n");
        sb.append("|---|----|------|-----------|-------|\n");
        for (int i = 0; i < scripts.size(); i++) {
            Script s = scripts.get(i);
            sb.append("| ").append(i + 1).append(" | ")
                    .append(s.getId()).append(" | ")
                    .append(s.getName()).append(" | ")
                    .append(s.getNamespace() != null ? s.getNamespace() : "-").append(" | ")
                    .append(s.getScope()).append(" |\n");
        }
        return sb.toString();
    }

    public static String formatTarget(Target t) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Target: ").append(t.getName()).append("\n");
        sb.append("- **ID**: ").append(t.getId()).append("\n");
        if (t.getAgentsPath() != null) sb.append("- **Agents Path**: ").append(t.getAgentsPath()).append("\n");
        if (t.getScriptsPath() != null) sb.append("- **Scripts Path**: ").append(t.getScriptsPath()).append("\n");
        if (t.getCli() != null) sb.append("- **CLI**: ").append(t.getCli()).append("\n");
        return sb.toString();
    }

    public static String formatTargetsList(List<Target> targets) {
        if (targets.isEmpty()) {
            return "No targets found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Targets (").append(targets.size()).append(")\n\n");
        for (Target t : targets) {
            sb.append(formatTarget(t)).append("\n");
        }
        return sb.toString();
    }

    public static String formatTemplate(Template t) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Template: ").append(t.getName()).append("\n");
        sb.append("- **ID**: ").append(t.getId()).append("\n");
        sb.append("- **Type**: ").append(t.getType()).append("\n");
        if (t.getDescription() != null) sb.append("- **Description**: ").append(t.getDescription()).append("\n");
        sb.append("- **Created**: ").append(t.getCreatedAt()).append("\n");
        return sb.toString();
    }

    public static String formatTemplatesList(List<Template> templates) {
        if (templates.isEmpty()) {
            return "No templates found.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("## Templates (").append(templates.size()).append(")\n\n");
        sb.append("| # | ID | Name | Type | Description |\n");
        sb.append("|---|----|------|------|-------------|\n");
        for (int i = 0; i < templates.size(); i++) {
            Template t = templates.get(i);
            sb.append("| ").append(i + 1).append(" | ")
                    .append(t.getId()).append(" | ")
                    .append(t.getName()).append(" | ")
                    .append(t.getType()).append(" | ")
                    .append(t.getDescription() != null ? t.getDescription() : "-").append(" |\n");
        }
        return sb.toString();
    }
}
