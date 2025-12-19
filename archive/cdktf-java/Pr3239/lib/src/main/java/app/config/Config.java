package app.config;

public class Config {
    public static final String REGION = "us-east-1";
    public static final String PREFIX = "SrvlessDemo-";
    public static final String ENVIRONMENT = "production";
    public static final String OWNER = "DevOpsTeam";
    public static final String LAMBDA_RUNTIME = "nodejs20.x";
    public static final int LAMBDA_TIMEOUT = 10;
    public static final String LAMBDA_HANDLER = "handler.main";

    public String generateResourceName(final String name) {
        return PREFIX.concat(name);
    }
}