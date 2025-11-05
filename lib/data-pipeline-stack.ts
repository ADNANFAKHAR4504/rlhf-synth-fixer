import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  DataPipelineConfig,
  DataPipelineConstruct,
} from './constructs/data-pipeline-construct';

export interface DataPipelineStackProps extends DataPipelineConfig {
  region: string;
  stateBucket?: string;
  stateBucketRegion?: string;
}

export class DataPipelineStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: DataPipelineStackProps) {
    super(scope, id);

    // Configure S3 Backend for remote state management
    const stateBucket =
      props.stateBucket ||
      process.env.TERRAFORM_STATE_BUCKET ||
      'iac-rlhf-tf-states';
    const stateBucketRegion =
      props.stateBucketRegion ||
      process.env.TERRAFORM_STATE_BUCKET_REGION ||
      'us-east-1';
    const environmentSuffix =
      props.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: props.region,
      defaultTags: [
        {
          tags: {
            Environment: props.environment,
            CostCenter: props.costCenter,
            ManagedBy: 'CDKTF',
            EnvironmentSuffix: props.environmentSuffix,
          },
        },
      ],
    });

    // Create the data pipeline using our custom construct
    const pipeline = new DataPipelineConstruct(this, 'DataPipeline', props);

    // CloudFormation Outputs
    new TerraformOutput(this, 'S3BucketName', {
      value: pipeline.dataBucket.bucket,
      description: 'Name of the S3 data ingestion bucket',
    });

    new TerraformOutput(this, 'S3BucketArn', {
      value: pipeline.dataBucket.arn,
      description: 'ARN of the S3 data ingestion bucket',
    });

    new TerraformOutput(this, 'DynamoDBTableName', {
      value: pipeline.metadataTable.name,
      description: 'Name of the DynamoDB metadata table',
    });

    new TerraformOutput(this, 'DynamoDBTableArn', {
      value: pipeline.metadataTable.arn,
      description: 'ARN of the DynamoDB metadata table',
    });

    new TerraformOutput(this, 'LambdaFunctionName', {
      value: pipeline.processorFunction.functionName,
      description: 'Name of the Lambda processor function',
    });

    new TerraformOutput(this, 'LambdaFunctionArn', {
      value: pipeline.processorFunction.arn,
      description: 'ARN of the Lambda processor function',
    });

    new TerraformOutput(this, 'SNSTopicArn', {
      value: pipeline.alertTopic.arn,
      description: 'ARN of the SNS alert topic',
    });

    new TerraformOutput(this, 'EventBridgeRuleName', {
      value: pipeline.s3EventRule.name,
      description: 'Name of the EventBridge rule for S3 events',
    });
  }
}
