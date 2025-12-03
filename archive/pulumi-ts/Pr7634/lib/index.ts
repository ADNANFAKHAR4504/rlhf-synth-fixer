import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

// Configuration
const awsConfig = new pulumi.Config('aws');
const region = awsConfig.require('region');
const accountId = aws.getCallerIdentity().then(id => id.accountId);

// Common tags
const commonTags = {
  Environment: 'production',
  Project: 'compliance-monitoring',
  ManagedBy: 'pulumi',
  Purpose: 'automated-compliance',
};

// ===== KMS Key for CloudWatch Logs and S3 Encryption =====
const kmsKey = new aws.kms.Key('compliance-kms-key', {
  description: 'KMS key for CloudWatch Logs and S3 encryption',
  enableKeyRotation: true,
  policy: pulumi.all([accountId]).apply(([accountId]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${accountId}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudWatch Logs to use the key',
          Effect: 'Allow',
          Principal: {
            Service: `logs.${region}.amazonaws.com`,
          },
          Action: [
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:CreateGrant',
            'kms:DescribeKey',
          ],
          Resource: '*',
          Condition: {
            ArnLike: {
              'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${accountId}:log-group:*`,
            },
          },
        },
        {
          Sid: 'Allow S3 to use the key',
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
          Resource: '*',
        },
      ],
    })
  ),
  tags: commonTags,
});

// KMS Key Alias for easier reference
new aws.kms.Alias('compliance-kms-key-alias', {
  name: 'alias/compliance-monitoring',
  targetKeyId: kmsKey.id,
});

// ===== S3 Bucket for Compliance Reports =====
const complianceBucket = new aws.s3.Bucket('compliance-reports-bucket', {
  bucket: pulumi.interpolate`compliance-reports-${accountId}`,
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'aws:kms',
        kmsMasterKeyId: kmsKey.id,
      },
    },
  },
  lifecycleRules: [
    {
      enabled: true,
      expiration: {
        days: 30,
      },
      id: 'delete-old-reports',
    },
  ],
  tags: commonTags,
});

// Block public access
new aws.s3.BucketPublicAccessBlock('compliance-bucket-public-access-block', {
  bucket: complianceBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// ===== IAM Role for Lambda Functions =====
const lambdaRole = new aws.iam.Role('compliance-lambda-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
  tags: commonTags,
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment('lambda-basic-execution', {
  role: lambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

// Custom policy for Lambda functions
new aws.iam.RolePolicy('compliance-lambda-policy', {
  role: lambdaRole.id,
  policy: pulumi
    .all([complianceBucket.arn, kmsKey.arn, accountId])
    .apply(([bucketArn, kmsArn, acctId]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'config:DescribeComplianceByConfigRule',
              'config:DescribeComplianceByResource',
              'config:GetComplianceDetailsByConfigRule',
              'config:GetComplianceDetailsByResource',
              'config:PutEvaluations',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: kmsArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${region}:${acctId}:log-group:/aws/lambda/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:StopInstances',
              's3:PutBucketEncryption',
              'rds:ModifyDBInstance',
            ],
            Resource: '*',
          },
        ],
      })
    ),
});

// ===== CloudWatch Log Groups for Lambda Functions =====
const processingLogGroup = new aws.cloudwatch.LogGroup(
  'processing-lambda-log-group',
  {
    name: '/aws/lambda/compliance-processing',
    retentionInDays: 7,
    kmsKeyId: kmsKey.arn,
    tags: commonTags,
  }
);

const aggregationLogGroup = new aws.cloudwatch.LogGroup(
  'aggregation-lambda-log-group',
  {
    name: '/aws/lambda/compliance-aggregation',
    retentionInDays: 7,
    kmsKeyId: kmsKey.arn,
    tags: commonTags,
  }
);

const remediationLogGroup = new aws.cloudwatch.LogGroup(
  'remediation-lambda-log-group',
  {
    name: '/aws/lambda/compliance-remediation',
    retentionInDays: 7,
    kmsKeyId: kmsKey.arn,
    tags: commonTags,
  }
);

// ===== Lambda Functions =====

// Processing Lambda
const processingLambda = new aws.lambda.Function(
  'compliance-processing-lambda',
  {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'processing')
      ),
    }),
    environment: {
      variables: {
        BUCKET_NAME: complianceBucket.bucket,
        REGION: region,
      },
    },
    timeout: 300,
    tags: commonTags,
  },
  { dependsOn: [processingLogGroup] }
);

// Aggregation Lambda
const aggregationLambda = new aws.lambda.Function(
  'compliance-aggregation-lambda',
  {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'aggregation')
      ),
    }),
    environment: {
      variables: {
        BUCKET_NAME: complianceBucket.bucket,
        REGION: region,
      },
    },
    timeout: 300,
    tags: commonTags,
  },
  { dependsOn: [aggregationLogGroup] }
);

