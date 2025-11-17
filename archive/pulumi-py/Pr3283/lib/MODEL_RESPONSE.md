# Secure Logging System Infrastructure

Here is the complete Pulumi Java infrastructure code for your secure logging system:

## Main Infrastructure Class

```java
// File: /lib/src/main/java/app/Main.java
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
        // Create KMS key for log encryption
        Key logEncryptionKey = new Key("log-encryption-key", KeyArgs.builder()
                .description("KMS key for CloudWatch Logs encryption")
                .enableKeyRotation(true)
                .deletionWindowInDays(10)
                .tags(Map.of(
                        "Name", "CloudWatchLogsKey",
                        "Environment", "Production",
                        "Purpose", "LogEncryption"))
                .build());

        // Create KMS key alias
        Alias keyAlias = new Alias("log-encryption-key-alias", AliasArgs.builder()
                .name("alias/cloudwatch-logs-encryption")
                .targetKeyId(logEncryptionKey.id())
                .build());

        // Create IAM role for CloudWatch Logs
        Role cloudWatchLogsRole = new Role("cloudwatch-logs-role", RoleArgs.builder()
                .name("secure-logging-cloudwatch-role")
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
                .tags(Map.of("Name", "CloudWatchLogsRole"))
                .build());

        // Create IAM policy for KMS key usage
        Policy kmsPolicy = new Policy("kms-usage-policy", PolicyArgs.builder()
                .name("cloudwatch-logs-kms-policy")
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
        RolePolicyAttachment kmsPolicyAttachment = new RolePolicyAttachment("kms-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(cloudWatchLogsRole.name())
                        .policyArn(kmsPolicy.arn())
                        .build());

        // Create S3 bucket for log archival
        Bucket logArchiveBucket = new Bucket("log-archive-bucket", BucketArgs.builder()
                .bucket("secure-logs-archive-" + ctx.config().get("stackName").orElse("default"))
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
                        "Name", "LogArchiveBucket",
                        "Environment", "Production"))
                .build());

        // Create CloudWatch Log Group with encryption and data protection
        LogGroup applicationLogGroup = new LogGroup("application-log-group", LogGroupArgs.builder()
                .name("/aws/application/secure-logs")
                .retentionInDays(90)
                .kmsKeyId(logEncryptionKey.arn())
                .tags(Map.of(
                        "Name", "ApplicationLogs",
                        "Environment", "Production",
                        "DataProtection", "Enabled"))
                .build());

        // Create data protection policy for masking sensitive data
        LogDataProtectionPolicy dataProtectionPolicy = new LogDataProtectionPolicy("log-data-protection",
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
        MetricFilter anomalyMetricFilter = new MetricFilter("anomaly-metric-filter",
                MetricFilterArgs.builder()
                        .name("error-count-filter")
                        .logGroupName(applicationLogGroup.name())
                        .pattern("[ERROR]")
                        .metricTransformation(MetricFilterMetricTransformationArgs.builder()
                                .name("ErrorCount")
                                .namespace("ApplicationLogs")
                                .value("1")
                                .unit("Count")
                                .build())
                        .build());

        // Create CloudWatch metric alarm
        MetricAlarm errorAlarm = new MetricAlarm("error-alarm", MetricAlarmArgs.builder()
                .name("high-error-rate-alarm")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("ErrorCount")
                .namespace("ApplicationLogs")
                .period(300)
                .statistic("Sum")
                .threshold(100.0)
                .alarmDescription("Alert when error count exceeds threshold")
                .treatMissingData("notBreaching")
                .build());

        // Create Lambda function for log export
        Role lambdaRole = new Role("lambda-export-role", RoleArgs.builder()
                .name("log-export-lambda-role")
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
                .build());

        // Attach policies to Lambda role
        RolePolicyAttachment lambdaBasicExecution = new RolePolicyAttachment("lambda-basic-execution",
                RolePolicyAttachmentArgs.builder()
                        .role(lambdaRole.name())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                        .build());

        Policy lambdaExportPolicy = new Policy("lambda-export-policy", PolicyArgs.builder()
                .name("lambda-log-export-policy")
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

        RolePolicyAttachment lambdaExportPolicyAttachment = new RolePolicyAttachment("lambda-export-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(lambdaRole.name())
                        .policyArn(lambdaExportPolicy.arn())
                        .build());

        // Create Lambda function
        Function logExportFunction = new Function("log-export-function", FunctionArgs.builder()
                .name("cloudwatch-log-exporter")
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
                .tags(Map.of("Name", "LogExporter"))
                .build(),
                CustomResourceOptions.builder()
                        .dependsOn(List.of(lambdaBasicExecution, lambdaExportPolicyAttachment))
                        .build());

        // Create EventBridge Scheduler role
        Role schedulerRole = new Role("scheduler-role", RoleArgs.builder()
                .name("log-export-scheduler-role")
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
                .build());

        Policy schedulerPolicy = new Policy("scheduler-policy", PolicyArgs.builder()
                .name("scheduler-invoke-lambda-policy")
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

        RolePolicyAttachment schedulerPolicyAttachment = new RolePolicyAttachment("scheduler-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(schedulerRole.name())
                        .policyArn(schedulerPolicy.arn())
                        .build());

        // Create EventBridge Scheduler for daily log export
        Schedule dailyLogExport = new Schedule("daily-log-export", ScheduleArgs.builder()
                .name("daily-log-archival")
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
        LogGroup eventBridgeLogGroup = new LogGroup("eventbridge-log-group", LogGroupArgs.builder()
                .name("/aws/events/log-archival")
                .retentionInDays(30)
                .kmsKeyId(logEncryptionKey.arn())
                .tags(Map.of(
                        "Name", "EventBridgeSchedulerLogs",
                        "Purpose", "SchedulerDebugging"))
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
```

