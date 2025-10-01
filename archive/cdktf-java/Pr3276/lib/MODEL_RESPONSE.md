### Reasoning Trace
---

This is a comprehensive request for designing a CI/CD pipeline on AWS using CDK for Terraform (CDKTF) with Java. Let me break down the requirements:

1. Source: AWS CodeCommit (triggered on main branch changes)
2. Orchestration: AWS CodePipeline
3. Build: AWS CodeBuild with inline buildspec definitions
4. Deploy: AWS CodeDeploy
5. Artifact storage: S3 with KMS encryption
6. Security: IAM roles with least privilege
7. Monitoring: CloudWatch logs
8. Multi-environment: Staging (us-west-2) → Manual Approval → Production (us-east-1)
9. Components: Separate frontend and backend with independent builds/deployments
10. Notifications: SNS for build failures via EventBridge rules

I'll create a comprehensive CDKTF Java implementation that covers all these requirements.
### Answer
---

I'll design a comprehensive CI/CD pipeline using CDKTF with Java that meets all your requirements. This solution implements a multi-stage, multi-region pipeline with proper security, monitoring, and notification features.

## Project Structure

```
cicd-pipeline-cdktf/
├── src/main/java/com/example/
│   ├── Main.java
│   ├── stacks/
│   │   ├── PipelineStack.java
│   │   ├── SharedResourcesStack.java
│   │   └── NotificationStack.java
│   ├── constructs/
│   │   ├── CodeBuildConstruct.java
│   │   ├── CodeDeployConstruct.java
│   │   └── IAMRolesConstruct.java
│   └── config/
│       └── PipelineConfig.java
├── pom.xml
└── cdktf.json
```

## Complete Implementation

### 1. Main Application Entry Point

```java
package com.example;

import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.StackOptions;
import com.hashicorp.cdktf.RemoteBackend;
import com.hashicorp.cdktf.RemoteBackendProps;
import com.example.stacks.PipelineStack;
import com.example.stacks.SharedResourcesStack;
import com.example.stacks.NotificationStack;
import com.example.config.PipelineConfig;

public class Main {
    public static void main(String[] args) {
        final App app = new App();
        
        // Configuration
        PipelineConfig config = PipelineConfig.builder()
            .projectName("webapp")
            .repositoryName("webapp-repo")
            .stagingRegion("us-west-2")
            .productionRegion("us-east-1")
            .notificationEmail("devops@example.com")
            .build();
        
        // Shared resources stack (KMS, S3)
        SharedResourcesStack sharedStack = new SharedResourcesStack(app, "shared-resources", 
            StackOptions.builder()
                .env("us-east-1")
                .build(), 
            config);
        
        // Notification stack
        NotificationStack notificationStack = new NotificationStack(app, "notifications",
            StackOptions.builder()
                .env("us-east-1")
                .build(),
            config);
        
        // Main pipeline stack
        PipelineStack pipelineStack = new PipelineStack(app, "cicd-pipeline",
            StackOptions.builder()
                .env("us-east-1")
                .build(),
            config, sharedStack, notificationStack);
        
        app.synth();
    }
}
```

### 2. Shared Resources Stack

