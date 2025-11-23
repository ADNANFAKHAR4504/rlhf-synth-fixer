import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here

import { getPipelineConfig } from './config/pipeline-config';
import { ApplicationInfrastructure } from './constructs/application-infrastructure';
import {
  MonitoringInfrastructure,
  createMonitoringTopics,
} from './constructs/monitoring-infrastructure';
import { PipelineInfrastructure } from './constructs/pipeline-infrastructure';
import { SecurityInfrastructure } from './constructs/security-infrastructure';

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

    const team = this.node.tryGetContext('team') || 'platform';
    const project = this.node.tryGetContext('project') || 'hono-api';
    const notificationEmail = this.node.tryGetContext('notificationEmail') as
      | string
      | undefined;

    const config = getPipelineConfig(
      team,
      project,
      environmentSuffix,
      notificationEmail
    );

    // Security infrastructure (KMS, Parameter Store)
    const security = new SecurityInfrastructure(this, 'Security', {
      config,
    });

    // Create SNS topics early - needed by application and pipeline infrastructure
    const { alarmTopic, pipelineTopic } = createMonitoringTopics(
      this,
      'Monitoring',
      config,
      security.kmsKey
    );

    // Application infrastructure (Lambda, API Gateway)
    const application = new ApplicationInfrastructure(this, 'Application', {
      config,
      kmsKey: security.kmsKey,
      alarmTopic,
    });

    // CI/CD Pipeline
    const pipeline = new PipelineInfrastructure(this, 'Pipeline', {
      config,
      kmsKey: security.kmsKey,
      notificationTopic: pipelineTopic,
      lambdaFunction: application.lambdaFunction,
      apiGateway: application.api,
      alarmTopic,
    });

    // Create comprehensive monitoring infrastructure with all resources at the end
    // This creates the dashboard and all alarms in one place
    const monitoring = new MonitoringInfrastructure(this, 'Monitoring', {
      config,
      kmsKey: security.kmsKey,
      alarmTopic,
      pipelineTopic,
      lambdaFunctionArn: application.lambdaFunction.functionArn,
      apiGatewayId: application.api.restApiId,
      pipelineName: pipeline.pipeline.pipelineName,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: application.api.url!,
      description: 'API Gateway endpoint URL',
      exportName: `${config.prefix}-api-endpoint`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: application.api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${config.prefix}-api-id`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: application.lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `${config.prefix}-lambda-function-name`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: application.lambdaFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `${config.prefix}-lambda-function-arn`,
    });

    new cdk.CfnOutput(this, 'LambdaAliasArn', {
      value: application.lambdaAlias.functionArn,
      description: 'Lambda alias ARN',
      exportName: `${config.prefix}-lambda-alias-arn`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: security.kmsKey.keyId,
      description: 'KMS key ID',
      exportName: `${config.prefix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: security.kmsKey.keyArn,
      description: 'KMS key ARN',
      exportName: `${config.prefix}-kms-key-arn`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoring.alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarms',
      exportName: `${config.prefix}-alarm-topic-arn`,
    });

    new cdk.CfnOutput(this, 'PipelineNotificationTopic', {
      value: monitoring.pipelineTopic.topicArn,
      description: 'SNS Topic for pipeline notifications',
      exportName: `${config.prefix}-pipeline-topic`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `${config.prefix}-pipeline-name`,
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: pipeline.sourceBucket.bucketName,
      description: 'S3 bucket name for source artifacts',
      exportName: `${config.prefix}-source-bucket`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: pipeline.artifactsBucket.bucketName,
      description: 'S3 bucket name for pipeline artifacts',
      exportName: `${config.prefix}-artifacts-bucket`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: monitoring.dashboard.dashboardName,
      description: 'CloudWatch Dashboard name',
      exportName: `${config.prefix}-dashboard-name`,
    });

    new cdk.CfnOutput(this, 'ParameterStorePrefix', {
      value: security.parameterPrefix,
      description: 'Parameter Store prefix for configuration',
      exportName: `${config.prefix}-parameter-prefix`,
    });
  }
}
