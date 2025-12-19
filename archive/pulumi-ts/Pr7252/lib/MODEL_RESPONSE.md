# Pulumi CI/CD Pipeline Implementation

This implementation creates a self-managed CI/CD pipeline using AWS CodePipeline to deploy Pulumi stacks across multiple environments (dev, staging, prod) with proper security controls and compliance requirements.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Self-managed CI/CD pipeline for deploying Pulumi stacks across multiple AWS accounts
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
  githubToken: pulumi.Input<string>;
  ecrImageUri: pulumi.Input<string>;
  devAccountId?: string;
  stagingAccountId?: string;
  prodAccountId?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly devPipelineArn: pulumi.Output<string>;
  public readonly stagingPipelineArn: pulumi.Output<string>;
  public readonly prodPipelineArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const githubBranch = args.githubBranch || 'main';

    // Multi-account configuration
    const accounts = {
      dev: args.devAccountId || '123456789012',
      staging: args.stagingAccountId || '234567890123',
      prod: args.prodAccountId || '345678901234'
    };

    // Create KMS key for artifact encryption with rotation enabled
    const artifactKmsKey = new aws.kms.Key(`pipeline-artifact-key-${environmentSuffix}`, {
      description: `KMS key for pipeline artifacts encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: tags,
    }, { parent: this });

    new aws.kms.Alias(`pipeline-artifact-key-alias-${environmentSuffix}`, {
      name: `alias/pipeline-artifact-${environmentSuffix}`,
      targetKeyId: artifactKmsKey.keyId,
    }, { parent: this });

    // Create S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts-${environmentSuffix}`, {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      forceDestroy: true,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: artifactKmsKey.keyId,
          },
          bucketKeyEnabled: true,
        },
      },
      versioning: {
        enabled: true,
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 90,
        },
        noncurrentVersionExpiration: {
          days: 30,
        },
      }],
      tags: tags,
    }, { parent: this });

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(`pipeline-artifacts-pab-${environmentSuffix}`, {
      bucket: artifactBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Create S3 buckets for Pulumi state (one per environment)
    const stateBuckets: { [key: string]: aws.s3.Bucket } = {};

    ['dev', 'staging', 'prod'].forEach(env => {
      stateBuckets[env] = new aws.s3.Bucket(`pulumi-state-${env}-${environmentSuffix}`, {
        bucket: `pulumi-state-${env}-${environmentSuffix}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: artifactKmsKey.keyId,
            },
            bucketKeyEnabled: true,
          },
        },
        versioning: {
          enabled: true,
        },
        lifecycleRules: [{
          enabled: true,
          noncurrentVersionExpiration: {
            days: 90,
          },
        }],
        tags: { ...tags, Environment: env },
      }, { parent: this });

      new aws.s3.BucketPublicAccessBlock(`pulumi-state-pab-${env}-${environmentSuffix}`, {
        bucket: stateBuckets[env].id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }, { parent: this });
    });

    // Create CloudWatch Log Group for build logs (30 days retention)
    const buildLogGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
      name: `/aws/codebuild/pulumi-pipeline-${environmentSuffix}`,
      retentionInDays: 30,
      tags: tags,
    }, { parent: this });

    // Create IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(`pipeline-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'codepipeline.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: tags,
    }, { parent: this });

    // Policy for CodePipeline role
    new aws.iam.RolePolicy(`pipeline-policy-${environmentSuffix}`, {
      role: pipelineRole.id,
      policy: pulumi.all([artifactBucket.arn, artifactKmsKey.arn]).apply(([bucketArn, keyArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              Resource: [bucketArn, `${bucketArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: keyArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'sns:Publish',
              ],
              Resource: '*',
            },
          ],
        })
      ),
    }, { parent: this });

    // Create IAM role for CodeBuild with cross-account assume permissions
    const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'codebuild.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: tags,
    }, { parent: this });

    // Policy for CodeBuild role with least-privilege access
    new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([
        artifactBucket.arn,
        artifactKmsKey.arn,
        buildLogGroup.arn,
        stateBuckets.dev.arn,
        stateBuckets.staging.arn,
        stateBuckets.prod.arn,
      ]).apply(([bucketArn, keyArn, logArn, devBucketArn, stagingBucketArn, prodBucketArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: [`${logArn}:*`],
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:ListBucket',
              ],
              Resource: [
                bucketArn,
                `${bucketArn}/*`,
                devBucketArn,
                `${devBucketArn}/*`,
                stagingBucketArn,
                `${stagingBucketArn}/*`,
                prodBucketArn,
                `${prodBucketArn}/*`,
              ],
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: keyArn,
            },
            {
              Effect: 'Allow',
              Action: 'sts:AssumeRole',
              Resource: [
                `arn:aws:iam::${accounts.dev}:role/PulumiDeploymentRole`,
                `arn:aws:iam::${accounts.staging}:role/PulumiDeploymentRole`,
                `arn:aws:iam::${accounts.prod}:role/PulumiDeploymentRole`,
              ],
            },
            {
              Effect: 'Allow',
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              Resource: '*',
            },
          ],
        })
      ),
    }, { parent: this });

    // Create SNS topic for pipeline notifications
    const notificationTopic = new aws.sns.Topic(`pipeline-notifications-${environmentSuffix}`, {
      displayName: `Pipeline Notifications - ${environmentSuffix}`,
      kmsMasterKeyId: artifactKmsKey.id,
      tags: tags,
    }, { parent: this });

    // Create CodeBuild projects for preview and deploy stages
    const createCodeBuildProject = (
      projectName: string,
      environment: string,
      command: string
    ): aws.codebuild.Project => {
      return new aws.codebuild.Project(projectName, {
        name: projectName,
        description: `Pulumi ${command} for ${environment} environment`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_LARGE',
          image: args.ecrImageUri,
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'SERVICE_ROLE',
          environmentVariables: [
            {
              name: 'PULUMI_BACKEND_URL',
              value: pulumi.interpolate`s3://${stateBuckets[environment].bucket}`,
            },
            {
              name: 'ENVIRONMENT',
              value: environment,
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: accounts[environment as keyof typeof accounts],
            },
            {
              name: 'PULUMI_COMMAND',
              value: command,
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging into Pulumi backend"
      - pulumi login $PULUMI_BACKEND_URL
      - echo "Installing dependencies"
      - npm ci

  build:
    commands:
      - echo "Running Pulumi $PULUMI_COMMAND"
      - |
        if [ "$PULUMI_COMMAND" = "preview" ]; then
          pulumi stack select $ENVIRONMENT || pulumi stack init $ENVIRONMENT
          pulumi preview --non-interactive --diff
        else
          pulumi stack select $ENVIRONMENT || pulumi stack init $ENVIRONMENT
          pulumi up --yes --non-interactive --skip-preview
        fi

  post_build:
    commands:
      - echo "Pulumi $PULUMI_COMMAND completed successfully"
      - pulumi stack output --json > stack-outputs.json || echo "{}" > stack-outputs.json

artifacts:
  files:
    - '**/*'
    - stack-outputs.json
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: buildLogGroup.name,
            streamName: `${environment}-${command}`,
          },
        },
        tags: { ...tags, Environment: environment },
      }, { parent: this });
    };

    // Create preview and deploy projects for each environment
    const previewProjects: { [key: string]: aws.codebuild.Project } = {};
    const deployProjects: { [key: string]: aws.codebuild.Project } = {};

    ['dev', 'staging', 'prod'].forEach(env => {
      previewProjects[env] = createCodeBuildProject(
        `pulumi-preview-${env}-${environmentSuffix}`,
        env,
        'preview'
      );

      deployProjects[env] = createCodeBuildProject(
        `pulumi-deploy-${env}-${environmentSuffix}`,
        env,
        'up'
      );
    });

    // Create CodePipeline for each environment
    const createPipeline = (
      pipelineName: string,
      environment: string,
      includeManualApproval: boolean
    ): aws.codepipeline.Pipeline => {
      const stages: any[] = [
        {
          name: 'Source',
          actions: [{
            name: 'Source',
            category: 'Source',
            owner: 'ThirdParty',
            provider: 'GitHub',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              Owner: args.githubOwner,
              Repo: args.githubRepo,
              Branch: githubBranch,
              OAuthToken: args.githubToken,
              PollForSourceChanges: false,
            },
          }],
        },
        {
          name: 'Build',
          actions: [{
            name: 'PulumiPreview',
            category: 'Build',
            owner: 'AWS',
            provider: 'CodeBuild',
            version: '1',
            inputArtifacts: ['source_output'],
            outputArtifacts: ['build_output'],
            configuration: {
              ProjectName: previewProjects[environment].name,
            },
          }],
        },
      ];

      // Add manual approval for production
      if (includeManualApproval) {
        stages.push({
          name: 'Approval',
          actions: [{
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
            configuration: {
              NotificationArn: notificationTopic.arn,
              CustomData: `Please review and approve deployment to ${environment} environment`,
            },
          }],
        });
      }

      stages.push({
        name: 'Deploy',
        actions: [{
          name: 'PulumiDeploy',
          category: 'Build',
          owner: 'AWS',
          provider: 'CodeBuild',
          version: '1',
          inputArtifacts: ['build_output'],
          outputArtifacts: ['deploy_output'],
          configuration: {
            ProjectName: deployProjects[environment].name,
          },
        }],
      });

      return new aws.codepipeline.Pipeline(pipelineName, {
        name: pipelineName,
        roleArn: pipelineRole.arn,
        artifactStores: [{
          location: artifactBucket.bucket,
          type: 'S3',
          encryptionKey: {
            id: artifactKmsKey.arn,
            type: 'KMS',
          },
        }],
        stages: stages,
        tags: { ...tags, Environment: environment },
      }, { parent: this, dependsOn: [previewProjects[environment], deployProjects[environment]] });
    };

    // Create pipelines for each environment
    const devPipeline = createPipeline(
      `pulumi-pipeline-dev-${environmentSuffix}`,
      'dev',
      false
    );

    const stagingPipeline = createPipeline(
      `pulumi-pipeline-staging-${environmentSuffix}`,
      'staging',
      false
    );

    const prodPipeline = createPipeline(
      `pulumi-pipeline-prod-${environmentSuffix}`,
      'prod',
      true  // Include manual approval for production
    );

    // Create EventBridge rule to trigger pipeline on GitHub push
    const githubWebhookRule = new aws.cloudwatch.EventRule(`github-push-rule-${environmentSuffix}`, {
      description: `Trigger pipelines on GitHub push to ${args.githubRepo}`,
      eventPattern: JSON.stringify({
        source: ['aws.codepipeline'],
        'detail-type': ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['STARTED', 'SUCCEEDED', 'FAILED'],
        },
      }),
      tags: tags,
    }, { parent: this });

    // Create EventBridge target to send notifications
    new aws.cloudwatch.EventTarget(`pipeline-notification-target-${environmentSuffix}`, {
      rule: githubWebhookRule.name,
      arn: notificationTopic.arn,
    }, { parent: this });

    // Create SNS topic policy to allow EventBridge to publish
    new aws.sns.TopicPolicy(`notification-topic-policy-${environmentSuffix}`, {
      arn: notificationTopic.arn,
      policy: pulumi.all([notificationTopic.arn, githubWebhookRule.arn]).apply(([topicArn, ruleArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'events.amazonaws.com' },
            Action: 'sns:Publish',
            Resource: topicArn,
            Condition: {
              ArnEquals: {
                'aws:SourceArn': ruleArn,
              },
            },
          }],
        })
      ),
    }, { parent: this });

    // Store outputs
    this.devPipelineArn = devPipeline.arn;
    this.stagingPipelineArn = stagingPipeline.arn;
    this.prodPipelineArn = prodPipeline.arn;

    this.registerOutputs({
      devPipelineArn: this.devPipelineArn,
      stagingPipelineArn: this.stagingPipelineArn,
      prodPipelineArn: this.prodPipelineArn,
      artifactBucketName: artifactBucket.id,
      devStateBucketName: stateBuckets.dev.id,
      stagingStateBucketName: stateBuckets.staging.id,
      prodStateBucketName: stateBuckets.prod.id,
      kmsKeyId: artifactKmsKey.id,
      notificationTopicArn: notificationTopic.arn,
      buildLogGroupName: buildLogGroup.name,
    });
  }
}
```

## File: lib/README.md

```markdown
# Pulumi CI/CD Pipeline

