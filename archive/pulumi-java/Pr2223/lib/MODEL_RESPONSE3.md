I'll fix these compilation errors. The main issues are:

1. The `defaultTags` method expects `ProviderDefaultTagsArgs` not a `Map<String,String>`
2. There's a typo in the filename - it should be `SecretsManagerMigration.java` not `SecretsManagerMirgration.java`

Here are the fixes:

## Fixed Main Application Code

### src/main/java/app/Main.java

```java
package app;

import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.ProviderDefaultTagsArgs;
import app.config.EnvironmentConfig;
import app.infrastructure.InfrastructureStack;
import app.migration.MigrationManager;
import app.utils.TaggingPolicy;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Get environment configuration
            String environment = ctx.config().get("environment").orElse("development");
            String region = ctx.config().get("region").orElse("us-east-1");

            // Validate environment
            EnvironmentConfig envConfig = new EnvironmentConfig(environment);

            // Create AWS provider with environment-specific configuration
            Provider awsProvider = new Provider("aws-provider", ProviderArgs.builder()
                .region(region)
                .defaultTags(ProviderDefaultTagsArgs.builder()
                    .tags(TaggingPolicy.getDefaultTags(environment))
                    .build())
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
        });
    }
}
```

### src/main/java/app/utils/TaggingPolicy.java

```java
package app.utils;

import java.util.Map;
import java.util.HashMap;

public class TaggingPolicy {
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
```

### src/main/java/app/utils/ResourceNaming.java

```java
package app.utils;

import java.security.SecureRandom;

public class ResourceNaming {
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
```

### src/main/java/app/config/EnvironmentConfig.java

```java
package app.config;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class EnvironmentConfig {
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
```

### src/main/java/app/infrastructure/InfrastructureStack.java

```java
package app.infrastructure;

import com.pulumi.aws.Provider;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.SecurityGroupRule;
import com.pulumi.aws.ec2.SecurityGroupRuleArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;
import app.config.EnvironmentConfig;
import app.utils.ResourceNaming;
import app.utils.TaggingPolicy;

import java.util.List;
import java.util.Map;

public class InfrastructureStack {
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

        String keyPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::*:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }
            """;

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
```

### src/main/java/app/migration/MigrationManager.java

```java
package app.migration;

import com.pulumi.aws.Provider;
import com.pulumi.aws.kms.Key;
import com.pulumi.core.Output;
import app.config.EnvironmentConfig;
import app.migration.custom.SecretsManagerMigration;

public class MigrationManager {
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
            name + "-secrets-migration",
            envConfig,
            awsProvider,
            kmsKey
        );

        return secretsMigration.migrate();
    }
}
```

### src/main/java/app/migration/custom/SecretsManagerMigration.java

```java
package app.migration.custom;

import com.pulumi.aws.Provider;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.secretsmanager.Secret;
import com.pulumi.aws.secretsmanager.SecretArgs;
import com.pulumi.aws.secretsmanager.SecretVersion;
import com.pulumi.aws.secretsmanager.SecretVersionArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResource;
import com.pulumi.resources.ResourceArgs;
import com.pulumi.resources.CustomResourceOptions;
import app.config.EnvironmentConfig;
import app.utils.ResourceNaming;
import app.utils.TaggingPolicy;

import java.util.Map;
import java.util.HashMap;

public class SecretsManagerMigration extends CustomResource {
    private final EnvironmentConfig envConfig;
    private final Provider awsProvider;
    private final Key kmsKey;

    public SecretsManagerMigration(String name, EnvironmentConfig envConfig,
                                 Provider awsProvider, Key kmsKey) {
        super("custom:migration:SecretsManager", name, ResourceArgs.Empty, null);
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
```

## Tests (No changes needed, but including for completeness)

### src/test/unit/java/app/MainTest.java