```java
package com.example.stacks;

import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.StackOptions;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import imports.aws.provider.AwsProvider;
import imports.aws.provider.AwsProviderConfig;
import imports.aws.kms_key.KmsKey;
import imports.aws.kms_key.KmsKeyConfig;
import imports.aws.kms_alias.KmsAlias;
import imports.aws.kms_alias.KmsAliasConfig;
import imports.aws.s3_bucket.S3Bucket;
import imports.aws.s3_bucket.S3BucketConfig;
import imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfiguration;
import imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationConfig;
import imports.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRule;
import imports.aws.s3_bucket_versioning.S3BucketVersioning;
import imports.aws.s3_bucket_versioning.S3BucketVersioningConfig;
import imports.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import imports.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import imports.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlockConfig;
import com.example.config.PipelineConfig;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class SharedResourcesStack extends TerraformStack {
    private final S3Bucket artifactBucket;
    private final KmsKey kmsKey;
    
    public SharedResourcesStack(final Construct scope, final String id, 
                                final StackOptions options, final PipelineConfig config) {
        super(scope, id);
        
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
            .region(options.getEnv())
            .build());
        
        // Create KMS key for encryption
        Map<String, String> tags = new HashMap<>();
        tags.put("Project", config.getProjectName());
        tags.put("ManagedBy", "CDKTF");
        
        this.kmsKey = new KmsKey(this, "pipeline-kms-key", KmsKeyConfig.builder()
            .description("KMS key for CI/CD pipeline artifacts encryption")
            .deletionWindowInDays(10)
            .enableKeyRotation(true)
            .tags(tags)
            .policy(generateKmsPolicy(config))
            .build());
        
        new KmsAlias(this, "pipeline-kms-alias", KmsAliasConfig.builder()
            .name("alias/" + config.getProjectName() + "-pipeline")
            .targetKeyId(kmsKey.getId())
            .build());
        
        // Create S3 bucket for artifacts
        this.artifactBucket = new S3Bucket(this, "artifacts-bucket", S3BucketConfig.builder()
            .bucket(config.getProjectName() + "-pipeline-artifacts-" + System.currentTimeMillis())
            .tags(tags)
            .build());
        
        // Enable versioning
        new S3BucketVersioning(this, "artifacts-versioning", S3BucketVersioningConfig.builder()
            .bucket(artifactBucket.getId())
            .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                .status("Enabled")
                .build())
            .build());
        
        // Configure server-side encryption
        new S3BucketServerSideEncryptionConfiguration(this, "artifacts-encryption",
            S3BucketServerSideEncryptionConfigurationConfig.builder()
                .bucket(artifactBucket.getId())
                .rule(Arrays.asList(
                    S3BucketServerSideEncryptionConfigurationRule.builder()
                        .applyServerSideEncryptionByDefault(
                            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault.builder()
                                .sseAlgorithm("aws:kms")
                                .kmsMasterKeyId(kmsKey.getArn())
                                .build())
                        .bucketKeyEnabled(true)
                        .build()
                ))
                .build());
        
        // Block public access
        new S3BucketPublicAccessBlock(this, "artifacts-public-access-block",
            S3BucketPublicAccessBlockConfig.builder()
                .bucket(artifactBucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());
        
        // Outputs
        new TerraformOutput(this, "artifact-bucket-name", TerraformOutputConfig.builder()
            .value(artifactBucket.getBucket())
            .build());
        
        new TerraformOutput(this, "kms-key-arn", TerraformOutputConfig.builder()
            .value(kmsKey.getArn())
            .build());
    }
    
    private String generateKmsPolicy(PipelineConfig config) {
        return """
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
                    },
                    {
                        "Sid": "Allow services to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "codepipeline.amazonaws.com",
                                "codebuild.amazonaws.com",
                                "s3.amazonaws.com",
                                "logs.amazonaws.com"
                            ]
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey",
                            "kms:CreateGrant"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            """.formatted(getAccountId());
    }
    
    private String getAccountId() {
        // In production, retrieve this from AWS STS or environment variable
        return System.getenv("AWS_ACCOUNT_ID");
    }
    
    public S3Bucket getArtifactBucket() {
        return artifactBucket;
    }
    
    public KmsKey getKmsKey() {
        return kmsKey;
    }
}
```

### 3. Main Pipeline Stack

