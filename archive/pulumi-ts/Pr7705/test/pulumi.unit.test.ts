/**
 * Unit tests for the S3 Compliance Analysis infrastructure stack.
 *
 * These tests validate the Pulumi infrastructure code for S3 compliance
 * checking, including Lambda, Step Functions, SQS, SNS, CloudWatch, and EventBridge.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the TapStack.ts file for pattern matching
const indexCode = readFileSync(join(__dirname, '../lib/TapStack.ts'), 'utf-8');
const lambdaCode = readFileSync(
  join(__dirname, '../lib/lambda/compliance-checker/index.js'),
  'utf-8'
);

describe('S3 Compliance Analysis Stack - Code Patterns', () => {
  describe('Configuration', () => {
    test('should get environmentSuffix from args with default', () => {
      expect(indexCode).toMatch(/args\.environmentSuffix\s*\|\|\s*['"]dev['"]/);
    });

    test('should have optional region configuration', () => {
      expect(indexCode).toMatch(
        /process\.env\.AWS_REGION\s*\|\|\s*['"]us-east-1['"]/
      );
    });

    test('should define compliance thresholds', () => {
      expect(indexCode).toMatch(/lifecycleAgeThreshold:\s*90/);
      expect(indexCode).toMatch(/alarmThreshold:\s*1/);
    });
  });

  describe('Type Definitions', () => {
    test('should define ComplianceViolation interface', () => {
      expect(indexCode).toMatch(/interface\s+ComplianceViolation/);
      expect(indexCode).toMatch(/bucketName:\s*string/);
      expect(indexCode).toMatch(/bucketArn:\s*string/);
      expect(indexCode).toMatch(/violations:\s*string\[\]/);
    });

    test('should define ComplianceReport interface', () => {
      expect(indexCode).toMatch(/interface\s+ComplianceReport/);
      expect(indexCode).toMatch(/totalBuckets:\s*number/);
      expect(indexCode).toMatch(/compliantBuckets:\s*number/);
      expect(indexCode).toMatch(/nonCompliantBuckets:\s*number/);
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.sns\.Topic\s*\(\s*`compliance-topic-\$\{environmentSuffix\}`/
      );
    });

    test('should set SNS topic name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-compliance-notifications-\$\{environmentSuffix\}`/
      );
    });

    test('should include tags on SNS topic', () => {
      expect(indexCode).toMatch(/displayName:\s*['"]S3 Compliance Notifications['"]/);
    });
  });

  describe('SQS Queue', () => {
    test('should create SQS queue with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.sqs\.Queue\s*\(\s*`compliance-queue-\$\{environmentSuffix\}`/
      );
    });

    test('should set SQS queue name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-compliance-results-\$\{environmentSuffix\}`/
      );
    });

    test('should configure visibility timeout', () => {
      expect(indexCode).toMatch(/visibilityTimeoutSeconds:\s*300/);
    });

    test('should configure message retention', () => {
      expect(indexCode).toMatch(/messageRetentionSeconds:\s*86400/);
    });
  });

  describe('SNS to SQS Subscription', () => {
    test('should create topic subscription', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.sns\.TopicSubscription\s*\(\s*`queue-subscription-\$\{environmentSuffix\}`/
      );
    });

    test('should use sqs protocol', () => {
      expect(indexCode).toMatch(/protocol:\s*['"]sqs['"]/);
    });
  });

  describe('SQS Queue Policy', () => {
    test('should create queue policy', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.sqs\.QueuePolicy\s*\(\s*`queue-policy-\$\{environmentSuffix\}`/
      );
    });

    test('should allow SNS to send messages', () => {
      expect(indexCode).toMatch(/Action.*sqs:SendMessage/);
    });
  });

  describe('Lambda IAM Role', () => {
    test('should create Lambda execution role', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.Role\s*\(\s*`compliance-lambda-role-\$\{environmentSuffix\}`/
      );
    });

    test('should set role name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-compliance-lambda-role-\$\{environmentSuffix\}`/
      );
    });

    test('should allow Lambda to assume role', () => {
      expect(indexCode).toMatch(/Service.*lambda\.amazonaws\.com/);
      expect(indexCode).toMatch(/Action.*sts:AssumeRole/);
    });
  });

  describe('Lambda Basic Policy Attachment', () => {
    test('should attach basic execution policy', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.RolePolicyAttachment\s*\(\s*`lambda-basic-\$\{environmentSuffix\}`/
      );
    });

    test('should use AWSLambdaBasicExecutionRole', () => {
      expect(indexCode).toMatch(/AWSLambdaBasicExecutionRole/);
    });
  });

  describe('Lambda Custom Policy', () => {
    test('should create custom IAM policy', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.RolePolicy\s*\(\s*`lambda-custom-policy-\$\{environmentSuffix\}`/
      );
    });

    test('should include S3 read permissions', () => {
      expect(indexCode).toMatch(/s3:ListAllMyBuckets/);
      expect(indexCode).toMatch(/s3:GetBucketVersioning/);
      expect(indexCode).toMatch(/s3:GetBucketEncryption/);
      expect(indexCode).toMatch(/s3:GetBucketLifecycleConfiguration/);
      expect(indexCode).toMatch(/s3:GetBucketPolicy/);
    });

    test('should include S3 write permissions for tagging', () => {
      expect(indexCode).toMatch(/s3:PutBucketTagging/);
    });

    test('should include SNS publish permission', () => {
      expect(indexCode).toMatch(/sns:Publish/);
    });

    test('should include SQS permissions', () => {
      expect(indexCode).toMatch(/sqs:SendMessage/);
    });

    test('should include CloudWatch permissions', () => {
      expect(indexCode).toMatch(/cloudwatch:PutMetricData/);
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.lambda\.Function\s*\(\s*`compliance-checker-\$\{environmentSuffix\}`/
      );
    });

    test('should set function name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-compliance-checker-\$\{environmentSuffix\}`/
      );
    });

    test('should use Node.js 18.x runtime', () => {
      expect(indexCode).toMatch(/runtime:\s*aws\.lambda\.Runtime\.NodeJS18/);
    });

    test('should set handler correctly', () => {
      expect(indexCode).toMatch(/handler:\s*['"]index\.handler['"]/);
    });

    test('should configure timeout', () => {
      expect(indexCode).toMatch(/timeout:\s*300/);
    });

    test('should configure memory size', () => {
      expect(indexCode).toMatch(/memorySize:\s*512/);
    });

    test('should set environment variables', () => {
      expect(indexCode).toMatch(/ENVIRONMENT_SUFFIX/);
      expect(indexCode).toMatch(/SNS_TOPIC_ARN/);
      expect(indexCode).toMatch(/SQS_QUEUE_URL/);
      expect(indexCode).toMatch(/LIFECYCLE_AGE_THRESHOLD/);
      // Note: AWS_REGION is a reserved Lambda env var, so we don't set it explicitly
      // Lambda automatically provides AWS_REGION from the runtime environment
    });

    test('should use FileArchive for code', () => {
      expect(indexCode).toMatch(/new\s+pulumi\.asset\.FileArchive/);
    });

    test('should have dependsOn for IAM resources', () => {
      expect(indexCode).toMatch(
        /dependsOn:\s*\[lambdaRole,\s*lambdaBasicPolicy,\s*lambdaCustomPolicy\]/
      );
    });
  });

  describe('Step Functions IAM Role', () => {
    test('should create Step Functions role', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.Role\s*\(\s*`sfn-role-\$\{environmentSuffix\}`/
      );
    });

    test('should allow states service to assume role', () => {
      expect(indexCode).toMatch(/Service.*states\.amazonaws\.com/);
    });
  });

  describe('Step Functions Policy', () => {
    test('should create Step Functions policy', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.RolePolicy\s*\(\s*`sfn-policy-\$\{environmentSuffix\}`/
      );
    });

    test('should allow Lambda invocation', () => {
      expect(indexCode).toMatch(/lambda:InvokeFunction/);
    });

    test('should allow CloudWatch Logs', () => {
      expect(indexCode).toMatch(/logs:CreateLogGroup/);
      expect(indexCode).toMatch(/logs:CreateLogStream/);
      expect(indexCode).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('Step Functions State Machine', () => {
    test('should create state machine with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.sfn\.StateMachine\s*\(\s*`compliance-sfn-\$\{environmentSuffix\}`/
      );
    });

    test('should set state machine name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-compliance-workflow-\$\{environmentSuffix\}`/
      );
    });

    test('should define CheckCompliance state', () => {
      expect(indexCode).toMatch(/StartAt.*CheckCompliance/);
      expect(indexCode).toMatch(/CheckCompliance/);
    });

    test('should include retry logic', () => {
      expect(indexCode).toMatch(/Retry/);
      expect(indexCode).toMatch(/States\.TaskFailed/);
      expect(indexCode).toMatch(/MaxAttempts.*3/);
      expect(indexCode).toMatch(/BackoffRate.*2\.0/);
    });

    test('should include error handling', () => {
      expect(indexCode).toMatch(/Catch/);
      expect(indexCode).toMatch(/States\.ALL/);
      expect(indexCode).toMatch(/CheckFailed/);
    });
  });

  describe('CloudWatch Alarm', () => {
    test('should create CloudWatch alarm with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.cloudwatch\.MetricAlarm\s*\(\s*`compliance-alarm-\$\{environmentSuffix\}`/
      );
    });

    test('should set alarm name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-non-compliant-buckets-\$\{environmentSuffix\}`/
      );
    });

    test('should use S3Compliance namespace', () => {
      expect(indexCode).toMatch(/namespace:\s*['"]S3Compliance['"]/);
    });

    test('should monitor NonCompliantBuckets metric', () => {
      expect(indexCode).toMatch(/metricName:\s*['"]NonCompliantBuckets['"]/);
    });

    test('should use GreaterThanThreshold comparison', () => {
      expect(indexCode).toMatch(/comparisonOperator:\s*['"]GreaterThanThreshold['"]/);
    });

    test('should configure alarm actions', () => {
      expect(indexCode).toMatch(/alarmActions:\s*\[complianceTopic\.arn\]/);
    });
  });

  describe('EventBridge Schedule Role', () => {
    test('should create schedule role', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.Role\s*\(\s*`schedule-role-\$\{environmentSuffix\}`/
      );
    });

    test('should allow events service to assume role', () => {
      expect(indexCode).toMatch(/Service.*events\.amazonaws\.com/);
    });
  });

  describe('EventBridge Schedule Policy', () => {
    test('should create schedule policy', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.iam\.RolePolicy\s*\(\s*`schedule-policy-\$\{environmentSuffix\}`/
      );
    });

    test('should allow states:StartExecution', () => {
      expect(indexCode).toMatch(/states:StartExecution/);
    });
  });

  describe('EventBridge Rule', () => {
    test('should create EventBridge rule with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.cloudwatch\.EventRule\s*\(\s*`compliance-schedule-\$\{environmentSuffix\}`/
      );
    });

    test('should set rule name with environmentSuffix', () => {
      expect(indexCode).toMatch(
        /name:\s*`s3-compliance-daily-check-\$\{environmentSuffix\}`/
      );
    });

    test('should use daily schedule expression', () => {
      expect(indexCode).toMatch(/scheduleExpression:\s*['"]rate\(1 day\)['"]/);
    });
  });

  describe('EventBridge Target', () => {
    test('should create EventBridge target', () => {
      expect(indexCode).toMatch(
        /new\s+aws\.cloudwatch\.EventTarget\s*\(\s*`schedule-target-\$\{environmentSuffix\}`/
      );
    });

    test('should target state machine', () => {
      expect(indexCode).toMatch(/arn:\s*stateMachine\.arn/);
    });
  });

  describe('Outputs', () => {
    test('should define snsTopicArn as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+snsTopicArn:/);
    });

    test('should define sqsQueueUrl as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+sqsQueueUrl:/);
    });

    test('should define lambdaFunctionArn as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+lambdaFunctionArn:/);
    });

    test('should define stateMachineArn as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+stateMachineArn:/);
    });

    test('should define complianceAlarmArn as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+complianceAlarmArn:/);
    });

    test('should define regionDeployed as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+regionDeployed:/);
    });

    test('should define environmentSuffixOutput as public readonly', () => {
      expect(indexCode).toMatch(/public\s+readonly\s+environmentSuffixOutput:/);
    });

    test('should register outputs', () => {
      expect(indexCode).toMatch(/this\.registerOutputs\s*\(\s*\{/);
    });
  });

  describe('Tags', () => {
    test('should include Environment tag', () => {
      expect(indexCode).toMatch(/Environment:\s*environmentSuffix/);
    });

    test('should include Purpose tag', () => {
      expect(indexCode).toMatch(/Purpose:/);
    });

    test('should include ManagedBy tag', () => {
      expect(indexCode).toMatch(/ManagedBy:\s*['"]Pulumi['"]/);
    });
  });
});

describe('Lambda Function Code - Compliance Checker', () => {
  describe('AWS SDK Imports', () => {
    test('should import S3 client and commands', () => {
      expect(lambdaCode).toMatch(/require\(['"]@aws-sdk\/client-s3['"]\)/);
      expect(lambdaCode).toMatch(/S3Client/);
      expect(lambdaCode).toMatch(/ListBucketsCommand/);
      expect(lambdaCode).toMatch(/GetBucketVersioningCommand/);
      expect(lambdaCode).toMatch(/GetBucketEncryptionCommand/);
      expect(lambdaCode).toMatch(/GetBucketLifecycleConfigurationCommand/);
    });

    test('should import SNS client', () => {
      expect(lambdaCode).toMatch(/require\(['"]@aws-sdk\/client-sns['"]\)/);
      expect(lambdaCode).toMatch(/SNSClient/);
      expect(lambdaCode).toMatch(/PublishCommand/);
    });

    test('should import SQS client', () => {
      expect(lambdaCode).toMatch(/require\(['"]@aws-sdk\/client-sqs['"]\)/);
      expect(lambdaCode).toMatch(/SQSClient/);
      expect(lambdaCode).toMatch(/SendMessageCommand/);
    });

    test('should import CloudWatch client', () => {
      expect(lambdaCode).toMatch(/require\(['"]@aws-sdk\/client-cloudwatch['"]\)/);
      expect(lambdaCode).toMatch(/CloudWatchClient/);
      expect(lambdaCode).toMatch(/PutMetricDataCommand/);
    });
  });

  describe('Retry Logic', () => {
    test('should implement withRetry function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+withRetry/);
    });

    test('should have MAX_RETRIES constant', () => {
      expect(lambdaCode).toMatch(/MAX_RETRIES\s*=\s*3/);
    });

    test('should implement exponential backoff', () => {
      expect(lambdaCode).toMatch(/Math\.pow\(2,\s*attempt\)/);
    });

    test('should check for retryable errors', () => {
      expect(lambdaCode).toMatch(/isRetryableError/);
      expect(lambdaCode).toMatch(/ThrottlingException/);
    });
  });

  describe('Compliance Check Functions', () => {
    test('should implement getBucketLocation', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+getBucketLocation/);
      expect(lambdaCode).toMatch(/GetBucketLocationCommand/);
    });

    test('should implement checkVersioning', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+checkVersioning/);
      expect(lambdaCode).toMatch(/GetBucketVersioningCommand/);
    });

    test('should implement checkEncryption', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+checkEncryption/);
      expect(lambdaCode).toMatch(/GetBucketEncryptionCommand/);
      expect(lambdaCode).toMatch(/AES256/);
      expect(lambdaCode).toMatch(/aws:kms/);
    });

    test('should implement checkLifecycle', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+checkLifecycle/);
      expect(lambdaCode).toMatch(/GetBucketLifecycleConfigurationCommand/);
      expect(lambdaCode).toMatch(/LIFECYCLE_THRESHOLD/);
    });

    test('should implement checkPublicAccess', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+checkPublicAccess/);
      expect(lambdaCode).toMatch(/GetBucketPolicyCommand/);
    });

    test('should implement checkCloudWatchMetrics', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+checkCloudWatchMetrics/);
      expect(lambdaCode).toMatch(/GetBucketMetricsConfigurationCommand/);
    });
  });

  describe('Bucket Tagging', () => {
    test('should implement idempotent tagging', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+tagBucketIdempotent/);
    });

    test('should check existing tags before updating', () => {
      expect(lambdaCode).toMatch(/GetBucketTaggingCommand/);
    });

    test('should set compliance-status tag', () => {
      expect(lambdaCode).toMatch(/compliance-status/);
      expect(lambdaCode).toMatch(/passed/);
      expect(lambdaCode).toMatch(/failed/);
    });
  });

  describe('Pagination Support', () => {
    test('should implement listAllBuckets with pagination', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+listAllBuckets/);
      expect(lambdaCode).toMatch(/ContinuationToken/);
      expect(lambdaCode).toMatch(/NextContinuationToken/);
    });
  });

  describe('Metrics Publishing', () => {
    test('should implement publishMetrics', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+publishMetrics/);
    });

    test('should publish to S3Compliance namespace', () => {
      expect(lambdaCode).toMatch(/Namespace:\s*['"]S3Compliance['"]/);
    });

    test('should publish TotalBuckets metric', () => {
      expect(lambdaCode).toMatch(/MetricName:\s*['"]TotalBuckets['"]/);
    });

    test('should publish CompliantBuckets metric', () => {
      expect(lambdaCode).toMatch(/MetricName:\s*['"]CompliantBuckets['"]/);
    });

    test('should publish NonCompliantBuckets metric', () => {
      expect(lambdaCode).toMatch(/MetricName:\s*['"]NonCompliantBuckets['"]/);
    });
  });

  describe('Main Handler', () => {
    test('should export handler function', () => {
      expect(lambdaCode).toMatch(/exports\.handler\s*=\s*async/);
    });

    test('should filter buckets by region', () => {
      expect(lambdaCode).toMatch(/TARGET_REGION/);
    });

    test('should run compliance checks in parallel', () => {
      expect(lambdaCode).toMatch(/Promise\.all/);
    });

    test('should send SNS notification for high-severity violations', () => {
      expect(lambdaCode).toMatch(/bucketViolations\.length\s*>=\s*3/);
      expect(lambdaCode).toMatch(/PublishCommand/);
    });

    test('should send report to SQS', () => {
      expect(lambdaCode).toMatch(/SendMessageCommand/);
      expect(lambdaCode).toMatch(/SQS_QUEUE_URL/);
    });

    test('should write JSON report to file', () => {
      expect(lambdaCode).toMatch(/writeFile/);
      expect(lambdaCode).toMatch(/compliance-report\.json/);
    });

    test('should return proper response', () => {
      expect(lambdaCode).toMatch(/statusCode:\s*200/);
    });
  });

  describe('Error Handling', () => {
    test('should handle NoSuchLifecycleConfiguration', () => {
      expect(lambdaCode).toMatch(/NoSuchLifecycleConfiguration/);
    });

    test('should handle NoSuchBucketPolicy', () => {
      expect(lambdaCode).toMatch(/NoSuchBucketPolicy/);
    });

    test('should handle NoSuchConfiguration for metrics', () => {
      expect(lambdaCode).toMatch(/NoSuchConfiguration/);
    });

    test('should have try-catch in handler', () => {
      expect(lambdaCode).toMatch(/try\s*\{[\s\S]*catch\s*\(\s*error\s*\)/);
    });
  });
});

describe('Resource Naming Conventions', () => {
  test('all resources should use environmentSuffix', () => {
    const resourcePatterns = [
      /compliance-topic-\$\{environmentSuffix\}/,
      /compliance-queue-\$\{environmentSuffix\}/,
      /compliance-lambda-role-\$\{environmentSuffix\}/,
      /compliance-checker-\$\{environmentSuffix\}/,
      /sfn-role-\$\{environmentSuffix\}/,
      /compliance-sfn-\$\{environmentSuffix\}/,
      /compliance-alarm-\$\{environmentSuffix\}/,
      /schedule-role-\$\{environmentSuffix\}/,
      /compliance-schedule-\$\{environmentSuffix\}/,
    ];

    resourcePatterns.forEach(pattern => {
      expect(indexCode).toMatch(pattern);
    });
  });
});

describe('Security Best Practices', () => {
  test('should use least privilege IAM permissions', () => {
    // S3 permissions should be read-only plus tagging
    expect(indexCode).not.toMatch(/s3:\*/);
    expect(indexCode).toMatch(/s3:GetBucket/);
    expect(indexCode).toMatch(/s3:PutBucketTagging/);
  });

  test('should limit SNS permissions to specific topic', () => {
    expect(indexCode).toMatch(/Resource:\s*topicArn/);
  });

  test('should limit SQS permissions to specific queue', () => {
    expect(indexCode).toMatch(/Resource:\s*queueArn/);
  });
});

describe('Idempotency', () => {
  test('Lambda tagging should be idempotent', () => {
    expect(lambdaCode).toMatch(/existingStatus\?\.Value\s*!==\s*newStatus/);
  });

  test('resources should not have retain policies', () => {
    expect(indexCode).not.toMatch(/RemovalPolicy\.RETAIN/);
    expect(indexCode).not.toMatch(/DeletionPolicy.*Retain/);
  });
});
