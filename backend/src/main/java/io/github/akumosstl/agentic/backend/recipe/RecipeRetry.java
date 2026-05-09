package io.github.akumosstl.agentic.backend.recipe;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeRetry {
    @JsonProperty("max_attempts")
    private Integer maxAttempts;
    @JsonProperty("delay_seconds")
    private Integer delaySeconds;
    @JsonProperty("on_status")
    private List<String> onStatus;

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public Integer getDelaySeconds() { return delaySeconds; }
    public void setDelaySeconds(Integer delaySeconds) { this.delaySeconds = delaySeconds; }

    public List<String> getOnStatus() { return onStatus; }
    public void setOnStatus(List<String> onStatus) { this.onStatus = onStatus; }
}