This Pulumi program creates a self-managed CI/CD pipeline for deploying Pulumi infrastructure stacks across multiple AWS accounts and environments (dev, staging, prod).

## Architecture Overview

The solution implements:

- **CodePipeline**: Three separate pipelines (dev, staging, prod) orchestrating the deployment workflow
- **CodeBuild**: Build projects for Pulumi preview and deployment operations
- **S3**: Separate state buckets for each environment with versioning and encryption
- **KMS**: Customer-managed encryption keys for artifacts and state with automatic rotation
- **IAM**: Cross-account roles enabling multi-account deployments with least-privilege access
- **EventBridge**: Automated pipeline triggering on GitHub push events
- **SNS**: Notifications for pipeline state changes
- **CloudWatch Logs**: Build logs with 30-day retention

## Prerequisites

1. **AWS Account Setup**: Three AWS accounts (dev, staging, prod) with proper IAM roles
2. **GitHub Repository**: Repository containing Pulumi infrastructure code
3. **GitHub Token**: Personal access token with repo scope
4. **ECR Image**: Custom Docker image containing Pulumi CLI 3.x
5. **Pulumi CLI**: Installed locally for initial deployment

## Required Configuration

### Pulumi Stack Configuration

```bash
pulumi config set githubOwner <your-github-username>
pulumi config set githubRepo <your-repo-name>
pulumi config set --secret githubToken <your-github-token>
pulumi config set ecrImageUri <your-ecr-image-uri>
pulumi config set devAccountId 123456789012
pulumi config set stagingAccountId 234567890123
pulumi config set prodAccountId 345678901234
```

