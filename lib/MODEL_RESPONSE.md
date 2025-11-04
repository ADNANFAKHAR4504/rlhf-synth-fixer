# Multi-Environment Data Processing Pipeline - CDKTF Implementation

This implementation creates a data processing pipeline that can be deployed across multiple environments (dev, staging, prod) using CDKTF with TypeScript. The solution uses a single stack definition that adapts based on environment context.

## Architecture Overview

The infrastructure includes:
- S3 buckets for data storage (environment-specific naming)
- DynamoDB table for job tracking (environment-specific capacity)
- Lambda functions for data processing (environment-specific memory)
- IAM roles with cross-environment access restrictions
- CloudWatch log groups with environment-specific retention

## Implementation

### File: lib/environment-config.ts

```typescript
/**
 * Environment-specific configuration interface
 */
export interface EnvironmentConfig {
  environment: string;
  dynamodbReadCapacity: number;
  dynamodbWriteCapacity: number;
  lambdaMemorySize: number;
  logRetentionDays: number;
}

/**
 * Get configuration for a specific environment
 */
export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const configs: { [key: string]: EnvironmentConfig } = {
    dev: {
      environment: 'dev',
      dynamodbReadCapacity: 5,
      dynamodbWriteCapacity: 5,
      lambdaMemorySize: 128,
      logRetentionDays: 7,
    },
    staging: {
      environment: 'staging',
      dynamodbReadCapacity: 10,
      dynamodbWriteCapacity: 10,
      lambdaMemorySize: 256,
      logRetentionDays: 30,
    },
    prod: {
      environment: 'prod',
      dynamodbReadCapacity: 25,
      dynamodbWriteCapacity: 25,
      lambdaMemorySize: 512,
      logRetentionDays: 90,
    },
  };

  if (!configs[env]) {
    throw new Error(
      `Invalid environment: ${env}. Must be one of: dev, staging, prod`
    );
  }

  return configs[env];
}

/**
 * Validate environment name
 */
export function validateEnvironment(env: string): void {
  const validEnvironments = ['dev', 'staging', 'prod'];
  if (!validEnvironments.includes(env)) {
    throw new Error(
      `Invalid environment: ${env}. Must be one of: ${validEnvironments.join(', ')}`
    );
  }
}
```

### File: lib/data-processing-stack.ts

