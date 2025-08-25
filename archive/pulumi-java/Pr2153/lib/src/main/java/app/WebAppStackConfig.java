package app;

import java.util.Map;
import java.util.HashMap;

/**
 * Configuration class for WebAppStack to improve testability. 
 */
public final class WebAppStackConfig {
    
    /**
     * Private constructor to prevent instantiation.
     */
    private WebAppStackConfig() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    public static final String DEFAULT_ENVIRONMENT_SUFFIX = "synthtrainr347";
    public static final String VPC_CIDR = "10.0.0.0/16";
    public static final String SUBNET1_CIDR = "10.0.1.0/24";
    public static final String SUBNET2_CIDR = "10.0.2.0/24";
    public static final String INSTANCE_TYPE = "t3.micro";
    public static final int MIN_SIZE = 2;
    public static final int MAX_SIZE = 4;
    public static final int DESIRED_CAPACITY = 2;
    public static final int HEALTH_CHECK_INTERVAL = 30;
    public static final int HEALTH_CHECK_TIMEOUT = 5;
    public static final int HEALTHY_THRESHOLD = 2;
    public static final int UNHEALTHY_THRESHOLD = 2;
    public static final int HTTP_PORT = 80;
    public static final int HTTPS_PORT = 443;
    public static final String LOAD_BALANCER_TYPE = "application";
    public static final String HEALTH_CHECK_PATH = "/";
    public static final String HTTP_PROTOCOL = "HTTP";
    public static final String TCP_PROTOCOL = "tcp";
    public static final int HEALTH_CHECK_GRACE_PERIOD = 300;
    
    /**
     * Get environment suffix from environment variable or use default.
     * @return environment suffix string
     */
    public static String getEnvironmentSuffix() {
        String suffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (suffix == null || suffix.isEmpty()) {
            suffix = DEFAULT_ENVIRONMENT_SUFFIX;
        }
        return suffix;
    }
    
    /**
     * Create resource tags.
     * @param environmentSuffix the environment suffix
     * @return map of resource tags
     */
    public static Map<String, String> createTags(final String environmentSuffix) {
        Map<String, String> tags = new HashMap<>();
        tags.put("Environment", "Production");
        tags.put("Project", "trainr347");
        tags.put("ManagedBy", "Pulumi");
        tags.put("EnvironmentSuffix", environmentSuffix);
        return tags;
    }
    
    /**
     * Generate bucket name with environment suffix.
     * @param environmentSuffix the environment suffix
     * @return bucket name string
     */
    public static String generateBucketName(final String environmentSuffix) {
        return "webapp-code-bucket-" + environmentSuffix.toLowerCase();
    }
    
    /**
     * Generate resource name with suffix.
     * @param baseName the base name
     * @param environmentSuffix the environment suffix
     * @return resource name with suffix
     */
    public static String generateResourceName(final String baseName, final String environmentSuffix) {
        return baseName + "-" + environmentSuffix;
    }
    
    /**
     * Generate launch template name prefix.
     * @param environmentSuffix the environment suffix
     * @return launch template name prefix
     */
    public static String generateLaunchTemplatePrefix(final String environmentSuffix) {
        return "webapp-" + environmentSuffix + "-";
    }
    
    /**
     * Create IAM assume role policy.
     * @return IAM assume role policy JSON string
     */
    public static String createAssumeRolePolicy() {
        return "{"
            + "\"Version\": \"2012-10-17\","
            + "\"Statement\": [{"
                + "\"Action\": \"sts:AssumeRole\","
                + "\"Principal\": {"
                    + "\"Service\": \"ec2.amazonaws.com\""
                + "},"
                + "\"Effect\": \"Allow\""
            + "}]"
            + "}";
    }
    
    /**
     * Create S3 access policy.
     * @return S3 access policy JSON string
     */
    public static String createS3AccessPolicy() {
        return "{"
            + "\"Version\": \"2012-10-17\","
            + "\"Statement\": [{"
                + "\"Effect\": \"Allow\","
                + "\"Action\": ["
                    + "\"s3:GetObject\","
                    + "\"s3:ListBucket\""
                + "],"
                + "\"Resource\": \"*\""
            + "}]"
            + "}";
    }
    
    /**
     * Create user data script.
     * @param bucketName the S3 bucket name
     * @return user data script string
     */
    public static String createUserDataScript(final String bucketName) {
        return "#!/bin/bash\n"
            + "yum update -y\n"
            + "yum install -y httpd\n"
            + "systemctl start httpd\n"
            + "systemctl enable httpd\n"
            + "\n"
            + "# Create a simple HTML page\n"
            + "cat > /var/www/html/index.html <<EOF\n"
            + "<!DOCTYPE html>\n"
            + "<html>\n"
            + "<head>\n"
            + "    <title>Web Application</title>\n"
            + "</head>\n"
            + "<body>\n"
            + "    <h1>Welcome to the Web Application</h1>\n"
            + "    <p>Instance ID: $(ec2-metadata --instance-id | cut -d \" \" -f 2)</p>\n"
            + "    <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d \" \" -f 2)</p>\n"
            + "</body>\n"
            + "</html>\n"
            + "EOF\n"
            + "\n"
            + "# Download application code from S3 if available\n"
            + "aws s3 cp s3://" + bucketName + "/app.tar.gz /tmp/app.tar.gz 2>/dev/null || true\n"
            + "if [ -f /tmp/app.tar.gz ]; then\n"
            + "    tar -xzf /tmp/app.tar.gz -C /var/www/html/\n"
            + "fi\n";
    }
    
    /**
     * Validate configuration values.
     * @return true if configuration is valid, false otherwise
     */
    public static boolean validateConfiguration() {
        return MIN_SIZE > 0
               && MAX_SIZE > MIN_SIZE
               && DESIRED_CAPACITY >= MIN_SIZE
               && DESIRED_CAPACITY <= MAX_SIZE
               && HEALTH_CHECK_INTERVAL > 0
               && HEALTH_CHECK_TIMEOUT > 0
               && HEALTH_CHECK_TIMEOUT < HEALTH_CHECK_INTERVAL
               && HTTP_PORT > 0 && HTTP_PORT <= 65535
               && HTTPS_PORT > 0 && HTTPS_PORT <= 65535;
    }
    
    /**
     * Get expected export names.
     * @return array of expected export names
     */
    public static String[] getExpectedExports() {
        return new String[] {
            "loadBalancerDnsName",
            "applicationUrl",
            "applicationUrlHttps",
            "vpcId",
            "publicSubnet1Id",
            "publicSubnet2Id",
            "autoScalingGroupName",
            "targetGroupArn",
            "codeBucketName"
        };
    }
}
