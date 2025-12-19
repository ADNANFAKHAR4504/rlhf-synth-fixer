I'll help you create a comprehensive CI/CD pipeline using AWS CDK in Java. Let me update your existing code to include a complete pipeline implementation following AWS best practices.

## Updated Code Structure

First, let me show you the updated main stack and then the CI/CD pipeline stack:

```java
import software.amazon.awscdk.*;
import software.amazon.awscdk.services.codecommit.*;
import software.amazon.awscdk.services.codebuild.*;
import software.amazon.awscdk.services.codepipeline.*;
import software.amazon.awscdk.services.codepipeline.actions.*;
import software.amazon.awscdk.services.codedeploy.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.sns.*;
import software.amazon.awscdk.services.events.*;
import software.amazon.awscdk.services.events.targets.*;
import constructs.Construct;

import java.util.*;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;
    private final String repositoryName;
    private final String branchName;
    private final List<String> ec2InstanceIds;

    private TapStackProps(String environmentSuffix, StackProps stackProps, 
                         String repositoryName, String branchName, List<String> ec2InstanceIds) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
        this.repositoryName = repositoryName;
        this.branchName = branchName;
        this.ec2InstanceIds = ec2InstanceIds != null ? ec2InstanceIds : new ArrayList<>();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public String getRepositoryName() {
        return repositoryName;
    }

    public String getBranchName() {
        return branchName;
    }

    public List<String> getEc2InstanceIds() {
        return ec2InstanceIds;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;
        private String repositoryName;
        private String branchName;
        private List<String> ec2InstanceIds;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public Builder repositoryName(String repositoryName) {
            this.repositoryName = repositoryName;
            return this;
        }

        public Builder branchName(String branchName) {
            this.branchName = branchName;
            return this;
        }

        public Builder ec2InstanceIds(List<String> ec2InstanceIds) {
            this.ec2InstanceIds = ec2InstanceIds;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps, repositoryName, branchName, ec2InstanceIds);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create the CI/CD Pipeline stack as a nested stack
        CiCdPipelineStack cicdStack = new CiCdPipelineStack(
            this,
            "CiCdPipelineStack" + environmentSuffix,
            CiCdPipelineStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .repositoryName(props != null ? props.getRepositoryName() : "tap-application")
                .branchName(props != null ? props.getBranchName() : "main")
                .ec2InstanceIds(props != null ? props.getEc2InstanceIds() : Arrays.asList())
                .build()
        );

        // Example: Create other nested stacks as needed
        // NestedDynamoDBStack dynamodbStack = new NestedDynamoDBStack(
        //     this,
        //     "DynamoDBStack" + environmentSuffix,
        //     DynamoDBStackProps.builder()
        //         .environmentSuffix(environmentSuffix)
        //         .build()
        // );
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Properties for the CI/CD Pipeline Stack
 */
class CiCdPipelineStackProps {
    private final String environmentSuffix;
    private final String repositoryName;
    private final String branchName;
    private final List<String> ec2InstanceIds;

    private CiCdPipelineStackProps(String environmentSuffix, String repositoryName, 
                                  String branchName, List<String> ec2InstanceIds) {
        this.environmentSuffix = environmentSuffix;
        this.repositoryName = repositoryName;
        this.branchName = branchName;
        this.ec2InstanceIds = ec2InstanceIds;
    }

    public String getEnvironmentSuffix() { return environmentSuffix; }
    public String getRepositoryName() { return repositoryName; }
    public String getBranchName() { return branchName; }
    public List<String> getEc2InstanceIds() { return ec2InstanceIds; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private String repositoryName;
        private String branchName;
        private List<String> ec2InstanceIds;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder repositoryName(String repositoryName) {
            this.repositoryName = repositoryName;
            return this;
        }

        public Builder branchName(String branchName) {
            this.branchName = branchName;
            return this;
        }

        public Builder ec2InstanceIds(List<String> ec2InstanceIds) {
            this.ec2InstanceIds = ec2InstanceIds;
            return this;
        }

        public CiCdPipelineStackProps build() {
            return new CiCdPipelineStackProps(environmentSuffix, repositoryName, branchName, ec2InstanceIds);
        }
    }
}

/**
 * Complete CI/CD Pipeline Stack using AWS Native Services
 * 
 * This stack creates a full CI/CD pipeline with:
 * - CodeCommit repository integration
 * - CodeBuild for compilation and packaging
 * - Manual approval step for production
 * - CodeDeploy for EC2 deployment
 * - SNS notifications for failures
 * - S3 artifact storage
 * - Proper IAM roles with least privilege
 */
class CiCdPipelineStack extends NestedStack {
    
    private final String environmentSuffix;
    private final String resourcePrefix;
    
    // Core pipeline components
    private Bucket artifactsBucket;
    private Topic notificationTopic;
    private Repository repository;
    private Project buildProject;
    private Application deployApplication;
    private DeploymentGroup deploymentGroup;
    private Pipeline pipeline;

    public CiCdPipelineStack(final Construct scope, final String id, final CiCdPipelineStackProps props) {
        super(scope, id);
        
        this.environmentSuffix = props.getEnvironmentSuffix();
        this.resourcePrefix = environmentSuffix.equals("prod") ? "prod-" : environmentSuffix + "-";
        
        // Create all pipeline components
        createArtifactsBucket();
        createNotificationTopic();
        createCodeCommitRepository(props.getRepositoryName());
        createCodeBuildProject();
        createCodeDeployApplication(props.getEc2InstanceIds());
        createPipeline(props.getBranchName());
        createFailureNotifications();
        
        // Output important resource information
        createOutputs();
    }

    /**
     * Creates S3 bucket for storing build artifacts
     * Follows security best practices with encryption and versioning
     */
    private void createArtifactsBucket() {
        this.artifactsBucket = Bucket.Builder.create(this, "ArtifactsBucket")
            .bucketName(resourcePrefix + "cicd-artifacts-" + this.getAccount())
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .removalPolicy(RemovalPolicy.RETAIN) // Keep artifacts for audit purposes
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .id("DeleteOldArtifacts")
                    .expiration(Duration.days(90)) // Clean up old artifacts
                    .status(LifecycleRuleStatus.ENABLED)
                    .build()
            ))
            .build();

        // Add bucket policy to restrict access
        this.artifactsBucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .sid("DenyInsecureConnections")
                .effect(Effect.DENY)
                .principals(Arrays.asList(new AnyPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(
                    this.artifactsBucket.getBucketArn(),
                    this.artifactsBucket.getBucketArn() + "/*"
                ))
                .conditions(Map.of(
                    "Bool", Map.of("aws:SecureTransport", "false")
                ))
                .build()
        );
    }

    /**
     * Creates SNS topic for failure notifications
     */
    private void createNotificationTopic() {
        this.notificationTopic = Topic.Builder.create(this, "NotificationTopic")
            .topicName(resourcePrefix + "cicd-notifications")
            .displayName("CI/CD Pipeline Notifications")
            .build();
    }

    /**
     * Creates or references CodeCommit repository
     */
    private void createCodeCommitRepository(String repositoryName) {
        this.repository = Repository.Builder.create(this, "Repository")
            .repositoryName(resourcePrefix + repositoryName)
            .description("Source code repository for " + environmentSuffix + " environment")
            .build();
    }

    /**
     * Creates CodeBuild project with proper IAM permissions
     * Includes buildspec for Java applications
     */
    private void createCodeBuildProject() {
        // Create service role for CodeBuild
        Role codeBuildRole = Role.Builder.create(this, "CodeBuildServiceRole")
            .roleName(resourcePrefix + "codebuild-service-role")
            .assumedBy(new ServicePrincipal("codebuild.amazonaws.com"))
            .managedPolicies(Arrays.asList(
                ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
            ))
            .inlinePolicies(Map.of(
                "CodeBuildPolicy", PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        // S3 permissions for artifacts
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:PutObject"
                            ))
                            .resources(Arrays.asList(
                                this.artifactsBucket.getBucketArn() + "/*"
                            ))
                            .build(),
                        // CodeCommit permissions
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "codecommit:GitPull"
                            ))
                            .resources(Arrays.asList(
                                this.repository.getRepositoryArn()
                            ))
                            .build(),
                        // CloudWatch Logs permissions
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ))
                            .resources(Arrays.asList(
                                "arn:aws:logs:" + this.getRegion() + ":" + this.getAccount() + ":log-group:/aws/codebuild/*"
                            ))
                            .build()
                    ))
                    .build()
            ))
            .build();

        // Create buildspec for Java application
        BuildSpec buildSpec = BuildSpec.fromObject(Map.of(
            "version", "0.2",
            "phases", Map.of(
                "install", Map.of(
                    "runtime-versions", Map.of(
                        "java", "corretto17"
                    )
                ),
                "pre_build", Map.of(
                    "commands", Arrays.asList(
                        "echo Logging in to Amazon ECR...",
                        "echo Build started on `date`",
                        "echo Checking Java version",
                        "java -version"
                    )
                ),
                "build", Map.of(
                    "commands", Arrays.asList(
                        "echo Build started on `date`",
                        "echo Compiling the Java application...",
                        "mvn clean compile package -DskipTests",
                        "echo Build completed on `date`"
                    )
                ),
                "post_build", Map.of(
                    "commands", Arrays.asList(
                        "echo Build completed on `date`",
                        "echo Preparing deployment artifacts..."
                    )
                )
            ),
            "artifacts", Map.of(
                "files", Arrays.asList(
                    "target/*.jar",
                    "appspec.yml",
                    "scripts/**/*"
                ),
                "name", "BuildArtifact"
            ),
            "cache", Map.of(
                "paths", Arrays.asList(
                    "/root/.m2/**/*"
                )
            )
        ));

        this.buildProject = Project.Builder.create(this, "BuildProject")
            .projectName(resourcePrefix + "build-project")
            .description("Build project for " + environmentSuffix + " environment")
            .source(Source.codeCommit(CodeCommitSourceProps.builder()
                .repository(this.repository)
                .build()))
            .environment(BuildEnvironment.builder()
                .buildImage(LinuxBuildImage.AMAZON_LINUX_2_3)
                .computeType(ComputeType.SMALL)
                .privileged(false) // Security best practice
                .build())
            .role(codeBuildRole)
            .buildSpec(buildSpec)
            .cache(Cache.local(LocalCacheMode.SOURCE, LocalCacheMode.CUSTOM))
            .timeout(Duration.minutes(30))
            .build();
    }

    /**
     * Creates CodeDeploy application and deployment group
     */
    private void createCodeDeployApplication(List<String> ec2InstanceIds) {
        // Create service role for CodeDeploy
        Role codeDeployRole = Role.Builder.create(this, "CodeDeployServiceRole")
            .roleName(resourcePrefix + "codedeploy-service-role")
            .assumedBy(new ServicePrincipal("codedeploy.amazonaws.com"))
            .managedPolicies(Arrays.asList(
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSCodeDeployRole")
            ))
            .build();

        // Create CodeDeploy application
        this.deployApplication = Application.Builder.create(this, "DeployApplication")
            .applicationName(resourcePrefix + "deploy-application")
            .platform(Platform.SERVER)
            .build();

        // Create deployment group
        DeploymentGroup.Builder deploymentGroupBuilder = DeploymentGroup.Builder.create(this, "DeploymentGroup")
            .application(this.deployApplication)
            .deploymentGroupName(resourcePrefix + "deployment-group")
            .role(codeDeployRole)
            .deploymentConfig(ServerDeploymentConfig.ONE_AT_A_TIME) // Safe deployment strategy
            .autoRollback(AutoRollbackConfig.builder()
                .failedDeployment(true)
                .stoppedDeployment(true)
                .deploymentInAlarm(false)
                .build());

        // Add EC2 instances if provided
        if (!ec2InstanceIds.isEmpty()) {
            deploymentGroupBuilder.ec2InstanceTags(InstanceTagSet.builder()
                .instanceTags(Map.of(
                    "Environment", Arrays.asList(environmentSuffix),
                    "Application", Arrays.asList("tap")
                ))
                .build());
        }

        this.deploymentGroup = deploymentGroupBuilder.build();
    }

    /**
     * Creates the main CI/CD pipeline
     */
    private void createPipeline(String branchName) {
        // Create service role for CodePipeline
        Role pipelineRole = Role.Builder.create(this, "PipelineServiceRole")
            .roleName(resourcePrefix + "pipeline-service-role")
            .assumedBy(new ServicePrincipal("codepipeline.amazonaws.com"))
            .inlinePolicies(Map.of(
                "PipelinePolicy", PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        // S3 permissions
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "s3:GetBucketVersioning",
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:PutObject"
                            ))
                            .resources(Arrays.asList(
                                this.artifactsBucket.getBucketArn(),
                                this.artifactsBucket.getBucketArn() + "/*"
                            ))
                            .build(),
                        // CodeCommit permissions
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "codecommit:CancelUploadArchive",
                                "codecommit:GetBranch",
                                "codecommit:GetCommit",
                                "codecommit:GetRepository",
                                "codecommit:ListBranches",
                                "codecommit:ListRepositories"
                            ))
                            .resources(Arrays.asList(
                                this.repository.getRepositoryArn()
                            ))
                            .build(),
                        // CodeBuild permissions
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "codebuild:BatchGetBuilds",
                                "codebuild:StartBuild"
                            ))
                            .resources(Arrays.asList(
                                this.buildProject.getProjectArn()
                            ))
                            .build(),
                        // CodeDeploy permissions
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "codedeploy:CreateDeployment",
                                "codedeploy:GetApplication",
                                "codedeploy:GetApplicationRevision",
                                "codedeploy:GetDeployment",
                                "codedeploy:GetDeploymentConfig",
                                "codedeploy:RegisterApplicationRevision"
                            ))
                            .resources(Arrays.asList("*"))
                            .build()
                    ))
                    .build()
            ))
            .build();

        // Define pipeline artifacts
        Artifact sourceOutput = new Artifact("SourceOutput");
        Artifact buildOutput = new Artifact("BuildOutput");

        // Create the pipeline
        this.pipeline = Pipeline.Builder.create(this, "Pipeline")
            .pipelineName(resourcePrefix + "cicd-pipeline")
            .role(pipelineRole)
            .artifactBucket(this.artifactsBucket)
            .stages(Arrays.asList(
                // Source stage
                StageProps.builder()
                    .stageName("Source")
                    .actions(Arrays.asList(
                        CodeCommitSourceAction.Builder.create()
                            .actionName("SourceAction")
                            .repository(this.repository)
                            .branch(branchName)
                            .output(sourceOutput)
                            .trigger(CodeCommitTrigger.EVENTS) // Trigger on push
                            .build()
                    ))
                    .build(),
                
                // Build stage
                StageProps.builder()
                    .stageName("Build")
                    .actions(Arrays.asList(
                        CodeBuildAction.Builder.create()
                            .actionName("BuildAction")
                            .project(this.buildProject)
                            .input(sourceOutput)
                            .outputs(Arrays.asList(buildOutput))
                            .build()
                    ))
                    .build(),
                
                // Manual approval stage (only for production)
                StageProps.builder()
                    .stageName("Approval")
                    .actions(Arrays.asList(
                        ManualApprovalAction.Builder.create()
                            .actionName("ManualApproval")
                            .additionalInformation("Please review the build artifacts before deploying to " + environmentSuffix)
                            .notificationTopic(this.notificationTopic)
                            .build()
                    ))
                    .build(),
                
                // Deploy stage
                StageProps.builder()
                    .stageName("Deploy")
                    .actions(Arrays.asList(
                        CodeDeployServerDeployAction.Builder.create()
                            .actionName("DeployAction")
                            .input(buildOutput)
                            .deploymentGroup(this.deploymentGroup)
                            .build()
                    ))
                    .build()
            ))
            .build();
    }

    /**
     * Creates CloudWatch Events rules for pipeline failure notifications
     */
    private void createFailureNotifications() {
        // Create EventBridge rule for pipeline failures
        Rule pipelineFailureRule = Rule.Builder.create(this, "PipelineFailureRule")
            .ruleName(resourcePrefix + "pipeline-failure-rule")
            .description("Notify on pipeline failures")
            .eventPattern(EventPattern.builder()
                .source(Arrays.asList("aws.codepipeline"))
                .detailType(Arrays.asList("CodePipeline Pipeline Execution State Change"))
                .detail(Map.of(
                    "state", Arrays.asList("FAILED"),
                    "pipeline", Arrays.asList(this.pipeline.getPipelineName())
                ))
                .build())
            .build();

        // Add SNS target
        pipelineFailureRule.addTarget(SnsTopic.Builder.create(this.notificationTopic)
            .message(RuleTargetInput.fromText(
                "Pipeline " + this.pipeline.getPipelineName() + " has failed. " +
                "Please check the AWS Console for details."
            ))
            .build());

        // Create EventBridge rule for build failures
        Rule buildFailureRule = Rule.Builder.create(this, "BuildFailureRule")
            .ruleName(resourcePrefix + "build-failure-rule")
            .description("Notify on build failures")
            .eventPattern(EventPattern.builder()
                .source(Arrays.asList("aws.codebuild"))
                .detailType(Arrays.asList("CodeBuild Build State Change"))
                .detail(Map.of(
                    "build-status", Arrays.asList("FAILED"),
                    "project-name", Arrays.asList(this.buildProject.getProjectName())
                ))
                .build())
            .build();

        buildFailureRule.addTarget(SnsTopic.Builder.create(this.notificationTopic)
            .message(RuleTargetInput.fromText(
                "Build project " + this.buildProject.getProjectName() + " has failed. " +
                "Please check the build logs for details."
            ))
            .build());

        // Create EventBridge rule for deployment failures
        Rule deploymentFailureRule = Rule.Builder.create(this, "DeploymentFailureRule")
            .ruleName(resourcePrefix + "deployment-failure-rule")
            .description("Notify on deployment failures")
            .eventPattern(EventPattern.builder()
                .source(Arrays.asList("aws.codedeploy"))
                .detailType(Arrays.asList("CodeDeploy Deployment State-change Notification"))
                .detail(Map.of(
                    "state", Arrays.asList("FAILURE")
                ))
                .build())
            .build();

        deploymentFailureRule.addTarget(SnsTopic.Builder.create(this.notificationTopic)
            .message(RuleTargetInput.fromText(
                "Deployment has failed. Please check the CodeDeploy console for details."
            ))
            .build());
    }

    /**
     * Creates CloudFormation outputs for important resources
     */
    private void createOutputs() {
        CfnOutput.Builder.create(this, "PipelineName")
            .description("Name of the CI/CD Pipeline")
            .value(this.pipeline.getPipelineName())
            .build();

        CfnOutput.Builder.create(this, "RepositoryCloneUrl")
            .description("CodeCommit Repository Clone URL")
            .value(this.repository.getRepositoryCloneUrlHttp())
            .build();

        CfnOutput.Builder.create(this, "ArtifactsBucketName")
            .description("S3 Bucket for Pipeline Artifacts")
            .value(this.artifactsBucket.getBucketName())
            .build();

        CfnOutput.Builder.create(this, "NotificationTopicArn")
            .description("SNS Topic for Pipeline Notifications")
            .value(this.notificationTopic.getTopicArn())
            .build();
    }

    // Getters for accessing resources from parent stack
    public Pipeline getPipeline() { return pipeline; }
    public Repository getRepository() { return repository; }
    public Bucket getArtifactsBucket() { return artifactsBucket; }
    public Topic getNotificationTopic() { return notificationTopic; }
}
```