```java
package com.example.stacks;

import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.StackOptions;
import imports.aws.provider.AwsProvider;
import imports.aws.provider.AwsProviderConfig;
import imports.aws.codecommit_repository.CodecommitRepository;
import imports.aws.codecommit_repository.CodecommitRepositoryConfig;
import imports.aws.codepipeline.Codepipeline;
import imports.aws.codepipeline.CodepipelineConfig;
import imports.aws.codepipeline.CodepipelineStage;
import imports.aws.codepipeline.CodepipelineStageAction;
import imports.aws.codepipeline.CodepipelineArtifactStore;
import imports.aws.codepipeline.CodepipelineArtifactStoreEncryptionKey;
import com.example.config.PipelineConfig;
import com.example.constructs.CodeBuildConstruct;
import com.example.constructs.CodeDeployConstruct;
import com.example.constructs.IAMRolesConstruct;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

public class PipelineStack extends TerraformStack {
    
    public PipelineStack(final Construct scope, final String id,
                        final StackOptions options, 
                        final PipelineConfig config,
                        final SharedResourcesStack sharedStack,
                        final NotificationStack notificationStack) {
        super(scope, id);
        
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
            .region(options.getEnv())
            .build());
        
        // Create IAM roles
        IAMRolesConstruct iamRoles = new IAMRolesConstruct(this, "iam-roles", config, sharedStack);
        
        // Create CodeCommit repository
        CodecommitRepository repository = new CodecommitRepository(this, "app-repository",
            CodecommitRepositoryConfig.builder()
                .repositoryName(config.getRepositoryName())
                .description("Web application source repository")
                .build());
        
        // Create CodeBuild projects
        CodeBuildConstruct frontendBuild = new CodeBuildConstruct(this, "frontend-build",
            config, "frontend", getFrontendBuildspec(), iamRoles.getCodeBuildRole(), 
            sharedStack, notificationStack.getSnsTopicArn());
        
        CodeBuildConstruct backendBuild = new CodeBuildConstruct(this, "backend-build",
            config, "backend", getBackendBuildspec(), iamRoles.getCodeBuildRole(),
            sharedStack, notificationStack.getSnsTopicArn());
        
        // Create CodeDeploy applications
        CodeDeployConstruct frontendDeploy = new CodeDeployConstruct(this, "frontend-deploy",
            config, "frontend", iamRoles.getCodeDeployRole());
        
        CodeDeployConstruct backendDeploy = new CodeDeployConstruct(this, "backend-deploy",
            config, "backend", iamRoles.getCodeDeployRole());
        
        // Create CodePipeline
        createPipeline(config, sharedStack, iamRoles, repository,
            frontendBuild, backendBuild, frontendDeploy, backendDeploy);
    }
    
    private void createPipeline(PipelineConfig config, SharedResourcesStack sharedStack,
                                IAMRolesConstruct iamRoles, CodecommitRepository repository,
                                CodeBuildConstruct frontendBuild, CodeBuildConstruct backendBuild,
                                CodeDeployConstruct frontendDeploy, CodeDeployConstruct backendDeploy) {
        
        List<CodepipelineStage> stages = new ArrayList<>();
        
        // Source Stage
        stages.add(CodepipelineStage.builder()
            .name("Source")
            .action(Arrays.asList(
                CodepipelineStageAction.builder()
                    .name("SourceAction")
                    .category("Source")
                    .owner("AWS")
                    .provider("CodeCommit")
                    .version("1")
                    .outputArtifacts(Arrays.asList("SourceOutput"))
                    .configuration(Map.of(
                        "RepositoryName", repository.getRepositoryName(),
                        "BranchName", "main",
                        "PollForSourceChanges", "false"
                    ))
                    .build()
            ))
            .build());
        
        // Build Stage
        stages.add(CodepipelineStage.builder()
            .name("Build")
            .action(Arrays.asList(
                CodepipelineStageAction.builder()
                    .name("BuildFrontend")
                    .category("Build")
                    .owner("AWS")
                    .provider("CodeBuild")
                    .version("1")
                    .inputArtifacts(Arrays.asList("SourceOutput"))
                    .outputArtifacts(Arrays.asList("FrontendBuildOutput"))
                    .configuration(Map.of(
                        "ProjectName", frontendBuild.getProject().getName()
                    ))
                    .runOrder(1)
                    .build(),
                CodepipelineStageAction.builder()
                    .name("BuildBackend")
                    .category("Build")
                    .owner("AWS")
                    .provider("CodeBuild")
                    .version("1")
                    .inputArtifacts(Arrays.asList("SourceOutput"))
                    .outputArtifacts(Arrays.asList("BackendBuildOutput"))
                    .configuration(Map.of(
                        "ProjectName", backendBuild.getProject().getName()
                    ))
                    .runOrder(1)
                    .build()
            ))
            .build());
        
        // Deploy to Staging Stage
        stages.add(CodepipelineStage.builder()
            .name("DeployToStaging")
            .action(Arrays.asList(
                CodepipelineStageAction.builder()
                    .name("DeployFrontendStaging")
                    .category("Deploy")
                    .owner("AWS")
                    .provider("CodeDeploy")
                    .version("1")
                    .inputArtifacts(Arrays.asList("FrontendBuildOutput"))
                    .configuration(Map.of(
                        "ApplicationName", frontendDeploy.getApplication().getApplicationName(),
                        "DeploymentGroupName", frontendDeploy.getStagingDeploymentGroup().getDeploymentGroupName()
                    ))
                    .region(config.getStagingRegion())
                    .runOrder(1)
                    .build(),
                CodepipelineStageAction.builder()
                    .name("DeployBackendStaging")
                    .category("Deploy")
                    .owner("AWS")
                    .provider("CodeDeploy")
                    .version("1")
                    .inputArtifacts(Arrays.asList("BackendBuildOutput"))
                    .configuration(Map.of(
                        "ApplicationName", backendDeploy.getApplication().getApplicationName(),
                        "DeploymentGroupName", backendDeploy.getStagingDeploymentGroup().getDeploymentGroupName()
                    ))
                    .region(config.getStagingRegion())
                    .runOrder(1)
                    .build()
            ))
            .build());
        
        // Manual Approval Stage
        stages.add(CodepipelineStage.builder()
            .name("ManualApproval")
            .action(Arrays.asList(
                CodepipelineStageAction.builder()
                    .name("ApproveProduction")
                    .category("Approval")
                    .owner("AWS")
                    .provider("Manual")
                    .version("1")
                    .configuration(Map.of(
                        "NotificationArn", notificationStack.getSnsTopicArn(),
                        "CustomData", "Please review staging deployment and approve for production"
                    ))
                    .build()
            ))
            .build());
        
        // Deploy to Production Stage
        stages.add(CodepipelineStage.builder()
            .name("DeployToProduction")
            .action(Arrays.asList(
                CodepipelineStageAction.builder()
                    .name("DeployFrontendProduction")
                    .category("Deploy")
                    .owner("AWS")
                    .provider("CodeDeploy")
                    .version("1")
                    .inputArtifacts(Arrays.asList("FrontendBuildOutput"))
                    .configuration(Map.of(
                        "ApplicationName", frontendDeploy.getApplication().getApplicationName(),
                        "DeploymentGroupName", frontendDeploy.getProductionDeploymentGroup().getDeploymentGroupName()
                    ))
                    .region(config.getProductionRegion())
                    .runOrder(1)
                    .build(),
                CodepipelineStageAction.builder()
                    .name("DeployBackendProduction")
                    .category("Deploy")
                    .owner("AWS")
                    .provider("CodeDeploy")
                    .version("1")
                    .inputArtifacts(Arrays.asList("BackendBuildOutput"))
                    .configuration(Map.of(
                        "ApplicationName", backendDeploy.getApplication().getApplicationName(),
                        "DeploymentGroupName", backendDeploy.getProductionDeploymentGroup().getDeploymentGroupName()
                    ))
                    .region(config.getProductionRegion())
                    .runOrder(1)
                    .build()
            ))
            .build());
        
        // Create the pipeline
        new Codepipeline(this, "main-pipeline", CodepipelineConfig.builder()
            .name(config.getProjectName() + "-pipeline")
            .roleArn(iamRoles.getCodePipelineRole().getArn())
            .artifactStore(Arrays.asList(
                CodepipelineArtifactStore.builder()
                    .location(sharedStack.getArtifactBucket().getBucket())
                    .type("S3")
                    .encryptionKey(CodepipelineArtifactStoreEncryptionKey.builder()
                        .id(sharedStack.getKmsKey().getArn())
                        .type("KMS")
                        .build())
                    .build()
            ))
            .stage(stages)
            .build());
    }
    
    private String getFrontendBuildspec() {
        return """
            version: 0.2
            
            phases:
              pre_build:
                commands:
                  - echo Installing dependencies...
                  - cd frontend
                  - npm install
              build:
                commands:
                  - echo Building frontend application...
                  - npm run build
                  - npm run test
              post_build:
                commands:
                  - echo Build completed on `date`
            
            artifacts:
              files:
                - '**/*'
              name: frontend-build
              base-directory: frontend/build
            
            cache:
              paths:
                - 'frontend/node_modules/**/*'
            """;
    }
    
    private String getBackendBuildspec() {
        return """
            version: 0.2
            
            environment:
              variables:
                JAVA_HOME: "/usr/lib/jvm/java-11-amazon-corretto"
            
            phases:
              pre_build:
                commands:
                  - echo Installing dependencies...
                  - cd backend
                  - ./mvnw clean
              build:
                commands:
                  - echo Building backend application...
                  - ./mvnw package
                  - ./mvnw test
              post_build:
                commands:
                  - echo Build completed on `date`
                  - cp appspec.yml target/
                  - cp scripts/* target/
            
            artifacts:
              files:
                - 'target/**/*'
                - 'appspec.yml'
                - 'scripts/**/*'
              name: backend-build
              base-directory: backend
            
            cache:
              paths:
                - '/root/.m2/**/*'
            """;
    }
}
```

