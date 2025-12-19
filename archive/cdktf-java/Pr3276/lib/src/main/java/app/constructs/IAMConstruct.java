package app.constructs;

import app.config.Config;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachmentConfig;
import software.constructs.Construct;

public class IAMConstruct extends Construct {
    private final IamRole codePipelineRole;
    private final IamRole codeBuildRole;
    private final IamRole codeDeployRole;

    public IAMConstruct(final Construct scope, final String id, final Config config,
                        final ArtifactStorageConstruct artifactStorage) {
        super(scope, id);

        // CodePipeline Service Role
        this.codePipelineRole = new IamRole(this, "codepipeline-role",
                IamRoleConfig.builder()
                        .name(config.resourceName(config.projectName() + "-codepipeline-role"))
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
                        .name(config.projectName() + "-codepipeline-policy")
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
                                                        "s3:GetObject",
                                                        "s3:GetObjectVersion",
                                                        "s3:GetBucketVersioning",
                                                        "s3:GetBucketAcl",
                                                        "s3:GetBucketLocation",
                                                        "s3:GetObjectTagging",
                                                        "s3:GetObjectVersionTagging",
                                                        "s3:ListBucket"
                                                    ],
                                                    "Resource": [
                                                        "%s",
                                                        "%s/*"
                                                    ]
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
                                artifactStorage.getArtifactBucket().getArn(),
                                artifactStorage.getArtifactBucket().getArn(),
                                artifactStorage.getSourceBucket().getArn(),
                                artifactStorage.getSourceBucket().getArn(),
                                artifactStorage.getKmsKey().getArn()))
                        .build());

        // CodeBuild Service Role
        this.codeBuildRole = new IamRole(this, "codebuild-role",
                IamRoleConfig.builder()
                        .name(config.resourceName(config.projectName() + "-codebuild-role"))
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
                        .name(config.projectName() + "-codebuild-policy")
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
                                                }
                                            ]
                                        }
                                        """,
                                artifactStorage.getArtifactBucket().getArn(),
                                artifactStorage.getKmsKey().getArn()))
                        .build());

        // CodeDeploy Service Role
        this.codeDeployRole = new IamRole(this, "codedeploy-role",
                IamRoleConfig.builder()
                        .name(config.resourceName(config.projectName() + "-codedeploy-role"))
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
                        .policyArn("arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole")
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
