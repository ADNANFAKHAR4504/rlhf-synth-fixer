package app.stacks;


import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.logs.ILogGroup;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;



public final class SecurityStack extends Stack {
    private final IKey kmsKey;
    private final IKey rdsKmsKey;
    private final Role ecsTaskRole;
    private final Role ecsExecutionRole;
    private final ILogGroup ecsLogGroup;

    public SecurityStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Centralized ECS Log Group (prevents cross-stack references from SecurityStack to ECSStack)
        this.ecsLogGroup = LogGroup.Builder.create(this, "ECSLogGroup")
                .logGroupName("/aws/ecs/secure-webapp-" + environmentSuffix)
                .retention(RetentionDays.ONE_MONTH)
                .build();

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

        // Secrets Manager access can be granted where needed to avoid cross-stack refs

        // Create ECS task role (for application permissions)
        this.ecsTaskRole = Role.Builder.create(this, "ECSTaskRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .description("ECS task role for application permissions")
                .build();

        // Note: Avoid adding inline KMS/Logs statements here to prevent cross-stack references.
        // Managed policies or more targeted permissions can be attached at deployment time if needed.

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

    public ILogGroup getEcsLogGroup() {
        return ecsLogGroup;
    }
}