```typescript
import { TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { getEnvironmentConfig, validateEnvironment } from './environment-config';

interface DataProcessingStackProps {
  environmentSuffix: string;
  environment: string;
  awsRegion: string;
}

export class DataProcessingStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: DataProcessingStackProps) {
    super(scope, id);

    const { environmentSuffix, environment, awsRegion } = props;

    // Validate environment
    validateEnvironment(environment);

    // Get environment-specific configuration
    const config = getEnvironmentConfig(environment);

    // Initialize Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // Project name for tagging
    const projectName = 'data-processing-pipeline';

    /**
     * S3 Bucket for Data Storage
     * Environment-specific naming with environmentSuffix for uniqueness
     */
    const dataBucket = new S3Bucket(this, 'DataBucket', {
      bucket: `company-data-${environment}-${environmentSuffix}`,
      forceDestroy: true, // Allow destruction for CI/CD
      tags: {
        Name: `company-data-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Enable versioning on the S3 bucket
    new S3BucketVersioningA(this, 'DataBucketVersioning', {
      bucket: dataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'DataBucketEncryption',
      {
        bucket: dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    /**
     * DynamoDB Table for Job Tracking
     * Environment-specific capacity based on configuration
     */
    const jobTable = new DynamodbTable(this, 'JobTable', {
      name: `job-tracking-${environment}-${environmentSuffix}`,
      billingMode: 'PROVISIONED',
      readCapacity: config.dynamodbReadCapacity,
      writeCapacity: config.dynamodbWriteCapacity,
      hashKey: 'jobId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'jobId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
        {
          name: 'status',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'StatusIndex',
          hashKey: 'status',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
          readCapacity: config.dynamodbReadCapacity,
          writeCapacity: config.dynamodbWriteCapacity,
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `job-tracking-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    /**
     * IAM Role for Lambda Function
     * Includes cross-environment access restrictions
     */
    const lambdaRole = new IamRole(this, 'LambdaRole', {
      name: `data-processor-role-${environment}-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `data-processor-role-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    /**
     * IAM Policy with Cross-Environment Access Restrictions
     * Explicitly denies access to resources from other environments
     */
    const lambdaPolicy = new IamPolicy(this, 'LambdaPolicy', {
      name: `data-processor-policy-${environment}-${environmentSuffix}`,
      description: `Policy for data processor Lambda in ${environment} environment with cross-environment restrictions`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          // Allow access to S3 bucket in current environment
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: [`${dataBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: [dataBucket.arn],
          },
          // Deny access to S3 buckets from other environments
          {
            Effect: 'Deny',
            Action: ['s3:*'],
            Resource: ['arn:aws:s3:::company-data-*'],
            Condition: {
              StringNotEquals: {
                's3:ExistingObjectTag/Environment': environment,
              },
            },
          },
          // Allow access to DynamoDB table in current environment
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [jobTable.arn, `${jobTable.arn}/index/*`],
          },
          // Deny access to DynamoDB tables from other environments
          {
            Effect: 'Deny',
            Action: ['dynamodb:*'],
            Resource: ['arn:aws:dynamodb:*:*:table/job-tracking-*'],
            Condition: {
              StringNotEquals: {
                'dynamodb:LeadingKeys': [`${environment}-*`],
              },
            },
          },
          // Allow CloudWatch Logs
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: ['arn:aws:logs:*:*:*'],
          },
        ],
      }),
      tags: {
        Name: `data-processor-policy-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'LambdaPolicyAttachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    /**
     * CloudWatch Log Group with Environment-Specific Retention
     */
    const logGroup = new CloudwatchLogGroup(this, 'LambdaLogGroup', {
      name: `/aws/lambda/data-processor-${environment}-${environmentSuffix}`,
      retentionInDays: config.logRetentionDays,
      tags: {
        Name: `data-processor-logs-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    /**
     * Lambda Function Code Package
     */
    const lambdaArchive = new DataArchiveFile(this, 'LambdaArchive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda`,
      outputPath: `${__dirname}/.build/lambda-${environment}-${environmentSuffix}.zip`,
    });

    /**
     * Lambda Function for Data Processing
     * Environment-specific memory allocation
     */
    const dataProcessor = new LambdaFunction(this, 'DataProcessor', {
      functionName: `data-processor-${environment}-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      memorySize: config.lambdaMemorySize,
      timeout: 300,
      environment: {
        variables: {
          ENVIRONMENT: environment,
          BUCKET_NAME: dataBucket.bucket,
          TABLE_NAME: jobTable.name,
          AWS_REGION: awsRegion,
        },
      },
      tags: {
        Name: `data-processor-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Ensure log group is created before Lambda function
    dataProcessor.addOverride('depends_on', [logGroup]);

    /**
     * Stack Outputs
     * Clearly identify deployed resources per environment
     */
    new TerraformOutput(this, 'BucketName', {
      value: dataBucket.bucket,
      description: `S3 bucket name for ${environment} environment`,
    });

    new TerraformOutput(this, 'BucketArn', {
      value: dataBucket.arn,
      description: `S3 bucket ARN for ${environment} environment`,
    });

    new TerraformOutput(this, 'TableName', {
      value: jobTable.name,
      description: `DynamoDB table name for ${environment} environment`,
    });

    new TerraformOutput(this, 'TableArn', {
      value: jobTable.arn,
      description: `DynamoDB table ARN for ${environment} environment`,
    });

    new TerraformOutput(this, 'LambdaFunctionName', {
      value: dataProcessor.functionName,
      description: `Lambda function name for ${environment} environment`,
    });

    new TerraformOutput(this, 'LambdaFunctionArn', {
      value: dataProcessor.arn,
      description: `Lambda function ARN for ${environment} environment`,
    });

    new TerraformOutput(this, 'LogGroupName', {
      value: logGroup.name,
      description: `CloudWatch log group name for ${environment} environment`,
    });

    new TerraformOutput(this, 'Environment', {
      value: environment,
      description: 'Deployed environment name',
    });

    new TerraformOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for resource uniqueness',
    });
  }
}
```

### File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataProcessingStack } from './data-processing-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// AWS Region override for this specific task
const AWS_REGION_OVERRIDE = 'ap-southeast-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Get environment from context or environment variable
    const environment =
      this.node.tryGetContext('env') ||
      process.env.ENVIRONMENT ||
      environmentSuffix.replace(/[^a-z]/g, '') ||
      'dev';

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate the Data Processing Stack
    new DataProcessingStack(this, 'DataProcessing', {
      environmentSuffix,
      environment,
      awsRegion,
    });
  }
}
```

