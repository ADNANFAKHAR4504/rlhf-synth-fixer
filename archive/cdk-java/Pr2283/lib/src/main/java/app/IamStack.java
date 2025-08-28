package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.Bucket;
import software.constructs.Construct;

import java.util.Map;

public class IamStack extends Stack {

    private final Role ec2Role;

    public IamStack(final Construct scope, final String id, 
                   final StackProps props, final Bucket s3Bucket) {
        super(scope, id, props);

        // Create IAM role for EC2 with S3 read-only access
        this.ec2Role = Role.Builder.create(this, "app-role-ec2")
                .roleName("app-role-ec2")
                .description("EC2 role with S3 read-only access")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .build();

        // Add policy for S3 read-only access to specific bucket
        PolicyStatement s3ReadPolicy = PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(java.util.List.of(
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:ListBucket"
                ))
                .resources(java.util.List.of(
                        s3Bucket.getBucketArn(),
                        s3Bucket.getBucketArn() + "/*"
                ))
                .build();

        ec2Role.addToPolicy(s3ReadPolicy);

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public Role getEc2Role() {
        return ec2Role;
    }
}