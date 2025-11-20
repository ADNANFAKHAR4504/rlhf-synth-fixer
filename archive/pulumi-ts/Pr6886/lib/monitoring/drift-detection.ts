import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DriftDetectionArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  ecsClusterArn: pulumi.Output<string>;
  auroraClusterArn: pulumi.Output<string>;
}

export class DriftDetection extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly eventRule: aws.cloudwatch.EventRule;

  constructor(
    name: string,
    args: DriftDetectionArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:DriftDetection', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Create SNS topic for drift alerts
    this.snsTopic = new aws.sns.Topic(
      `drift-alerts-${args.environmentSuffix}`,
      {
        name: `drift-alerts-${args.environmentSuffix}`,
        displayName: 'Infrastructure Drift Alerts',
        tags: {
          Name: `drift-alerts-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.snsTopicArn = this.snsTopic.arn;

    // Create CloudWatch Event Rule for configuration changes
    this.eventRule = new aws.cloudwatch.EventRule(
      `drift-rule-${args.environmentSuffix}`,
      {
        name: `drift-detection-${args.environmentSuffix}`,
        description: 'Detect configuration drift in infrastructure',
        eventPattern: JSON.stringify({
          source: ['aws.ec2', 'aws.ecs', 'aws.rds'],
          'detail-type': [
            'AWS API Call via CloudTrail',
            'EC2 Instance State-change Notification',
            'ECS Task State Change',
            'RDS DB Instance Event',
          ],
        }),
        tags: {
          Name: `drift-rule-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create Lambda function for drift detection
    const driftDetectionRole = new aws.iam.Role(
      `drift-lambda-role-${args.environmentSuffix}`,
      {
        name: `drift-lambda-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `drift-lambda-role-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    new aws.iam.RolePolicyAttachment(
      `drift-lambda-basic-${args.environmentSuffix}`,
      {
        role: driftDetectionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      defaultResourceOptions
    );

    new aws.iam.RolePolicy(
      `drift-lambda-policy-${args.environmentSuffix}`,
      {
        role: driftDetectionRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sns:Publish",
            "ec2:Describe*",
            "ecs:Describe*",
            "rds:Describe*",
            "ssm:GetParameter"
          ],
          "Resource": "*"
        }]
      }`,
      },
      defaultResourceOptions
    );

    const driftLambda = new aws.lambda.Function(
      `drift-lambda-${args.environmentSuffix}`,
      {
        name: `drift-detection-${args.environmentSuffix}`,
        runtime: 'nodejs16.x',
        handler: 'index.handler',
        role: driftDetectionRole.arn,
        timeout: 60,
        environment: {
          variables: {
            ENVIRONMENT: args.environment,
            SNS_TOPIC_ARN: this.snsTopic.arn,
            VPC_ID: pulumi.output(args.vpcId),
            ECS_CLUSTER_ARN: args.ecsClusterArn,
            AURORA_CLUSTER_ARN: args.auroraClusterArn,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
// Using AWS SDK v2 which is available in Lambda runtime by default
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
  console.log('Drift detection event received:', JSON.stringify(event, null, 2));

  const environment = process.env.ENVIRONMENT;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  const vpcId = process.env.VPC_ID;
  const ecsClusterArn = process.env.ECS_CLUSTER_ARN;
  const auroraClusterArn = process.env.AURORA_CLUSTER_ARN;

  try {
    // Extract relevant information from the CloudWatch event
    const eventSource = event.source || 'unknown';
    const detailType = event['detail-type'] || 'unknown';
    const eventTime = event.time || new Date().toISOString();
    const eventDetail = event.detail || {};

    // Build alert message based on event data
    const resourceType = eventSource.replace('aws.', '').toUpperCase();
    let message = \`Infrastructure Change Detected\\n\\n\`;
    message += \`Environment: \${environment}\\n\`;
    message += \`Resource Type: \${resourceType}\\n\`;
    message += \`Event Type: \${detailType}\\n\`;
    message += \`Time: \${eventTime}\\n\\n\`;

    // Add resource-specific information
    if (eventSource === 'aws.ec2' && vpcId) {
      message += \`VPC ID: \${vpcId}\\n\`;
      if (eventDetail.instance-id) {
        message += \`Instance ID: \${eventDetail['instance-id']}\\n\`;
      }
    } else if (eventSource === 'aws.ecs' && ecsClusterArn) {
      message += \`ECS Cluster: \${ecsClusterArn}\\n\`;
      if (eventDetail.clusterArn) {
        message += \`Event Cluster: \${eventDetail.clusterArn}\\n\`;
      }
    } else if (eventSource === 'aws.rds' && auroraClusterArn) {
      message += \`Aurora Cluster: \${auroraClusterArn}\\n\`;
      if (eventDetail.SourceArn) {
        message += \`Event Source: \${eventDetail.SourceArn}\\n\`;
      }
    }

    message += \`\\nEvent Details:\\n\${JSON.stringify(eventDetail, null, 2)}\`;

    // Publish to SNS
    const params = {
      TopicArn: snsTopicArn,
      Subject: \`[\${environment.toUpperCase()}] Infrastructure Change - \${resourceType}\`,
      Message: message
    };

    await sns.publish(params).promise();
    console.log('Alert published to SNS successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Drift detection event processed successfully',
        eventSource: eventSource,
        detailType: detailType
      })
    };
  } catch (error) {
    console.error('Error processing drift detection event:', error);
    throw error;
  }
};
        `),
        }),
        tags: {
          Name: `drift-lambda-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `drift-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: driftLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: this.eventRule.arn,
      },
      defaultResourceOptions
    );

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(
      `drift-target-${args.environmentSuffix}`,
      {
        rule: this.eventRule.name,
        arn: driftLambda.arn,
      },
      defaultResourceOptions
    );

    // Create CloudWatch Alarms for drift detection
    new aws.cloudwatch.MetricAlarm(
      `drift-alarm-${args.environmentSuffix}`,
      {
        name: `drift-alarm-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert on drift detection errors',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          FunctionName: driftLambda.name,
        },
        tags: {
          Name: `drift-alarm-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