### File: lib/lambda/index.js

```javascript
/**
 * Data Processing Lambda Function
 * Processes data from S3 and tracks jobs in DynamoDB
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log(`Processing event in ${ENVIRONMENT} environment`, JSON.stringify(event, null, 2));

  try {
    const jobId = generateJobId();
    const timestamp = Date.now();

    // Create job tracking entry
    await createJobEntry(jobId, timestamp, 'STARTED');

    // Process data (example implementation)
    const result = await processData(event);

    // Update job status
    await updateJobEntry(jobId, timestamp, 'COMPLETED', result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processing completed successfully',
        jobId,
        environment: ENVIRONMENT,
        result,
      }),
    };
  } catch (error) {
    console.error('Error processing data:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Data processing failed',
        error: error.message,
        environment: ENVIRONMENT,
      }),
    };
  }
};

/**
 * Generate unique job ID
 */
function generateJobId() {
  return `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create job tracking entry in DynamoDB
 */
async function createJobEntry(jobId, timestamp, status) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      jobId: { S: jobId },
      timestamp: { N: timestamp.toString() },
      status: { S: status },
      environment: { S: ENVIRONMENT },
      createdAt: { S: new Date().toISOString() },
    },
  };

  await dynamoClient.send(new PutItemCommand(params));
  console.log(`Created job entry: ${jobId} with status: ${status}`);
}

/**
 * Update job tracking entry
 */
async function updateJobEntry(jobId, timestamp, status, result) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      jobId: { S: jobId },
      timestamp: { N: timestamp.toString() },
      status: { S: status },
      environment: { S: ENVIRONMENT },
      completedAt: { S: new Date().toISOString() },
      result: { S: JSON.stringify(result) },
    },
  };

  await dynamoClient.send(new PutItemCommand(params));
  console.log(`Updated job entry: ${jobId} to status: ${status}`);
}

/**
 * Process data (example implementation)
 */
async function processData(event) {
  // Example data processing logic
  const data = {
    processedAt: new Date().toISOString(),
    environment: ENVIRONMENT,
    eventType: event.eventType || 'unknown',
    recordCount: event.records?.length || 0,
  };

  // Simulate processing work
  await new Promise((resolve) => setTimeout(resolve, 100));

  return data;
}
```

### File: lib/lambda/package.json

```json
{
  "name": "data-processor",
  "version": "1.0.0",
  "description": "Data processing Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.454.0",
    "@aws-sdk/client-dynamodb": "^3.454.0"
  }
}
```

### File: bin/tap.ts

```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'ap-southeast-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Get environment from context (for multi-environment deployment)
const environment = app.node.tryGetContext('env') || 'dev';

// Calculate the stack name with environment identifier
const stackName = `TapStack-${environment}-${environmentSuffix}`;

