package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.core.Output;

import java.util.Map;

/**
 * Main class for AWS Multi-Account Security Infrastructure.
 * 
 * This class implements a basic security framework for AWS Organizations
 * including IAM roles, KMS encryption, S3 security, and monitoring.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {
    
    private static final String REGION = "us-east-1";
    private static final String ENVIRONMENT = "production";
    private static final String PROJECT = "security-framework";
    
    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }
    
    /**
     * Main entry point for the Pulumi program.
     * 
     * @param args Command line arguments
     */
    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the complete security infrastructure.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(final Context ctx) {
        // Get account ID for naming convention
        final Output<String> accountId = Output.of("${aws:accountId}");
        
        // 1. Create KMS Key for encryption
        final Key kmsKey = createKmsKey(accountId);
        
        // 2. Create S3 Bucket with encryption
        final Bucket secureBucket = createSecureS3Bucket(accountId, kmsKey);
        
        // 3. Create IAM Roles and Policies
        final Role securityRole = createSecurityRole(accountId);
        final Role crossAccountRole = createCrossAccountRole(accountId);
        
        // 4. Create SNS Topic for alerts
        final Topic securityTopic = createSecurityTopic(accountId);
        
        // Export outputs
        ctx.export("kmsKeyId", kmsKey.id());
        ctx.export("secureBucketName", secureBucket.id());
        ctx.export("securityRoleArn", securityRole.arn());
        ctx.export("crossAccountRoleArn", crossAccountRole.arn());
        ctx.export("securityTopicArn", securityTopic.arn());
    }
    
    /**
     * Creates a KMS key for encrypting sensitive data.
     */
    private static Key createKmsKey(final Output<String> accountId) {
        return new Key("security-kms-key", KeyArgs.builder()
                .description("KMS key for encrypting sensitive data across services")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .enableKeyRotation(true)
                .deletionWindowInDays(7)
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "data-encryption"))
                .build());
    }
    
    /**
     * Creates a secure S3 bucket with encryption.
     */
    private static Bucket createSecureS3Bucket(final Output<String> accountId, final Key kmsKey) {
        return new Bucket("secure-data-bucket", BucketArgs.builder()
                .forceDestroy(false)
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "secure-data-storage"))
                .build());
    }
    
    /**
     * Creates IAM role with least privilege security policies.
     */
    private static Role createSecurityRole(final Output<String> accountId) {
        // Create the security role
        final Role role = new Role("security-role", RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "lambda.amazonaws.com"
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """)
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-automation"))
                .build());
        
        // Create least privilege policy
        final Policy securityPolicy = new Policy("security-policy", PolicyArgs.builder()
                .policy("""
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
                                    "sns:Publish"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "cloudwatch:PutMetricData"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """)
                .build());
        
        // Attach policy to role
        new RolePolicyAttachment("security-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(role.name())
                .policyArn(securityPolicy.arn())
                .build());
        
        return role;
    }
    
    /**
     * Creates IAM role for cross-account access.
     */
    private static Role createCrossAccountRole(final Output<String> accountId) {
        return new Role("cross-account-role", RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": "arn:aws:iam::*:root"
                                },
                                "Action": "sts:AssumeRole",
                                "Condition": {
                                    "StringEquals": {
                                        "sts:ExternalId": "security-framework"
                                    }
                                }
                            }
                        ]
                    }
                    """)
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "cross-account-access"))
                .build());
    }
    
    /**
     * Creates SNS Topic for security alerts.
     */
    private static Topic createSecurityTopic(final Output<String> accountId) {
        return new Topic("security-alerts", TopicArgs.builder()
                .displayName("Security Alerts")
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-notifications"))
                .build());
    }
}