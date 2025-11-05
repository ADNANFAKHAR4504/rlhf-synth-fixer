import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface SlackNotifierProps {
  config: any;
  slackWebhookUrl: string;
  removalPolicy: cdk.RemovalPolicy;
}

export class SlackNotifier extends Construct {
  public readonly notificationLambda: lambda_nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: SlackNotifierProps) {
    super(scope, id);

    const { config, slackWebhookUrl } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create Lambda function for Slack notifications
    this.notificationLambda = new lambda_nodejs.NodejsFunction(
      this,
      'SlackNotifierFunction',
      {
        functionName: resourceName('slack-notifier'),
        entry: path.join(__dirname, '../lambda/slack-notifier.ts'),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          SLACK_WEBHOOK_URL: slackWebhookUrl,
          ENVIRONMENT: config.environmentSuffix,
          COMPANY: config.company,
          DIVISION: config.division,
        },
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new cdk.aws_logs.LogGroup(
          this,
          'NotificationLambdaLogGroup',
          {
            logGroupName: `/aws/lambda/${resourceName('notification-lambda')}`,
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
            removalPolicy: props.removalPolicy,
          }
        ),
      }
    );

    // Add additional permissions if needed
    this.notificationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codepipeline:GetPipeline',
          'codepipeline:GetPipelineExecution',
          'codepipeline:GetPipelineState',
        ],
        resources: ['*'],
      })
    );
  }
}
