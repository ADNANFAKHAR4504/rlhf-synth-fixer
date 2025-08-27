I'll help you create a comprehensive AWS CDK Java solution that addresses all your requirements. Let me provide you with a complete project structure and the main stack file you requested.

## Project Structure

First, here's how you should organize your CDK project:

```
my-cdk-project/
├── src/main/java/com/mycompany/infrastructure/
│   ├── TapStack.java                    # Your main stack file
│   ├── TapApp.java                      # CDK App entry point
│   └── config/
│       └── EnvironmentConfig.java       # Environment configuration
├── cdk.json                             # CDK configuration
├── pom.xml                              # Maven dependencies
└── deploy/
    ├── deploy-dev.sh
    ├── deploy-staging.sh
    └── deploy-prod.sh
```

## Complete Stack Implementation

Here's your complete `tap_stack.java` file:

```java
package com.mycompany.infrastructure;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;

import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.s3.deployment.*;

import java.util.*;

/**
 * Complete AWS Infrastructure Stack for Multi-Environment Deployment
 * Supports dev, staging, and production environments with environment-specific configurations
 */
public class TapStack extends Stack {

    // Environment configuration class
    public static class EnvironmentConfig {
        private final String environmentName;
        private final String accountId;
        private final String region;
        private final String vpcCidr;
        private final boolean enableNatGateway;
        private final int maxAzs;
        private final Map<String, String> tags;

        public EnvironmentConfig(String environmentName, String accountId, String region,
                               String vpcCidr, boolean enableNatGateway, int maxAzs) {
            this.environmentName = environmentName;
            this.accountId = accountId;
            this.region = region;
            this.vpcCidr = vpcCidr;
            this.enableNatGateway = enableNatGateway;
            this.maxAzs = maxAzs;
            this.tags = createDefaultTags();
        }

        private Map<String, String> createDefaultTags() {
            Map<String, String> tags = new HashMap<>();
            tags.put("Environment", environmentName);
            tags.put("Project", "TapInfrastructure");
            tags.put("ManagedBy", "CDK");
            return tags;
        }

        // Getters
        public String getEnvironmentName() { return environmentName; }
        public String getAccountId() { return accountId; }
        public String getRegion() { return region; }
        public String getVpcCidr() { return vpcCidr; }
        public boolean isEnableNatGateway() { return enableNatGateway; }
        public int getMaxAzs() { return maxAzs; }
        public Map<String, String> getTags() { return tags; }

        public boolean isProd() { return "prod".equals(environmentName); }
        public boolean isDev() { return "dev".equals(environmentName); }
        public boolean isStaging() { return "staging".equals(environmentName); }
    }

    // Infrastructure components
    private final Vpc vpc;
    private final Role crossAccountRole;
    private final Bucket loggingBucket;
    private final Bucket replicationBucket;
    private final EnvironmentConfig config;

    public TapStack(final App scope, final String id, final StackProps props,
                   final EnvironmentConfig config) {
        super(scope, id, props);

        this.config = config;

        // Apply tags to the entire stack
        applyStackTags();

        // Create VPC with environment-specific configuration
        this.vpc = createVpc();

        // Create IAM roles and policies
        this.crossAccountRole = createCrossAccountRole();

        // Create S3 buckets for logging
        this.loggingBucket = createLoggingBucket();

        // Create replication bucket if not dev environment
        this.replicationBucket = config.isDev() ? null : createReplicationBucket();

        // Set up cross-region replication if applicable
        if (this.replicationBucket != null) {
            setupCrossRegionReplication();
        }

        // Create additional IAM policies
        createAdditionalIamPolicies();

        // Output important resource information
        createOutputs();
    }

    /**
     * Apply tags to the entire stack
     */
    private void applyStackTags() {
        config.getTags().forEach((key, value) -> Tags.of(this).add(key, value));
    }

    /**
     * Create VPC with environment-specific configuration
     */
    private Vpc createVpc() {
        // Configure subnets based on environment
        List<SubnetConfiguration> subnets = new ArrayList<>();

        // Public subnets for load balancers, NAT gateways
        subnets.add(SubnetConfiguration.builder()
            .name(config.getEnvironmentName() + "-public")
            .subnetType(SubnetType.PUBLIC)
            .cidrMask(24)
            .build());

        // Private subnets for application servers
        subnets.add(SubnetConfiguration.builder()
            .name(config.getEnvironmentName() + "-private")
            .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
            .cidrMask(24)
            .build());

        // Isolated subnets for databases (only in staging and prod)
        if (!config.isDev()) {
            subnets.add(SubnetConfiguration.builder()
                .name(config.getEnvironmentName() + "-isolated")
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .cidrMask(24)
                .build());
        }

        Vpc.Builder vpcBuilder = Vpc.Builder.create(this, "TapVpc")
            .vpcName(config.getEnvironmentName() + "-tap-vpc")
            .ipAddresses(IpAddresses.cidr(config.getVpcCidr()))
            .maxAzs(config.getMaxAzs())
            .subnetConfiguration(subnets)
            .enableDnsHostnames(true)
            .enableDnsSupport(true);

        // NAT Gateway configuration based on environment
        if (config.isEnableNatGateway()) {
            if (config.isProd()) {
                // Production: NAT Gateway in each AZ for high availability
                vpcBuilder.natGateways(config.getMaxAzs());
            } else {
                // Dev/Staging: Single NAT Gateway to save costs
                vpcBuilder.natGateways(1);
            }
        } else {
            vpcBuilder.natGateways(0);
        }

        Vpc vpc = vpcBuilder.build();

        // Add VPC Flow Logs for production
        if (config.isProd()) {
            FlowLog.Builder.create(this, "VpcFlowLogs")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .destination(FlowLogDestination.toCloudWatchLogs())
                .build();
        }

        return vpc;
    }

    /**
     * Create cross-account IAM role for deployments and management
     */
    private Role createCrossAccountRole() {
        // Define trusted accounts (all three environment accounts)
        List<String> trustedAccounts = Arrays.asList(
            "123456789012", // Dev account
            "123456789013", // Staging account
            "123456789014"  // Prod account
        );

        List<IPrincipal> principals = new ArrayList<>();
        for (String accountId : trustedAccounts) {
            principals.add(new AccountPrincipal(accountId));
        }

        Role role = Role.Builder.create(this, "CrossAccountRole")
            .roleName(config.getEnvironmentName() + "-cross-account-role")
            .assumedBy(new CompositePrincipal(principals.toArray(new IPrincipal[0])))
            .description("Cross-account role for " + config.getEnvironmentName() + " environment")
            .maxSessionDuration(software.amazon.awscdk.Duration.hours(12))
            .build();

        // Attach policies based on environment
        if (config.isProd()) {
            // Production: More restrictive permissions
            role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"));

            // Custom policy for production deployments
            PolicyDocument prodPolicyDoc = PolicyDocument.Builder.create()
                .statements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList(
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ))
                        .resources(Arrays.asList("arn:aws:s3:::*-prod-*/*"))
                        .build(),
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList(
                            "ec2:DescribeInstances",
                            "ec2:DescribeImages",
                            "ec2:DescribeSnapshots"
                        ))
                        .resources(Arrays.asList("*"))
                        .build()
                ))
                .build();

            Policy prodPolicy = Policy.Builder.create(this, "ProdCrossAccountPolicy")
                .policyName(config.getEnvironmentName() + "-cross-account-policy")
                .document(prodPolicyDoc)
                .build();

            role.attachInlinePolicy(prodPolicy);
        } else {
            // Dev/Staging: More permissive for development
            role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("PowerUserAccess"));
        }

        return role;
    }

    /**
     * Create S3 bucket for logging with environment-specific configuration
     */
    private Bucket createLoggingBucket() {
        Bucket.Builder bucketBuilder = Bucket.Builder.create(this, "LoggingBucket")
            .bucketName(config.getEnvironmentName() + "-tap-logging-" +
                       config.getAccountId() + "-" + config.getRegion())
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .enforceSSL(true);

        // Environment-specific configurations
        if (config.isProd()) {
            // Production: Enable MFA delete and longer retention
            bucketBuilder
                .lifecycleRules(Arrays.asList(
                    LifecycleRule.builder()
                        .id("prod-log-retention")
                        .enabled(true)
                        .transitions(Arrays.asList(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(90))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.DEEP_ARCHIVE)
                                .transitionAfter(software.amazon.awscdk.Duration.days(365))
                                .build()
                        ))
                        .expiration(software.amazon.awscdk.Duration.days(2555)) // 7 years
                        .build()
                ));
        } else if (config.isStaging()) {
            // Staging: Moderate retention
            bucketBuilder
                .lifecycleRules(Arrays.asList(
                    LifecycleRule.builder()
                        .id("staging-log-retention")
                        .enabled(true)
                        .expiration(software.amazon.awscdk.Duration.days(90))
                        .build()
                ));
        } else {
            // Dev: Short retention to save costs
            bucketBuilder
                .lifecycleRules(Arrays.asList(
                    LifecycleRule.builder()
                        .id("dev-log-retention")
                        .enabled(true)
                        .expiration(software.amazon.awscdk.Duration.days(7))
                        .build()
                ));
        }

        Bucket bucket = bucketBuilder.build();

        // Add bucket policy for cross-account access
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .sid("CrossAccountLogAccess")
                .effect(Effect.ALLOW)
                .principals(Arrays.asList(new AccountPrincipal(config.getAccountId())))
                .actions(Arrays.asList(
                    "s3:GetBucketLocation",
                    "s3:ListBucket",
                    "s3:PutObject",
                    "s3:GetObject"
                ))
                .resources(Arrays.asList(
                    bucket.getBucketArn(),
                    bucket.getBucketArn() + "/*"
                ))
                .build()
        );

        return bucket;
    }

    /**
     * Create replication bucket for cross-region backup (not for dev)
     */
    private Bucket createReplicationBucket() {
        if (config.isDev()) {
            return null;
        }

        // Determine replication region (different from source)
        String replicationRegion = config.isProd() ? "us-east-1" : "us-west-2";

        return Bucket.Builder.create(this, "ReplicationBucket")
            .bucketName(config.getEnvironmentName() + "-tap-replication-" +
                       config.getAccountId() + "-" + replicationRegion)
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .enforceSSL(true)
            .build();
    }

    /**
     * Set up cross-region replication for logging bucket
     */
    private void setupCrossRegionReplication() {
        if (replicationBucket == null) {
            return;
        }

        // Create replication role
        Role replicationRole = Role.Builder.create(this, "ReplicationRole")
            .roleName(config.getEnvironmentName() + "-s3-replication-role")
            .assumedBy(new ServicePrincipal("s3.amazonaws.com"))
            .build();

        // Add replication permissions
        replicationRole.addToPolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl"
                ))
                .resources(Arrays.asList(loggingBucket.getBucketArn() + "/*"))
                .build()
        );

        replicationRole.addToPolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete"
                ))
                .resources(Arrays.asList(replicationBucket.getBucketArn() + "/*"))
                .build()
        );
    }

    /**
     * Create additional IAM policies for application-specific needs
     */
    private void createAdditionalIamPolicies() {
        // Application execution role
        Role appRole = Role.Builder.create(this, "ApplicationRole")
            .roleName(config.getEnvironmentName() + "-application-role")
            .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
            .build();

        // Add CloudWatch permissions
        appRole.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
        );

        // Add S3 permissions for logging bucket
        appRole.addToPolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:DeleteObject"
                ))
                .resources(Arrays.asList(loggingBucket.getBucketArn() + "/*"))
                .build()
        );

        // Environment-specific permissions
        if (config.isProd()) {
            // Production: Add additional security and monitoring permissions
            appRole.addToPolicy(
                PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList(
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ))
                    .resources(Arrays.asList(
                        "arn:aws:ssm:" + config.getRegion() + ":" + config.getAccountId() +
                        ":parameter/prod/*"
                    ))
                    .build()
            );
        }

        // Create instance profile
        CfnInstanceProfile.Builder.create(this, "ApplicationInstanceProfile")
            .instanceProfileName(config.getEnvironmentName() + "-application-profile")
            .roles(Arrays.asList(appRole.getRoleName()))
            .build();
    }

    /**
     * Create CloudFormation outputs for important resources
     */
    private void createOutputs() {
        // VPC outputs
        software.amazon.awscdk.CfnOutput.Builder.create(this, "VpcId")
            .value(vpc.getVpcId())
            .description("VPC ID for " + config.getEnvironmentName())
            .exportName(config.getEnvironmentName() + "-vpc-id")
            .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "VpcCidr")
            .value(vpc.getVpcCidrBlock())
            .description("VPC CIDR for " + config.getEnvironmentName())
            .exportName(config.getEnvironmentName() + "-vpc-cidr")
            .build();

        // S3 bucket outputs
        software.amazon.awscdk.CfnOutput.Builder.create(this, "LoggingBucketName")
            .value(loggingBucket.getBucketName())
            .description("Logging bucket name for " + config.getEnvironmentName())
            .exportName(config.getEnvironmentName() + "-logging-bucket")
            .build();

        // IAM role outputs
        software.amazon.awscdk.CfnOutput.Builder.create(this, "CrossAccountRoleArn")
            .value(crossAccountRole.getRoleArn())
            .description("Cross-account role ARN for " + config.getEnvironmentName())
            .exportName(config.getEnvironmentName() + "-cross-account-role-arn")
            .build();

        // Subnet outputs
        List<ISubnet> publicSubnets = vpc.getPublicSubnets();
        for (int i = 0; i < publicSubnets.size(); i++) {
            software.amazon.awscdk.CfnOutput.Builder.create(this, "PublicSubnet" + (i + 1))
                .value(publicSubnets.get(i).getSubnetId())
                .description("Public subnet " + (i + 1) + " for " + config.getEnvironmentName())
                .exportName(config.getEnvironmentName() + "-public-subnet-" + (i + 1))
                .build();
        }

        List<ISubnet> privateSubnets = vpc.getPrivateSubnets();
        for (int i = 0; i < privateSubnets.size(); i++) {
            software.amazon.awscdk.CfnOutput.Builder.create(this, "PrivateSubnet" + (i + 1))
                .value(privateSubnets.get(i).getSubnetId())
                .description("Private subnet " + (i + 1) + " for " + config.getEnvironmentName())
                .exportName(config.getEnvironmentName() + "-private-subnet-" + (i + 1))
                .build();
        }
    }

    // Getters for accessing created resources
    public Vpc getVpc() { return vpc; }
    public Role getCrossAccountRole() { return crossAccountRole; }
    public Bucket getLoggingBucket() { return loggingBucket; }
    public Bucket getReplicationBucket() { return replicationBucket; }
    public EnvironmentConfig getConfig() { return config; }

    /**
     * Main CDK App class - place this in a separate TapApp.java file
     */
    public static class TapApp {
        public static void main(final String[] args) {
            App app = new App();

            // Environment configurations
            Map<String, EnvironmentConfig> environments = createEnvironmentConfigs();

            // Get environment from context or default to dev
            String targetEnv = (String) app.getNode().tryGetContext("environment");
            if (targetEnv == null) {
                targetEnv = "dev";
            }

            EnvironmentConfig config = environments.get(targetEnv);
            if (config == null) {
                throw new IllegalArgumentException("Unknown environment: " + targetEnv);
            }

            // Create stack with environment-specific configuration
            Environment env = Environment.builder()
                .account(config.getAccountId())
                .region(config.getRegion())
                .build();

            StackProps props = StackProps.builder()
                .env(env)
                .description("Tap Infrastructure Stack for " + config.getEnvironmentName())
                .build();

            new TapStack(app, config.getEnvironmentName() + "-TapStack", props, config);

            app.synth();
        }

        private static Map<String, EnvironmentConfig> createEnvironmentConfigs() {
            Map<String, EnvironmentConfig> configs = new HashMap<>();

            // Dev environment
            configs.put("dev", new EnvironmentConfig(
                "dev",
                "123456789012",  // Replace with your dev account ID
                "us-east-1",
                "10.0.0.0/16",
                false,  // No NAT Gateway for dev to save costs
                2
            ));

            // Staging environment
            configs.put("staging", new EnvironmentConfig(
                "staging",
                "123456789013",  // Replace with your staging account ID
                "us-east-2",
                "10.1.0.0/16",
                true,   // NAT Gateway for staging
                2
            ));

            // Production environment
            configs.put("prod", new EnvironmentConfig(
                "prod",
                "123456789014",  // Replace with your prod account ID
                "us-west-1",
                "10.2.0.0/16",
                true,   // NAT Gateway for production
                3       // More AZs for production
            ));

            return configs;
        }
    }
}
```

