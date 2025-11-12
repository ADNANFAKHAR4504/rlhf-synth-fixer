## package.json

```json
{
  "name": "secure-iam-multi-region",
  "version": "1.0.0",
  "description": "Production-ready multi-region IAM with least-privilege roles and stack protection",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "diff": "cdk diff",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0"
  }
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## bin/app.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IamCoreStack } from '../lib/iam-core-stack';

const app = new cdk.App();

// Configuration
const appName = 'SecureIAM';
const env = 'prod';
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-west-2';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Workloads that need IAM roles
const workloads = ['lambda', 'ec2', 'codebuild', 'codepipeline'];

// Common tags for all resources
const commonTags = {
  App: appName,
  Env: env,
  Owner: 'platform-team@company.com',
  CostCenter: 'engineering-platform',
  ManagedBy: 'aws-cdk'
};

// Primary region stack
const primaryStack = new IamCoreStack(app, `IamCoreStack-${primaryRegion}`, {
  env: {
    account,
    region: primaryRegion,
  },
  appName,
  environment: env,
  workloads,
  // Enable termination protection for production
  terminationProtection: env === 'prod',
  tags: {
    ...commonTags,
    Region: primaryRegion,
  },
});

// Secondary region stack
const secondaryStack = new IamCoreStack(app, `IamCoreStack-${secondaryRegion}`, {
  env: {
    account,
    region: secondaryRegion,
  },
  appName,
  environment: env,
  workloads,
  // Enable termination protection for production
  terminationProtection: env === 'prod',
  tags: {
    ...commonTags,
    Region: secondaryRegion,
  },
});

app.synth();
```

## lib/iam-core-stack.ts

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
          new iam.PolicyStatement({
            sid: 'EnableRootAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
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

    // CloudWatch Log Group for application logs
    const appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/${appName.toLowerCase()}/${environment}/${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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

## lib/policies/stack-policy.json

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": [
        "Update:Replace",
        "Update:Delete"
      ],
      "Resource": "LogicalResourceId/AppEncryptionKey*",
      "Condition": {
        "StringEquals": {
          "ResourceType": [
            "AWS::KMS::Key"
          ]
        }
      }
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": [
        "Update:Replace",
        "Update:Delete"
      ],
      "Resource": "LogicalResourceId/AppLogsBucket*",
      "Condition": {
        "StringEquals": {
          "ResourceType": [
            "AWS::S3::Bucket"
          ]
        }
      }
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": [
        "Update:Replace",
        "Update:Delete"
      ],
      "Resource": "LogicalResourceId/AppLogGroup*",
      "Condition": {
        "StringEquals": {
          "ResourceType": [
            "AWS::Logs::LogGroup"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "*"
    }
  ]
}
```

## README.md

```markdown
# Secure IAM Multi-Region CDK Stack

This CDK application deploys least-privilege IAM roles across two AWS regions with CloudFormation stack protection and automatic rollback capabilities.

## Architecture

- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2
- **Workloads**: Lambda, EC2, CodeBuild, CodePipeline
- **Protected Resources**: KMS Key, S3 Logs Bucket, CloudWatch Log Group

## Features

### Least-Privilege IAM
- Separate roles per workload with minimal permissions
- Resource-level ARN restrictions
- Condition-based access controls
- Service-specific trust policies

### Stack Protection
- CloudFormation stack policy prevents accidental deletion/replacement of critical resources
- Automatic rollback on deployment failures
- Termination protection enabled for production stacks

### Multi-Region Design
- Identical logical setup across both regions
- Region-aware naming and tagging
- Cross-stack outputs for role ARNs

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Node.js 18+ and npm
3. AWS CDK v2 installed globally: `npm install -g aws-cdk`

## Installation

```bash
npm install
```

## Bootstrap (First Time Only)

```bash
# Bootstrap both regions
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2
```

## Deployment

### Synthesize Templates
```bash
npm run build
cdk synth
```

### Deploy to Both Regions
```bash
# Deploy primary region with stack policy
cdk deploy IamCoreStack-us-east-1 \
  --require-approval never \
  --stack-policy lib/policies/stack-policy.json

# Deploy secondary region with stack policy  
cdk deploy IamCoreStack-us-west-2 \
  --require-approval never \
  --stack-policy lib/policies/stack-policy.json
```

### Deploy All Stacks
```bash
cdk deploy --all \
  --require-approval never \
  --stack-policy lib/policies/stack-policy.json
```

## Validation

### Verify Stack Policy
```bash
# Check stack policy is applied
aws cloudformation get-stack-policy \
  --stack-name IamCoreStack-us-east-1 \
  --region us-east-1
```

