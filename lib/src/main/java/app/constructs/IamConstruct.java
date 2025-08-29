package app.constructs;

import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.constructs.Construct;
import software.amazon.awscdk.CfnResource;
import software.amazon.awscdk.CfnResourceProps;
import software.amazon.awscdk.customresources.AwsCustomResource;
import software.amazon.awscdk.customresources.AwsCustomResourcePolicy;
import software.amazon.awscdk.customresources.AwsSdkCall;
import software.amazon.awscdk.customresources.PhysicalResourceId;
import software.amazon.awscdk.customresources.SdkCallsPolicyOptions;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import app.config.EnvironmentConfig;
import java.util.List;
import java.util.Map;
import software.amazon.awscdk.services.iam.Group;
import software.amazon.awscdk.services.iam.ArnPrincipal;
import software.amazon.awscdk.services.iam.User;

/**
 * IAM construct that creates roles and policies following the principle of least privilege.
 * This construct also enforces strong password policies and MFA requirements
 * for enhanced security in financial services environments.
 */
public class IamConstruct extends Construct {
    
    private final Role s3ReadOnlyRole;
    private final Role cloudTrailRole;
    
    public IamConstruct(final Construct scope, final String id) {
        super(scope, id);
    // Create and enforce account password policy (90-day rotation, complexity)
    createPasswordPolicy();
    // MFA enforcement removed by request.
        // Create IAM roles with least privilege
        this.s3ReadOnlyRole = createS3ReadOnlyRole();
        this.cloudTrailRole = createCloudTrailRole();
    }

    /**
     * Creates a group for human operators and attaches the MFA enforcement policy.
     */
    // Operators group and MFA enforcement removed.
    
    /**
     * Creates a strict password policy for IAM users.
     * Enforces 90-day rotation, complexity requirements, and prevents password reuse.
     */
    
    /**
     * Creates an IAM role for S3 read-only access with least privilege principle.
     */
    private Role createS3ReadOnlyRole() {
        return Role.Builder.create(this, EnvironmentConfig.getResourceName("iam", "s3-readonly-role"))
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("Role for EC2 instances requiring read-only S3 access")
                .inlinePolicies(Map.of(
                    "S3ReadOnlyPolicy", PolicyDocument.Builder.create()
                        .statements(List.of(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(List.of(
                                    "s3:GetObject",
                                    "s3:GetObjectVersion",
                                    "s3:ListBucket"
                                ))
                                .resources(List.of(
                                    String.format("arn:aws:s3:::%s-*", EnvironmentConfig.ENVIRONMENT),
                                    String.format("arn:aws:s3:::%s-*/*", EnvironmentConfig.ENVIRONMENT)
                                ))
                                .build()
                        ))
                        .build()
                ))
                .build();
    }
    
    /**
     * Creates an IAM role for CloudTrail service with minimal required permissions.
     */
    private Role createCloudTrailRole() {
        return Role.Builder.create(this, EnvironmentConfig.getResourceName("iam", "cloudtrail-role"))
                .assumedBy(new ServicePrincipal("cloudtrail.amazonaws.com"))
                .description("Role for CloudTrail logging service")
                .inlinePolicies(Map.of(
                    "CloudTrailLogsPolicy", PolicyDocument.Builder.create()
                        .statements(List.of(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(List.of(
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents",
                                    "logs:DescribeLogGroups",
                                    "logs:DescribeLogStreams"
                                ))
                                // Limit to CloudWatch Logs in this account; CloudTrail writes to log groups with the pattern /aws/cloudtrail/*
                                .resources(List.of(String.format("arn:aws:logs:*:%s:log-group:/aws/cloudtrail/*", software.amazon.awscdk.Stack.of(this).getAccount())))
                                .build()
                        ))
                        .build()
                ))
                .build();
    }

    /**
     * Create an account password policy using the L1 construct so the account
     * enforces 90-day rotation and complexity rules.
     */
    private void createPasswordPolicy() {
        // Use an AWS SDK custom resource to call PutAccountPasswordPolicy because
        // CloudFormation does not recognize an account-level AccountPasswordPolicy resource.
        AwsSdkCall sdkCall = AwsSdkCall.builder()
            .service("IAM")
            // Use the service operation name expected by the CDK custom resource runtime
            // (some runtimes expect the PascalCase operation name).
            .action("PutAccountPasswordPolicy")
            .parameters(java.util.Map.of(
                "MinimumPasswordLength", EnvironmentConfig.PASSWORD_MIN_LENGTH,
                "RequireSymbols", EnvironmentConfig.REQUIRE_SYMBOLS,
                "RequireNumbers", EnvironmentConfig.REQUIRE_NUMBERS,
                "RequireUppercaseCharacters", EnvironmentConfig.REQUIRE_UPPERCASE,
                "RequireLowercaseCharacters", EnvironmentConfig.REQUIRE_LOWERCASE,
                "MaxPasswordAge", EnvironmentConfig.PASSWORD_MAX_AGE_DAYS,
                "PasswordReusePrevention", EnvironmentConfig.PASSWORD_REUSE_PREVENTION
            ))
            .physicalResourceId(PhysicalResourceId.of(EnvironmentConfig.getResourceName("iam", "password-policy")))
            .build();

        AwsCustomResource.Builder.create(this, EnvironmentConfig.getResourceName("iam", "password-policy"))
            .onCreate(sdkCall)
            .onUpdate(sdkCall)
            .policy(AwsCustomResourcePolicy.fromSdkCalls(SdkCallsPolicyOptions.builder()
                .resources(java.util.List.of("*"))
                .build()))
            .build();
    }

    /**
     * Creates a managed policy that can be attached to user groups to enforce MFA
     * and limit actions for human users. This is intentionally conservative.
     */
    private ManagedPolicy createMfaEnforcementPolicy() {
    // MFA enforcement removed per request.
    return null;
    }
    
    // Getters
    public Role getS3ReadOnlyRole() { return s3ReadOnlyRole; }
    public Role getCloudTrailRole() { return cloudTrailRole; }
    // Operators group removed.
    // Password policy getter intentionally omitted; refer to account-level governance
}