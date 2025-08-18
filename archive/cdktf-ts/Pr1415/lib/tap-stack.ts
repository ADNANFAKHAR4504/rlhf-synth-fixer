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
