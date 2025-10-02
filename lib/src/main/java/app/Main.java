package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.kms.*;
import com.pulumi.aws.iam.*;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.cloudwatch.*;
import com.pulumi.aws.cloudwatch.inputs.*;
import com.pulumi.aws.scheduler.*;
import com.pulumi.aws.scheduler.inputs.*;
import com.pulumi.aws.lambda.*;
import com.pulumi.aws.lambda.inputs.*;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;
import com.pulumi.deployment.FileArchive;

import java.util.Map;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;

public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(Context ctx) {
        // Get environment suffix from config or environment
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "synth30598714";  // Default for this task
        }
        final String suffix = environmentSuffix; // Make it effectively final for lambdas

        // Create KMS key for log encryption
        Key logEncryptionKey = new Key("log-encryption-key-" + suffix, KeyArgs.builder()
                .description("KMS key for CloudWatch Logs encryption")
                .enableKeyRotation(true)
                .deletionWindowInDays(10)
                .tags(Map.of(
                        "Name", "CloudWatchLogsKey-" + suffix,
                        "Environment", "Production",
                        "Purpose", "LogEncryption",
                        "EnvironmentSuffix", suffix))
                .build());

        // Create KMS key alias
        Alias keyAlias = new Alias("log-encryption-key-alias-" + suffix, AliasArgs.builder()
                .name("alias/cloudwatch-logs-encryption-" + suffix)
                .targetKeyId(logEncryptionKey.id())
                .build());

        // Create IAM role for CloudWatch Logs
        Role cloudWatchLogsRole = new Role("cloudwatch-logs-role-" + suffix, RoleArgs.builder()
                .name("secure-logging-cloudwatch-role-" + suffix)
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "logs.amazonaws.com"
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """)
                .tags(Map.of("Name", "CloudWatchLogsRole-" + suffix))
                .build());

        // Create IAM policy for KMS key usage
        Policy kmsPolicy = new Policy("kms-usage-policy-" + suffix, PolicyArgs.builder()
                .name("cloudwatch-logs-kms-policy-" + suffix)
                .policy(logEncryptionKey.arn().apply(keyArn -> String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Encrypt",
                                    "kms:Decrypt",
                                    "kms:ReEncrypt*",
                                    "kms:GenerateDataKey*",
                                    "kms:CreateGrant",
                                    "kms:DescribeKey"
                                ],
                                "Resource": "%s"
                            }
                        ]
                    }
                    """, keyArn)))
                .build());

        // Attach KMS policy to role
        RolePolicyAttachment kmsPolicyAttachment = new RolePolicyAttachment("kms-policy-attachment-" + suffix,
                RolePolicyAttachmentArgs.builder()
                        .role(cloudWatchLogsRole.name())
                        .policyArn(kmsPolicy.arn())
                        .build());

        // Create S3 bucket for log archival
        Bucket logArchiveBucket = new Bucket("log-archive-bucket-" + suffix, BucketArgs.builder()
                .bucket("secure-logs-archive-" + suffix)
                .forceDestroy(true)  // Ensure bucket can be destroyed
                .versioning(BucketVersioningArgs.builder()
                        .enabled(true)
                        .build())
                .serverSideEncryptionConfiguration(BucketServerSideEncryptionConfigurationArgs.builder()
                        .rule(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                                .applyServerSideEncryptionByDefault(
                                        BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                                .sseAlgorithm("aws:kms")
                                                .kmsMasterKeyId(logEncryptionKey.arn())
                                                .build())
                                .build())
                        .build())
                .lifecycleRules(BucketLifecycleRuleArgs.builder()
                        .enabled(true)
                        .id("archive-old-logs")
                        .transitions(
                                BucketLifecycleRuleTransitionArgs.builder()
                                        .days(90)
                                        .storageClass("GLACIER")
                                        .build())
                        .expiration(BucketLifecycleRuleExpirationArgs.builder()
                                .days(365)
                                .build())
                        .build())
                .tags(Map.of(
                        "Name", "LogArchiveBucket-" + suffix,
                        "Environment", "Production",
                        "EnvironmentSuffix", suffix))
                .build());

        // Create CloudWatch Log Group with encryption and data protection
        LogGroup applicationLogGroup = new LogGroup("application-log-group-" + suffix, LogGroupArgs.builder()
                .name("/aws/application/secure-logs-" + suffix)
                .retentionInDays(90)
                .kmsKeyId(logEncryptionKey.arn())
                .tags(Map.of(
                        "Name", "ApplicationLogs-" + suffix,
                        "Environment", "Production",
                        "DataProtection", "Enabled",
                        "EnvironmentSuffix", suffix))
                .build());

        // Create data protection policy for masking sensitive data
        LogDataProtectionPolicy dataProtectionPolicy = new LogDataProtectionPolicy("log-data-protection-" + suffix,
                LogDataProtectionPolicyArgs.builder()
                        .logGroupName(applicationLogGroup.name())
                        .policyDocument("""
                            {
                                "Name": "DataProtectionPolicy",
                                "Version": "2021-06-01",
                                "Statement": [
                                    {
                                        "Sid": "MaskSensitiveData",
                                        "DataIdentifier": [
                                            "arn:aws:dataprotection::aws:data-identifier/EmailAddress",
                                            "arn:aws:dataprotection::aws:data-identifier/CreditCardNumber",
                                            "arn:aws:dataprotection::aws:data-identifier/AwsSecretKey"
                                        ],
                                        "Operation": {
                                            "Mask": {}
                                        }
                                    }
                                ]
                            }
                            """)
                        .build());

        // Create metric filter for monitoring
        MetricFilter anomalyMetricFilter = new MetricFilter("anomaly-metric-filter-" + suffix,
                MetricFilterArgs.builder()
                        .name("error-count-filter-" + suffix)
                        .logGroupName(applicationLogGroup.name())
                        .pattern("[ERROR]")
                        .metricTransformation(MetricFilterMetricTransformationArgs.builder()
                                .name("ErrorCount-" + suffix)
                                .namespace("ApplicationLogs")
                                .value("1")
                                .unit("Count")
                                .build())
                        .build());

        // Create CloudWatch metric alarm
        MetricAlarm errorAlarm = new MetricAlarm("error-alarm-" + suffix, MetricAlarmArgs.builder()
                .name("high-error-rate-alarm-" + suffix)
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("ErrorCount-" + suffix)
                .namespace("ApplicationLogs")
                .period(300)
                .statistic("Sum")
                .threshold(100.0)
                .alarmDescription("Alert when error count exceeds threshold")
                .treatMissingData("notBreaching")
                .build());

        // Create Lambda function for log export
        Role lambdaRole = new Role("lambda-export-role-" + suffix, RoleArgs.builder()
                .name("log-export-lambda-role-" + suffix)
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
                .tags(Map.of("EnvironmentSuffix", suffix))
                .build());

        // Attach policies to Lambda role
        RolePolicyAttachment lambdaBasicExecution = new RolePolicyAttachment("lambda-basic-execution-" + suffix,
                RolePolicyAttachmentArgs.builder()
                        .role(lambdaRole.name())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                        .build());

        Policy lambdaExportPolicy = new Policy("lambda-export-policy-" + suffix, PolicyArgs.builder()
                .name("lambda-log-export-policy-" + suffix)
                .policy(Output.tuple(applicationLogGroup.arn(), logArchiveBucket.arn()).apply(tuple -> {
                    String logGroupArn = tuple.t1;
                    String bucketArn = tuple.t2;
                    return String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateExportTask",
                                        "logs:DescribeExportTasks",
                                        "logs:DescribeLogGroups"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:PutObject",
                                        "s3:GetObject",
                                        "s3:ListBucket"
                                    ],
                                    "Resource": [
                                        "%s",
                                        "%s/*"
                                    ]
                                }
                            ]
                        }
                        """, logGroupArn, bucketArn, bucketArn);
                }))
                .build());

        RolePolicyAttachment lambdaExportPolicyAttachment = new RolePolicyAttachment("lambda-export-policy-attachment-" + suffix,
                RolePolicyAttachmentArgs.builder()
                        .role(lambdaRole.name())
                        .policyArn(lambdaExportPolicy.arn())
                        .build());

        // Create Lambda function
        Function logExportFunction = new Function("log-export-function-" + suffix, FunctionArgs.builder()
                .name("cloudwatch-log-exporter-" + suffix)
                .runtime("python3.9")
                .handler("index.handler")
                .role(lambdaRole.arn())
                .code(new FileArchive("./lib/lambda"))
                .environment(FunctionEnvironmentArgs.builder()
                        .variables(Map.of(
                                "LOG_GROUP_NAME", applicationLogGroup.name(),
                                "S3_BUCKET_NAME", logArchiveBucket.bucket()))
                        .build())
                .timeout(300)
                .memorySize(256)
                .tags(Map.of("Name", "LogExporter-" + suffix, "EnvironmentSuffix", suffix))
                .build(),
                CustomResourceOptions.builder()
                        .dependsOn(List.of(lambdaBasicExecution, lambdaExportPolicyAttachment))
                        .build());

        // Create EventBridge Scheduler role
        Role schedulerRole = new Role("scheduler-role-" + suffix, RoleArgs.builder()
                .name("log-export-scheduler-role-" + suffix)
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "scheduler.amazonaws.com"
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """)
                .tags(Map.of("EnvironmentSuffix", suffix))
                .build());

        Policy schedulerPolicy = new Policy("scheduler-policy-" + suffix, PolicyArgs.builder()
                .name("scheduler-invoke-lambda-policy-" + suffix)
                .policy(logExportFunction.arn().apply(lambdaArn -> String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": "lambda:InvokeFunction",
                                "Resource": "%s"
                            }
                        ]
                    }
                    """, lambdaArn)))
                .build());

        RolePolicyAttachment schedulerPolicyAttachment = new RolePolicyAttachment("scheduler-policy-attachment-" + suffix,
                RolePolicyAttachmentArgs.builder()
                        .role(schedulerRole.name())
                        .policyArn(schedulerPolicy.arn())
                        .build());

        // Create EventBridge Scheduler for daily log export
        Schedule dailyLogExport = new Schedule("daily-log-export-" + suffix, ScheduleArgs.builder()
                .name("daily-log-archival-" + suffix)
                .scheduleExpression("rate(1 day)")
                .flexibleTimeWindow(ScheduleFlexibleTimeWindowArgs.builder()
                        .mode("OFF")
                        .build())
                .target(ScheduleTargetArgs.builder()
                        .arn(logExportFunction.arn())
                        .roleArn(schedulerRole.arn())
                        .retryPolicy(ScheduleTargetRetryPolicyArgs.builder()
                                .maximumRetryAttempts(3)
                                .maximumEventAge(3600)
                                .build())
                        .build())
                .description("Daily trigger for CloudWatch log archival to S3")
                .build(),
                CustomResourceOptions.builder()
                        .dependsOn(List.of(schedulerPolicyAttachment))
                        .build());

        // Create EventBridge log group for enhanced logging
        LogGroup eventBridgeLogGroup = new LogGroup("eventbridge-log-group-" + suffix, LogGroupArgs.builder()
                .name("/aws/events/log-archival-" + suffix)
                .retentionInDays(30)
                .kmsKeyId(logEncryptionKey.arn())
                .tags(Map.of(
                        "Name", "EventBridgeSchedulerLogs-" + suffix,
                        "Purpose", "SchedulerDebugging",
                        "EnvironmentSuffix", suffix))
                .build());

        // Export outputs
        ctx.export("logGroupName", applicationLogGroup.name());
        ctx.export("logGroupArn", applicationLogGroup.arn());
        ctx.export("archiveBucketName", logArchiveBucket.bucket());
        ctx.export("archiveBucketArn", logArchiveBucket.arn());
        ctx.export("kmsKeyId", logEncryptionKey.id());
        ctx.export("kmsKeyArn", logEncryptionKey.arn());
        ctx.export("lambdaFunctionName", logExportFunction.name());
        ctx.export("lambdaFunctionArn", logExportFunction.arn());
        ctx.export("schedulerName", dailyLogExport.name());
        ctx.export("schedulerArn", dailyLogExport.arn());
        ctx.export("eventBridgeLogGroup", eventBridgeLogGroup.name());
    }
}