// Remediation Lambda
const remediationLambda = new aws.lambda.Function(
  'compliance-remediation-lambda',
  {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'remediation')
      ),
    }),
    environment: {
      variables: {
        BUCKET_NAME: complianceBucket.bucket,
        REGION: region,
      },
    },
    timeout: 300,
    tags: commonTags,
  },
  { dependsOn: [remediationLogGroup] }
);

// ===== SNS Topic for Notifications =====
const complianceTopic = new aws.sns.Topic('compliance-notifications-topic', {
  displayName: 'Compliance Notifications',
  deliveryPolicy: JSON.stringify({
    http: {
      defaultHealthyRetryPolicy: {
        minDelayTarget: 20,
        maxDelayTarget: 20,
        numRetries: 3,
        numMaxDelayRetries: 0,
        numNoDelayRetries: 0,
        numMinDelayRetries: 0,
        backoffFunction: 'linear',
      },
      disableSubscriptionOverrides: false,
    },
  }),
  tags: commonTags,
});

// SNS Topic Policy to allow EventBridge to publish
const snsTopicPolicy = new aws.sns.TopicPolicy('compliance-topic-policy', {
  arn: complianceTopic.arn,
  policy: pulumi
    .all([complianceTopic.arn, accountId])
    .apply(([topicArn, _accountId]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Action: 'sns:Publish',
            Resource: topicArn,
          },
        ],
      })
    ),
});

// Email subscription (will need confirmation)
new aws.sns.TopicSubscription('compliance-email-subscription', {
  topic: complianceTopic.arn,
  protocol: 'email',
  endpoint: 'compliance-team@example.com',
});

// ===== EventBridge Rules for 6-hour triggers =====
const processingScheduleRule = new aws.cloudwatch.EventRule(
  'processing-schedule-rule',
  {
    description: 'Trigger compliance processing every 6 hours',
    scheduleExpression: 'rate(6 hours)',
    tags: commonTags,
  }
);

new aws.cloudwatch.EventTarget('processing-lambda-target', {
  rule: processingScheduleRule.name,
  arn: processingLambda.arn,
});

new aws.lambda.Permission('processing-lambda-eventbridge-permission', {
  action: 'lambda:InvokeFunction',
  function: processingLambda.name,
  principal: 'events.amazonaws.com',
  sourceArn: processingScheduleRule.arn,
});

const aggregationScheduleRule = new aws.cloudwatch.EventRule(
  'aggregation-schedule-rule',
  {
    description: 'Trigger compliance aggregation every 6 hours',
    scheduleExpression: 'rate(6 hours)',
    tags: commonTags,
  }
);

new aws.cloudwatch.EventTarget('aggregation-lambda-target', {
  rule: aggregationScheduleRule.name,
  arn: aggregationLambda.arn,
});

new aws.lambda.Permission('aggregation-lambda-eventbridge-permission', {
  action: 'lambda:InvokeFunction',
  function: aggregationLambda.name,
  principal: 'events.amazonaws.com',
  sourceArn: aggregationScheduleRule.arn,
});

// EventBridge rule for Config compliance changes
const complianceChangeRule = new aws.cloudwatch.EventRule(
  'compliance-change-rule',
  {
    description: 'Trigger remediation on compliance changes',
    eventPattern: JSON.stringify({
      source: ['aws.config'],
      'detail-type': ['Config Rules Compliance Change'],
    }),
    tags: commonTags,
  }
);

new aws.cloudwatch.EventTarget('remediation-lambda-target', {
  rule: complianceChangeRule.name,
  arn: remediationLambda.arn,
});

new aws.lambda.Permission('remediation-lambda-eventbridge-permission', {
  action: 'lambda:InvokeFunction',
  function: remediationLambda.name,
  principal: 'events.amazonaws.com',
  sourceArn: complianceChangeRule.arn,
});

// Also send compliance changes to SNS
new aws.cloudwatch.EventTarget(
  'compliance-change-sns-target',
  {
    rule: complianceChangeRule.name,
    arn: complianceTopic.arn,
  },
  { dependsOn: [snsTopicPolicy] }
);

// ===== AWS Config Setup =====

// IAM role for AWS Config
const configRole = new aws.iam.Role('config-service-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'config.amazonaws.com',
        },
      },
    ],
  }),
  managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'],
  tags: commonTags,
});