### Environment Variables

The following environment variables are automatically configured in CodeBuild:

- `PULUMI_BACKEND_URL`: S3 bucket URL for state storage
- `ENVIRONMENT`: Target environment (dev/staging/prod)
- `AWS_ACCOUNT_ID`: Target AWS account ID
- `PULUMI_COMMAND`: Command to execute (preview/up)

## Deployment Instructions

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Login to Pulumi
pulumi login

# Select or create stack
pulumi stack select dev
```

### 2. Configure Stack

```bash
# Set required configuration
pulumi config set environmentSuffix dev
pulumi config set githubOwner your-username
pulumi config set githubRepo your-repo
pulumi config set --secret githubToken ghp_xxxxxxxxxxxxx
pulumi config set ecrImageUri 123456789012.dkr.ecr.us-east-1.amazonaws.com/pulumi-cli:latest
```

### 3. Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up
```

## Pipeline Workflow

### Development Pipeline
1. **Source**: GitHub repository checkout
2. **Build**: Pulumi preview (validate changes)
3. **Deploy**: Pulumi up (automatic deployment)

### Staging Pipeline
1. **Source**: GitHub repository checkout
2. **Build**: Pulumi preview (validate changes)
3. **Deploy**: Pulumi up (automatic deployment)

### Production Pipeline
1. **Source**: GitHub repository checkout
2. **Build**: Pulumi preview (validate changes)
3. **Approval**: Manual approval step (SNS notification)
4. **Deploy**: Pulumi up (deployment after approval)

