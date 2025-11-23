# MODEL FAILURES

#### 1. CodeBuild Cache Configuration Syntax Error

**Model Response:**
Used incorrect syntax for CodeBuild cache configuration with `codebuild.Cache.s3()` method that doesn't exist in the AWS CDK API.

**Actual Implementation:**
Fixed cache configuration to use the correct `codebuild.Cache.bucket()` method:

```typescript
cache: codebuild.Cache.bucket(artifactsBucket, {
  prefix: 'build-cache',
}),
```

This properly configures S3 bucket caching for CodeBuild with the correct API method and options object structure.

---

#### 2. IAM Role Tags Property Error

**Model Response:**
Attempted to add `tags` property directly to IAM Role constructor, which is not a valid property for `RoleProps` in AWS CDK.

**Actual Implementation:**
Removed the invalid `tags` property from the IAM Role constructor:

```typescript
// Removed invalid tags property
const ebInstanceRole = new iam.Role(this, 'EBInstanceRole', {
  roleName: resourceName('eb-instance-role'),
  assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'AWSElasticBeanstalkMulticontainerDocker'
    ),
  ],
  inlinePolicies: {
    CustomPolicy: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: ['*'],
        }),
      ],
    }),
  },
});
```

Tags should be applied at the construct level using `cdk.Tags.of(ebInstanceRole).add()` if needed, not as a Role property.

---

#### 3. Secrets Manager Rotation Schedule Configuration Error

**Model Response:**
Used incorrect method `secretsmanager.RotationSchedule.hostedRotation()` which doesn't exist in the AWS CDK API for configuring secret rotation.

**Actual Implementation:**
Fixed rotation configuration to use the correct `hostedRotation` property directly on the `RotationSchedule` constructor:

```typescript
new secretsmanager.RotationSchedule(this, 'DbSecretRotation', {
  secret: this.dbSecret,
  hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
  automaticallyAfter: cdk.Duration.days(30),
});
```

The `hostedRotation` is a property of `RotationScheduleProps`, not a method on the `RotationSchedule` class. This properly configures automatic secret rotation using AWS managed rotation for MySQL single-user credentials.

---

#### 4. Elastic Beanstalk Solution Stack Name Error

**Model Response:**
Used outdated Elastic Beanstalk solution stack name `'64bit Amazon Linux 2023 v4.0.0 running Docker'` which is not available in AWS.

**Actual Implementation:**
Fixed solution stack name to use the currently available version:

```typescript
solutionStackName: '64bit Amazon Linux 2023 v4.7.2 running Docker',
```

The solution stack name was updated from `v4.0.0` to `v4.7.2` based on the available solution stacks returned by AWS CLI command `aws elasticbeanstalk list-available-solution-stacks`. This ensures the Elastic Beanstalk environment can be created successfully with a valid platform version.

---

#### 5. Elastic Beanstalk Managed Actions Configuration Error

**Model Response:**
Enabled managed actions with `ManagedActionsEnabled: 'true'` but failed to provide the required `PreferredStartTime` configuration option.

**Actual Implementation:**
Added the missing `PreferredStartTime` option when managed actions are enabled:

```typescript
{
  namespace: 'aws:elasticbeanstalk:managedactions',
  optionName: 'ManagedActionsEnabled',
  value: 'true',
},
{
  namespace: 'aws:elasticbeanstalk:managedactions',
  optionName: 'PreferredStartTime',
  value: 'Sun:10:00',
},
{
  namespace: 'aws:elasticbeanstalk:managedactions:platformupdate',
  optionName: 'UpdateLevel',
  value: 'minor',
},
```

AWS Elastic Beanstalk requires `PreferredStartTime` to be configured when `ManagedActionsEnabled` is set to `true`. The value `'Sun:10:00'` schedules managed platform updates for Sunday at 10:00 AM UTC, which is typically a low-traffic maintenance window.

---

#### 6. Missing CloudFormation Outputs for Resource Interaction

**Model Response:**
Failed to add CloudFormation outputs to any of the CDK constructs, making it impossible to interact with deployed resources or troubleshoot pipeline issues.

**Actual Implementation:**
Added comprehensive outputs to all constructs for better resource management:

**CodePipelineStack outputs:**

```typescript
new cdk.CfnOutput(this, 'PipelineName', {
  value: this.pipeline.pipelineName,
  description: 'Name of the CodePipeline',
  exportName: `${resourceName('pipeline-name')}`,
});
// ... additional outputs for buckets, roles, etc.
```

**BuildStage outputs:**

```typescript
new cdk.CfnOutput(this, 'BuildProjectName', {
  value: this.buildProject.projectName,
  description: 'Name of the CodeBuild build project',
  exportName: `${resourceName('build-project-name')}`,
});
// ... additional outputs for test project, roles, etc.
```

