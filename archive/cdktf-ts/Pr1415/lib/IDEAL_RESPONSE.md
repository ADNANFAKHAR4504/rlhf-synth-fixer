I'll create a serverless AWS environment using CDK for Terraform (TypeScript) with the specified requirements. Here are the two files:

## `modules.ts`

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

/**
 * Configuration interface for Lambda function module
 */
export interface LambdaModuleConfig {
  functionName: string;
  s3BucketName: string; // bucket where the zip is stored
  s3Key: string; // key of the zip file
  vpcId: string;
  runtime?: string;
  timeout?: number;
  memorySize?: number;
  environment?: { [key: string]: string };
}

/**
 * Configuration interface for S3 bucket module
 */
export interface S3ModuleConfig {
  bucketName: string;
  lambdaFunctionArn: string;
  lambdaFunction: LambdaFunction; // optional: pass instance
}

/**
 * Reusable Lambda function module with VPC integration and CloudWatch logging
 * This module creates a Lambda function with proper IAM roles, VPC configuration,
 * and CloudWatch log group following AWS best practices
 */
export class LambdaModule extends Construct {
  public readonly function: LambdaFunction;
  public readonly role: IamRole;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: LambdaModuleConfig) {
    super(scope, id);

    // Get VPC data for subnet configuration
    // const vpc = new DataAwsVpc(this, 'vpc', {
    //   id: config.vpcId,
    // });

    // Get private subnets for Lambda VPC configuration
    const subnets = new DataAwsSubnets(this, 'subnets', {
      filter: [
        {
          name: 'vpc-id',
          values: [config.vpcId],
        },
        {
          name: 'tag:Type', // Assuming subnets are tagged with Type=private
          values: ['private'],
        },
      ],
    });

    // CloudWatch Log Group for Lambda function logs
    // Retention set to 14 days to balance cost and debugging needs
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/corp-${config.functionName}`,
      retentionInDays: 14,
      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },
    });

    // IAM assume role policy document for Lambda service
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['lambda.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    // IAM role for Lambda function with corporate naming convention
    this.role = new IamRole(this, 'lambda-role', {
      name: `corp-${config.functionName}-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },
    });

    // Custom IAM policy for S3 bucket access and CloudWatch logging
    const lambdaPolicy = new DataAwsIamPolicyDocument(this, 'lambda-policy', {
      statement: [
        {
          // S3 read permissions for the specific bucket
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: [`arn:aws:s3:::corp-${config.s3BucketName}/*`],
        },
        {
          // CloudWatch Logs permissions for function logging
          effect: 'Allow',
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [`${this.logGroup.arn}:*`],
        },
        {
          // VPC permissions required for Lambda VPC integration
          effect: 'Allow',
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
            'ec2:AttachNetworkInterface',
            'ec2:DetachNetworkInterface',
          ],
          resources: ['*'],
        },
      ],
    });

    // Attach custom policy to Lambda role
    new IamRolePolicy(this, 'lambda-policy-attachment', {
      name: `corp-${config.functionName}-policy`,
      role: this.role.id,
      policy: lambdaPolicy.json,
    });

    // Attach AWS managed VPC execution role for Lambda
    new IamRolePolicyAttachment(this, 'vpc-execution-role', {
      role: this.role.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Lambda function with VPC configuration and best practices
    this.function = new LambdaFunction(this, 'function', {
      functionName: `corp-${config.functionName}`,
      role: this.role.arn,
      handler: 'index.handler',
      runtime: config.runtime || 'python3.9',
      s3Bucket: config.s3BucketName,
      s3Key: config.s3Key,

      // Performance and cost optimization settings
      timeout: config.timeout || 30, // 30 seconds default, sufficient for most image processing
      memorySize: config.memorySize || 256, // 256MB default, can be adjusted based on workload

      // VPC configuration for secure network access
      vpcConfig: {
        subnetIds: subnets.ids,
        securityGroupIds: [], // Should be provided via variables in production
      },

      // Environment variables for runtime configuration
      environment: {
        variables: {
          LOG_LEVEL: 'INFO',
          S3_BUCKET: `corp-${config.s3BucketName}`,
          ...config.environment,
        },
      },

      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },

      dependsOn: [this.logGroup],
    });
  }
}

/**
 * Reusable S3 bucket module with Lambda trigger configuration
 * This module creates an S3 bucket with event notifications to trigger Lambda functions
 * on object uploads, following AWS best practices for event-driven architecture
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketNotification: S3BucketNotification;
  public readonly lambdaPermission: LambdaPermission;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // S3 bucket for image uploads with corporate naming convention
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `corp-${config.bucketName}`,

      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
        Purpose: 'image-uploads',
      },
    });

    // Create the public access block as a separate resource
    new S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning for the S3 bucket
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Server-side encryption for data at rest
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-sse', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });
    // Lambda permission to allow S3 to invoke the function
    this.lambdaPermission = new LambdaPermission(this, 'lambda-permission', {
      statementId: 'AllowExecutionFromS3Bucket',
      action: 'lambda:InvokeFunction',
      functionName: config.lambdaFunctionArn,
      principal: 's3.amazonaws.com',
      sourceArn: this.bucket.arn,
    });

    // S3 bucket notification configuration to trigger Lambda on uploads
    this.bucketNotification = new S3BucketNotification(
      this,
      'bucket-notification',
      {
        bucket: this.bucket.id,
        lambdaFunction: [
          {
            lambdaFunctionArn: config.lambdaFunctionArn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
        dependsOn: [
          ...(config.lambdaFunction ? [config.lambdaFunction] : []),
          this.lambdaPermission,
        ],
      }
    );
  }
}

/**
 * CloudWatch Log Group module for centralized logging
 * This module creates log groups with appropriate retention policies
 * and tagging for cost management and compliance
 */
