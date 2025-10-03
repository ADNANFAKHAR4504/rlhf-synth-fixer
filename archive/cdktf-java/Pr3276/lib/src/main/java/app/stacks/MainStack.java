package app.stacks;

import app.config.Config;
import app.config.PipelineStackResources;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 */
public class MainStack extends TerraformStack {

    /**
     * Creates a new MainStack with basic AWS resources.
     *
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configuration
        Config config = new Config();

        // Configure AWS Providers
        new AwsProvider(this, "aws-primary", AwsProviderConfig.builder()
                .region(config.primaryRegion())
                .build());

        AwsProvider secondaryProvider = new AwsProvider(this, "aws-secondary", AwsProviderConfig.builder()
                .region(config.secondaryRegion())
                .alias("secondary")
                .build());

        // Main pipeline stack
        PipelineStack pipeline = new PipelineStack(this, "pipeline", config, secondaryProvider);

        //Export Outputs
        exportOutputs(config, pipeline.getPipelineStackResources());

    }

    private void exportOutputs(final Config config, final PipelineStackResources stackResources) {

        // Main stack outputs - only essential cross-stack references
        new TerraformOutput(this, "projectName", TerraformOutputConfig.builder()
                .value(config.projectName())
                .description("Project name used across all stacks")
                .build());

        new TerraformOutput(this, "region", TerraformOutputConfig.builder()
                .value(config.primaryRegion())
                .description("Primary deployment region")
                .build());

        new TerraformOutput(this, "stackId", TerraformOutputConfig.builder()
                .value(stackId)
                .description("Main stack identifier")
                .build());

        // Source bucket outputs
        new TerraformOutput(this, "sourceBucketName", TerraformOutputConfig.builder()
                .value(stackResources.artifactStorage().getSourceBucket().getBucket())
                .description("S3 source bucket name")
                .build());

        // CodeBuild project outputs
        new TerraformOutput(this, "frontendBuildProjectName", TerraformOutputConfig.builder()
                .value(stackResources.resources().frontendBuild().getName())
                .description("Frontend CodeBuild project name")
                .build());

        new TerraformOutput(this, "backendBuildProjectName", TerraformOutputConfig.builder()
                .value(stackResources.resources().backendBuild().getName())
                .description("Backend CodeBuild project name")
                .build());

        // CodeDeploy application outputs
        new TerraformOutput(this, "frontendDeployApplicationName", TerraformOutputConfig.builder()
                .value(stackResources.resources().frontendDeploy().getApplication().getName())
                .description("Frontend CodeDeploy application name")
                .build());

        new TerraformOutput(this, "backendDeployApplicationName", TerraformOutputConfig.builder()
                .value(stackResources.resources().backendDeploy().getApplication().getName())
                .description("Backend CodeDeploy application name")
                .build());

        // Pipeline outputs
        new TerraformOutput(this, "pipelineName", TerraformOutputConfig.builder()
                .value(stackResources.pipeline().getName())
                .description("CodePipeline name")
                .build());

        // IAM Role outputs
        new TerraformOutput(this, "codePipelineRoleName", TerraformOutputConfig.builder()
                .value(stackResources.iamRoles().getCodePipelineRole().getName())
                .description("CodePipeline IAM role name")
                .build());

        new TerraformOutput(this, "codeBuildRoleName", TerraformOutputConfig.builder()
                .value(stackResources.iamRoles().getCodeBuildRole().getName())
                .description("CodeBuild IAM role name")
                .build());

        new TerraformOutput(this, "codeDeployRoleName", TerraformOutputConfig.builder()
                .value(stackResources.iamRoles().getCodeDeployRole().getName())
                .description("CodeDeploy IAM role name")
                .build());

        // SNS outputs
        new TerraformOutput(this, "snsTopicName", TerraformOutputConfig.builder()
                .value(stackResources.notifications().getSnsTopic().getName())
                .description("SNS topic name for notifications")
                .build());

        // EventBridge rule outputs
        new TerraformOutput(this, "buildFailedRuleName", TerraformOutputConfig.builder()
                .value(stackResources.notifications().getBuildFailedRule().getName())
                .description("EventBridge rule name for build failures")
                .build());

        // Artifacts Storage Outputs
        new TerraformOutput(this, "artifactBucketName", TerraformOutputConfig.builder()
                .value(stackResources.artifactStorage().getArtifactBucket().getBucket())
                .description("Name of the primary region artifact bucket")
                .build());

        new TerraformOutput(this, "secondaryArtifactBucketName", TerraformOutputConfig.builder()
                .value(stackResources.artifactStorage().getStagingArtifactBucket().getBucket())
                .description("Name of the secondary region artifact bucket")
                .build());

        new TerraformOutput(this, "pipelineKmsKeyArn", TerraformOutputConfig.builder()
                .value(stackResources.artifactStorage().getKmsKey().getArn())
                .description("The KMS key ARN")
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}