**DeployStage outputs:**

```typescript
new cdk.CfnOutput(this, 'EnvironmentUrl', {
  value: this.environment.attrEndpointUrl,
  description: 'URL of the Elastic Beanstalk environment',
  exportName: `${resourceName('eb-environment-url')}`,
});
// ... additional outputs for application, environment, SNS topic, etc.
```

**SecurityConfig outputs:**

```typescript
new cdk.CfnOutput(this, 'DatabaseSecretArn', {
  value: this.dbSecret.secretArn,
  description: 'ARN of the database credentials secret',
  exportName: `${resourceName('db-secret-arn')}`,
});
// ... additional outputs for secrets, parameter store paths, etc.
```

These outputs enable programmatic access to deployed resources, facilitate troubleshooting, and allow for automated testing and interaction with the infrastructure.

---

#### 7. CodePipeline Artifact Management Issue

**Model Response:**
CodePipeline failed because no source artifacts were available in S3, but provided no mechanism to upload test artifacts for pipeline validation.

**Actual Implementation:**
Created comprehensive artifact upload script `scripts/upload-test-artifacts.sh` that:

- Automatically discovers deployed pipeline resources using CloudFormation outputs
- Creates a complete test application with TypeScript, Docker, and test files
- Generates proper `Dockerrun.aws.json` for Elastic Beanstalk deployment
- Uploads artifacts to the correct S3 source bucket to trigger the pipeline
- Provides monitoring links and status information

The script includes proper error handling, colored output, and creates a realistic application structure that will successfully pass through the entire CI/CD pipeline for testing purposes.

---

#### 8. Missing Application Structure for Complete Solution

**Model Response:**
Failed to create a proper application structure with actual code to build and deploy, making the pipeline incomplete and unrealistic.

**Actual Implementation:**
Created a complete application structure in `lib/app/` with:

**Simple Express Application (`lib/app/src/index.ts`):**

```typescript
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IAC Test Automations API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
```

**Complete Application Structure:**

- `lib/app/package.json` - Minimal dependencies (express only)
- `lib/app/tsconfig.json` - TypeScript configuration
- `lib/app/Dockerfile` - Multi-stage Docker build
- `lib/app/src/index.ts` - Single-file Express application

**Updated Build Pipeline:**

```typescript
build: {
  commands: [
    'echo Building TypeScript application...',
    'cd lib/app && npm ci && npm run build',
    'echo Building Docker image...',
    'cd lib/app && docker build -t $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG .',
    // ... rest of build commands
  ],
},
```

This creates a realistic, deployable application that demonstrates the complete CI/CD pipeline working with actual TypeScript code, Docker containerization, and AWS deployment.

---

#### 9. Unused Import in Lambda Function

**Model Response:**
Created a Slack notifier Lambda function with an unused `CodePipelineClient` import that was imported and instantiated but never actually used in the code.

**Actual Implementation:**
Removed the unused import and instantiation:

```typescript
// Before (unused):
import { CodePipelineClient } from '@aws-sdk/client-codepipeline';
const codepipelineClient = new CodePipelineClient({});

// After (cleaned up):
import { Context, SNSEvent } from 'aws-lambda';
import axios from 'axios';
```

The Lambda function now only imports what it actually uses:

- `Context` and `SNSEvent` from AWS Lambda for proper typing
- `axios` for making HTTP requests to Slack webhook

This keeps the code clean and reduces bundle size by removing unused dependencies.

---

#### 10. Deprecated Lambda LogRetention Usage

**Model Response:**
Used deprecated `logRetention` property in Lambda function configuration, which generates deprecation warnings and will be removed in future CDK versions.

**Actual Implementation:**
Replaced deprecated `logRetention` with the new `logGroup` approach:

```typescript
// Before (deprecated):
logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,

// After (current approach):
logGroup: new cdk.aws_logs.LogGroup(this, 'NotificationLambdaLogGroup', {
  logGroupName: `/aws/lambda/${resourceName('notification-lambda')}`,
  retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
  removalPolicy: props.removalPolicy,
}),
```

The new approach provides:

- Explicit log group creation with proper naming
- Better control over log group properties
- Removal policy configuration for proper cleanup
- Future-proof code that won't break with CDK updates

This eliminates the deprecation warnings and ensures compatibility with future CDK versions.

---

#### 11. Invalid Docker Runtime Configuration in CodeBuild

**Model Response:**
Specified `docker: '24'` in CodeBuild runtime-versions, but Docker is not a runtime - it's a tool that needs to be available in the build environment, causing YAML_FILE_ERROR.