### 4. CodeBuild Construct

```java
package com.example.constructs;

import software.constructs.Construct;
import imports.aws.codebuild_project.CodebuildProject;
import imports.aws.codebuild_project.CodebuildProjectConfig;
import imports.aws.codebuild_project.CodebuildProjectArtifacts;
import imports.aws.codebuild_project.CodebuildProjectEnvironment;
import imports.aws.codebuild_project.CodebuildProjectSource;
import imports.aws.codebuild_project.CodebuildProjectLogsConfig;
import imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs;
import imports.aws.cloudwatch_log_group.CloudwatchLogGroup;
import imports.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import imports.aws.iam_role.IamRole;
import com.example.config.PipelineConfig;
import com.example.stacks.SharedResourcesStack;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

public class CodeBuildConstruct extends Construct {
    private final CodebuildProject project;
    
    public CodeBuildConstruct(final Construct scope, final String id,
                             final PipelineConfig config,
                             final String component,
                             final String buildspec,
                             final IamRole serviceRole,
                             final SharedResourcesStack sharedStack,
                             final String snsTopicArn) {
        super(scope, id);
        
        // Create CloudWatch Log Group
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, component + "-build-logs",
            CloudwatchLogGroupConfig.builder()
                .name("/aws/codebuild/" + config.getProjectName() + "-" + component)
                .retentionInDays(7)
                .build());
        
        Map<String, String> tags = new HashMap<>();
        tags.put("Project", config.getProjectName());
        tags.put("Component", component);
        tags.put("ManagedBy", "CDKTF");
        
        // Create CodeBuild Project
        this.project = new CodebuildProject(this, component + "-build-project",
            CodebuildProjectConfig.builder()
                .name(config.getProjectName() + "-" + component + "-build")
                .description("Build project for " + component)
                .serviceRole(serviceRole.getArn())
                .artifacts(CodebuildProjectArtifacts.builder()
                    .type("CODEPIPELINE")
                    .build())
                .environment(CodebuildProjectEnvironment.builder()
                    .computeType("BUILD_GENERAL1_SMALL")
                    .image("aws/codebuild/standard:5.0")
                    .type("LINUX_CONTAINER")
                    .imagePullCredentialsType("CODEBUILD")
                    .environmentVariable(Arrays.asList(
                        CodebuildProjectEnvironmentEnvironmentVariable.builder()
                            .name("ARTIFACT_BUCKET")
                            .value(sharedStack.getArtifactBucket().getBucket())
                            .build(),
                        CodebuildProjectEnvironmentEnvironmentVariable.builder()
                            .name("KMS_KEY_ID")
                            .value(sharedStack.getKmsKey().getId())
                            .build(),
                        CodebuildProjectEnvironmentEnvironmentVariable.builder()
                            .name("COMPONENT")
                            .value(component)
                            .build()
                    ))
                    .build())
                .source(CodebuildProjectSource.builder()
                    .type("CODEPIPELINE")
                    .buildspec(buildspec)
                    .build())
                .logsConfig(CodebuildProjectLogsConfig.builder()
                    .cloudwatchLogs(CodebuildProjectLogsConfigCloudwatchLogs.builder()
                        .status("ENABLED")
                        .groupName(logGroup.getName())
                        .build())
                    .build())
                .encryptionKey(sharedStack.getKmsKey().getArn())
                .tags(tags)
                .build());
    }
    
    public CodebuildProject getProject() {
        return project;
    }
}
```