// Additional policy for Config to write to S3
new aws.iam.RolePolicy('config-s3-policy', {
  role: configRole.id,
  policy: pulumi
    .all([complianceBucket.arn, kmsKey.arn])
    .apply(([bucketArn, kmsArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetBucketVersioning', 's3:PutObject', 's3:GetObject'],
            Resource: [bucketArn, `${bucketArn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: kmsArn,
          },
        ],
      })
    ),
});

// NOTE: We do NOT create a Config Recorder as AWS allows only one per region
// NOTE: We also do NOT create a Config Delivery Channel as AWS allows only one per region
// Assuming both Config Recorder and Delivery Channel already exist in the account

// AWS Config Rules using valid managed rule identifiers

// 1. EC2 Instance Type Compliance (using approved instance types)
const ec2InstanceTypeRule = new aws.cfg.Rule('ec2-instance-type-rule', {
  name: 'ec2-approved-instance-types',
  description: 'Check if EC2 instances are using approved instance types',
  source: {
    owner: 'AWS',
    sourceIdentifier: 'DESIRED_INSTANCE_TYPE',
  },
  inputParameters: JSON.stringify({
    instanceType: 't2.micro,t2.small,t3.micro,t3.small',
  }),
  tags: commonTags,
});

// 2. S3 Bucket Encryption Compliance
const s3EncryptionRule = new aws.cfg.Rule('s3-encryption-rule', {
  name: 's3-bucket-encryption-enabled',
  description: 'Check if S3 buckets have encryption enabled',
  source: {
    owner: 'AWS',
    sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
  },
  tags: commonTags,
});

// 3. RDS Backup Retention Compliance
const rdsBackupRule = new aws.cfg.Rule('rds-backup-retention-rule', {
  name: 'rds-backup-retention-enabled',
  description: 'Check if RDS instances have automated backups enabled',
  source: {
    owner: 'AWS',
    sourceIdentifier: 'DB_INSTANCE_BACKUP_ENABLED',
  },
  tags: commonTags,
});

// 4. EBS Volume Encryption
const ebsEncryptionRule = new aws.cfg.Rule('ebs-encryption-rule', {
  name: 'ebs-volumes-encrypted',
  description: 'Check if EBS volumes are encrypted',
  source: {
    owner: 'AWS',
    sourceIdentifier: 'ENCRYPTED_VOLUMES',
  },
  tags: commonTags,
});

// Config Aggregator for us-east-1
const configAggregator = new aws.cfg.AggregateAuthorization(
  'config-aggregation-auth',
  {
    accountId: accountId,
    region: region,
    tags: commonTags,
  }
);

const configAggregatorResource = new aws.cfg.ConfigurationAggregator(
  'config-aggregator',
  {
    name: 'compliance-aggregator',
    accountAggregationSource: {
      accountIds: [accountId],
      allRegions: false,
      regions: [region],
    },
    tags: commonTags,
  },
  { dependsOn: [configAggregator] }
);

// ===== CloudWatch Dashboard =====
const complianceDashboard = new aws.cloudwatch.Dashboard(
  'compliance-dashboard',
  {
    dashboardName: 'ComplianceMonitoring',
    dashboardBody: pulumi
      .all([
        processingLambda.name,
        aggregationLambda.name,
        remediationLambda.name,
        region,
      ])
      .apply(([processingName, aggregationName, remediationName, region]) =>
        JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/Lambda',
                    'Invocations',
                    'FunctionName',
                    processingName,
                    { stat: 'Sum', label: 'Processing Invocations' },
                  ],
                  [
                    'AWS/Lambda',
                    'Invocations',
                    'FunctionName',
                    aggregationName,
                    { stat: 'Sum', label: 'Aggregation Invocations' },
                  ],
                  [
                    'AWS/Lambda',
                    'Invocations',
                    'FunctionName',
                    remediationName,
                    { stat: 'Sum', label: 'Remediation Invocations' },
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: region,
                title: 'Lambda Invocations',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/Lambda',
                    'Errors',
                    'FunctionName',
                    processingName,
                    { stat: 'Sum' },
                  ],
                  [
                    'AWS/Lambda',
                    'Errors',
                    'FunctionName',
                    aggregationName,
                    { stat: 'Sum' },
                  ],
                  [
                    'AWS/Lambda',
                    'Errors',
                    'FunctionName',
                    remediationName,
                    { stat: 'Sum' },
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: region,
                title: 'Lambda Errors',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/Lambda',
                    'Duration',
                    'FunctionName',
                    processingName,
                    { stat: 'Average' },
                  ],
                  [
                    'AWS/Lambda',
                    'Duration',
                    'FunctionName',
                    aggregationName,
                    { stat: 'Average' },
                  ],
                  [
                    'AWS/Lambda',
                    'Duration',
                    'FunctionName',
                    remediationName,
                    { stat: 'Average' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'Lambda Duration',
              },
            },
          ],
        })
      ),
  }
);

// ===== Exports =====
export const bucketName = complianceBucket.bucket;
export const bucketArn = complianceBucket.arn;
export const kmsKeyId = kmsKey.id;
export const kmsKeyArn = kmsKey.arn;
export const processingLambdaArn = processingLambda.arn;
export const processingLambdaName = processingLambda.name;
export const aggregationLambdaArn = aggregationLambda.arn;
export const aggregationLambdaName = aggregationLambda.name;
export const remediationLambdaArn = remediationLambda.arn;
export const remediationLambdaName = remediationLambda.name;
export const snsTopicArn = complianceTopic.arn;
export const dashboardName = complianceDashboard.dashboardName;
export const configRuleNames = pulumi
  .all([
    ec2InstanceTypeRule.name,
    s3EncryptionRule.name,
    rdsBackupRule.name,
    ebsEncryptionRule.name,
  ])
  .apply(names => names);
export const configAggregatorName = configAggregatorResource.name;
export const lambdaRoleArn = lambdaRole.arn;
export const configRoleArn = configRole.arn;