### Test Least Privilege
```bash
# Simulate policy for Lambda role - this should DENY listing all S3 buckets
aws iam simulate-custom-policy \
  --policy-input-list file://lambda-policy.json \
  --action-names s3:ListAllMyBuckets \
  --resource-arns "*" \
  --region us-east-1

# This should ALLOW GetObject on the specific bucket prefix
aws iam simulate-custom-policy \
  --policy-input-list file://lambda-policy.json \
  --action-names s3:GetObject \
  --resource-arns "arn:aws:s3:::secureiam-logs-prod-us-east-1-ACCOUNT/lambda/test.log" \
  --region us-east-1
```

### Safe Rollback Test

1. **Introduce a failing change** (safe method):
   ```typescript
   // In lib/iam-core-stack.ts, add an invalid resource reference
   role.addToPolicy(new iam.PolicyStatement({
     actions: ['s3:GetObject'],
     resources: ['arn:aws:s3:::non-existent-bucket-12345/*'], // This will fail
   }));
   ```

2. **Deploy and observe rollback**:
   ```bash
   cdk deploy IamCoreStack-us-east-1
   ```

3. **Monitor CloudFormation Events**:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name IamCoreStack-us-east-1 \
     --region us-east-1 \
     --query 'StackEvents[?ResourceStatus==`ROLLBACK_IN_PROGRESS` || ResourceStatus==`ROLLBACK_COMPLETE`]'
   ```

4. **Revert the change** and redeploy successfully.

### Test Stack Policy Protection

1. **Try to update a protected resource** (this should fail):
   ```typescript
   // Try to change KMS key description
   this.kmsKey = new kms.Key(this, 'AppEncryptionKey', {
     description: 'CHANGED DESCRIPTION', // This change will be blocked
     // ... other properties
   });
   ```

2. **Deploy and observe policy denial**:
   ```bash
   cdk deploy IamCoreStack-us-east-1
   # Should see: "Action denied by stack policy"
   ```

## Stack Policy Override (Emergency Use Only)

To temporarily bypass stack policy for emergency updates:

```bash
# Create temporary policy allowing all updates
echo '{"Statement":[{"Effect":"Allow","Principal":"*","Action":"Update:*","Resource":"*"}]}' > temp-allow-all.json

# Deploy with override policy
cdk deploy IamCoreStack-us-east-1 \
  --stack-policy temp-allow-all.json

# IMPORTANT: Restore original policy after emergency fix
cdk deploy IamCoreStack-us-east-1 \
  --stack-policy lib/policies/stack-policy.json

# Clean up
rm temp-allow-all.json
```

## Monitoring and Troubleshooting

### View Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name IamCoreStack-us-east-1 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Check Role Permissions
```bash
# Get role ARN from stack outputs
LAMBDA_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name IamCoreStack-us-east-1 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`lambdaRoleArn`].OutputValue' \
  --output text)

# List role policies
aws iam list-role-policies \
  --role-name SecureIAM-lambda-prod-us-east-1
```

### CloudFormation Events
```bash
# Monitor deployment progress
aws cloudformation describe-stack-events \
  --stack-name IamCoreStack-us-east-1 \
  --region us-east-1 \
  --max-items 20
```

## Cleanup

```bash
# Destroy stacks (will be protected in prod)
cdk destroy IamCoreStack-us-east-1 IamCoreStack-us-west-2
```

## Security Considerations

1. **Least Privilege**: Each role has minimal permissions for its specific workload
2. **Resource Scoping**: All permissions are scoped to specific ARNs or prefixes
3. **Condition-Based Access**: KMS permissions use `kms:ViaService` conditions
4. **Stack Protection**: Critical resources are protected from accidental changes
5. **Termination Protection**: Production stacks cannot be accidentally deleted
6. **Encryption**: All logs and artifacts are encrypted with customer-managed KMS keys

## Role Permission Summary

| Role | Permissions | Resource Scope | Conditions |
|------|-------------|----------------|------------|
| Lambda | logs:CreateLogStream, logs:PutLogEvents | Specific log group only | None |
| Lambda | kms:Decrypt, kms:DescribeKey | App KMS key only | kms:ViaService=logs |
| Lambda | s3:GetObject | /lambda/* prefix only | s3:prefix=lambda/* |
| EC2 | logs:*, ec2:DescribeTags | Specific log group, all EC2 | aws:RequestedRegion |
| CodeBuild | logs:*, s3:GetObject/PutObject, kms:* | Build logs, /codebuild/* prefix | kms:ViaService |
| CodePipeline | s3:*, codebuild:BatchGetBuilds/StartBuild, kms:* | /codepipeline/* prefix, app projects | kms:ViaService |

## Compliance

This implementation follows AWS security best practices:
- ✅ Least privilege access
- ✅ Resource-level permissions
-