```java
package app;

import app.config.EnvironmentConfig;
import app.utils.ResourceNaming;
import app.utils.TaggingPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MainTest {

    @Test
    @DisplayName("Environment configuration should validate valid environments")
    void testEnvironmentConfigValidation() {
        // Test valid environments
        assertDoesNotThrow(() -> new EnvironmentConfig("development"));
        assertDoesNotThrow(() -> new EnvironmentConfig("testing"));
        assertDoesNotThrow(() -> new EnvironmentConfig("staging"));
        assertDoesNotThrow(() -> new EnvironmentConfig("production"));

        // Test invalid environment
        assertThrows(IllegalArgumentException.class, () -> new EnvironmentConfig("invalid"));
    }

    @Test
    @DisplayName("VPC configuration should return correct CIDR blocks for each environment")
    void testVpcConfiguration() {
        EnvironmentConfig devConfig = new EnvironmentConfig("development");
        EnvironmentConfig testConfig = new EnvironmentConfig("testing");
        EnvironmentConfig stagingConfig = new EnvironmentConfig("staging");
        EnvironmentConfig prodConfig = new EnvironmentConfig("production");

        assertEquals("10.0.0.0/16", devConfig.getVpcConfig().get("cidrBlock"));
        assertEquals("10.1.0.0/16", testConfig.getVpcConfig().get("cidrBlock"));
        assertEquals("10.2.0.0/16", stagingConfig.getVpcConfig().get("cidrBlock"));
        assertEquals("10.3.0.0/16", prodConfig.getVpcConfig().get("cidrBlock"));
    }

    @Test
    @DisplayName("Resource naming should generate unique names with proper format")
    void testResourceNaming() {
        String name1 = ResourceNaming.generateResourceName("development", "vpc", "main");
        String name2 = ResourceNaming.generateResourceName("development", "vpc", "main");

        // Names should be different due to random suffix
        assertNotEquals(name1, name2);

        // Names should follow the pattern
        assertTrue(name1.startsWith("cm-dev-vpc-main-"));
        assertTrue(name1.length() > "cm-dev-vpc-main-".length());

        // Test name sanitization
        String sanitized = ResourceNaming.sanitizeName("Test@Name#With$Special%Characters");
        assertEquals("test-name-with-special-characters", sanitized);
    }

    @Test
    @DisplayName("Tagging policy should include mandatory tags")
    void testTaggingPolicy() {
        Map<String, String> devTags = TaggingPolicy.getResourceTags("development", "VPC");

        assertEquals("CloudMigration", devTags.get("Project"));
        assertEquals("development", devTags.get("Environment"));
        assertEquals("VPC", devTags.get("ResourceType"));
        assertEquals("Pulumi", devTags.get("ManagedBy"));

        // Test custom tags
        Map<String, String> customTags = TaggingPolicy.getResourceTags(
            "production", "SecurityGroup", "Tier", "Web"
        );
        assertEquals("Web", customTags.get("Tier"));
        assertEquals("production", customTags.get("Environment"));
    }

    @Test
    @DisplayName("KMS key rotation should be environment-specific")
    void testKmsKeyRotation() {
        EnvironmentConfig prodConfig = new EnvironmentConfig("production");
        EnvironmentConfig devConfig = new EnvironmentConfig("development");

        assertEquals(90, prodConfig.getKmsKeyRotationDays());
        assertEquals(365, devConfig.getKmsKeyRotationDays());
    }

    @Test
    @DisplayName("Random string generation should produce strings of correct length")
    void testRandomStringGeneration() {
        String random6 = ResourceNaming.generateRandomString(6);
        String random10 = ResourceNaming.generateRandomString(10);

        assertEquals(6, random6.length());
        assertEquals(10, random10.length());

        // Should only contain allowed characters
        assertTrue(random6.matches("[a-z0-9]+"));
        assertTrue(random10.matches("[a-z0-9]+"));

        // Multiple calls should produce different strings
        assertNotEquals(random6, ResourceNaming.generateRandomString(6));
    }

    @Test
    @DisplayName("Default tags should be properly formatted")
    void testDefaultTags() {
        Map<String, String> tags = TaggingPolicy.getDefaultTags("development");

        assertNotNull(tags);
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("development", tags.get("Environment"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertNotNull(tags.get("CreatedDate"));
    }
}
```

### src/test/integration/java/app/MainIntegrationTest.java

