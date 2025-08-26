package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.iam.*;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.s3.inputs.BucketWebsiteConfigurationErrorDocumentArgs;
import com.pulumi.aws.s3.inputs.BucketWebsiteConfigurationIndexDocumentArgs;
import com.pulumi.core.Either;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

public class StorageStack extends ComponentResource {
    public final Output<String> bucketId;
    public final Output<String> bucketArn;
    public final Output<String> iamRoleArn;
    public final Output<String> instanceProfileName;

    public StorageStack(String name, ComponentResourceOptions options) {
        super("custom:infrastructure:StorageStack", name, options);

        // Create S3 Bucket for static website hosting
        var bucket = new Bucket("web-hosting-bucket",
                BucketArgs.builder()
                        .bucket(AppConfig.getS3BucketNamePrefix() + "-" + System.currentTimeMillis())
                        .tags(TagUtils.getTagsWithName("Web-Hosting-Bucket"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.bucketId = bucket.id();
        this.bucketArn = bucket.arn();

        // Configure bucket for static website hosting
        new BucketWebsiteConfiguration("bucket-website-config",
                BucketWebsiteConfigurationArgs.builder()
                        .bucket(bucket.id())
                        .indexDocument(BucketWebsiteConfigurationIndexDocumentArgs.builder()
                                .suffix(AppConfig.getS3WebsiteIndexDocument())
                                .build())
                        .errorDocument(BucketWebsiteConfigurationErrorDocumentArgs.builder()
                                .key(AppConfig.getS3WebsiteErrorDocument())
                                .build())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Block public access (we'll use CloudFront for public access)
        new BucketPublicAccessBlock("bucket-public-access-block",
                BucketPublicAccessBlockArgs.builder()
                        .bucket(bucket.id())
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Create IAM Role for EC2 instance
        var assumeRolePolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            }
                        }
                    ]
                }
                """;

        var iamRole = new Role("ec2-s3-access-role",
                RoleArgs.builder()
                        .name("ec2-s3-access-role")
                        .assumeRolePolicy(assumeRolePolicy)
                        .tags(TagUtils.getTagsWithName("EC2-S3-Access-Role"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.iamRoleArn = iamRole.arn();

        // Create IAM Policy for S3 access
        var s3AccessPolicy = bucket.arn().applyValue(arn -> String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            "Resource": [
                                "%s",
                                "%s/*"
                            ]
                        }
                    ]
                }
                """, arn, arn));

        var policy = new Policy("s3-access-policy",
                PolicyArgs.builder()
                        .name("s3-access-policy")
                        .policy(s3AccessPolicy.applyValue(Either::ofLeft))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Attach policy to role
        new RolePolicyAttachment("role-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(iamRole.name())
                        .policyArn(policy.arn())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Create Instance Profile
        var instanceProfile = new InstanceProfile("ec2-instance-profile",
                InstanceProfileArgs.builder()
                        .name("ec2-instance-profile")
                        .role(iamRole.name())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceProfileName = instanceProfile.name();
    }
}