### 5. CodeDeploy Construct

```java
package com.example.constructs;

import software.constructs.Construct;
import imports.aws.codedeploy_app.CodedeployApp;
import imports.aws.codedeploy_app.CodedeployAppConfig;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupConfig;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSetEc2TagFilter;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig;
import imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle;
import imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfig;
import imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigConfig;
import imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts;
import imports.aws.iam_role.IamRole;
import com.example.config.PipelineConfig;
import java.util.Arrays;

public class CodeDeployConstruct extends Construct {
    private final CodedeployApp application;
    private final CodedeployDeploymentGroup stagingDeploymentGroup;
    private final CodedeployDeploymentGroup productionDeploymentGroup;
    
    public CodeDeployConstruct(final Construct scope, final String id,
                               final PipelineConfig config,
                               final String component,
                               final IamRole serviceRole) {
        super(scope, id);
        
        // Create CodeDeploy Application
        this.application = new CodedeployApp(this, component + "-app",
            CodedeployAppConfig.builder()
                .name(config.getProjectName() + "-" + component)
                .computePlatform("Server")
                .build());
        
        // Create custom deployment configuration
        CodedeployDeploymentConfig deploymentConfig = new CodedeployDeploymentConfig(this, 
            component + "-deployment-config",
            CodedeployDeploymentConfigConfig.builder()
                .deploymentConfigName(config.getProjectName() + "-" + component + "-config")
                .minimumHealthyHosts(CodedeployDeploymentConfigMinimumHealthyHosts.builder()
                    .type("HOST_COUNT")
                    .value(1)
                    .build())
                .build());
        
        // Create Staging Deployment Group
        this.stagingDeploymentGroup = new CodedeployDeploymentGroup(this, 
            component + "-staging-deployment-group",
            CodedeployDeploymentGroupConfig.builder()
                .appName(application.getName())
                .deploymentGroupName(component + "-staging")
                .serviceRoleArn(serviceRole.getArn())
                .deploymentConfigName(deploymentConfig.getDeploymentConfigName())
                .ec2TagSet(Arrays.asList(
                    CodedeployDeploymentGroupEc2TagSet.builder()
                        .ec2TagFilter(Arrays.asList(
                            CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                .type("KEY_AND_VALUE")
                                .key("Environment")
                                .value("Staging")
                                .build(),
                            CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                .type("KEY_AND_VALUE")
                                .key("Component")
                                .value(component)
                                .build()
                        ))
                        .build()
                ))
                .autoRollbackConfiguration(CodedeployDeploymentGroupAutoRollbackConfiguration.builder()
                    .enabled(true)
                    .events(Arrays.asList("DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"))
                    .build())
                .deploymentStyle(CodedeployDeploymentGroupDeploymentStyle.builder()
                    .deploymentType("IN_PLACE")
                    .deploymentOption("WITH_TRAFFIC_CONTROL")
                    .build())
                .build());
        
        // Create Production Deployment Group
        this.productionDeploymentGroup = new CodedeployDeploymentGroup(this,
            component + "-production-deployment-group",
            CodedeployDeploymentGroupConfig.builder()
                .appName(application.getName())
                .deploymentGroupName(component + "-production")
                .serviceRoleArn(serviceRole.getArn())
                .deploymentConfigName("CodeDeployDefault.OneAtATime")
                .ec2TagSet(Arrays.asList(
                    CodedeployDeploymentGroupEc2TagSet.builder()
                        .ec2TagFilter(Arrays.asList(
                            CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                .type("KEY_AND_VALUE")
                                .key("Environment")
                                .value("Production")
                                .build(),
                            CodedeployDeploymentGroupEc2TagSetEc2TagFilter.builder()
                                .type("KEY_AND_VALUE")
                                .key("Component")
                                .value(component)
                                .build()
                        ))
                        .build()
                ))
                .autoRollbackConfiguration(CodedeployDeploymentGroupAutoRollbackConfiguration.builder()
                    .enabled(true)
                    .events(Arrays.asList("DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"))
                    .build())
                .deploymentStyle(CodedeployDeploymentGroupDeploymentStyle.builder()
                    .deploymentType("BLUE_GREEN")
                    .deploymentOption("WITH_TRAFFIC_CONTROL")
                    .build())
                .blueGreenDeploymentConfig(CodedeployDeploymentGroupBlueGreenDeploymentConfig.builder()
                    .terminateBlueInstancesOnDeploymentSuccess(
                        CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess.builder()
                            .action("TERMINATE")
                            .terminationWaitTimeInMinutes(5)
                            .build())
                    .deploymentReadyOption(
                        CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption.builder()
                            .actionOnTimeout("CONTINUE_DEPLOYMENT")
                            .build())
                    .greenFleetProvisioningOption(
                        CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption.builder()
                            .action("COPY_AUTO_SCALING_GROUP")
                            .build())
                    .build())
                .build());
    }
    
    public CodedeployApp getApplication() {
        return application;
    }
    
    public CodedeployDeploymentGroup getStagingDeploymentGroup() {
        return stagingDeploymentGroup;
    }
    
    public CodedeployDeploymentGroup getProductionDeploymentGroup() {
        return productionDeploymentGroup;
    }
}
```

