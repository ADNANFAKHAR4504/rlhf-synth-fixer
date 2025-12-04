import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';

export interface RollbackConstructProps {
  environmentSuffix: string;
  environment: string;
  pipeline: codepipeline.Pipeline;
  notificationTopic: sns.ITopic;
  tags: { [key: string]: string };
}

export class RollbackConstruct extends Construct {
  constructor(scope: Construct, id: string, props: RollbackConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      environment,
      pipeline,
      notificationTopic,
      tags,
    } = props;

    // Create Lambda function for rollback automation
    const rollbackFunction = new lambda.Function(
      this,
      `RollbackFunction-${environmentSuffix}`,
      {
        functionName: `pipeline-rollback-${environment}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { CodePipelineClient, StopPipelineExecutionCommand } = require('@aws-sdk/client-codepipeline');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

exports.handler = async (event) => {
  console.log('Rollback function triggered', JSON.stringify(event));

  const codepipeline = new CodePipelineClient({});
  const sns = new SNSClient({});

  const pipelineName = process.env.PIPELINE_NAME;
  const notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN;
  const environment = process.env.ENVIRONMENT;

  try {
    // Parse CloudWatch alarm details
    const message = JSON.parse(event.Records[0].Sns.Message);
    const alarmName = message.AlarmName;
    const alarmState = message.NewStateValue;

    console.log(\`Alarm \${alarmName} is in \${alarmState} state\`);

    if (alarmState === 'ALARM') {
      console.log(\`Initiating rollback for pipeline \${pipelineName}\`);

      // Stop the current pipeline execution
      await codepipeline.send(new StopPipelineExecutionCommand({
        pipelineName: pipelineName,
        abandon: false,
        reason: \`Automatic rollback triggered by alarm: \${alarmName}\`
      }));

      console.log('Pipeline execution stopped');

      // Send notification
      await sns.send(new PublishCommand({
        TopicArn: notificationTopicArn,
        Subject: \`Rollback Triggered - \${environment}\`,
        Message: \`Automatic rollback was triggered for pipeline \${pipelineName} due to alarm: \${alarmName}\`
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Rollback executed successfully' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No rollback needed' })
    };
  } catch (error) {
    console.error('Rollback failed:', error);

    // Send failure notification
    await sns.send(new PublishCommand({
      TopicArn: notificationTopicArn,
      Subject: \`Rollback Failed - \${environment}\`,
      Message: \`Failed to execute rollback for pipeline \${pipelineName}: \${error.message}\`
    }));

    throw error;
  }
};
      `),
        timeout: cdk.Duration.minutes(2),
        memorySize: 256,
        environment: {
          PIPELINE_NAME: pipeline.pipelineName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
          ENVIRONMENT: environment,
        },
      }
    );

    // Grant permissions to Lambda
    rollbackFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'codepipeline:StopPipelineExecution',
          'codepipeline:GetPipelineExecution',
          'codepipeline:GetPipelineState',
        ],
        resources: [pipeline.pipelineArn],
      })
    );

    rollbackFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: [notificationTopic.topicArn],
      })
    );

    // Apply tags
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(rollbackFunction).add(key, value);
    });

    // Create SNS topic for alarm notifications
    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environmentSuffix}`, {
      topicName: `pipeline-alarm-${environment}-${environmentSuffix}`,
      displayName: `Pipeline Alarm Topic - ${environment}`,
    });

    // Subscribe rollback Lambda to alarm topic
    alarmTopic.addSubscription(
      new cdk.aws_sns_subscriptions.LambdaSubscription(rollbackFunction)
    );

    // Apply tags to alarm topic
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(alarmTopic).add(key, value);
    });

    // Create CloudWatch alarm for pipeline failures
    const pipelineFailureMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionFailure',
      dimensionsMap: {
        PipelineName: pipeline.pipelineName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      `PipelineFailureAlarm-${environmentSuffix}`,
      {
        alarmName: `pipeline-failure-${environment}-${environmentSuffix}`,
        metric: pipelineFailureMetric,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Triggers rollback when pipeline ${pipeline.pipelineName} fails`,
      }
    );

    // Add alarm action to notify SNS topic
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Apply tags to alarm
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(pipelineFailureAlarm).add(key, value);
    });

    // Create custom metric for deployment duration
    const deploymentDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionTime',
      dimensionsMap: {
        PipelineName: pipeline.pipelineName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Create alarm for excessive deployment duration
    const deploymentDurationAlarm = new cloudwatch.Alarm(
      this,
      `DeploymentDurationAlarm-${environmentSuffix}`,
      {
        alarmName: `deployment-duration-${environment}-${environmentSuffix}`,
        metric: deploymentDurationMetric,
        threshold: 1800000, // 30 minutes in milliseconds
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          'Triggers when deployment takes longer than 30 minutes',
      }
    );

    deploymentDurationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(notificationTopic)
    );

    // Apply tags
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(deploymentDurationAlarm).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'RollbackFunctionName', {
      value: rollbackFunction.functionName,
      description: 'Name of the rollback Lambda function',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the alarm notification topic',
    });
  }
}