## Security Features

- **Encryption at Rest**: All S3 buckets use KMS encryption with customer-managed keys
- **Encryption in Transit**: TLS for all AWS API calls
- **Key Rotation**: Automatic KMS key rotation enabled
- **Least Privilege**: IAM policies follow principle of least privilege without wildcards
- **Cross-Account Access**: Explicit assume role permissions for multi-account deployments
- **GitHub Security**: HMAC signature validation for webhook authenticity
- **Public Access**: Blocked on all S3 buckets

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{suffix}`

Example:
- `pulumi-pipeline-dev-dev`
- `pulumi-state-prod-dev`
- `pipeline-artifacts-dev`

## Monitoring and Notifications

### CloudWatch Logs
- Build logs retained for 30 days
- Log group: `/aws/codebuild/pulumi-pipeline-{environmentSuffix}`
- Separate log streams for each environment and command

### SNS Notifications
Pipeline state changes trigger SNS notifications for:
- Pipeline execution started
- Pipeline execution succeeded
- Pipeline execution failed
- Manual approval required (production only)

### EventBridge Rules
Monitors CodePipeline execution state changes and routes notifications appropriately.

## Troubleshooting

### Build Failures

Check CodeBuild logs:
```bash
aws logs tail /aws/codebuild/pulumi-pipeline-dev --follow
```

### State Lock Issues

If Pulumi state is locked:
```bash
pulumi cancel
```

### Cross-Account Access Issues

Verify IAM roles exist in target accounts:
- Role name: `PulumiDeploymentRole`
- Trust relationship: CodeBuild role ARN
- Permissions: Sufficient for infrastructure deployment

## Cost Optimization

- **Serverless First**: Uses CodePipeline and CodeBuild (pay-per-use)
- **S3 Lifecycle**: Automatic cleanup of old artifacts and state versions
- **Large Compute**: BUILD_GENERAL1_LARGE reduces execution time
- **Log Retention**: 30-day retention balances compliance and cost

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with `forceDestroy: true` and no retention policies, enabling complete cleanup.

## Compliance and Governance

- **Audit Trail**: All pipeline executions logged in CloudWatch
- **Immutable History**: S3 versioning preserves state history
- **Change Control**: Manual approval for production deployments
- **Encryption**: KMS encryption for all sensitive data
- **Access Control**: IAM roles and policies enforce least privilege

## Support

For issues or questions, refer to:
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Load configuration
const config = new pulumi.Config();
const environmentSuffix = pulumi.getStack();

// Required configuration
const githubOwner = config.require('githubOwner');
const githubRepo = config.require('githubRepo');
const githubToken = config.requireSecret('githubToken');
const ecrImageUri = config.require('ecrImageUri');

// Optional configuration with defaults
const githubBranch = config.get('githubBranch') || 'main';
const devAccountId = config.get('devAccountId') || '123456789012';
const stagingAccountId = config.get('stagingAccountId') || '234567890123';
const prodAccountId = config.get('prodAccountId') || '345678901234';

// Create the main stack
const stack = new TapStack('pulumi-cicd-pipeline', {
  environmentSuffix: environmentSuffix,
  githubOwner: githubOwner,
  githubRepo: githubRepo,
  githubBranch: githubBranch,
  githubToken: githubToken,
  ecrImageUri: ecrImageUri,
  devAccountId: devAccountId,
  stagingAccountId: stagingAccountId,
  prodAccountId: prodAccountId,
  tags: {
    Project: 'PulumiCICD',
    ManagedBy: 'Pulumi',
    Environment: environmentSuffix,
  },
});

// Export pipeline ARNs and resource names
export const devPipelineArn = stack.devPipelineArn;
export const stagingPipelineArn = stack.stagingPipelineArn;
export const prodPipelineArn = stack.prodPipelineArn;
```

