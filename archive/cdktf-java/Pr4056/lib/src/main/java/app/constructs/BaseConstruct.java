package app.constructs;

import app.config.AppConfig;
import app.config.MonitoringConfig;
import app.config.NetworkConfig;
import app.config.SecurityConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public abstract class BaseConstruct extends Construct {

    private final AppConfig config;

    public BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.config = AppConfig.defaultConfig();
    }

    protected Map<String, String> mergeTags(final Map<String, String> additionalTags) {
        return config.mergeWithTags(additionalTags);
    }

    protected String getEnvironment() {
        return config.environment();
    }

    protected String getRegion() {
        return config.region();
    }

    protected String getProjectName() {
        return config.projectName();
    }

    protected NetworkConfig getNetworkConfig() {
        return config.networkConfig();
    }

    protected SecurityConfig getSecurityConfig() {
        return config.securityConfig();
    }

    protected MonitoringConfig getMonitoringConfig() {
        return config.monitoringConfig();
    }

    protected List<String> getExistingInstanceIds() {
        return config.existingInstanceIds();
    }

    protected Map<String, String> getTags() {
        return config.tags();
    }
}