```java
package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class MainIntegrationTest {

    private TestMocks mocks;

    @BeforeEach
    void setUp() {
        mocks = new TestMocks();
    }

    @Test
    @DisplayName("Infrastructure deployment should create all required resources")
    void testInfrastructureDeployment() {
        // Simulate resource creation
        mocks.createResource("aws:ec2/vpc:Vpc", "test-vpc", Map.of("cidrBlock", "10.0.0.0/16"));
        mocks.createResource("aws:ec2/securityGroup:SecurityGroup", "test-sg", Map.of("name", "web-sg"));
        mocks.createResource("aws:kms/key:Key", "test-key", Map.of("enableKeyRotation", true));
        mocks.createResource("aws:secretsmanager/secret:Secret", "test-secret", Map.of("name", "db-secret"));

        var resources = mocks.getCreatedResources();

        // Verify VPC was created
        assertTrue(resources.containsKey("aws:ec2/vpc:Vpc"));

        // Verify Security Group was created
        assertTrue(resources.containsKey("aws:ec2/securityGroup:SecurityGroup"));

        // Verify KMS Key was created
        assertTrue(resources.containsKey("aws:kms/key:Key"));

        // Verify Secret was created
        assertTrue(resources.containsKey("aws:secretsmanager/secret:Secret"));
    }

    @Test
    @DisplayName("All resources should have mandatory tags")
    void testMandatoryTags() {
        Map<String, String> tags = new HashMap<>();
        tags.put("Project", "CloudMigration");
        tags.put("Environment", "development");
        tags.put("ManagedBy", "Pulumi");

        mocks.createResource("aws:ec2/vpc:Vpc", "test-vpc", Map.of("tags", tags));

        var resources = mocks.getCreatedResources();
        var vpcResource = resources.get("aws:ec2/vpc:Vpc");

        @SuppressWarnings("unchecked")
        Map<String, String> resourceTags = (Map<String, String>) vpcResource.get("tags");

        assertNotNull(resourceTags);
        assertEquals("CloudMigration", resourceTags.get("Project"));
        assertEquals("development", resourceTags.get("Environment"));
        assertEquals("Pulumi", resourceTags.get("ManagedBy"));
    }

    @Test
    @DisplayName("Security groups should have proper ingress/egress rules")
    void testSecurityGroupRules() {
        // Simulate security group rule creation
        mocks.addSecurityGroupRule(Map.of(
            "type", "ingress",
            "fromPort", 80,
            "toPort", 80,
            "protocol", "tcp"
        ));

        mocks.addSecurityGroupRule(Map.of(
            "type", "ingress",
            "fromPort", 443,
            "toPort", 443,
            "protocol", "tcp"
        ));

        mocks.addSecurityGroupRule(Map.of(
            "type", "egress",
            "fromPort", 0,
            "toPort", 65535,
            "protocol", "tcp"
        ));

        var rules = mocks.getSecurityGroupRules();

        // Verify HTTP ingress rule exists
        assertTrue(rules.stream().anyMatch(rule ->
            "ingress".equals(rule.get("type")) &&
            Integer.valueOf(80).equals(rule.get("fromPort"))
        ));

        // Verify HTTPS ingress rule exists
        assertTrue(rules.stream().anyMatch(rule ->
            "ingress".equals(rule.get("type")) &&
            Integer.valueOf(443).equals(rule.get("fromPort"))
        ));

        // Verify egress rule exists
        assertTrue(rules.stream().anyMatch(rule ->
            "egress".equals(rule.get("type"))
        ));
    }

    @Test
    @DisplayName("KMS key should be properly configured")
    void testKmsKeyConfiguration() {
        Map<String, Object> kmsConfig = new HashMap<>();
        kmsConfig.put("enableKeyRotation", true);
        kmsConfig.put("policy", "test-policy");
        kmsConfig.put("description", "Test KMS key");

        mocks.addKmsKey(kmsConfig);

        var kmsKeys = mocks.getKmsKeys();

        assertFalse(kmsKeys.isEmpty());

        var kmsKey = kmsKeys.get(0);
        assertEquals(true, kmsKey.get("enableKeyRotation"));
        assertNotNull(kmsKey.get("policy"));
        assertNotNull(kmsKey.get("description"));
    }

    @Test
    @DisplayName("Secrets migration should complete successfully")
    void testSecretsMigration() {
        Map<String, Object> secretConfig = new HashMap<>();
        secretConfig.put("name", "cm-dev-secret-db-credentials-abc123");
        secretConfig.put("kmsKeyId", "test-kms-key-id");
        secretConfig.put("description", "Database credentials for development");

        mocks.addSecret(secretConfig);

        var secrets = mocks.getSecrets();

        assertFalse(secrets.isEmpty());

        var secret = secrets.get(0);
        assertNotNull(secret.get("kmsKeyId"));
        assertTrue(secret.get("name").toString().contains("db-credentials"));
    }

    // Mock implementation for testing
    private static class TestMocks {
        private final Map<String, Map<String, Object>> createdResources = new HashMap<>();
        private final List<Map<String, Object>> securityGroupRules = new ArrayList<>();
        private final List<Map<String, Object>> kmsKeys = new ArrayList<>();
        private final List<Map<String, Object>> secrets = new ArrayList<>();

        public void createResource(String resourceType, String resourceName, Map<String, Object> properties) {
            Map<String, Object> resource = new HashMap<>(properties);
            resource.put("id", resourceName + "-" + System.currentTimeMillis());
            createdResources.put(resourceType, resource);
        }

        public void addSecurityGroupRule(Map<String, Object> rule) {
            securityGroupRules.add(new HashMap<>(rule));
        }

        public void addKmsKey(Map<String, Object> kmsKey) {
            kmsKeys.add(new HashMap<>(kmsKey));
        }

        public void addSecret(Map<String, Object> secret) {
            secrets.add(new HashMap<>(secret));
        }

        public Map<String, Map<String, Object>> getCreatedResources() {
            return createdResources;
        }

        public List<Map<String, Object>> getSecurityGroupRules() {
            return securityGroupRules;
        }

        public List<Map<String, Object>> getKmsKeys() {
            return kmsKeys;
        }

        public List<Map<String, Object>> getSecrets() {
            return secrets;
        }
    }
}
```

## Key Fixes Made:

1. **Fixed defaultTags issue**: Added the proper import for `ProviderDefaultTagsArgs` and wrapped the tags map in the correct builder pattern.

2. **Fixed filename issue**: Make sure to rename the file from `SecretsManagerMirgration.java` to `SecretsManagerMigration.java` (note the correct spelling).

The main changes are:

- Added `import com.pulumi.aws.ProviderDefaultTagsArgs;`
- Changed `.defaultTags(TaggingPolicy.getDefaultTags(environment))` to `.defaultTags(ProviderDefaultTagsArgs.builder().tags(TaggingPolicy.getDefaultTags(environment)).build())`

Make sure to rename the file `SecretsManagerMirgration.java` to `SecretsManagerMigration.java` to fix the filename/class name mismatch error.
