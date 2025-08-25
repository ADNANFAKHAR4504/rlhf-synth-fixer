package app;

import com.pulumi.Context;

public class InfrastructureConfig {
    private final Context ctx;
    private final String environment;
    private final String companyName;
    private final String region;
    
    public InfrastructureConfig(Context ctx) {
        this.ctx = ctx;
        this.environment = ctx.config().require("environment");
        this.companyName = ctx.config().require("companyName");
        this.region = "us-east-1"; // Fixed for financial services compliance
    }
    
    public String getEnvironment() { return environment; }
    public String getCompanyName() { return companyName; }
    public String getRegion() { return region; }
    public Context getContext() { return ctx; }
    
    public String getResourceName(String service, String resource) {
        return String.format("%s-%s-%s-%s", companyName, environment, service, resource);
    }
}