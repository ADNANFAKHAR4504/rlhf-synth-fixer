package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.iam.*;
import com.pulumi.aws.kms.*;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.cloudwatch.*;
import com.pulumi.aws.sns.*;
import com.pulumi.aws.lambda.*;
import com.pulumi.aws.sfn.*;
import com.pulumi.aws.logs.*;
import com.pulumi.core.Output;
import com.pulumi.aws.iam.inputs.*;

import java.util.Map;
import java.util.List;

/**
 * Main class for AWS Multi-Account Security Infrastructure.
 * 
 * This class implements a comprehensive security framework for AWS Organizations
 * including IAM roles, KMS encryption, S3 security, monitoring, and automation.
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
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the complete security infrastructure.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {
        // Get account ID for naming convention
        Output<String> accountId = Output.of("${aws:accountId}");
        
        // 1. Create KMS Key for encryption
        Key kmsKey = createKmsKey(accountId);
        
        // 2. Create S3 Bucket with encryption
        Bucket secureBucket = createSecureS3Bucket(accountId, kmsKey);
        
        // 3. Create IAM Roles and Policies
        Role securityRole = createSecurityRole(accountId);
        Role crossAccountRole = createCrossAccountRole(accountId);
        
        // 4. Create CloudWatch Log Group
        LogGroup securityLogGroup = createSecurityLogGroup(accountId);
        
        // 5. Create SNS Topic for alerts
        Topic securityTopic = createSecurityTopic(accountId);
        
        // 6. Create CloudWatch Alarms
        createSecurityAlarms(accountId, securityTopic);
        
        // 7. Create Lambda Function for security automation
        Function securityLambda = createSecurityLambda(accountId, securityTopic);
        
        // 8. Create Step Function for security workflow
        StateMachine securityWorkflow = createSecurityWorkflow(accountId, securityLambda);
        
        // 9. Create CloudTrail for comprehensive logging
        createCloudTrail(accountId, secureBucket, securityLogGroup);
        
        // Export outputs
        ctx.export("kmsKeyId", kmsKey.id());
        ctx.export("secureBucketName", secureBucket.id());
        ctx.export("securityRoleArn", securityRole.arn());
        ctx.export("crossAccountRoleArn", crossAccountRole.arn());
        ctx.export("securityTopicArn", securityTopic.arn());
        ctx.export("securityLambdaArn", securityLambda.arn());
        ctx.export("securityWorkflowArn", securityWorkflow.arn());
    }
    
    /**
     * Creates a KMS key for encrypting sensitive data.
     */
    private static Key createKmsKey(Output<String> accountId) {
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
     * Creates a secure S3 bucket with encryption and access logging.
     */
    private static Bucket createSecureS3Bucket(Output<String> accountId, Key kmsKey) {
        return new Bucket("secure-data-bucket", BucketArgs.builder()
                .forceDestroy(false)
                .versioning(BucketVersioningArgs.builder()
                        .enabled(true)
                        .build())
                .serverSideEncryptionConfiguration(BucketServerSideEncryptionConfigurationArgs.builder()
                        .rules(List.of(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                                .applyServerSideEncryptionByDefault(BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                        .sseAlgorithm("aws:kms")
                                        .kmsMasterKeyId(kmsKey.id())
                                        .build())
                                .build()))
                        .build())
                .publicAccessBlockConfiguration(BucketPublicAccessBlockConfigurationArgs.builder()
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build())
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "secure-data-storage"))
                .build());
    }
    
    /**
     * Creates IAM role with least privilege security policies.
     */
    private static Role createSecurityRole(Output<String> accountId) {
        // Create the security role
        Role role = new Role("security-role", RoleArgs.builder()
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
        Policy securityPolicy = new Policy("security-policy", PolicyArgs.builder()
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
    private static Role createCrossAccountRole(Output<String> accountId) {
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
     * Creates CloudWatch Log Group for security logs.
     */
    private static LogGroup createSecurityLogGroup(Output<String> accountId) {
        return new LogGroup("security-logs", LogGroupArgs.builder()
                .retentionInDays(90)
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-logging"))
                .build());
    }
    
    /**
     * Creates SNS Topic for security alerts.
     */
    private static Topic createSecurityTopic(Output<String> accountId) {
        return new Topic("security-alerts", TopicArgs.builder()
                .displayName("Security Alerts")
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-notifications"))
                .build());
    }
    
    /**
     * Creates CloudWatch alarms for security monitoring.
     */
    private static void createSecurityAlarms(Output<String> accountId, Topic securityTopic) {
        // IAM Policy Changes Alarm
        new MetricAlarm("iam-policy-changes", MetricAlarmArgs.builder()
                .alarmName("IAM Policy Changes")
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .evaluationPeriods(1)
                .metricName("IAMPolicyChanges")
                .namespace("AWS/CloudTrail")
                .period(300)
                .statistic("Sum")
                .threshold(1.0)
                .alarmActions(List.of(securityTopic.arn()))
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-monitoring"))
                .build());
        
        // Root Account Usage Alarm
        new MetricAlarm("root-account-usage", MetricAlarmArgs.builder()
                .alarmName("Root Account Usage")
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .evaluationPeriods(1)
                .metricName("RootAccountUsage")
                .namespace("AWS/CloudTrail")
                .period(300)
                .statistic("Sum")
                .threshold(1.0)
                .alarmActions(List.of(securityTopic.arn()))
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-monitoring"))
                .build());
    }
    
    /**
     * Creates Lambda function for security automation.
     */
    private static Function createSecurityLambda(Output<String> accountId, Topic securityTopic) {
        // Lambda function code for security response
        String lambdaCode = """
            import json
            import boto3
            import os
            
            def lambda_handler(event, context):
                # Parse the CloudWatch alarm event
                alarm_name = event['detail']['alarmName']
                alarm_state = event['detail']['state']['value']
                
                # Send detailed alert to SNS
                sns = boto3.client('sns')
                message = f"Security Alert: {alarm_name} is in {alarm_state} state"
                
                sns.publish(
                    TopicArn=os.environ['SECURITY_TOPIC_ARN'],
                    Subject=f"Security Alert: {alarm_name}",
                    Message=message
                )
                
                # Log the security event
                print(f"Security event processed: {alarm_name} - {alarm_state}")
                
                return {
                    'statusCode': 200,
                    'body': json.dumps('Security alert processed successfully')
                }
            """;
        
        return new Function("security-lambda", FunctionArgs.builder()
                .runtime("python3.9")
                .handler("index.lambda_handler")
                .role(createSecurityRole(accountId).arn())
                .code(new FunctionCodeArgs.Builder()
                        .zipFile(lambdaCode)
                        .build())
                .environment(FunctionEnvironmentArgs.builder()
                        .variables(Map.of(
                                "SECURITY_TOPIC_ARN", securityTopic.arn().applyValue(arn -> arn),
                                "ENVIRONMENT", ENVIRONMENT,
                                "PROJECT", PROJECT))
                        .build())
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-automation"))
                .build());
    }
    
    /**
     * Creates Step Function workflow for security response automation.
     */
    private static StateMachine createSecurityWorkflow(Output<String> accountId, Function securityLambda) {
        String stateMachineDefinition = """
            {
                "Comment": "Security Response Workflow",
                "StartAt": "DetectSecurityEvent",
                "States": {
                    "DetectSecurityEvent": {
                        "Type": "Task",
                        "Resource": "%s",
                        "Next": "LogSecurityEvent",
                        "Catch": [{
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError"
                        }]
                    },
                    "LogSecurityEvent": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::cloudwatch:putMetricData",
                        "Parameters": {
                            "Namespace": "SecurityFramework",
                            "MetricData": [{
                                "MetricName": "SecurityEventProcessed",
                                "Value": 1,
                                "Unit": "Count"
                            }]
                        },
                        "End": true
                    },
                    "HandleError": {
                        "Type": "Fail",
                        "Cause": "Security workflow failed",
                        "Error": "SecurityWorkflowError"
                    }
                }
            }
            """.formatted(securityLambda.arn().applyValue(arn -> arn));
        
        return new StateMachine("security-workflow", StateMachineArgs.builder()
                .definition(stateMachineDefinition)
                .roleArn(createSecurityRole(accountId).arn())
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "security-workflow"))
                .build());
    }
    
    /**
     * Creates CloudTrail for comprehensive logging.
     */
    private static void createCloudTrail(Output<String> accountId, Bucket secureBucket, LogGroup securityLogGroup) {
        new Trail("security-trail", TrailArgs.builder()
                .name("security-audit-trail")
                .s3BucketName(secureBucket.id())
                .cloudWatchLogsGroupArn(securityLogGroup.arn().applyValue(arn -> arn + ":*"))
                .cloudWatchLogsRoleArn(createSecurityRole(accountId).arn())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableLogging(true)
                .eventSelectors(List.of(TrailEventSelectorArgs.builder()
                        .readWriteType("All")
                        .includeManagementEvents(true)
                        .build()))
                .tags(Map.of(
                        "Environment", ENVIRONMENT,
                        "Project", PROJECT,
                        "Purpose", "audit-logging"))
                .build());
    }
}