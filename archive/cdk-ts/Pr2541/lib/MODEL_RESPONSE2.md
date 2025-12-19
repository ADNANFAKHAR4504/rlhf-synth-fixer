The error indicates that the KMS key doesn't have the proper permissions to be used by CloudWatch Logs. The issue is in the KMS key policy - it needs to explicitly allow the CloudWatch Logs service to use the key. Here's the corrected implementation:

## lib/iam-core-stack.ts (Fixed)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface IamCoreStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  workloads: string[];
}

export class IamCoreStack extends cdk.Stack {
  public readonly roles: { [key: string]: iam.Role } = {};
  public readonly kmsKey: kms.Key;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: IamCoreStackProps) {
    super(scope, id, props);

    const { appName, environment, workloads } = props;
    const region = this.region;
    const account = this.account;

    // Protected resources that will be guarded by stack policy
    // KMS key for encryption - PROTECTED RESOURCE
    this.kmsKey = new kms.Key(this, 'AppEncryptionKey', {
      description: `${appName} encryption key for ${environment} in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      policy: new iam.PolicyDocument({
        statements: [
          // Root account access
          new iam.PolicyStatement({
            sid: 'EnableRootAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // CloudWatch Logs service access
          new iam.PolicyStatement({
            sid: 'AllowCloudWatchLogsAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal(`logs.${region}.amazonaws.com`)],
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
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${account}:log-group:/aws/${appName.toLowerCase()}/${environment}/${region}`,
              },
            },
          }),
          // S3 service access for bucket encryption
          new iam.PolicyStatement({
            sid: 'AllowS3ServiceAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `s3.${region}.amazonaws.com`,
              },
            },
          }),
        ],
      }),
    });

    // CloudWatch Log Group for application logs - create BEFORE using in roles
    const appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/${appName.toLowerCase()}/${environment}/${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // S3 bucket for application logs - PROTECTED RESOURCE
    this.logsBucket = new s3.Bucket(this, 'AppLogsBucket', {
      bucketName: `${appName.toLowerCase()}-logs-${environment}-${region}-${account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create least-privilege roles for each workload
    workloads.forEach(workload => {
      this.roles[workload] = this.createWorkloadRole(workload, appName, environment, region, account, appLogGroup);
    });

    // Outputs for cross-stack references
    Object.entries(this.roles).forEach(([workload, role]) => {
      new cdk.CfnOutput(this, `${workload}RoleArn`, {
        value: role.roleArn,
        description: `ARN of the ${workload} execution role`,
        exportName: `${id}-${workload}-role-arn`,
      });
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'ARN of the application encryption key',
      exportName: `${id}-kms-key-arn`,
    });

    new cdk.CfnOutput(this, 'LogsBucketArn', {
      value: this.logsBucket.bucketArn,
      description: 'ARN of the application logs bucket',
      exportName: `${id}-logs-bucket-arn`,
    });

    new cdk.CfnOutput(this, 'LogGroupArn', {
      value: appLogGroup.logGroupArn,
      description: 'ARN of the application log group',
      exportName: `${id}-log-group-arn`,
    });
  }

  private createWorkloadRole(
    workload: string,
    appName: string,
    environment: string,
    region: string,
    account: string,
    logGroup: logs.LogGroup
  ): iam.Role {
    const roleName = `${appName}-${workload}-${environment}-${region}`;

    switch (workload) {
      case 'lambda':
        return this.createLambdaRole(roleName, appName, environment, region, account, logGroup);
      case 'ec2':
        return this.createEc2Role(roleName, appName, environment, region, account, logGroup);
      case 'codebuild':
        return this.createCodeBuildRole(roleName, appName, environment, region, account, logGroup);
      case 'codepipeline':
        return this.createCodePipelineRole(roleName, appName, environment, region, account, logGroup);
      default:
        throw new Error(`Unsupported workload: ${workload}`);
    }
  }

  private createLambdaRole(
    roleName: string,
    appName: string,
    environment: string,
    region: string,
    account: string,
    logGroup: logs.LogGroup
  ): iam.Role {
    const role = new iam.Role(this, `${roleName}Role`, {
      roleName,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${appName} in ${environment}`,
    });

    // Least-privilege logging policy - only to specific log group
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowSpecificLogGroupAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        logGroup.logGroupArn,
        `${logGroup.logGroupArn}:*`, // Required for log streams
      ],
    }));

    // KMS decrypt for CloudWatch Logs encryption - scoped by service
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowKmsDecryptForLogs',
      effect: iam.Effect.ALLOW,
      actions: ['kms:Decrypt', 'kms:DescribeKey'],
      resources: [this.kmsKey.keyArn],
      conditions: {
        StringEquals: {
          'kms:ViaService': `logs.${region}.amazonaws.com`,
        },
      },
    }));

    // S3 read access to specific prefix only
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowS3ReadSpecificPrefix',
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${this.logsBucket.bucketArn}/lambda/*`],
      conditions: {
        StringLike: {
          's3:prefix': 'lambda/*',
        },
      },
    }));

    return role;
  }

  private createEc2Role(
    roleName: string,
    appName: string,
    environment: string,
    region: string,
    account: string,
    logGroup: logs.LogGroup
  ): iam.Role {
    const role = new iam.Role(this, `${roleName}Role`, {
      roleName,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `EC2 instance role for ${appName} in ${environment}`,
    });

    // CloudWatch agent permissions - scoped to specific log group
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCloudWatchAgentLogs',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: [
        logGroup.logGroupArn,
        `${logGroup.logGroupArn}:*`,
      ],
    }));

    // EC2 instance metadata and tags - restricted to own instance
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowInstanceMetadataAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:DescribeTags',
      ],
      resources: ['*'], // EC2 DescribeTags requires wildcard but is read-only
      conditions: {
        StringEquals: {
          'aws:RequestedRegion': region,
        },
      },
    }));

    // KMS decrypt for logs encryption
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowKmsDecryptForEC2Logs',
      effect: iam.Effect.ALLOW,
      actions: ['kms:Decrypt', 'kms:DescribeKey'],
      resources: [this.kmsKey.keyArn],
      conditions: {
        StringEquals: {
          'kms:ViaService': `logs.${region}.amazonaws.com`,
        },
      },
    }));

    return role;
  }

  private createCodeBuildRole(
    roleName: string,
    appName: string,
    environment: string,
    region: string,
    account: string,
    logGroup: logs.LogGroup
  ): iam.Role {
    const role = new iam.Role(this, `${roleName}Role`, {
      roleName,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: `CodeBuild service role for ${appName} in ${environment}`,
    });

    // CloudWatch Logs permissions for CodeBuild
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCodeBuildLogs',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${region}:${account}:log-group:/aws/codebuild/${appName}-*`,
        `arn:aws:logs:${region}:${account}:log-group:/aws/codebuild/${appName}-*:*`,
        logGroup.logGroupArn,
        `${logGroup.logGroupArn}:*`,
      ],
    }));

    // S3 access for build artifacts - scoped to specific prefix
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowS3BuildArtifacts',
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        `${this.logsBucket.bucketArn}/codebuild/*`,
      ],
    }));

    // KMS permissions for artifact encryption
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowKmsForCodeBuild',
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:Encrypt',
        'kms:GenerateDataKey',
        'kms:DescribeKey',
      ],
      resources: [this.kmsKey.keyArn],
      conditions: {
        StringEquals: {
          'kms:ViaService': [
            `s3.${region}.amazonaws.com`,
            `logs.${region}.amazonaws.com`,
          ],
        },
      },
    }));

    return role;
  }

  private createCodePipelineRole(
    roleName: string,
    appName: string,
    environment: string,
    region: string,
    account: string,
    logGroup: logs.LogGroup
  ): iam.Role {
    const role = new iam.Role(this, `${roleName}Role`, {
      roleName,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: `CodePipeline service role for ${appName} in ${environment}`,
    });

    // S3 access for pipeline artifacts
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowS3PipelineArtifacts',
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:GetBucketVersioning',
      ],
      resources: [
        `${this.logsBucket.bucketArn}/codepipeline/*`,
        this.logsBucket.bucketArn,
      ],
    }));

    // CodeBuild project invocation - scoped to specific project pattern
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCodeBuildInvocation',
      effect: iam.Effect.ALLOW,
      actions: [
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: [
        `arn:aws:codebuild:${region}:${account}:project/${appName}-*`,
      ],
    }));

    // CloudWatch Logs for pipeline execution
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowPipelineLogs',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${region}:${account}:log-group:/aws/codepipeline/${appName}-*`,
        `arn:aws:logs:${region}:${account}:log-group:/aws/codepipeline/${appName}-*:*`,
      ],
    }));

    // KMS permissions for pipeline artifacts
    role.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowKmsForPipeline',
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:Encrypt',
        'kms:GenerateDataKey',
        'kms:DescribeKey',
      ],
      resources: [this.kmsKey.keyArn],
      conditions: {
        StringEquals: {
          'kms:ViaService': `s3.${region}.amazonaws.com`,
        },
      },
    }));

    return role;
  }
}
```

## Key Changes Made:

1. **Added CloudWatch Logs service principal to KMS key policy** - This is the critical fix that allows CloudWatch Logs to use the KMS key for encryption.

2. **Added proper encryption context condition** - The condition ensures the key can only be used for the specific log group.

3. **Added S3 service principal to KMS key policy** - Allows S3 to use the key for bucket encryption.

4. **Moved log group creation before role creation** - Ensures the log group exists when roles reference it.

5. **Added proper log stream ARN patterns** - Fixed the ARN patterns to include `:*` for log streams.

## Runbook

```bash
# Clean up any failed stacks first
aws cloudformation delete-stack --stack-name TapStackpr2541-us-east-1 --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name TapStackpr2541-us-east-1 --region us-east-1

# Install dependencies
npm install

# Build the project
npm run build

# Synthesize templates to verify they're correct
cdk synth

# Bootstrap regions if not already done
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2

# Deploy primary region with stack policy
cdk deploy IamCoreStack-us-east-1 \
  --require-approval never \
  --stack-policy lib/policies/stack-policy.json

# Deploy secondary region with stack policy  
cdk deploy IamCoreStack-us-west-2 \
  --require-approval never \
  --stack-policy lib/policies/stack-policy.json

# Verify KMS key policy allows CloudWatch Logs
aws kms describe-key --key-id $(aws cloudformation describe-stacks \
  --stack-name IamCoreStack-us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`KmsKeyArn`].OutputValue' \
  --output text | cut -d'/' -f2) \
  --region us-east-1

# Test least privilege - this should DENY
aws iam simulate-custom-policy \
  --policy-input-list '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Resource":"arn:aws:s3:::secureiam-logs-prod-us-east-1-*/lambda/*"}]}' \
  --action-names s3:ListAllMyBuckets \
  --resource-arns "*" \
  --region us-east-1
```

The main issue was that CloudWatch Logs needs explicit permission in the KMS key policy to use the key for log group encryption. The fixed version includes the proper service principal and encryption context conditions.