### 6. IAM Roles Construct

```java
package com.example.constructs;

import software.constructs.Construct;
import imports.aws.iam_role.IamRole;
import imports.aws.iam_role.IamRoleConfig;
import imports.aws.iam_role_policy.IamRolePolicy;
import imports.aws.iam_role_policy.IamRolePolicyConfig;
import imports.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import imports.aws.iam_role_policy_attachment.IamRolePolicyAttachmentConfig;
import com.example.config.PipelineConfig;
import com.example.stacks.SharedResourcesStack;

public class IAMRolesConstruct extends Construct {
    private final IamRole codePipelineRole;
    private final IamRole codeBuildRole;
    private final IamRole codeDeployRole;
    
    public IAMRolesConstruct(final Construct scope, final String id,
                             final PipelineConfig config,
                             final SharedResourcesStack sharedStack) {
        super(scope, id);
        
        // CodePipeline Service Role
        this.codePipelineRole = new IamRole(this, "codepipeline-role",
            IamRoleConfig.builder()
                .name(config.getProjectName() + "-codepipeline-role")
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "codepipeline.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }]
                    }
                    """)
                .build());
        
        new IamRolePolicy(this, "codepipeline-policy",
            IamRolePolicyConfig.builder()
                .role(codePipelineRole.getName())
                .name(config.getProjectName() + "-codepipeline-policy")
                .policy(String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:GetObject",
                                    "s3:GetObjectVersion",
                                    "s3:PutObject",
                                    "s3:GetBucketVersioning"
                                ],
                                "Resource": [
                                    "%s",
                                    "%s/*"
                                ]
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "codecommit:GetBranch",
                                    "codecommit:GetCommit",
                                    "codecommit:UploadArchive",
                                    "codecommit:GetUploadArchiveStatus",
                                    "codecommit:CancelUploadArchive"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "codebuild:BatchGetBuilds",
                                    "codebuild:StartBuild"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "codedeploy:CreateDeployment",
                                    "codedeploy:GetApplication",
                                    "codedeploy:GetApplicationRevision",
                                    "codedeploy:GetDeployment",
                                    "codedeploy:GetDeploymentConfig",
                                    "codedeploy:RegisterApplicationRevision"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:GenerateDataKey"
                                ],
                                "Resource": "%s"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sns:Publish"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """, 
                    sharedStack.getArtifactBucket().getArn(),
                    sharedStack.getArtifactBucket().getArn(),
                    sharedStack.getKmsKey().getArn()))
                .build());
        
        // CodeBuild Service Role
        this.codeBuildRole = new IamRole(this, "codebuild-role",
            IamRoleConfig.builder()
                .name(config.getProjectName() + "-codebuild-role")
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "codebuild.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }]
                    }
                    """)
                .build());
        
        new IamRolePolicy(this, "codebuild-policy",
            IamRolePolicyConfig.builder()
                .role(codeBuildRole.getName())
                .name(config.getProjectName() + "-codebuild-policy")
                .policy(String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": "arn:aws:logs:*:*:*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:GetObject",
                                    "s3:GetObjectVersion",
                                    "s3:PutObject"
                                ],
                                "Resource": [
                                    "%s/*"
                                ]
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:GenerateDataKey"
                                ],
                                "Resource": "%s"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "codecommit:GitPull"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """,
                    sharedStack.getArtifactBucket().getArn(),
                    sharedStack.getKmsKey().getArn()))
                .build());
        
        // CodeDeploy Service Role
        this.codeDeployRole = new IamRole(this, "codedeploy-role",
            IamRoleConfig.builder()
                .name(config.getProjectName() + "-codedeploy-role")
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "codedeploy.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }]
                    }
                    """)
                .build());
        
        new IamRolePolicyAttachment(this, "codedeploy-policy-attachment",
            IamRolePolicyAttachmentConfig.builder()
                .role(codeDeployRole.getName())
                .policyArn("arn:aws:iam::aws:policy/AWSCodeDeployRole")
                .build());
    }
    
    public IamRole getCodePipelineRole() {
        return codePipelineRole;
    }
    
    public IamRole getCodeBuildRole() {
        return codeBuildRole;
    }
    
    public IamRole getCodeDeployRole() {
        return codeDeployRole;
    }
}
```

