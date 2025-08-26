package app.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.kms.*;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class SecurityStack extends Stack {
    private final IKey kmsKey;
    private final IKey rdsKmsKey;
    private final Role ecsTaskRole;
    private final Role ecsExecutionRole;

    public SecurityStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create customer-managed KMS key for general encryption
        this.kmsKey = Key.Builder.create(this, "GeneralKMSKey")
                .description("KMS key for encrypting CloudWatch logs and other resources")
                .enableKeyRotation(true)
                .build();

        // Create customer-managed KMS key for RDS encryption
        this.rdsKmsKey = Key.Builder.create(this, "RDSKMSKey")
                .description("KMS key for encrypting RDS database")
                .enableKeyRotation(true)
                .build();

        // Create ECS task execution role
        this.ecsExecutionRole = Role.Builder.create(this, "ECSExecutionRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .description("ECS task execution role with minimal permissions")
                .build();

        // Add basic ECS execution permissions
        ecsExecutionRole.addManagedPolicy(
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")
        );

        // Add permissions for KMS decryption
        ecsExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                ))
                .resources(List.of(kmsKey.getKeyArn()))
                .build());

        // Add permissions for Secrets Manager
        ecsExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "secretsmanager:GetSecretValue"
                ))
                .resources(List.of("arn:aws:secretsmanager:*:*:secret:*"))
                .build());

        // Create ECS task role (for application permissions)
        this.ecsTaskRole = Role.Builder.create(this, "ECSTaskRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .description("ECS task role for application permissions")
                .build();

        // Add CloudWatch logs permissions to task role
        ecsTaskRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                ))
                .resources(List.of("arn:aws:logs:*:*:*"))
                .build());

        // Add KMS permissions for CloudWatch logs encryption
        ecsTaskRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                ))
                .resources(List.of(kmsKey.getKeyArn()))
                .build());

        // Add tags
        Tags.of(this).add("Environment", "production");
        Tags.of(this).add("Project", "SecureWebApp");
    }

    public IKey getKmsKey() {
        return kmsKey;
    }

    public IKey getRdsKmsKey() {
        return rdsKmsKey;
    }

    public Role getEcsTaskRole() {
        return ecsTaskRole;
    }

    public Role getEcsExecutionRole() {
        return ecsExecutionRole;
    }
}