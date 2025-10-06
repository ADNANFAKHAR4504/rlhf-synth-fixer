package app.config;

public record ComputeConfig(String instanceType, int minSize, int maxSize, int desiredCapacity, String amiId,
                            int healthCheckGracePeriod, String applicationName, String environmentName) {
    public static ComputeConfig defaultConfig() {
        return new ComputeConfig(
                "t3.medium",
                2,
                5,
                2,
                "ami-0c02fb55956c7d316", // Amazon Linux 2 in us-east-1
                300,
                "web-application",
                "production"
        );
    }
}
