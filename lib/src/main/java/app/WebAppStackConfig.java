package com.pulumi;

import java.util.Map;
import java.util.HashMap;

/**
 * Configuration class for WebAppStack to improve testability
 */
public class WebAppStackConfig {
    
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
     * Get environment suffix from environment variable or use default
     */
    public static String getEnvironmentSuffix() {
        String suffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (suffix == null || suffix.isEmpty()) {
            suffix = DEFAULT_ENVIRONMENT_SUFFIX;
        }
        return suffix;
    }
    
    /**
     * Create resource tags
     */
    public static Map<String, String> createTags(String environmentSuffix) {
        Map<String, String> tags = new HashMap<>();
        tags.put("Environment", "Production");
        tags.put("Project", "trainr347");
        tags.put("ManagedBy", "Pulumi");
        tags.put("EnvironmentSuffix", environmentSuffix);
        return tags;
    }
    
    /**
     * Generate bucket name with environment suffix
     */
    public static String generateBucketName(String environmentSuffix) {
        return "webapp-code-bucket-" + environmentSuffix.toLowerCase();
    }
    
    /**
     * Generate resource name with suffix
     */
    public static String generateResourceName(String baseName, String environmentSuffix) {
        return baseName + "-" + environmentSuffix;
    }
    
    /**
     * Generate launch template name prefix
     */
    public static String generateLaunchTemplatePrefix(String environmentSuffix) {
        return "webapp-" + environmentSuffix + "-";
    }
    
    /**
     * Create IAM assume role policy
     */
    public static String createAssumeRolePolicy() {
        return "{" +
            "\"Version\": \"2012-10-17\"," +
            "\"Statement\": [{" +
                "\"Action\": \"sts:AssumeRole\"," +
                "\"Principal\": {" +
                    "\"Service\": \"ec2.amazonaws.com\"" +
                "}," +
                "\"Effect\": \"Allow\"" +
            "}]" +
        "}";
    }
    
    /**
     * Create S3 access policy
     */
    public static String createS3AccessPolicy() {
        return "{" +
            "\"Version\": \"2012-10-17\"," +
            "\"Statement\": [{" +
                "\"Effect\": \"Allow\"," +
                "\"Action\": [" +
                    "\"s3:GetObject\"," +
                    "\"s3:ListBucket\"" +
                "]," +
                "\"Resource\": \"*\"" +
            "}]" +
        "}";
    }
    
    /**
     * Create user data script
     */
    public static String createUserDataScript(String bucketName) {
        return "#!/bin/bash\n" +
            "yum update -y\n" +
            "yum install -y httpd\n" +
            "systemctl start httpd\n" +
            "systemctl enable httpd\n" +
            "\n" +
            "# Create a simple HTML page\n" +
            "cat > /var/www/html/index.html <<EOF\n" +
            "<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "    <title>Web Application</title>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <h1>Welcome to the Web Application</h1>\n" +
            "    <p>Instance ID: $(ec2-metadata --instance-id | cut -d \" \" -f 2)</p>\n" +
            "    <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d \" \" -f 2)</p>\n" +
            "</body>\n" +
            "</html>\n" +
            "EOF\n" +
            "\n" +
            "# Download application code from S3 if available\n" +
            "aws s3 cp s3://" + bucketName + "/app.tar.gz /tmp/app.tar.gz 2>/dev/null || true\n" +
            "if [ -f /tmp/app.tar.gz ]; then\n" +
            "    tar -xzf /tmp/app.tar.gz -C /var/www/html/\n" +
            "fi\n";
    }
    
    /**
     * Validate configuration values
     */
    public static boolean validateConfiguration() {
        return MIN_SIZE > 0 &&
               MAX_SIZE > MIN_SIZE &&
               DESIRED_CAPACITY >= MIN_SIZE &&
               DESIRED_CAPACITY <= MAX_SIZE &&
               HEALTH_CHECK_INTERVAL > 0 &&
               HEALTH_CHECK_TIMEOUT > 0 &&
               HEALTH_CHECK_TIMEOUT < HEALTH_CHECK_INTERVAL &&
               HTTP_PORT > 0 && HTTP_PORT <= 65535 &&
               HTTPS_PORT > 0 && HTTPS_PORT <= 65535;
    }
    
    /**
     * Get expected export names
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