package app.stacks;

import app.config.Config;
import app.config.PipelineResources;
import app.config.PipelineStackResources;
import app.constructs.IAMConstruct;
import app.constructs.ArtifactStorageConstruct;
import app.constructs.CodeDeployConstruct;
import app.constructs.CodeBuildConstruct;
import app.constructs.NotificationConstruct;
import com.hashicorp.cdktf.providers.aws.codepipeline.CodepipelineStage;
import com.hashicorp.cdktf.providers.aws.codepipeline.CodepipelineStageAction;
import com.hashicorp.cdktf.providers.aws.codepipeline.Codepipeline;
import com.hashicorp.cdktf.providers.aws.codepipeline.CodepipelineArtifactStore;
import com.hashicorp.cdktf.providers.aws.codepipeline.CodepipelineArtifactStoreEncryptionKey;
import com.hashicorp.cdktf.providers.aws.codepipeline.CodepipelineConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import software.constructs.Construct;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class PipelineStack extends Construct {

    private final PipelineResources pipelineResources;
    private final IAMConstruct iamRoles;
    private final NotificationConstruct notifications;
    private final ArtifactStorageConstruct artifactStorage;
    private final Codepipeline pipeline;

    public PipelineStack(final Construct scope, final String id, final Config config,
                         final AwsProvider secondaryProvider) {
        super(scope, id);

        // Create Artifact Storage
        this.artifactStorage = new ArtifactStorageConstruct(this, "artifact-storage", config, secondaryProvider);

        // Create Notifications
        this.notifications = new NotificationConstruct(this, "notifications", config);

        // Create IAM Roles
        this.iamRoles = new IAMConstruct(this, "iam-roles", config, artifactStorage);

        // Create CodeBuild Projects
        this.pipelineResources = getPipelineResources(config);

        // Create CodePipeline
        this.pipeline = createPipeline(config, pipelineResources);
    }

    private PipelineResources getPipelineResources(final Config config) {

        var codeBuild = new CodeBuildConstruct(this, "code-build", config, iamRoles.getCodeBuildRole(),
                artifactStorage);

        // Create CodeDeploy Applications
        var frontendDeploy = new CodeDeployConstruct(this, "frontend-deploy", config, "frontend",
                iamRoles.getCodeDeployRole());

        var backendDeploy = new CodeDeployConstruct(this, "backend-deploy", config, "backend",
                iamRoles.getCodeDeployRole());

        return new PipelineResources(artifactStorage.getSourceBucket(), codeBuild.getFrontendProject(),
                codeBuild.getBackendProject(), frontendDeploy, backendDeploy);
    }

    private Codepipeline createPipeline(final Config config, final PipelineResources resources) {

        List<CodepipelineStage> stages = new ArrayList<>();

        // Source Stage
        stages.add(CodepipelineStage.builder()
                .name("Source")
                .action(List.of(
                        CodepipelineStageAction.builder()
                                .name("SourceAction")
                                .category("Source")
                                .owner("AWS")
                                .provider("S3")
                                .version("1")
                                .outputArtifacts(List.of("SourceOutput"))
                                .configuration(Map.of(
                                        "S3Bucket", resources.sourceBucket().getBucket(),
                                        "S3ObjectKey", "source.zip",
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
                                .inputArtifacts(List.of("SourceOutput"))
                                .outputArtifacts(List.of("FrontendBuildOutput"))
                                .configuration(Map.of(
                                        "ProjectName", resources.frontendBuild().getName()
                                ))
                                .runOrder(1)
                                .build(),
                        CodepipelineStageAction.builder()
                                .name("BuildBackend")
                                .category("Build")
                                .owner("AWS")
                                .provider("CodeBuild")
                                .version("1")
                                .inputArtifacts(List.of("SourceOutput"))
                                .outputArtifacts(List.of("BackendBuildOutput"))
                                .configuration(Map.of(
                                        "ProjectName", resources.backendBuild().getName()
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
                                .inputArtifacts(List.of("FrontendBuildOutput"))
                                .configuration(Map.of(
                                        "ApplicationName", resources.frontendDeploy().getApplication().getName(),
                                        "DeploymentGroupName", resources.frontendDeploy().getStagingDeploymentGroup()
                                                .getDeploymentGroupName()
                                ))
                                .region(config.secondaryRegion())
                                .runOrder(1)
                                .build(),
                        CodepipelineStageAction.builder()
                                .name("DeployBackendStaging")
                                .category("Deploy")
                                .owner("AWS")
                                .provider("CodeDeploy")
                                .version("1")
                                .inputArtifacts(List.of("BackendBuildOutput"))
                                .configuration(Map.of(
                                        "ApplicationName", resources.backendDeploy().getApplication().getName(),
                                        "DeploymentGroupName", resources.backendDeploy().getStagingDeploymentGroup()
                                                .getDeploymentGroupName()
                                ))
                                .region(config.secondaryRegion())
                                .runOrder(1)
                                .build()
                ))
                .build());

        // Manual Approval Stage
        stages.add(CodepipelineStage.builder()
                .name("ManualApproval")
                .action(List.of(
                        CodepipelineStageAction.builder()
                                .name("ApproveProduction")
                                .category("Approval")
                                .owner("AWS")
                                .provider("Manual")
                                .version("1")
                                .configuration(Map.of(
                                        "NotificationArn", notifications.getSnsTopic().getArn(),
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
                                .inputArtifacts(List.of("FrontendBuildOutput"))
                                .configuration(Map.of(
                                        "ApplicationName", resources.frontendDeploy().getApplication().getName(),
                                        "DeploymentGroupName", resources.frontendDeploy()
                                                .getProductionDeploymentGroup().getDeploymentGroupName()
                                ))
                                .region(config.primaryRegion())
                                .runOrder(1)
                                .build(),
                        CodepipelineStageAction.builder()
                                .name("DeployBackendProduction")
                                .category("Deploy")
                                .owner("AWS")
                                .provider("CodeDeploy")
                                .version("1")
                                .inputArtifacts(List.of("BackendBuildOutput"))
                                .configuration(Map.of(
                                        "ApplicationName", resources.backendDeploy().getApplication().getName(),
                                        "DeploymentGroupName", resources.backendDeploy()
                                                .getProductionDeploymentGroup().getDeploymentGroupName()
                                ))
                                .region(config.primaryRegion())
                                .runOrder(1)
                                .build()
                ))
                .build());

        // Create the pipeline with artifact stores for multi-region deployment
        return new Codepipeline(this, "main-pipeline", CodepipelineConfig.builder()
                .name(config.resourceName(config.projectName() + "-pipeline"))
                .roleArn(iamRoles.getCodePipelineRole().getArn())
                .artifactStore(List.of(
                        // Artifact store for primary region (source, build stages)
                        CodepipelineArtifactStore.builder()
                                .location(artifactStorage.getArtifactBucket().getBucket())
                                .type("S3")
                                .region(config.primaryRegion())
                                .encryptionKey(CodepipelineArtifactStoreEncryptionKey.builder()
                                        .id(artifactStorage.getKmsKey().getArn())
                                        .type("KMS")
                                        .build())
                                .build(),
                        // Artifact store for secondary region
                        CodepipelineArtifactStore.builder()
                                .location(artifactStorage.getStagingArtifactBucket().getBucket())
                                .type("S3")
                                .region(config.secondaryRegion())
                                .encryptionKey(CodepipelineArtifactStoreEncryptionKey.builder()
                                        .id(artifactStorage.getKmsKey().getArn())
                                        .type("KMS")
                                        .build())
                                .build()
                ))
                .stage(stages)
                .build());
    }

    public PipelineStackResources getPipelineStackResources() {
        return new PipelineStackResources(artifactStorage, notifications, iamRoles, pipelineResources, pipeline);
    }

}
