/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IoTDataProcessorConstruct } from './iot-data-processor-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimaryRegion?: boolean;
  globalClusterId?: string;
  hostedZoneId?: string;
  domainName?: string;
}

export class TapStack extends cdk.Stack {
  public readonly iotDataProcessor: IoTDataProcessorConstruct;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        ...props?.env,
        region: 'us-west-2', // Hardcode region as per PROMPT.md requirements
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the IoT Data Processor construct
    this.iotDataProcessor = new IoTDataProcessorConstruct(this, 'IoTDataProcessor', {
      environmentSuffix,
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.iotDataProcessor.s3Bucket.bucketName,
      description: 'S3 bucket for IoT data uploads',
    });
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.iotDataProcessor.dynamoTable.tableName,
      description: 'DynamoDB table for processed IoT data',
    });
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.iotDataProcessor.lambdaFunction.functionName,
      description: 'Lambda function for processing IoT data',
    });
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.iotDataProcessor.lambdaFunction.functionArn,
      description: 'Lambda function ARN',
    });
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.iotDataProcessor.logGroup.logGroupName,
      description: 'CloudWatch log group for Lambda function',
    });
  }
}
}
