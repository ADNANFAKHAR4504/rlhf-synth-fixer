package app.constructs;

import software.constructs.Construct;
import app.config.Config;

import java.util.HashMap;
import java.util.Map;

public abstract class BaseConstruct extends Construct {

    private final Config config;

    protected BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.config = new Config();
    }

    public static Map<String, String> getDefaultTags() {
        Map<String, String> tags = new HashMap<>();
        tags.put("Name", Config.PREFIX + "Resource");
        tags.put("Environment", Config.ENVIRONMENT);
        tags.put("Owner", Config.OWNER);
        tags.put("Project", "ServerlessDemo");
        tags.put("ManagedBy", "cdktf");
        return tags;
    }

    public static Map<String, String> getTagsWithName(final String resourceName) {
        Map<String, String> tags = getDefaultTags();
        tags.put("Name", Config.PREFIX + resourceName);
        return tags;
    }

    protected String getRegion() {
        return Config.REGION;
    }

    protected String getPrefix() {
        return Config.PREFIX;
    }

    protected String getEnvironment() {
        return Config.ENVIRONMENT;
    }

    protected String getOwner() {
        return Config.OWNER;
    }

    protected String getLambdaRuntime() {
        return Config.LAMBDA_RUNTIME;
    }

    protected int getLambdaTimeout() {
        return Config.LAMBDA_TIMEOUT;
    }

    protected String getLambdaHandler() {
        return Config.LAMBDA_HANDLER;
    }

    protected String resourceName(final String name) {
        return getConfig().generateResourceName(name);
    }

    protected Config getConfig() {
        return config;
    }
}