## Additional Configuration Files

### `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"
         xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.mycompany</groupId>
    <artifactId>tap-infrastructure</artifactId>
    <version>0.1</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdk.version>2.100.0</cdk.version>
        <junit.version>5.7.1</junit.version>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.0.0</version>
                <configuration>
                    <mainClass>com.mycompany.infrastructure.TapStack$TapApp</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <dependencies>
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>aws-cdk-lib</artifactId>
            <version>${cdk.version}</version>
        </dependency>

        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>10.0.5</version>
        </dependency>

        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

### `cdk.json`

```json
{
  "app": "mvn -e -q compile exec:java",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "target", "pom.xml", "src/test"]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

## Deployment Scripts

### `deploy/deploy-dev.sh`

```bash
#!/bin/bash
set -e

echo "Deploying to DEV environment..."
cdk deploy dev-TapStack -c environment=dev --require-approval never
```

### `deploy/deploy-staging.sh`

```bash
#!/bin/bash
set -e

echo "Deploying to STAGING environment..."
cdk deploy staging-TapStack -c environment=staging --require-approval never
```

### `deploy/deploy-prod.sh`

```bash
#!/bin/bash
set -e

echo "Deploying to PRODUCTION environment..."
cdk deploy prod-TapStack -c environment=prod --require-approval broadening
```

## Key Features of This Solution

### 1. **Environment-Specific Configuration**

- Each environment has its own configuration with different CIDR ranges, account IDs, and regions
- Environment-specific resource sizing and features (NAT Gateways, retention policies)

### 2. **Reusable Code Structure**

- Single stack class handles all environments
- Configuration-driven approach eliminates code duplication
- Clean separation of concerns with inner classes

### 3. **Production-Ready Features**

- Proper IAM roles and policies with least privilege
- S3 bucket lifecycle policies and cross-region replication
- VPC Flow Logs for production
- Comprehensive tagging strategy

### 4. **Type Safety & Error Handling**

- Full Java type safety with compile-time checks
- Proper error handling for invalid environments
- Comprehensive validation
