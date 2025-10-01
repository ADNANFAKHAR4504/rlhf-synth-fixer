package app.constructs;

import app.config.CodeBuildConfig;
import app.config.Config;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProject;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectArtifacts;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectConfig;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectEnvironment;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariable;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectSource;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectLogsConfig;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class CodeBuildConstruct extends Construct {
    private final CodebuildProject frontendBuild;
    private final CodebuildProject backendBuild;

    public CodeBuildConstruct(final Construct scope, final String id, final Config pipelineConfig,
                              final IamRole codeBuildRole, final ArtifactStorageConstruct artifactStorage) {
        super(scope, id);

        this.frontendBuild = creatCodebuildProject(pipelineConfig, new CodeBuildConfig("frontend",
                frontendBuildSpec(), codeBuildRole), artifactStorage);

        this.backendBuild = creatCodebuildProject(pipelineConfig, new CodeBuildConfig("backend",
                backendBuildSpec(), codeBuildRole), artifactStorage);
    }

    private CodebuildProject creatCodebuildProject(final Config pipelineConfig, final CodeBuildConfig buildConfig,
                                                   final ArtifactStorageConstruct artifactStorage) {

        // Create CloudWatch Log Group
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, buildConfig.component() + "-build-logs",
                CloudwatchLogGroupConfig.builder()
                        .name("/aws/codebuild/" + pipelineConfig.resourceName(pipelineConfig.projectName()
                                + "-" + buildConfig.component()))
                        .retentionInDays(7)
                        .build());

        Map<String, String> tags = new HashMap<>();
        tags.put("Project", pipelineConfig.projectName());
        tags.put("Component", buildConfig.component());
        tags.put("ManagedBy", "CDK For Terraform");

        // Create CodeBuild Project
        return new CodebuildProject(this, buildConfig.component() + "-build-project",
                CodebuildProjectConfig.builder()
                        .name(pipelineConfig.resourceName(pipelineConfig.projectName()
                                + "-" + buildConfig.component() + "-build"))
                        .description("Build project for " + buildConfig.component())
                        .serviceRole(buildConfig.serviceRole().getArn())
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
                                                .value(artifactStorage.getArtifactBucket().getBucket())
                                                .build(),
                                        CodebuildProjectEnvironmentEnvironmentVariable.builder()
                                                .name("KMS_KEY_ID")
                                                .value(artifactStorage.getKmsKey().getId())
                                                .build(),
                                        CodebuildProjectEnvironmentEnvironmentVariable.builder()
                                                .name("COMPONENT")
                                                .value(buildConfig.component())
                                                .build()
                                ))
                                .build())
                        .source(CodebuildProjectSource.builder()
                                .type("CODEPIPELINE")
                                .buildspec(buildConfig.buildSpec())
                                .build())
                        .logsConfig(CodebuildProjectLogsConfig.builder()
                                .cloudwatchLogs(CodebuildProjectLogsConfigCloudwatchLogs.builder()
                                        .status("ENABLED")
                                        .groupName(logGroup.getName())
                                        .build())
                                .build())
                        .encryptionKey(artifactStorage.getKmsKey().getArn())
                        .tags(tags)
                        .build());
    }

    private String frontendBuildSpec() {
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

    private String backendBuildSpec() {
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


    public CodebuildProject getFrontendProject() {
        return frontendBuild;
    }

    public CodebuildProject getBackendProject() {
        return backendBuild;
    }
}