### 7. Notification Stack with EventBridge

```java
package com.example.stacks;

import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.StackOptions;
import imports.aws.provider.AwsProvider;
import imports.aws.provider.AwsProviderConfig;
import imports.aws.sns_topic.SnsTopic;
import imports.aws.sns_topic.SnsTopicConfig;
import imports.aws.sns_topic_subscription.SnsTopicSubscription;
import imports.aws.sns_topic_subscription.SnsTopicSubscriptionConfig;
import imports.aws.cloudwatch_event_rule.CloudwatchEventRule;
import imports.aws.cloudwatch_event_rule.CloudwatchEventRuleConfig;
import imports.aws.cloudwatch_event_target.CloudwatchEventTarget;
import imports.aws.cloudwatch_event_target.CloudwatchEventTargetConfig;
import com.example.config.PipelineConfig;

public class NotificationStack extends TerraformStack {
    private final SnsTopic snsTopic;
    
    public NotificationStack(final Construct scope, final String id,
                            final StackOptions options,
                            final PipelineConfig config) {
        super(scope, id);
        
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
            .region(options.getEnv())
            .build());
        
        // Create SNS Topic
        this.snsTopic = new SnsTopic(this, "pipeline-notifications",
            SnsTopicConfig.builder()
                .name(config.getProjectName() + "-pipeline-notifications")
                .displayName("Pipeline Notifications")
                .build());
        
        // Create SNS Subscription
        new SnsTopicSubscription(this, "email-subscription",
            SnsTopicSubscriptionConfig.builder()
                .topicArn(snsTopic.getArn())
                .protocol("email")
                .endpoint(config.getNotificationEmail())
                .build());
        
        // EventBridge Rule for CodeBuild Failed Builds
        CloudwatchEventRule buildFailedRule = new CloudwatchEventRule(this, "build-failed-rule",
            CloudwatchEventRuleConfig.builder()
                .name(config.getProjectName() + "-build-failed")
                .description("Trigger notification when build fails")
                .eventPattern("""
                    {
                        "source": ["aws.codebuild"],
                        "detail-type": ["CodeBuild Build State Change"],
                        "detail": {
                            "build-status": ["FAILED"],
                            "project-name": [{
                                "prefix": "%s"
                            }]
                        }
                    }
                    """.formatted(config.getProjectName()))
                .build());
        
        new CloudwatchEventTarget(this, "build-failed-target",
            CloudwatchEventTargetConfig.builder()
                .rule(buildFailedRule.getName())
                .arn(snsTopic.getArn())
                .targetId("SendToSNS")
                .build());
        
        // EventBridge Rule for Pipeline State Changes
        CloudwatchEventRule pipelineStateRule = new CloudwatchEventRule(this, "pipeline-state-rule",
            CloudwatchEventRuleConfig.builder()
                .name(config.getProjectName() + "-pipeline-state")
                .description("Trigger notification on pipeline state changes")
                .eventPattern("""
                    {
                        "source": ["aws.codepipeline"],
                        "detail-type": ["CodePipeline Pipeline Execution State Change"],
                        "detail": {
                            "state": ["FAILED"],
                            "pipeline": ["%s"]
                        }
                    }
                    """.formatted(config.getProjectName() + "-pipeline"))
                .build());
        
        new CloudwatchEventTarget(this, "pipeline-state-target",
            CloudwatchEventTargetConfig.builder()
                .rule(pipelineStateRule.getName())
                .arn(snsTopic.getArn())
                .targetId("SendPipelineStateToSNS")
                .build());
        
        // EventBridge Rule for Deployment Failures
        CloudwatchEventRule deploymentFailedRule = new CloudwatchEventRule(this, "deployment-failed-rule",
            CloudwatchEventRuleConfig.builder()
                .name(config.getProjectName() + "-deployment-failed")
                .description("Trigger notification when deployment fails")
                .eventPattern("""
                    {
                        "source": ["aws.codedeploy"],
                        "detail-type": ["CodeDeploy Deployment State-change Notification"],
                        "detail": {
                            "state": ["FAILURE"],
                            "application-name": [{
                                "prefix": "%s"
                            }]
                        }
                    }
                    """.formatted(config.getProjectName()))
                .build());
        
        new CloudwatchEventTarget(this, "deployment-failed-target",
            CloudwatchEventTargetConfig.builder()
                .rule(deploymentFailedRule.getName())
                .arn(snsTopic.getArn())
                .targetId("SendDeploymentFailureToSNS")
                .build());
    }
    
    public String getSnsTopicArn() {
        return snsTopic.getArn();
    }
}
```

