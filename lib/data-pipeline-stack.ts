import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import {
  DataPipelineConstruct,
  DataPipelineConfig,
} from './constructs/data-pipeline-construct';

export interface DataPipelineStackProps extends DataPipelineConfig {
  region: string;
}

export class DataPipelineStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: DataPipelineStackProps) {
    super(scope, id);

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