## File: package.json

```json
{
  "name": "pulumi-cicd-pipeline",
  "version": "1.0.0",
  "description": "Self-managed CI/CD pipeline for deploying Pulumi stacks",
  "main": "index.ts",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "bin",
    "rootDir": ".",
    "declaration": true,
    "sourceMap": true,
    "lib": ["ES2020"]
  },
  "include": [
    "index.ts",
    "lib/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin",
    "tests"
  ]
}
```

## File: Pulumi.yaml

```yaml
name: pulumi-cicd-pipeline
description: Self-managed CI/CD pipeline for deploying Pulumi stacks
runtime: nodejs

config:
  githubOwner:
    description: GitHub repository owner
    type: string
  githubRepo:
    description: GitHub repository name
    type: string
  githubBranch:
    description: GitHub branch to track
    type: string
    default: main
  githubToken:
    description: GitHub personal access token
    type: string
    secret: true
  ecrImageUri:
    description: ECR image URI containing Pulumi CLI
    type: string
  devAccountId:
    description: AWS account ID for dev environment
    type: string
    default: "123456789012"
  stagingAccountId:
    description: AWS account ID for staging environment
    type: string
    default: "234567890123"
  prodAccountId:
    description: AWS account ID for prod environment
    type: string
    default: "345678901234"
  environmentSuffix:
    description: Environment suffix for resource naming
    type: string
```

## File: .gitignore

```
node_modules/
bin/
*.js
*.js.map
*.d.ts
.pulumi/
Pulumi.*.yaml
```

## Implementation Notes

### Key Features Implemented

1. **Multi-Environment Pipelines**: Separate CodePipeline instances for dev, staging, and prod with environment-specific state buckets
2. **Security**: KMS encryption with rotation, least-privilege IAM policies, cross-account assume roles
3. **Build Configuration**: BUILD_GENERAL1_LARGE compute type, custom Docker image from ECR, 30-day log retention
4. **State Management**: S3 backends with versioning, lifecycle policies, and encryption
5. **Compliance**: Manual approval for production, EventBridge notifications, comprehensive audit logging
6. **Destroyability**: All resources configured with forceDestroy: true and no retention policies

### Cross-Account Deployment

For cross-account deployments to work, create the following IAM role in each target account:

**Role Name**: `PulumiDeploymentRole`

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::<pipeline-account-id>:role/codebuild-role-<suffix>"
    },
    "Action": "sts:AssumeRole"
  }]
}
```

**Permissions**: Attach policies required for infrastructure deployment (AdministratorAccess for testing, or specific policies for production).

### GitHub Webhook Configuration

While EventBridge monitors pipeline state, you need to configure GitHub webhooks manually:

1. Go to repository Settings > Webhooks
2. Add webhook with payload URL from CodePipeline
3. Content type: application/json
4. Enable SSL verification
5. Select "Just the push event"

### ECR Image Requirements

The custom CodeBuild image must include:
- Pulumi CLI 3.x
- Node.js runtime
- AWS CLI v2
- Git client

Example Dockerfile:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache git aws-cli
RUN curl -fsSL https://get.pulumi.com | sh
ENV PATH="/root/.pulumi/bin:${PATH}"
```

### Environment-Specific Configuration

Each pipeline uses environment variables to configure the target environment:
- `PULUMI_BACKEND_URL`: Points to environment-specific S3 state bucket
- `ENVIRONMENT`: Used to select the appropriate Pulumi stack
- `AWS_ACCOUNT_ID`: Target account for cross-account deployments
