import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { LocalBackend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import { EducationStack } from './education-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    // Note: stateBucket and stateBucketRegion defined for interface completeness
    // Currently using LocalBackend for development
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Local Backend for development/testing
    // Note: In production, use S3Backend with proper access controls
    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    const educationStack = new EducationStack(this, 'education', {
      environmentSuffix,
      region: awsRegion,
    });

    // Terraform Outputs
    new TerraformOutput(this, 'content-bucket-name', {
      value: educationStack.contentBucket.bucket,
      description: 'S3 bucket name for educational content',
    });

    new TerraformOutput(this, 'cloudfront-url', {
      value: educationStack.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'api-endpoint', {
      value: `https://${educationStack.api.id}.execute-api.${awsRegion}.amazonaws.com/${educationStack.apiStage.stageName}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'user-pool-id', {
      value: educationStack.userPool.id,
      description: 'Cognito User Pool ID',
    });

    new TerraformOutput(this, 'user-pool-client-id', {
      value: educationStack.userPoolClient.id,
      description: 'Cognito User Pool Client ID',
    });

    new TerraformOutput(this, 'enrollment-function-name', {
      value: educationStack.enrollmentFunction.functionName,
      description: 'Enrollment Lambda function name',
    });

    new TerraformOutput(this, 'progress-function-name', {
      value: educationStack.progressFunction.functionName,
      description: 'Progress Lambda function name',
    });
  }
}
