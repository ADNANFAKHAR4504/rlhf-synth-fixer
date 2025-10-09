package app.components;

import com.pulumi.core.Output;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;

import java.util.Map;

/**
 * IAM component for managing roles and policies.
 */
public class IamComponent {
    private final Role lambdaRole;
    private final Role glueRole;
    private final Role quickSightRole;

    /**
     * Creates IAM roles and policies for the time-series platform.
     *
     * @param name component name
     * @param region AWS region
     */
    public IamComponent(final String name, final String region) {
        // Lambda execution role
        this.lambdaRole = new Role(name + "-lambda-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "lambda.amazonaws.com"
                    }
                  }]
                }
                """)
            .tags(Map.of(
                "Component", "IAM",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Attach basic Lambda execution policy
        new RolePolicyAttachment(name + "-lambda-basic-execution",
            RolePolicyAttachmentArgs.builder()
                .role(lambdaRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());

        // Lambda custom policy for Kinesis and S3 (Timestream disabled due to account quota)
        new RolePolicy(name + "-lambda-custom-policy", RolePolicyArgs.builder()
            .role(lambdaRole.id())
            .policy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Action": [
                        "kinesis:GetRecords",
                        "kinesis:GetShardIterator",
                        "kinesis:DescribeStream",
                        "kinesis:ListStreams",
                        "kinesis:SubscribeToShard",
                        "kinesis:DescribeStreamConsumer",
                        "kinesis:RegisterStreamConsumer"
                      ],
                      "Resource": "*"
                    },
                    {
                      "Effect": "Allow",
                      "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                      ],
                      "Resource": "*"
                    }
                  ]
                }
                """)
            .build());

        // Glue role
        this.glueRole = new Role(name + "-glue-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "glue.amazonaws.com"
                    }
                  }]
                }
                """)
            .tags(Map.of(
                "Component", "IAM",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        new RolePolicyAttachment(name + "-glue-service-policy",
            RolePolicyAttachmentArgs.builder()
                .role(glueRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole")
                .build());

        // QuickSight role
        this.quickSightRole = new Role(name + "-quicksight-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "quicksight.amazonaws.com"
                    }
                  }]
                }
                """)
            .tags(Map.of(
                "Component", "IAM",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        new RolePolicy(name + "-quicksight-policy", RolePolicyArgs.builder()
            .role(quickSightRole.id())
            .policy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Action": [
                        "athena:*",
                        "s3:GetObject",
                        "s3:ListBucket"
                      ],
                      "Resource": "*"
                    }
                  ]
                }
                """)
            .build());
    }

    public Output<String> getLambdaRoleArn() {
        return lambdaRole.arn();
    }

    public Output<String> getGlueRoleArn() {
        return glueRole.arn();
    }

    public Output<String> getQuickSightRoleArn() {
        return quickSightRole.arn();
    }
}