## Lambda Function for Log Export

```python
# File: /lib/lambda/index.py
import boto3
import os
import json
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

logs_client = boto3.client('logs')
s3_client = boto3.client('s3')

def handler(event, context):
    """
    Lambda function to export CloudWatch Logs to S3
    """
    try:
        log_group_name = os.environ['LOG_GROUP_NAME']
        bucket_name = os.environ['S3_BUCKET_NAME']

        # Calculate time range (export last 24 hours of logs)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=1)

        # Convert to milliseconds since epoch
        start_timestamp = int(start_time.timestamp() * 1000)
        end_timestamp = int(end_time.timestamp() * 1000)

        # Create destination prefix with date
        destination_prefix = f"logs/{end_time.strftime('%Y/%m/%d')}/"

        # Create export task
        response = logs_client.create_export_task(
            logGroupName=log_group_name,
            fromTime=start_timestamp,
            to=end_timestamp,
            destination=bucket_name,
            destinationPrefix=destination_prefix
        )

        task_id = response.get('taskId')
        logger.info(f"Created export task: {task_id}")

        # Monitor export task status
        max_attempts = 30
        attempt = 0

        while attempt < max_attempts:
            task_status = logs_client.describe_export_tasks(taskId=task_id)
            status = task_status['exportTasks'][0]['status']['code']

            if status == 'COMPLETED':
                logger.info(f"Export task {task_id} completed successfully")
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Log export completed successfully',
                        'taskId': task_id,
                        'destination': f"{bucket_name}/{destination_prefix}"
                    })
                }
            elif status in ['CANCELLED', 'FAILED']:
                error_msg = f"Export task {task_id} failed with status: {status}"
                logger.error(error_msg)
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': error_msg,
                        'taskId': task_id
                    })
                }

            attempt += 1
            time.sleep(10)  # Wait 10 seconds before checking again

        # Timeout reached
        logger.warning(f"Export task {task_id} timed out")
        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Export task still running',
                'taskId': task_id
            })
        }

    except Exception as e:
        logger.error(f"Error exporting logs: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
```

## Build Configuration Update

```gradle
// File: /lib/build.gradle
plugins {
    id 'java'
    id 'application'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.pulumi:pulumi:latest.release'
    implementation 'com.pulumi:aws:latest.release'
    implementation 'com.pulumi:aws-native:latest.release'
}

application {
    mainClass = 'app.Main'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}
```