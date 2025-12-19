package app.constructs;

import app.config.AppConfig;
import software.constructs.Construct;

import java.util.Map;

public abstract class BaseConstruct extends Construct {

    private final AppConfig appConfig;

    public BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.appConfig = AppConfig.defaultConfig();
    }

    protected Map<String, String> mergeTags(final Map<String, String> additionalTags) {
        return appConfig.mergeWithTags(additionalTags);
    }

    protected AppConfig getAppConfig() {
        return appConfig;
    }

    protected String getEnvironment() {
        return appConfig.environment();
    }

    protected String getRegion() {
        return appConfig.region();
    }

    protected String appName() {
        return appConfig.appName();
    }

    protected Map<String, String> getTags() {
        return appConfig.tags();
    }
}
