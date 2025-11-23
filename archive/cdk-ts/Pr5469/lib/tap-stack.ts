import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { LambdaApiConstruct } from './constructs/lambda-api-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { PipelineConstruct } from './constructs/pipeline-construct';
import { StorageConstruct } from './constructs/storage-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const tags = {
      Project: 'FinanceApp',
      Environment: 'Dev',
      ManagedBy: 'CDK',
      Stack: this.stackName,
    };

    // Create storage resources
    const storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix: environmentSuffix,
      tags,
    });

    // Create Lambda and API Gateway
    const lambdaApi = new LambdaApiConstruct(this, 'LambdaApi', {
      environmentSuffix: environmentSuffix,
      dataBucket: storage.dataBucket,
      dynamoTable: storage.dynamoTable,
      kmsKeyId: storage.kmsKey.keyId,
      tags,
    });

    // Create CI/CD pipeline
    const pipeline = new PipelineConstruct(this, 'Pipeline', {
      environmentSuffix: environmentSuffix,
      artifactBucket: storage.artifactBucket,
      lambdaFunction: lambdaApi.lambdaFunction,
      tags,
    });

    // Create monitoring and alarms
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix: environmentSuffix,
      lambdaFunction: lambdaApi.lambdaFunction,
      apiGateway: lambdaApi.apiGateway,
      pipeline: pipeline.pipeline,
      notificationTopic: pipeline.notificationTopic,
      tags,
    });

    // Stack Outputs for integration testing
    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: lambdaApi.apiGateway.url,
      description: 'API Gateway endpoint URL',
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: storage.dataBucket.bucketName,
      description: 'S3 data bucket name',
      exportName: `${this.stackName}-DataBucket`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: storage.artifactBucket.bucketName,
      description: 'S3 artifact bucket name',
      exportName: `${this.stackName}-ArtifactBucket`,
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: storage.dynamoTable.tableName,
      description: 'DynamoDB table name',
      exportName: `${this.stackName}-DynamoTable`,
    });

    new cdk.CfnOutput(this, 'CodePipelineArn', {
      value: pipeline.pipeline.pipelineArn,
      description: 'CodePipeline ARN',
      exportName: `${this.stackName}-PipelineArn`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: pipeline.notificationTopic.topicArn,
      description: 'SNS notification topic ARN',
      exportName: `${this.stackName}-SNSTopicArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaApi.lambdaFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `${this.stackName}-LambdaArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionVersion', {
      value: lambdaApi.lambdaFunction.currentVersion.version,
      description: 'Lambda function version',
      exportName: `${this.stackName}-LambdaVersion`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaApi.lambdaRole.roleArn,
      description: 'Lambda execution role ARN',
      exportName: `${this.stackName}-LambdaRoleArn`,
    });

    new cdk.CfnOutput(this, 'PipelineRoleArn', {
      value: pipeline.pipelineRole.roleArn,
      description: 'CodePipeline role ARN',
      exportName: `${this.stackName}-PipelineRoleArn`,
    });

    new cdk.CfnOutput(this, 'BuildRoleArn', {
      value: pipeline.buildRole.roleArn,
      description: 'CodeBuild role ARN',
      exportName: `${this.stackName}-BuildRoleArn`,
    });

    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: lambdaApi.logGroup.logGroupName,
      description: 'Lambda CloudWatch log group name',
      exportName: `${this.stackName}-LambdaLogGroup`,
    });

    new cdk.CfnOutput(this, 'PipelineLogGroupName', {
      value: pipeline.logGroup.logGroupName,
      description: 'Pipeline CloudWatch log group name',
      exportName: `${this.stackName}-PipelineLogGroup`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
      exportName: `${this.stackName}-DashboardUrl`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: storage.kmsKey.keyArn,
      description: 'KMS encryption key ARN',
      exportName: `${this.stackName}-KMSKeyArn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: storage.kmsKey.keyId,
      description: 'KMS encryption key ID',
      exportName: `${this.stackName}-KMSKeyId`,
    });

    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'CloudFormation stack name',
      exportName: `${this.stackName}-StackName`,
    });

    // Apply stack-level tags
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