// defaultTags is structured in adherence to the AwsProviderDefaultTags interface
const defaultTags: import('@cdktf/provider-aws/lib/provider').AwsProviderDefaultTags[] =
  [
    {
      tags: {
        Environment: environment,
        EnvironmentSuffix: environmentSuffix,
        Repository: repositoryName,
        CommitAuthor: commitAuthor,
        Project: 'data-processing-pipeline',
      },
    },
  ];

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
```

### File: lib/README.md

```markdown
# Multi-Environment Data Processing Pipeline

This CDKTF TypeScript application deploys a data processing pipeline that maintains consistency across multiple environments (dev, staging, prod).

## Architecture

The infrastructure includes:

- **S3 Buckets**: Environment-specific data storage with versioning and encryption
- **DynamoDB Table**: Job tracking with environment-specific capacity and GSI
- **Lambda Functions**: Data processors with environment-specific memory allocation
- **IAM Roles**: Least privilege access with cross-environment restrictions
- **CloudWatch Logs**: Environment-specific retention policies

## Environment Configuration

Each environment has specific configurations:

### Dev Environment
- DynamoDB: 5 RCU / 5 WCU
- Lambda Memory: 128 MB
- Log Retention: 7 days

### Staging Environment
- DynamoDB: 10 RCU / 10 WCU
- Lambda Memory: 256 MB
- Log Retention: 30 days

### Production Environment
- DynamoDB: 25 RCU / 25 WCU
- Lambda Memory: 512 MB
- Log Retention: 90 days

## Deployment

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials
- CDKTF CLI: `npm install -g cdktf-cli`
- Terraform >= 1.0

### Deploy to Dev Environment

```bash
export ENVIRONMENT_SUFFIX="dev-pr123"
cdktf deploy --context env=dev
```

### Deploy to Staging Environment

```bash
export ENVIRONMENT_SUFFIX="staging-pr123"
cdktf deploy --context env=staging
```

### Deploy to Production Environment

```bash
export ENVIRONMENT_SUFFIX="prod"
cdktf deploy --context env=prod
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{environmentSuffix}`

Examples:
- S3 Bucket: `company-data-dev-pr123`
- DynamoDB Table: `job-tracking-staging-pr456`
- Lambda Function: `data-processor-prod-v1`

## Security Features

### Cross-Environment Access Restrictions

IAM policies explicitly deny access to resources from other environments using:
- S3 object tags for environment verification
- DynamoDB condition keys for table access control
- Resource-based policies with environment filters

### Encryption

- S3: Server-side encryption (AES256) enabled
- DynamoDB: Encryption at rest enabled
- CloudWatch Logs: Encrypted by default

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Stack Outputs

After deployment, the following outputs are available:

- `BucketName`: S3 bucket name
- `BucketArn`: S3 bucket ARN
- `TableName`: DynamoDB table name
- `TableArn`: DynamoDB table ARN
- `LambdaFunctionName`: Lambda function name
- `LambdaFunctionArn`: Lambda function ARN
- `LogGroupName`: CloudWatch log group name
- `Environment`: Deployed environment
- `EnvironmentSuffix`: Environment suffix for uniqueness

## Cleanup

Destroy the infrastructure:

```bash
cdktf destroy --context env=dev
```

Note: All resources are created without deletion protection for CI/CD compatibility.
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build Lambda function:
   ```bash
   cd lib/lambda && npm install && cd ../..
   ```

3. Deploy to desired environment:
   ```bash
   # Dev
   cdktf deploy --context env=dev

   # Staging
   cdktf deploy --context env=staging

   # Production
   cdktf deploy --context env=prod
   ```

## Key Features

1. **Single Codebase**: One stack definition that adapts based on context
2. **Environment Isolation**: Complete separation between dev/staging/prod
3. **Configuration Management**: Environment-specific sizing and retention
4. **Security**: Cross-environment access explicitly denied
5. **Observability**: Environment-specific CloudWatch logging
6. **Tagging**: Consistent tags across all resources
7. **Destroyable**: All resources can be destroyed for CI/CD workflows
