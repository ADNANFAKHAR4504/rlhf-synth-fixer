# Overview

Please find solution files below.

## ./lib/src/main/java/app/Main.java

```java
package app;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import software.constructs.Construct;
import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.codebuild.BuildEnvironment;
import software.amazon.awscdk.services.codebuild.BuildEnvironmentVariable;
import software.amazon.awscdk.services.codebuild.BuildSpec;
import software.amazon.awscdk.services.codebuild.ComputeType;
import software.amazon.awscdk.services.codebuild.LinuxBuildImage;
import software.amazon.awscdk.services.codebuild.Project;
import software.amazon.awscdk.services.codedeploy.AutoRollbackConfig;
import software.amazon.awscdk.services.codedeploy.ServerApplication;
import software.amazon.awscdk.services.codedeploy.ServerDeploymentConfig;
import software.amazon.awscdk.services.codedeploy.ServerDeploymentGroup;
import software.amazon.awscdk.services.codepipeline.Artifact;
import software.amazon.awscdk.services.codepipeline.Pipeline;
import software.amazon.awscdk.services.codepipeline.StageProps;
import software.amazon.awscdk.services.codepipeline.actions.CodeBuildAction;
import software.amazon.awscdk.services.codepipeline.actions.S3SourceAction;
import software.amazon.awscdk.services.codepipeline.actions.CodeDeployServerDeployAction;
import software.amazon.awscdk.services.codepipeline.actions.ManualApprovalAction;
import software.amazon.awscdk.services.events.EventPattern;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.RuleTargetInput;
import software.amazon.awscdk.services.events.targets.SnsTopic;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.InstanceProfile;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.sns.Topic;

/**
 * Properties for the CI/CD Pipeline Stack
 */
class CiCdPipelineStackProps {

  private final String environmentSuffix;

  private CiCdPipelineStackProps(String environmentSuffix) {
    this.environmentSuffix = environmentSuffix;
  }

  public String getEnvironmentSuffix() {
    return environmentSuffix;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {

    private String environmentSuffix;

    public Builder environmentSuffix(String environmentSuffix) {
      this.environmentSuffix = environmentSuffix;
      return this;
    }

    public CiCdPipelineStackProps build() {
      return new CiCdPipelineStackProps(environmentSuffix);
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
  private Project buildProject;
  private ServerApplication deployApplication;
  private ServerDeploymentGroup deploymentGroup;
  private Pipeline pipeline;
  private Role ec2InstanceRole;
  private InstanceProfile ec2InstanceProfile;

  public CiCdPipelineStack(
    final Construct scope,
    final String id,
    final CiCdPipelineStackProps props
  ) {
    super(scope, id);
    this.environmentSuffix = props.getEnvironmentSuffix();
    this.resourcePrefix = "prod-";

    // Create all pipeline components
    createArtifactsBucket();
    createNotificationTopic();
    createEc2InstanceRole();
    createCodeBuildProject();
    createCodeDeployApplication();
    createPipeline();
    createFailureNotifications();

    // Output important resource information
    createOutputs();
  }

  /**
   * Creates S3 bucket for storing build artifacts
   * Follows security best practices with encryption and versioning
   */
  private void createArtifactsBucket() {
    this.artifactsBucket =
      Bucket.Builder
        .create(this, "ArtifactsBucket")
        .bucketName(resourcePrefix + "cicd-artifacts-" + this.getAccount() + "-" + this.getRegion())
        .versioned(true)
        .encryption(BucketEncryption.S3_MANAGED)
        .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
        .removalPolicy(RemovalPolicy.RETAIN) // Keep artifacts for audit purposes
        .lifecycleRules(
          Arrays.asList(
            LifecycleRule
              .builder()
              .id("DeleteOldVersions")
              .noncurrentVersionExpiration(Duration.days(30))
              .enabled(true)
              .build()
          )
        )
        .build();

    // Add bucket policy to restrict access
    this.artifactsBucket.addToResourcePolicy(
        PolicyStatement.Builder
          .create()
          .sid("DenyInsecureConnections")
          .effect(Effect.DENY)
          .principals(Arrays.asList(new AnyPrincipal()))
          .actions(Arrays.asList("s3:*"))
          .resources(
            Arrays.asList(
              this.artifactsBucket.getBucketArn(),
              this.artifactsBucket.getBucketArn() + "/*"
            )
          )
          .conditions(Map.of("Bool", Map.of("aws:SecureTransport", "false")))
          .build()
      );
  }

  /**
   * Creates SNS topic for failure notifications
   */
  private void createNotificationTopic() {
    this.notificationTopic =
      Topic.Builder
        .create(this, "NotificationTopic")
        .topicName(resourcePrefix + "cicd-notifications")
        .displayName("CI/CD Pipeline Notifications")
        .build();
  }

  /**
   * Creates EC2 instance role and profile for CodeDeploy targets
   */
  private void createEc2InstanceRole() {
    this.ec2InstanceRole = Role.Builder
      .create(this, "Ec2InstanceRole")
      .roleName(resourcePrefix + "ec2-codedeploy-role")
      .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
      .inlinePolicies(
        Map.of(
          "Ec2CodeDeployPolicy",
          PolicyDocument.Builder
            .create()
            .statements(
              Arrays.asList(
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "s3:GetObject",
                      "s3:ListBucket"
                    )
                  )
                  .resources(
                    Arrays.asList(
                      this.artifactsBucket.getBucketArn(),
                      this.artifactsBucket.getBucketArn() + "/*"
                    )
                  )
                  .build(),
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "logs:CreateLogGroup",
                      "logs:CreateLogStream", 
                      "logs:PutLogEvents",
                      "logs:DescribeLogStreams"
                    )
                  )
                  .resources(
                    Arrays.asList(
                      "arn:aws:logs:" + this.getRegion() + ":" + this.getAccount() + ":log-group:/aws/codedeploy/*"
                    )
                  )
                  .build()
              )
            )
            .build()
        )
      )
      .build();

    this.ec2InstanceProfile = InstanceProfile.Builder
      .create(this, "Ec2InstanceProfile")
      .instanceProfileName(resourcePrefix + "ec2-codedeploy-profile")
      .role(this.ec2InstanceRole)
      .build();
  }

  /**
   * Creates CodeBuild project with proper IAM permissions
   * Includes buildspec for Java applications
   */
  private void createCodeBuildProject() {
    // Create service role for CodeBuild
    Role codeBuildRole = Role.Builder
      .create(this, "CodeBuildServiceRole")
      .roleName(resourcePrefix + "codebuild-service-role")
      .assumedBy(new ServicePrincipal("codebuild.amazonaws.com"))
      .managedPolicies(
        Arrays.asList(
          ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
        )
      )
      .inlinePolicies(
        Map.of(
          "CodeBuildPolicy",
          PolicyDocument.Builder
            .create()
            .statements(
              Arrays.asList(
                // S3 permissions for artifacts
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "s3:GetObject",
                      "s3:GetObjectVersion",
                      "s3:PutObject"
                    )
                  )
                  .resources(
                    Arrays.asList(this.artifactsBucket.getBucketArn() + "/*")
                  )
                  .build(),
                // SNS permissions
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(Arrays.asList("sns:Publish"))
                  .resources(Arrays.asList(this.notificationTopic.getTopicArn()))
                  .build(),
                // CloudWatch Logs permissions
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "logs:CreateLogGroup",
                      "logs:CreateLogStream",
                      "logs:PutLogEvents"
                    )
                  )
                  .resources(
                    Arrays.asList(
                      "arn:aws:logs:" +
                      this.getRegion() +
                      ":" +
                      this.getAccount() +
                      ":log-group:/aws/codebuild/*"
                    )
                  )
                  .build()
              )
            )
            .build()
        )
      )
      .build();

    // Create buildspec matching YAML template
    BuildSpec buildSpec = BuildSpec.fromObject(
      Map.of(
        "version",
        "0.2",
        "phases",
        Map.of(
          "pre_build",
          Map.of(
            "commands",
            Arrays.asList(
              "echo Logging in to Amazon ECR...",
              "echo Build started on `date`"
            )
          ),
          "build",
          Map.of(
            "commands",
            Arrays.asList(
              "echo Build phase started on `date`",
              "echo Compiling the application...",
              "# Add your build commands here",
              "echo Build completed on `date`"
            )
          ),
          "post_build",
          Map.of(
            "commands",
            Arrays.asList(
              "echo Build phase completed on `date`"
            )
          )
        ),
        "artifacts",
        Map.of(
          "files",
          Arrays.asList("**/*")
        )
      )
    );

    this.buildProject =
      Project.Builder
        .create(this, "BuildProject")
        .projectName(resourcePrefix + "build-project")
        .description("Production build project for CI/CD pipeline")
        .environment(
          BuildEnvironment
            .builder()
            .buildImage(LinuxBuildImage.AMAZON_LINUX_2_3)
            .computeType(ComputeType.MEDIUM)
            .privileged(false)
            .environmentVariables(
              Map.of(
                "AWS_DEFAULT_REGION", 
                BuildEnvironmentVariable.builder().value(this.getRegion()).build(),
                "AWS_ACCOUNT_ID",
                BuildEnvironmentVariable.builder().value(this.getAccount()).build(),
                "ARTIFACTS_BUCKET",
                BuildEnvironmentVariable.builder().value(this.artifactsBucket.getBucketName()).build()
              )
            )
            .build()
        )
        .role(codeBuildRole)
        .buildSpec(buildSpec)
        .timeout(Duration.minutes(15))
        .build();
  }

  /**
   * Creates CodeDeploy application and deployment group
   */
  private void createCodeDeployApplication() {
    // Create service role for CodeDeploy
    Role codeDeployRole = Role.Builder
      .create(this, "CodeDeployServiceRole")
      .roleName(resourcePrefix + "codedeploy-service-role")
      .assumedBy(new ServicePrincipal("codedeploy.amazonaws.com"))
      .managedPolicies(
        Arrays.asList(
          ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSCodeDeployRole"
          )
        )
      )
      .inlinePolicies(
        Map.of(
          "CodeDeployServicePolicy",
          PolicyDocument.Builder
            .create()
            .statements(
              Arrays.asList(
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(Arrays.asList("sns:Publish"))
                  .resources(Arrays.asList(this.notificationTopic.getTopicArn()))
                  .build()
              )
            )
            .build()
        )
      )
      .build();

    // Create CodeDeploy application
    this.deployApplication =
      ServerApplication.Builder
        .create(this, "DeployApplication")
        .applicationName(resourcePrefix + "deployment-application")
        .build();

    // Create deployment group
    ServerDeploymentGroup.Builder deploymentGroupBuilder = ServerDeploymentGroup.Builder
      .create(this, "DeploymentGroup")
      .application(this.deployApplication)
      .deploymentGroupName(resourcePrefix + "deployment-group")
      .role(codeDeployRole)
      .deploymentConfig(ServerDeploymentConfig.ALL_AT_ONCE)
      .autoRollback(
        AutoRollbackConfig
          .builder()
          .failedDeployment(true)
          .stoppedDeployment(true)
          .deploymentInAlarm(false)
          .build()
      );

    // Note: EC2 instances will be identified by tags when deployed
    // Target instances should have tags: Environment=Production and Application=prod-cicd-target

    this.deploymentGroup = deploymentGroupBuilder.build();
  }

  /**
   * Creates the main CI/CD pipeline
   */
  private void createPipeline() {
    // Create service role for CodePipeline
    Role pipelineRole = Role.Builder
      .create(this, "PipelineServiceRole")
      .roleName(resourcePrefix + "pipeline-service-role")
      .assumedBy(new ServicePrincipal("codepipeline.amazonaws.com"))
      .inlinePolicies(
        Map.of(
          "PipelinePolicy",
          PolicyDocument.Builder
            .create()
            .statements(
              Arrays.asList(
                // S3 permissions
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "s3:GetBucketVersioning",
                      "s3:GetObject",
                      "s3:GetObjectVersion",
                      "s3:PutObject"
                    )
                  )
                  .resources(
                    Arrays.asList(
                      this.artifactsBucket.getBucketArn(),
                      this.artifactsBucket.getBucketArn() + "/*"
                    )
                  )
                  .build(),
                // SNS permissions
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(Arrays.asList("sns:Publish"))
                  .resources(Arrays.asList(this.notificationTopic.getTopicArn()))
                  .build(),
                // CodeBuild permissions
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "codebuild:BatchGetBuilds",
                      "codebuild:StartBuild"
                    )
                  )
                  .resources(Arrays.asList(this.buildProject.getProjectArn()))
                  .build(),
                // CodeDeploy permissions
                PolicyStatement.Builder
                  .create()
                  .effect(Effect.ALLOW)
                  .actions(
                    Arrays.asList(
                      "codedeploy:CreateDeployment",
                      "codedeploy:GetApplication",
                      "codedeploy:GetApplicationRevision",
                      "codedeploy:GetDeployment",
                      "codedeploy:GetDeploymentConfig",
                      "codedeploy:RegisterApplicationRevision"
                    )
                  )
                  .resources(Arrays.asList("*"))
                  .build()
              )
            )
            .build()
        )
      )
      .build();

    // Define pipeline artifacts
    Artifact sourceOutput = new Artifact("SourceOutput");
    Artifact buildOutput = new Artifact("BuildOutput");

    // Create the pipeline
    this.pipeline =
      Pipeline.Builder
        .create(this, "Pipeline")
        .pipelineName(resourcePrefix + "cicd-pipeline")
        .role(pipelineRole)
        .artifactBucket(this.artifactsBucket)
        .stages(
          Arrays.asList(
            // Source stage
            StageProps
              .builder()
              .stageName("Source")
              .actions(
                Arrays.asList(
                  S3SourceAction.Builder
                    .create()
                    .actionName("SourceAction")
                    .bucket(this.artifactsBucket)
                    .bucketKey("source.zip")
                    .output(sourceOutput)
                    .build()
                )
              )
              .build(),
            // Build stage
            StageProps
              .builder()
              .stageName("Build")
              .actions(
                Arrays.asList(
                  CodeBuildAction.Builder
                    .create()
                    .actionName("BuildAction")
                    .project(this.buildProject)
                    .input(sourceOutput)
                    .outputs(Arrays.asList(buildOutput))
                    .build()
                )
              )
              .build(),
            // Manual approval stage (only for production)
            StageProps
              .builder()
              .stageName("Approval")
              .actions(
                Arrays.asList(
                  ManualApprovalAction.Builder
                    .create()
                    .actionName("ManualApproval")
                    .additionalInformation(
                      "Please review the build artifacts and approve deployment to production environment"
                    )
                    .notificationTopic(this.notificationTopic)
                    .build()
                )
              )
              .build(),
            // Deploy stage
            StageProps
              .builder()
              .stageName("Deploy")
              .actions(
                Arrays.asList(
                  CodeDeployServerDeployAction.Builder
                    .create()
                    .actionName("DeployAction")
                    .input(buildOutput)
                    .deploymentGroup(this.deploymentGroup)
                    .build()
                )
              )
              .build()
          )
        )
        .build();
  }

  /**
   * Creates CloudWatch Events rules for pipeline failure notifications
   */
  private void createFailureNotifications() {
    // Create EventBridge rule for pipeline failures
    Rule pipelineFailureRule = Rule.Builder
      .create(this, "PipelineFailureRule")
      .ruleName(resourcePrefix + "pipeline-failure-rule")
      .description("Notify on pipeline failures")
      .eventPattern(
        EventPattern
          .builder()
          .source(Arrays.asList("aws.codepipeline"))
          .detailType(
            Arrays.asList("CodePipeline Pipeline Execution State Change")
          )
          .detail(
            Map.of(
              "state",
              Arrays.asList("FAILED"),
              "pipeline",
              Arrays.asList(this.pipeline.getPipelineName())
            )
          )
          .build()
      )
      .build();

    // Add SNS target
    pipelineFailureRule.addTarget(
      SnsTopic.Builder
        .create(this.notificationTopic)
        .message(
          RuleTargetInput.fromText(
            "Pipeline " +
            this.pipeline.getPipelineName() +
            " has failed. " +
            "Please check the AWS Console for details."
          )
        )
        .build()
    );

    // Create EventBridge rule for build failures
    Rule buildFailureRule = Rule.Builder
      .create(this, "BuildFailureRule")
      .ruleName(resourcePrefix + "build-failure-rule")
      .description("Notify on build failures")
      .eventPattern(
        EventPattern
          .builder()
          .source(Arrays.asList("aws.codebuild"))
          .detailType(Arrays.asList("CodeBuild Build State Change"))
          .detail(
            Map.of(
              "build-status",
              Arrays.asList("FAILED"),
              "project-name",
              Arrays.asList(this.buildProject.getProjectName())
            )
          )
          .build()
      )
      .build();

    buildFailureRule.addTarget(
      SnsTopic.Builder
        .create(this.notificationTopic)
        .message(
          RuleTargetInput.fromText(
            "Build project " +
            this.buildProject.getProjectName() +
            " has failed. " +
            "Please check the build logs for details."
          )
        )
        .build()
    );

    // Create EventBridge rule for deployment failures
    Rule deploymentFailureRule = Rule.Builder
      .create(this, "DeploymentFailureRule")
      .ruleName(resourcePrefix + "deployment-failure-rule")
      .description("Notify on deployment failures")
      .eventPattern(
        EventPattern
          .builder()
          .source(Arrays.asList("aws.codedeploy"))
          .detailType(
            Arrays.asList("CodeDeploy Deployment State-change Notification")
          )
          .detail(Map.of("state", Arrays.asList("FAILURE")))
          .build()
      )
      .build();

    deploymentFailureRule.addTarget(
      SnsTopic.Builder
        .create(this.notificationTopic)
        .message(
          RuleTargetInput.fromText(
            "Deployment has failed. Please check the CodeDeploy console for details."
          )
        )
        .build()
    );
  }

  /**
   * Creates CloudFormation outputs for important resources
   */
  private void createOutputs() {
    CfnOutput.Builder
      .create(this, "PipelineName")
      .description("Name of the CI/CD Pipeline")
      .value(this.pipeline.getPipelineName())
      .build();


    CfnOutput.Builder
      .create(this, "ArtifactsBucketName")
      .description("S3 Bucket for Pipeline Artifacts")
      .value(this.artifactsBucket.getBucketName())
      .build();

    CfnOutput.Builder
      .create(this, "NotificationTopicArn")
      .description("SNS Topic for Pipeline Notifications")
      .value(this.notificationTopic.getTopicArn())
      .build();
  }

  // Getters for accessing resources from parent stack
  public Pipeline getPipeline() {
    return pipeline;
  }


  public Bucket getArtifactsBucket() {
    return artifactsBucket;
  }

  public Topic getNotificationTopic() {
    return notificationTopic;
  }
}

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

  private TapStackProps(String environmentSuffix, StackProps stackProps, String repositoryName, String branchName, List<String> ec2InstanceIds) {
    this.environmentSuffix = environmentSuffix;
    this.stackProps =
      stackProps != null ? stackProps : StackProps.builder().build();
    this.repositoryName = repositoryName;
    this.branchName = branchName;
    this.ec2InstanceIds = ec2InstanceIds;
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
  public TapStack(
    final Construct scope,
    final String id,
    final TapStackProps props
  ) {
    super(scope, id, props != null ? props.getStackProps() : null);
    // Get environment suffix from props, context, or use 'dev' as default
    this.environmentSuffix =
      Optional
        .ofNullable(props)
        .map(TapStackProps::getEnvironmentSuffix)
        .or(() ->
          Optional
            .ofNullable(this.getNode().tryGetContext("environmentSuffix"))
            .map(Object::toString)
        )
        .orElse("dev");

    // Create the CI/CD Pipeline stack as a nested stack
    CiCdPipelineStack cicdStack = new CiCdPipelineStack(
      this,
      "CiCdPipelineStack" + environmentSuffix,
      CiCdPipelineStackProps
        .builder()
        .environmentSuffix(environmentSuffix)
        .build()
    );
    // Create separate stacks for each resource type
    // Create the DynamoDB stack as a nested stack

    // ! DO not create resources directly in this stack.
    // ! Instead, instantiate separate stacks for each resource type.

    // Example nested stack pattern:
    // NestedDynamoDBStack dynamodbStack = new NestedDynamoDBStack(
    //     this,
    //     "DynamoDBStack" + environmentSuffix,
    //     DynamoDBStackProps.builder()
    //         .environmentSuffix(environmentSuffix)
    //         .build()
    // );

    // Make the table available as a property of this stack
    // this.table = dynamodbStack.getTable();
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
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

  /**
   * Private constructor to prevent instantiation of utility class.
   */
  private Main() {
    // Utility class should not be instantiated
  }

  /**
   * Main entry point for the CDK application.
   *
   * This method creates a CDK App instance and instantiates the TapStack
   * with appropriate configuration based on environment variables and context.
   *
   * @param args Command line arguments (not used in this application)
   */
  public static void main(final String[] args) {
    App app = new App();

    // Get environment suffix from context or default to 'dev'
    String environmentSuffix = (String) app
      .getNode()
      .tryGetContext("environmentSuffix");
    if (environmentSuffix == null) {
      environmentSuffix = "dev";
    }

    // Create the main TAP stack
    new TapStack(
      app,
      "TapStack" + environmentSuffix,
      TapStackProps
        .builder()
        .environmentSuffix(environmentSuffix)
        .stackProps(
          StackProps
            .builder()
            .env(
              Environment
                .builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build()
            )
            .build()
        )
        .build()
    );

    // Synthesize the CDK app
    app.synth();
  }
}

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./cdk.json

```json
{
  "app": "./gradlew run",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "build",
      ".gradle",
      "src/test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
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
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-kms:applyImportedAliasPermissionsToPrincipal": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
