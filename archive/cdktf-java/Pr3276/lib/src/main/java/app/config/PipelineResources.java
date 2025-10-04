package app.config;

import app.constructs.CodeDeployConstruct;
import com.hashicorp.cdktf.providers.aws.codebuild_project.CodebuildProject;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;

public record PipelineResources(S3Bucket sourceBucket, CodebuildProject frontendBuild,
                                CodebuildProject backendBuild, CodeDeployConstruct frontendDeploy,
                                CodeDeployConstruct backendDeploy) {
}
