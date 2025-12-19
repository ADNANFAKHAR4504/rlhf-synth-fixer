import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './stacks/api-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { RekognitionStack } from './stacks/rekognition-stack';
import { StorageStack } from './stacks/storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly storageStack: StorageStack;
  public readonly rekognitionStack: RekognitionStack;
  public readonly lambdaStack: LambdaStack;
  public readonly apiStack: ApiStack;
  public readonly monitoringStack: MonitoringStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Storage Stack - S3, DynamoDB, SNS
    this.storageStack = new StorageStack(this, 'Storage', {
      environmentSuffix,
      description: 'Storage resources for serverless image detector',
    });

    // Rekognition Stack - AI/ML configuration and service roles
    // Note: Rekognition is a Pro feature in LocalStack - this stack is created but service may not work in Community
    this.rekognitionStack = new RekognitionStack(this, 'Rekognition', {
      environmentSuffix,
      imageBucket: this.storageStack.imageBucket,
      description: 'Amazon Rekognition configuration and roles (Pro feature in LocalStack)',
    });

    // Lambda Stack - All Lambda functions
    this.lambdaStack = new LambdaStack(this, 'Lambda', {
      environmentSuffix,
      imageBucket: this.storageStack.imageBucket,
      detectionTable: this.storageStack.detectionTable,
      notificationTopic: this.storageStack.notificationTopic,
      description: 'Lambda functions for image processing',
    });

    // API Stack - API Gateway
    this.apiStack = new ApiStack(this, 'Api', {
      environmentSuffix,
      imageProcessorFunction: this.lambdaStack.imageProcessorFunction,
      imageBucket: this.storageStack.imageBucket,
      description: 'API Gateway for image upload and retrieval',
    });

    // Monitoring Stack - CloudWatch dashboards and alarms
    this.monitoringStack = new MonitoringStack(this, 'Monitoring', {
      environmentSuffix,
      lambdaFunctions: [
        this.lambdaStack.imageProcessorFunction,
        this.lambdaStack.fileManagerFunction,
        this.lambdaStack.notificationFunction,
      ],
      restApi: this.apiStack.restApi,
      detectionTable: this.storageStack.detectionTable,
      imageBucket: this.storageStack.imageBucket,
      description: 'CloudWatch monitoring and dashboards',
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiStack.restApi.url,
      description: 'API Gateway endpoint URL',
      exportName: `serverlessapp-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.storageStack.imageBucket.bucketName,
      description: 'S3 bucket for image storage',
      exportName: `serverlessapp-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.storageStack.detectionTable.tableName,
      description: 'DynamoDB table for detection logs',
      exportName: `serverlessapp-table-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.monitoringStack.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `serverlessapp-dashboard-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RekognitionServiceRoleArn', {
      value: this.rekognitionStack.rekognitionServiceRole.roleArn,
      description: 'Amazon Rekognition Service Role ARN',
      exportName: `serverlessapp-rekognition-service-role-${environmentSuffix}`,
    });

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Project', 'ServerlessImageDetector');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'DevOps Team');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
  }
}
