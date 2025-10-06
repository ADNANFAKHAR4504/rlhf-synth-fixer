package app.config;

import app.constructs.ArtifactStorageConstruct;
import app.constructs.IAMConstruct;
import app.constructs.NotificationConstruct;
import com.hashicorp.cdktf.providers.aws.codepipeline.Codepipeline;

public record PipelineStackResources(ArtifactStorageConstruct artifactStorage, NotificationConstruct notifications,
                                     IAMConstruct iamRoles, PipelineResources resources, Codepipeline pipeline) {
}