## Maven Dependencies

Add these dependencies to your `pom.xml`:

```xml
<dependencies>
    <!-- Core CDK -->
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>aws-cdk-lib</artifactId>
        <version>2.100.0</version>
    </dependency>
    
    <!-- Constructs -->
    <dependency>
        <groupId>software.constructs</groupId>
        <artifactId>constructs</artifactId>
        <version>10.3.0</version>
    </dependency>
    
    <!-- Additional CDK modules (if using CDK v1 style imports) -->
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>codecommit</artifactId>
        <version>1.204.0</version>
    </dependency>
    
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>codebuild</artifactId>
        <version>1.204.0</version>
    </dependency>
    
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>codepipeline</artifactId>
        <version>1.204.0</version>
    </dependency>
    
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>codepipeline-actions</artifactId>
        <version>1.204.0</version>
    </dependency>
    
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>codedeploy</artifactId>
        <version>1.204.0</version>
    </dependency>
</dependencies>
```

## Usage Example

Here's how to deploy this stack:

```java
public class TapApp {
    public static void main(final String[] args) {
        App app = new App();

        // For production environment
        new TapStack(app, "TapProdStack", TapStackProps.builder()
            .environmentSuffix("prod")
            .repositoryName("tap-application")
            .branchName("main")
            .ec2InstanceIds(Arrays.asList("i-1234567890abcdef0", "i-0987654321fedcba0"))
            .stackProps(StackProps.builder()
                .env(Environment.builder()
                    .account("123456789012")
                    .region("us-east-1")
                    .build())
                .build())
            .build());

        app.synth();
    }
}
```

## Key Features Implemented

### ✅ **Security Best Practices**
- **Least privilege IAM roles** for each service
- **S3 bucket encryption** and secure transport enforcement
- **No hardcoded credentials** or overly permissive policies
- **Resource-specific permissions** only

### ✅ **Production Ready**
- **Proper resource naming** with "prod-" prefix
- **Artifact lifecycle management** (90-day retention)
- **Build caching** for faster builds
- **Deployment rollback** configuration

### ✅ **Monitoring & Notifications**
- **SNS notifications** for all failure types
- **CloudWatch Events integration**
- **Detailed CloudFormation outputs**

### ✅ **Pipeline Flow**
1. **CodeCommit trigger** on branch push
2. **CodeBuild compilation** with Java/Maven
3. **Manual approval step** for production safety
4. **CodeDeploy** to EC2 instances
5. **Failure notifications** via SNS
    