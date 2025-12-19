## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// 🔹 Main Security Baseline Stack
new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: `Enterprise Security Baseline Stack - PCI-DSS Compliant (${environmentSuffix})`,
});

app.synth();
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

// 🔹 Custom Construct for Secure KMS Key
class SecureKmsKey extends Construct {
  public readonly key: kms.Key;

  constructor(
    scope: Construct,
    id: string,
    props: { description: string; alias: string }
  ) {
    super(scope, id);

    this.key = new kms.Key(this, 'Key', {
      description: props.description,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pendingWindow: cdk.Duration.days(30),
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM policies',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': cdk.Aws.ACCOUNT_ID,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${cdk.Aws.REGION}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnEquals: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`,
              },
            },
          }),
        ],
      }),
    });

    const uniqueAliasName = `${props.alias}-${cdk.Names.uniqueId(this).slice(0, 8)}`;
    new kms.Alias(this, 'Alias', {
      aliasName: uniqueAliasName,
      targetKey: this.key,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}

// 🔹 Custom Construct for Secure S3 Bucket
class SecureS3Bucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: {
      bucketName: string;
      encryptionKey: kms.IKey;
      logBucket?: s3.IBucket;
    }
  ) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.logBucket,
      serverAccessLogsPrefix: props.logBucket
        ? `${props.bucketName}/`
        : undefined,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add bucket policy to enforce SSL
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );
  }
}

// 🔹 Tagging Aspect
class TaggingAspect implements cdk.IAspect {
  private readonly tags: { [key: string]: string };

  constructor(tags: { [key: string]: string }) {
    this.tags = tags;
  }

  public visit(node: Construct): void {
    if (cdk.TagManager.isTaggable(node)) {
      Object.entries(this.tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value);
      });
    }
  }
}

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 🔹 Apply Global Tagging Aspect
    cdk.Aspects.of(this).add(
      new TaggingAspect({
        Environment: environmentSuffix,
        CostCenter: 'Security',
        Owner: 'SecurityTeam',
        DataClassification: 'Sensitive',
        ComplianceScope: 'PCI-DSS',
      }),
      { priority: 100 }
    );

    // 🔹 KMS Key Hierarchy
    const kmsDatabaseKey = new SecureKmsKey(this, 'KmsDatabaseKey', {
      description: 'KMS key for database encryption',
      alias: `alias/database-encryption-${environmentSuffix}`,
    });

    const kmsS3Key = new SecureKmsKey(this, 'KmsS3Key', {
      description: 'KMS key for S3 bucket encryption',
      alias: `alias/s3-encryption-${environmentSuffix}`,
    });

    // Grant CloudTrail permissions to use the S3 KMS key
    kmsS3Key.key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudTrail',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    const kmsSecretsKey = new SecureKmsKey(this, 'KmsSecretsKey', {
      description: 'KMS key for Secrets Manager encryption',
      alias: `alias/secrets-encryption-${environmentSuffix}`,
    });

    const kmsLogsKey = new SecureKmsKey(this, 'KmsLogsKey', {
      description: 'KMS key for CloudWatch Logs encryption',
      alias: `alias/logs-encryption-${environmentSuffix}`,
    });

    // 🔹 S3 Buckets for Logging
    const accessLogBucket = new SecureS3Bucket(this, 'AccessLogBucket', {
      bucketName: `${cdk.Aws.ACCOUNT_ID}-access-logs-${environmentSuffix}`,
      encryptionKey: kmsS3Key.key,
    });

    const cloudTrailBucket = new SecureS3Bucket(this, 'CloudTrailBucket', {
      bucketName: `${cdk.Aws.ACCOUNT_ID}-cloudtrail-logs-${environmentSuffix}`,
      encryptionKey: kmsS3Key.key,
      logBucket: accessLogBucket.bucket,
    });

    // Grant CloudTrail permissions to write to the bucket
    cloudTrailBucket.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${cloudTrailBucket.bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'aws:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    cloudTrailBucket.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudTrailGetBucketAcl',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudTrailBucket.bucket.bucketArn],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    const vpcFlowLogBucket = new SecureS3Bucket(this, 'VpcFlowLogBucket', {
      bucketName: `${cdk.Aws.ACCOUNT_ID}-vpc-flow-logs-${environmentSuffix}`,
      encryptionKey: kmsS3Key.key,
      logBucket: accessLogBucket.bucket,
    });

    // 🔹 VPC for Isolated Lambda
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      vpcName: `security-baseline-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      flowLogs: {
        VpcFlowLogsToS3: {
          destination: ec2.FlowLogDestination.toS3(
            vpcFlowLogBucket.bucket,
            'vpc-flow-logs/'
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // VPC Endpoints for AWS services
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    vpc.addInterfaceEndpoint('KmsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
    });

    // 🔹 CloudWatch Log Groups
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/main-${environmentSuffix}`,
      encryptionKey: kmsLogsKey.key,
      retention: logs.RetentionDays.SEVEN_YEARS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/secrets-rotation-${environmentSuffix}`,
      encryptionKey: kmsLogsKey.key,
      retention: logs.RetentionDays.SEVEN_YEARS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 IAM Roles
    const allowedIpRanges = ['10.0.0.0/8', '172.16.0.0/12'];

    // EC2 Instance Role
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `SecurityBaselineEc2Role-${environmentSuffix}`,
      description: 'Least privilege role for EC2 instances',
      maxSessionDuration: cdk.Duration.hours(4),
    });

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadSecretsWithConditions',
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:app/*`,
        ],
        conditions: {
          IpAddress: {
            'aws:SourceIp': allowedIpRanges,
          },
        },
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'WriteApplicationLogs',
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [applicationLogGroup.logGroupArn],
      })
    );

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `SecurityBaselineLambdaRole-${environmentSuffix}`,
      description: 'Least privilege role for Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'RotateSecrets',
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:RotateSecret',
          'secretsmanager:UpdateSecretVersionStage',
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'UseKmsKeys',
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [kmsSecretsKey.key.keyArn],
      })
    );

    // ECS Task Role
    const ecsTaskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: `SecurityBaselineEcsTaskRole-${environmentSuffix}`,
      description: 'Least privilege role for ECS tasks',
    });

    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadAppSecrets',
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:ecs/*`,
        ],
      })
    );

    // DevOps Cross-Account Role with MFA
    const devOpsRole = new iam.Role(this, 'DevOpsCrossAccountRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID).withConditions({
        Bool: {
          'aws:MultiFactorAuthPresent': 'true',
        },
        IpAddress: {
          'aws:SourceIp': allowedIpRanges,
        },
        StringEquals: {
          'aws:RequestedRegion': cdk.Aws.REGION,
        },
      }),
      roleName: `DevOpsSecurityBaselineRole-${environmentSuffix}`,
      description: 'Cross-account role for DevOps team with MFA enforcement',
      maxSessionDuration: cdk.Duration.hours(2),
    });

    devOpsRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
    );

    devOpsRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'LimitedWriteAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:StartInstances',
          'ec2:StopInstances',
          'ec2:RebootInstances',
          'ecs:UpdateService',
          'ecs:RegisterTaskDefinition',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:RequestTag/Environment': environmentSuffix,
          },
        },
      })
    );

    // 🔹 Secrets Manager with Rotation
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `app/database/master-${environmentSuffix}`,
      description: 'Database master credentials',
      encryptionKey: kmsSecretsKey.key,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    const apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: `app/api/key-${environmentSuffix}`,
      description: 'API key for external services',
      encryptionKey: kmsSecretsKey.key,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ service: 'payment-gateway' }),
        generateStringKey: 'apiKey',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 64,
      },
    });

    // Rotation Lambda
    const rotationLambda = new lambda.Function(this, 'SecretsRotationLambda', {
      functionName: `secrets-rotation-lambda-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        SECRETS_MANAGER_ENDPOINT: `https://secretsmanager.${cdk.Aws.REGION}.amazonaws.com`,
      },
      logGroup: lambdaLogGroup,
      code: lambda.Code.fromInline(`
import json
import boto3
import os
def handler(event, context):
    """Placeholder for secrets rotation logic"""
    service_client = boto3.client('secretsmanager', endpoint_url=os.environ['SECRETS_MANAGER_ENDPOINT'])
    arn = event['SecretId']
    token = event['Token']
    step = event['Step']
    
    if step == "createSecret":
        # Generate new secret
        pass
    elif step == "setSecret":
        # Set new secret in service
        pass
    elif step == "testSecret":
        # Test new secret
        pass
    elif step == "finishSecret":
        # Mark new secret as current
        service_client.update_secret_version_stage(
            SecretId=arn,
            VersionStage="AWSCURRENT",
            MoveToVersionId=token,
            RemoveFromVersionId=event['PreviousVersionId']
        )
    
    return {"statusCode": 200}
      `),
    });

    // Enable rotation for secrets
    new secretsmanager.RotationSchedule(this, 'DatabaseSecretRotation', {
      secret: databaseSecret,
      rotationLambda: rotationLambda,
      automaticallyAfter: cdk.Duration.days(30),
    });

    new secretsmanager.RotationSchedule(this, 'ApiKeyRotation', {
      secret: apiKeySecret,
      rotationLambda: rotationLambda,
      automaticallyAfter: cdk.Duration.days(90),
    });

    // 🔹 CloudTrail Configuration
    const trail = new cloudtrail.Trail(this, 'SecurityBaselineTrail', {
      trailName: `security-baseline-trail-${environmentSuffix}`,
      bucket: cloudTrailBucket.bucket,
      encryptionKey: kmsS3Key.key,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: `/aws/cloudtrail/security-baseline-${environmentSuffix}`,
        encryptionKey: kmsLogsKey.key,
        retention: logs.RetentionDays.SEVEN_YEARS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      managementEvents: cloudtrail.ReadWriteType.ALL,
      insightTypes: [
        cloudtrail.InsightType.API_CALL_RATE,
        cloudtrail.InsightType.API_ERROR_RATE,
      ],
    });

    // Add event selectors for data events
    trail.addEventSelector(
      cloudtrail.DataResourceType.S3_OBJECT,
      [`${cloudTrailBucket.bucket.bucketArn}/*`],
      {
        includeManagementEvents: true,
        readWriteType: cloudtrail.ReadWriteType.ALL,
      }
    );

    // 🔹 CloudWatch Alarms for Security Events
    const unauthorizedApiCallsAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'UnauthorizedApiCallsAlarm',
      {
        alarmName: `SecurityBaseline-UnauthorizedAPICalls-${environmentSuffix}`,
        alarmDescription: 'Alert on unauthorized API calls',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'CloudTrailMetrics',
          metricName: 'UnauthorizedAPICalls',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const rootAccountUsageAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'RootAccountUsageAlarm',
      {
        alarmName: `SecurityBaseline-RootAccountUsage-${environmentSuffix}`,
        alarmDescription: 'Alert on root account usage',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'CloudTrailMetrics',
          metricName: 'RootAccountUsage',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'KmsDatabaseKeyArn', {
      value: kmsDatabaseKey.key.keyArn,
      description: 'KMS key ARN for database encryption',
      exportName: `SecurityBaseline-KmsDatabaseKey-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN',
      exportName: `SecurityBaseline-CloudTrailArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DevOpsRoleArn', {
      value: devOpsRole.roleArn,
      description: 'DevOps cross-account role ARN',
      exportName: `SecurityBaseline-DevOpsRoleArn-${environmentSuffix}`,
    });
  }
}
```