**Actual Implementation:**
Removed the invalid Docker runtime specification:

```typescript
// Before (invalid):
'runtime-versions': {
  nodejs: '18',
  docker: '24',  // ❌ Docker is not a runtime
},

// After (correct):
'runtime-versions': {
  nodejs: '18',
},
```

Docker is available in CodeBuild through:

- Privileged mode (`privileged: true`)
- Pre-installed Docker in the build image
- No need to specify it as a runtime version

The build environment already has Docker available when `privileged: true` is set, so specifying it as a runtime version causes the build to fail with "Unknown runtime named 'docker'".

---

#### 12. Missing Application Directory Structure

**Model Response:**
Failed to include the complete `lib/app/` directory structure with actual application code, making the pipeline incomplete and unable to build/deploy a real application.

**Actual Implementation:**
Added complete application structure in `lib/app/` directory:

```
lib/app/
├── Dockerfile              # Multi-stage Docker build
├── package.json            # Application dependencies
├── tsconfig.json           # TypeScript configuration
└── src/
    └── index.ts            # Express application entrypoint
```

**Complete Application Code (`lib/app/src/index.ts`):**

```typescript
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IAC Test Automations API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
```

**Application Package.json (`lib/app/package.json`):**

```json
{
  "name": "iac-test-automations-app",
  "version": "1.0.0",
  "description": "TypeScript Express application for IAC test automations",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "echo 'No tests specified'",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "clean": "rm -rf dist"
  },
  "keywords": ["typescript", "express", "aws", "cdk", "infrastructure"],
  "author": "IAC Test Automations",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

This creates a realistic, deployable application that demonstrates the complete CI/CD pipeline working with actual TypeScript code, Docker containerization, and AWS deployment.

---

#### 13. Missing ECR Repository Integration

**Model Response:**
Failed to include ECR repository creation and integration in the CodePipeline stack, making Docker image storage and deployment impossible.

**Actual Implementation:**
Added ECR repository creation and proper integration:

```typescript
// Create ECR repository for Docker images
this.ecrRepository = new ecr.Repository(this, 'EcrRepository', {
  repositoryName: resourceName('app-images'),
  imageTagMutability: ecr.TagMutability.MUTABLE,
  emptyOnDelete: removalPolicy === cdk.RemovalPolicy.DESTROY,
  imageScanOnPush: true,
  lifecycleRules: [
    {
      maxImageCount: 10,
      rulePriority: 1,
    },
  ],
  removalPolicy,
});

// Grant ECR permissions to CodeBuild role
this.ecrRepository.grantPullPush(buildStage.buildProject.role!);
```

**Updated Build Stage with ECR Integration:**

```typescript
environmentVariables: {
  AWS_ACCOUNT_ID: { value: cdk.Aws.ACCOUNT_ID },
  AWS_REGION: { value: cdk.Aws.REGION },
  ENVIRONMENT: { value: config.environmentSuffix },
  IMAGE_TAG: { value: 'latest' },
  DOCKER_REGISTRY: {
    value: `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com`,
  },
  ECR_REPOSITORY_URI: { value: ecrRepository.repositoryUri },
  IMAGE_REPO: { value: ecrRepository.repositoryName },
},
```

This enables proper Docker image storage, versioning, and deployment through ECR integration with the CI/CD pipeline.

---

#### 14. Missing Source Code Deployment Mechanism

**Model Response:**
Failed to provide a mechanism to deploy source code to the S3 source bucket, making the pipeline unable to trigger automatically.

**Actual Implementation:**
Added source code deployment using S3 BucketDeployment:

```typescript
private deploySourceCode(sourcePath: string): s3_deployment.BucketDeployment {
  const deploySourceCode = new s3_deployment.BucketDeployment(
    this,
    'DeploySourceCode',
    {
      sources: [s3_deployment.Source.asset(sourcePath)],
      destinationBucket: this.sourceBucket,
      extract: false,
      prune: false,
    }
  );
  return deploySourceCode;
}

// Usage in constructor:
const deploySourceCode = this.deploySourceCode(props.appSourcePath);

// Updated S3SourceAction with proper bucket key:
new codepipeline_actions.S3SourceAction({
  actionName: 'S3Source',
  bucket: sourceBucket,
  bucketKey: cdk.Fn.select(0, deploySourceCode.objectKeys),
  output: sourceOutput,
  trigger: codepipeline_actions.S3Trigger.EVENTS,
}),
```

This automatically deploys the application source code to the S3 source bucket, enabling the pipeline to trigger and process the actual application code.

---

#### 15. Missing SlackNotifier Integration in Main Stack

**Model Response:**
Failed to properly integrate the SlackNotifier construct in the main TapStack, making Slack notifications non-functional.

**Actual Implementation:**
Added proper SlackNotifier integration in TapStack:

```typescript
import { SlackNotifier } from './monitoring/notifications';

