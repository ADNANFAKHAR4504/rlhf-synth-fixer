package app.constructs;

import app.config.AppConfig;
import software.constructs.Construct;

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

    protected AppConfig getConfig() {
        return config;
    }
}