export class CloudWatchModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    logGroupName: string,
    retentionDays: number = 14
  ) {
    super(scope, id);

    // CloudWatch Log Group with corporate naming and retention policy
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `corp-${logGroupName}`,
      retentionInDays: retentionDays,

      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
        CostCenter: 'engineering',
      },
    });
  }
}
```

## `tap-stack.ts`

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformOutput,
  TerraformVariable,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { LambdaModule, S3Module, CloudWatchModule } from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'serverless-image-processing',
            ManagedBy: 'CDKTF',
            Environment: environmentSuffix,
          },
        },
      ],
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Terraform variables for flexible configuration
    // These should be provided via terraform.tfvars or environment variables
    const lambdaFunctionName = new TerraformVariable(
      this,
      'lambda-function-name',
      {
        type: 'string',
        description: 'Name of the Lambda function for image processing',
        default: 'image-processor',
      }
    );

    const s3BucketName = new TerraformVariable(this, 's3-bucket-name', {
      type: 'string',
      description: 'Name of the S3 bucket for image uploads',
      default: 'image-uploads',
    });

    const vpcId = new TerraformVariable(this, 'vpc-id', {
      type: 'string',
      description: 'VPC ID where Lambda function will be deployed',
      default: 'vpc-123abc', // Default provided as per requirements
    });

    const lambdaTimeout = new TerraformVariable(this, 'lambda-timeout', {
      type: 'number',
      description: 'Lambda function timeout in seconds',
      default: 30,
    });

    const lambdaMemorySize = new TerraformVariable(this, 'lambda-memory-size', {
      type: 'number',
      description: 'Lambda function memory size in MB',
      default: 256,
    });

    const logRetentionDays = new TerraformVariable(this, 'log-retention-days', {
      type: 'number',
      description: 'CloudWatch log retention period in days',
      default: 14,
    });

    // Environment variables for Lambda function
    const lambdaEnvironment = {
      ENVIRONMENT: 'production',
      LOG_LEVEL: 'INFO',
      REGION: 'us-east-1',
    };

    // Instantiate Lambda module with VPC integration
    const lambdaModule = new LambdaModule(this, 'image-processor-lambda', {
      functionName: lambdaFunctionName.stringValue,
      s3BucketName: 'corp-image-uploads',
      s3Key: 'lambda-deployment.zip',
      vpcId: vpcId.stringValue,
      runtime: 'python3.9', // Using Python 3.9 for image processing capabilities
      timeout: lambdaTimeout.numberValue,
      memorySize: lambdaMemorySize.numberValue,
      environment: lambdaEnvironment,
    });

    // Instantiate S3 module with Lambda trigger configuration
    const s3Module = new S3Module(this, 'image-uploads-bucket', {
      bucketName: s3BucketName.stringValue,
      lambdaFunctionArn: lambdaModule.function.arn,
      lambdaFunction: lambdaModule.function, // pass instance
    });

    // Additional CloudWatch log group for application-specific logging
    new CloudWatchModule(
      this,
      'application-logs',
      'image-processing-app-logs',
      logRetentionDays.numberValue
    );

    // Terraform outputs for integration with other systems
    // These outputs can be used by other Terraform configurations or CI/CD pipelines
    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaModule.function.arn,
      description: 'ARN of the image processing Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambdafunction-name', {
      value: lambdaModule.function.functionName,
      description: 'Name of the image processing Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 's3bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'Name of the S3 bucket for image uploads',
      sensitive: false,
    });

    new TerraformOutput(this, 's3bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'ARN of the S3 bucket for image uploads',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambdarole-arn', {
      value: lambdaModule.role.arn,
      description: 'ARN of the Lambda execution role',
      sensitive: false,
    });

    new TerraformOutput(this, 'cloudwatchlog-group-name', {
      value: lambdaModule.logGroup.name,
      description: 'Name of the CloudWatch log group for Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 'vpcid', {
      value: vpcId.stringValue,
      description: 'VPC ID where resources are deployed',
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```

## Key Features and Design Decisions

### Architecture Overview
- **Serverless**: Uses AWS Lambda for compute with S3 event triggers
- **VPC Integration**: Lambda function deployed in existing VPC for security
- **Event-Driven**: S3 uploads automatically trigger Lambda processing
- **Logging**: Comprehensive CloudWatch logging with retention policies

### AWS Best Practices Implemented

1. **Security**:
   - IAM roles with least privilege access
   - S3 bucket encryption and public access blocking
   - VPC integration for network security

2. **Performance**:
   - Appropriate Lambda memory and timeout settings
   - Efficient resource naming and tagging

3. **Cost Optimization**:
   - CloudWatch log retention policies
   - Right-sized Lambda memory allocation

4. **Monitoring**:
   - Structured logging with log groups
   - Resource tagging for cost tracking

### Corporate Naming Convention
All resources follow the `corp-` prefix with lowercase naming:
- Lambda: `corp-image-processor`
- S3 Bucket: `corp-image-uploads`
- IAM Role: `corp-image-processor-role`
- Log Groups: `corp-*`

### Flexibility for Future Extensions
- Modular design allows easy addition of new Lambda functions
- Configurable through Terraform variables
- Reusable modules for consistent deployments
- Support for multiple S3 buckets and triggers