// In TapStack constructor:
let slackNotifier: SlackNotifier | undefined = undefined;

if (slackWebhookUrl) {
  slackNotifier = new SlackNotifier(this, 'SlackNotifier', {
    config,
    slackWebhookUrl,
    removalPolicy,
  });
}

// Pass notificationLambda to pipeline and monitoring:
const pipeline = new CodePipelineStack(this, 'Pipeline', {
  config,
  removalPolicy,
  securityConfig,
  appSourcePath: path.join(__dirname, 'app'),
  notificationLambda: slackNotifier?.notificationLambda,
});

new MonitoringStack(this, 'Monitoring', {
  config,
  pipeline: pipeline.pipeline,
  removalPolicy,
  notificationLambda: slackNotifier?.notificationLambda,
});
```

This ensures Slack notifications are properly configured and integrated throughout the entire pipeline infrastructure.

---

#### 16. Missing Path Import in Main Stack

**Model Response:**
Failed to import the `path` module needed for constructing the application source path, causing TypeScript compilation errors.

**Actual Implementation:**
Added missing path import:

```typescript
import path from 'path';

// Usage:
appSourcePath: path.join(__dirname, 'app'),
```

This enables proper path construction for the application source directory, ensuring the pipeline can locate and deploy the application code.

---

#### 17. Missing Lambda Package.json File

**Model Response:**
Failed to include the `lib/lambda/package.json` file needed for Lambda function dependencies, making the Slack notifier Lambda unable to install required packages.

**Actual Implementation:**
Added Lambda package.json file:

```json
{
  "name": "slack-notifier-lambda",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-codepipeline": "^3.400.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.5.0",
    "esbuild": "^0.19.2"
  }
}
```

This provides the necessary dependencies for the Slack notification Lambda function to operate correctly.

---

#### 18. Missing Context Parameter Usage in Lambda Handler

**Model Response:**
Failed to properly handle the unused `context` parameter in the Lambda handler, causing ESLint warnings and poor code quality.

**Actual Implementation:**
Added proper ESLint disable comment for unused parameter:

```typescript
export const handler = async (
  event: SNSEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: Context
): Promise<void> => {
```

This follows best practices for handling unused parameters in Lambda functions while maintaining proper TypeScript typing.

---

#### 19. Missing Source-Map-Support Import in bin/tap.ts

**Model Response:**
Failed to include `source-map-support/register` import in the bin/tap.ts file, making stack traces less readable during debugging.

**Actual Implementation:**
Added source-map-support import:

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
```

This improves debugging experience by providing readable stack traces with proper source map support.

---

#### 20. Missing Comprehensive bin/tap.ts Implementation

**Model Response:**
Provided a simplified bin/tap.ts that only shows hardcoded environment examples, missing the dynamic context-based configuration approach.

**Actual Implementation:**
Added comprehensive bin/tap.ts with dynamic configuration:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

This provides a more flexible and production-ready CDK app entry point that can be used across different environments and CI/CD pipelines.

---

#### 21. Missing KMS Permissions for EBS Volume Encryption

**Model Response:**
Failed to include KMS permissions in the EC2 instance role, causing instance launch failures when EBS volumes are encrypted with KMS keys. The error message indicates "One or more of the attached Amazon EBS volumes are encrypted with an inaccessible AWS KMS key."

**Actual Implementation:**
Added comprehensive KMS permissions to the EC2 instance role's inline policy to allow decryption of EBS volumes encrypted with any KMS key in the account:

```typescript
new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'kms:CreateGrant',
    'kms:Decrypt',
    'kms:DescribeKey',
    'kms:GenerateDataKeyWithoutPlainText',
    'kms:ReEncrypt',
  ],
  resources: [
    `arn:aws:kms:*:${cdk.Stack.of(this).account}:key/*`,
  ],
}),
```

This solution:

- Grants all required KMS permissions for EBS volume encryption/decryption
- Uses a wildcard pattern (`*`) for region to work across all AWS regions
- Dynamically resolves the account ID using `cdk.Stack.of(this).account` instead of hardcoding
- Allows any KMS key (`key/*`) within the account without specifying a specific key ARN
- Prevents "inaccessible AWS KMS key" errors during EC2 instance launches when default EBS encryption is enabled at the account level

The permissions are added to the `EBInstanceRole` inline policy, ensuring all EC2 instances launched by Elastic Beanstalk can properly decrypt attached EBS volumes regardless of which KMS key was used for encryption.
