package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeStep {
    private String id;
    private Integer order;
    private String name;
    private String agent;
    @JsonProperty("agent_name")
    private String agentName;
    @JsonProperty("agent_namespace")
    private String agentNamespace;
    private String script;
    @JsonProperty("script_name")
    private String scriptName;
    @JsonProperty("script_namespace")
    private String scriptNamespace;
    private String prompt;
    private String type;
    private String runtime;
    private String cli;
    private String parameters;
    private String arguments;
    private RecipeStepIO input;
    private RecipeStepIO output;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAgent() { return agent; }
    public void setAgent(String agent) { this.agent = agent; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getAgentNamespace() { return agentNamespace; }
    public void setAgentNamespace(String agentNamespace) { this.agentNamespace = agentNamespace; }

    public String getScript() { return script; }
    public void setScript(String script) { this.script = script; }

    public String getScriptName() { return scriptName; }
    public void setScriptName(String scriptName) { this.scriptName = scriptName; }

    public String getScriptNamespace() { return scriptNamespace; }
    public void setScriptNamespace(String scriptNamespace) { this.scriptNamespace = scriptNamespace; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRuntime() { return runtime; }
    public void setRuntime(String runtime) { this.runtime = runtime; }

    public String getCli() { return cli; }
    public void setCli(String cli) { this.cli = cli; }

    public String getParameters() { return parameters; }
    public void setParameters(String parameters) { this.parameters = parameters; }

    public String getArguments() { return arguments; }
    public void setArguments(String arguments) { this.arguments = arguments; }

    public RecipeStepIO getInput() { return input; }
    public void setInput(RecipeStepIO input) { this.input = input; }

    public RecipeStepIO getOutput() { return output; }
    public void setOutput(RecipeStepIO output) { this.output = output; }
}
