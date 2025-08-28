package app;

import com.pulumi.Pulumi;
import com.pulumi.Context;
import com.pulumi.core.Output;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.inputs.GetCallerIdentityArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.SecurityGroupRule;
import com.pulumi.aws.ec2.SecurityGroupRuleArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.secretsmanager.Secret;
import com.pulumi.aws.secretsmanager.SecretArgs;
import com.pulumi.aws.secretsmanager.SecretVersion;
import com.pulumi.aws.secretsmanager.SecretVersionArgs;
import com.pulumi.resources.CustomResourceOptions;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.security.SecureRandom;

public final class Main {
    
    private Main() {
        // Prevent instantiation
    }
    
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }
    
    static void defineInfrastructure(Context ctx) {
        // Get environment configuration
        String environment = ctx.config().get("environment").orElse("development");
        String region = ctx.config().get("region").orElse("us-east-1");
        
        // Validate environment
        EnvironmentConfig envConfig = new EnvironmentConfig(environment);
        
        // Create AWS provider with environment-specific configuration
        Provider awsProvider = new Provider("aws-provider", ProviderArgs.builder()
            .region(region)
            // Note: Default tags will be applied individually to resources via TaggingPolicy
            .build());
        
        // Initialize infrastructure stack
        InfrastructureStack infraStack = new InfrastructureStack(
            "cloud-migration-" + environment,
            envConfig,
            awsProvider
        );
        
        // Deploy core infrastructure
        var vpc = infraStack.createVpc();
        var securityGroups = infraStack.createSecurityGroups(vpc);
        var kmsKey = infraStack.createKmsKey();
        
        // Initialize migration manager for custom migration tasks
        MigrationManager migrationManager = new MigrationManager(
            "migration-manager-" + environment,
            envConfig,
            awsProvider
        );
        
        // Execute custom migrations
        var secretsMigration = migrationManager.migrateSecrets(kmsKey);
        
        // Export important outputs
        ctx.export("vpcId", vpc.id());
        ctx.export("kmsKeyId", kmsKey.id());
        ctx.export("environment", Output.of(environment));
        ctx.export("migrationStatus", secretsMigration.apply(status -> 
            Output.of(Map.of("secretsMigration", status))));
    }

    // Environment Configuration
    public static class EnvironmentConfig {
        private final String environment;
        private final List<String> validEnvironments = Arrays.asList(
            "development", "testing", "staging", "production"
        );
        
        public EnvironmentConfig(String environment) {
            if (!validEnvironments.contains(environment)) {
                throw new IllegalArgumentException(
                    "Invalid environment: " + environment + 
                    ". Must be one of: " + validEnvironments
                );
            }
            this.environment = environment;
        }
        
        public String getEnvironment() {
            return environment;
        }
        
        public boolean isProduction() {
            return "production".equals(environment);
        }
        
        public boolean isDevelopment() {
            return "development".equals(environment);
        }
        
        public Map<String, String> getVpcConfig() {
            Map<String, String> config = new HashMap<>();
            
            switch (environment) {
                case "development":
                    config.put("cidrBlock", "10.0.0.0/16");
                    config.put("enableDnsHostnames", "true");
                    config.put("enableDnsSupport", "true");
                    break;
                case "testing":
                    config.put("cidrBlock", "10.1.0.0/16");
                    config.put("enableDnsHostnames", "true");
                    config.put("enableDnsSupport", "true");
                    break;
                case "staging":
                    config.put("cidrBlock", "10.2.0.0/16");
                    config.put("enableDnsHostnames", "true");
                    config.put("enableDnsSupport", "true");
                    break;
                case "production":
                    config.put("cidrBlock", "10.3.0.0/16");
                    config.put("enableDnsHostnames", "true");
                    config.put("enableDnsSupport", "true");
                    break;
                default:
                    throw new IllegalStateException("Unexpected environment: " + environment);
            }
            
            return config;
        }
        
        public int getKmsKeyRotationDays() {
            return isProduction() ? 90 : 365;
        }
    }

    // Infrastructure Stack
    public static class InfrastructureStack {
        private final String stackName;
        private final EnvironmentConfig envConfig;
        private final Provider awsProvider;
        
        public InfrastructureStack(String stackName, EnvironmentConfig envConfig, Provider awsProvider) {
            this.stackName = stackName;
            this.envConfig = envConfig;
            this.awsProvider = awsProvider;
        }
        
        public Vpc createVpc() {
            String vpcName = ResourceNaming.generateResourceName(
                envConfig.getEnvironment(), "vpc", "main"
            );
            
            Map<String, String> vpcConfig = envConfig.getVpcConfig();
            
            return new Vpc(vpcName, VpcArgs.builder()
                .cidrBlock(vpcConfig.get("cidrBlock"))
                .enableDnsHostnames(Boolean.parseBoolean(vpcConfig.get("enableDnsHostnames")))
                .enableDnsSupport(Boolean.parseBoolean(vpcConfig.get("enableDnsSupport")))
                .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "VPC"))
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
        }
        
        public SecurityGroup createSecurityGroups(Vpc vpc) {
            String sgName = ResourceNaming.generateResourceName(
                envConfig.getEnvironment(), "sg", "web"
            );
            
            SecurityGroup webSg = new SecurityGroup(sgName, SecurityGroupArgs.builder()
                .name(sgName)
                .description("Security group for web tier - " + envConfig.getEnvironment())
                .vpcId(vpc.id())
                .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "SecurityGroup", "Tier", "Web"))
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
            
            // Add ingress rules
            new SecurityGroupRule("web-sg-ingress-http", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(webSg.id())
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
            
            new SecurityGroupRule("web-sg-ingress-https", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(webSg.id())
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
            
            // Add egress rule
            new SecurityGroupRule("web-sg-egress-all", SecurityGroupRuleArgs.builder()
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(webSg.id())
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
            
            return webSg;
        }
        
        public Key createKmsKey() {
            String keyName = ResourceNaming.generateResourceName(
                envConfig.getEnvironment(), "kms", "main"
            );
            
            // Get current AWS account ID
            Output<String> accountId = AwsFunctions.getCallerIdentity(GetCallerIdentityArgs.builder().build())
                .applyValue(identity -> identity.accountId());
            
            // Create KMS key policy with dynamic account ID
            Output<String> keyPolicy = accountId.applyValue(account -> String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::%s:root"
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        }
                    ]
                }
                """, account));
            
            return new Key(keyName, KeyArgs.builder()
                .description("KMS key for " + envConfig.getEnvironment() + " environment encryption")
                .policy(keyPolicy)
                .enableKeyRotation(true)
                .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "KMSKey"))
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
        }
    }

    // Migration Manager
    public static class MigrationManager {
        private final String name;
        private final EnvironmentConfig envConfig;
        private final Provider awsProvider;
        
        public MigrationManager(String name, EnvironmentConfig envConfig, Provider awsProvider) {
            this.name = name;
            this.envConfig = envConfig;
            this.awsProvider = awsProvider;
        }
        
        public Output<String> migrateSecrets(Key kmsKey) {
            SecretsManagerMigration secretsMigration = new SecretsManagerMigration(
                envConfig,
                awsProvider,
                kmsKey
            );
            
            return secretsMigration.migrate();
        }
    }

    // Secrets Manager Migration
    public static class SecretsManagerMigration {
        private final EnvironmentConfig envConfig;
        private final Provider awsProvider;
        private final Key kmsKey;
        
        public SecretsManagerMigration(EnvironmentConfig envConfig, 
                                     Provider awsProvider, Key kmsKey) {
            this.envConfig = envConfig;
            this.awsProvider = awsProvider;
            this.kmsKey = kmsKey;
        }
        
        public Output<String> migrate() {
            // Example: Migrate database credentials
            String secretName = ResourceNaming.generateResourceName(
                envConfig.getEnvironment(), "secret", "db-credentials"
            );
            
            Secret dbSecret = new Secret(secretName, SecretArgs.builder()
                .name(secretName)
                .description("Database credentials for " + envConfig.getEnvironment())
                .kmsKeyId(kmsKey.id())
                .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "Secret", "Type", "Database"))
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
            
            // Create secret version with placeholder values
            // In real implementation, you would fetch these from your existing secret store
            Map<String, String> secretValue = new HashMap<>();
            secretValue.put("username", "admin");
            secretValue.put("password", "placeholder-" + ResourceNaming.generateRandomString(16));
            secretValue.put("host", envConfig.getEnvironment() + "-db.internal");
            secretValue.put("port", "5432");
            secretValue.put("database", "app_" + envConfig.getEnvironment());
            
            String secretJson = convertMapToJson(secretValue);
            
            new SecretVersion(secretName + "-version", SecretVersionArgs.builder()
                .secretId(dbSecret.id())
                .secretString(secretJson)
                .build(), CustomResourceOptions.builder()
                    .provider(awsProvider)
                    .build());
            
            return Output.of("completed");
        }
        
        private String convertMapToJson(Map<String, String> map) {
            StringBuilder json = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, String> entry : map.entrySet()) {
                if (!first) {
                    json.append(",");
                }
                json.append("\"").append(entry.getKey()).append("\":\"").append(entry.getValue()).append("\"");
                first = false;
            }
            json.append("}");
            return json.toString();
        }
    }

    // Resource Naming
    public static class ResourceNaming {
        private static final SecureRandom random = new SecureRandom();
        private static final String CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
        
        public static String generateResourceName(String environment, String resourceType, String baseName) {
            String randomSuffix = generateRandomString(6);
            return String.format("cm-%s-%s-%s-%s", 
                environment.substring(0, Math.min(3, environment.length())),
                resourceType,
                baseName,
                randomSuffix
            ).toLowerCase();
        }
        
        public static String generateRandomString(int length) {
            StringBuilder sb = new StringBuilder(length);
            for (int i = 0; i < length; i++) {
                sb.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
            }
            return sb.toString();
        }
        
        public static String sanitizeName(String name) {
            return name.replaceAll("[^a-zA-Z0-9-]", "-")
                      .replaceAll("-+", "-")
                      .toLowerCase();
        }
    }

    // Tagging Policy
    public static class TaggingPolicy {
        private static final String PROJECT_NAME = "CloudMigration";
        
        public static Map<String, String> getDefaultTags(String environment) {
            Map<String, String> tags = new HashMap<>();
            tags.put("Project", PROJECT_NAME);
            tags.put("Environment", environment);
            tags.put("ManagedBy", "Pulumi");
            tags.put("CreatedDate", java.time.LocalDate.now().toString());
            return tags;
        }
        
        public static Map<String, String> getResourceTags(String environment, String resourceType) {
            Map<String, String> tags = new HashMap<>();
            tags.put("Project", PROJECT_NAME);
            tags.put("Environment", environment);
            tags.put("ResourceType", resourceType);
            tags.put("ManagedBy", "Pulumi");
            return tags;
        }
        
        public static Map<String, String> getResourceTags(String environment, String resourceType, String customTag, String customValue) {
            Map<String, String> baseTags = getResourceTags(environment, resourceType);
            baseTags.put(customTag, customValue);
            return baseTags;
        }
    }
}