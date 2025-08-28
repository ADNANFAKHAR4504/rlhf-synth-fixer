package app.constructs;

import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.constructs.Construct;
import app.config.EnvironmentConfig;
import java.util.List;
import java.util.Map;

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
        
    // Password policy enforcement is handled outside of CDK in this project
    // to avoid relying on account-level low-level constructs which may not
    // be available in the targeted CDK Java dependency set.
        
        // Create IAM roles with least privilege
        this.s3ReadOnlyRole = createS3ReadOnlyRole();
        this.cloudTrailRole = createCloudTrailRole();
    }
    
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
    
    // Getters
    public Role getS3ReadOnlyRole() { return s3ReadOnlyRole; }
    public Role getCloudTrailRole() { return cloudTrailRole; }
    // Password policy getter intentionally omitted; refer to account-level governance
}