### 8. Configuration Class

```java
package com.example.config;

public class PipelineConfig {
    private final String projectName;
    private final String repositoryName;
    private final String stagingRegion;
    private final String productionRegion;
    private final String notificationEmail;
    
    private PipelineConfig(Builder builder) {
        this.projectName = builder.projectName;
        this.repositoryName = builder.repositoryName;
        this.stagingRegion = builder.stagingRegion;
        this.productionRegion = builder.productionRegion;
        this.notificationEmail = builder.notificationEmail;
    }
    
    // Getters
    public String getProjectName() { return projectName; }
    public String getRepositoryName() { return repositoryName; }
    public String getStagingRegion() { return stagingRegion; }
    public String getProductionRegion() { return productionRegion; }
    public String getNotificationEmail() { return notificationEmail; }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String projectName;
        private String repositoryName;
        private String stagingRegion;
        private String productionRegion;
        private String notificationEmail;
        
        public Builder projectName(String projectName) {
            this.projectName = projectName;
            return this;
        }
        
        public Builder repositoryName(String repositoryName) {
            this.repositoryName = repositoryName;
            return this;
        }
        
        public Builder stagingRegion(String stagingRegion) {
            this.stagingRegion = stagingRegion;
            return this;
        }
        
        public Builder productionRegion(String productionRegion) {
            this.productionRegion = productionRegion;
            return this;
        }
        
        public Builder notificationEmail(String notificationEmail) {
            this.notificationEmail = notificationEmail;
            return this;
        }
        
        public PipelineConfig build() {
            return new PipelineConfig(this);
        }
    }
}
```

### 9. Maven Configuration (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>cicd-pipeline-cdktf</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdktf.version>0.18.0</cdktf.version>
        <constructs.version>10.2.70</constructs.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.hashicorp</groupId>
            <artifactId>cdktf</artifactId>
            <version>${cdktf.version}</version>
        </dependency>
        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>${constructs.version}</version>
        </dependency>
        <dependency>
            <groupId>com.hashicorp</groupId>
            <artifactId>cdktf-provider-aws</artifactId>
            <version>18.0.0</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 10. CDKTF Configuration (cdktf.json)

```json
{
  "language": "java",
  "app": "mvn compile && java -cp target/classes com.example.Main",
  "projectId": "cicd-pipeline-project",
  "sendCrashReports": "false",
  "terraformProviders": [
    "hashicorp/aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true"
  }
}
```

## Deployment Instructions

1. **Initialize CDKTF:**
```bash
cdktf init --template=java --local
```

2. **Install dependencies:**
```bash
mvn clean install
```

3. **Generate provider bindings:**
```bash
cdktf get
```

4. **Deploy the infrastructure:**
```bash
export AWS_ACCOUNT_ID="your-account-id"
cdktf deploy --all
```

## Key Features Implemented

### Security
- ✅ KMS encryption for artifacts
- ✅ IAM roles with least privilege principle
- ✅ S3 bucket with versioning and encryption
- ✅ Public access blocked on S3 buckets

### Monitoring & Notifications
- ✅ CloudWatch logs for all pipeline stages
- ✅ SNS notifications for failures
- ✅ EventBridge rules for state monitoring
- ✅ Email notifications for manual approvals

### CI/CD Pipeline
- ✅ Multi-stage pipeline (Source → Build → Staging → Approval → Production)
- ✅ Separate build projects for frontend and backend
- ✅ Inline buildspec definitions
- ✅ Multi-region deployment (us-west-2 for staging, us-east-1 for production)
- ✅ Manual approval gate before production
- ✅ Automatic rollback on deployment failures

### Best Practices
- ✅ Modular construct design
- ✅ Configuration management through builder pattern
- ✅ Proper resource tagging
- ✅ Log retention policies
- ✅ Blue-green deployment for production
- ✅ In-place deployment for staging

This implementation provides a complete, production-ready CI/CD pipeline that can be easily customized and extended based on specific requirements.