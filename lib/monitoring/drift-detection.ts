import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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
        runtime: 'nodejs18.x',
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
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { EC2Client, DescribeVpcsCommand } = require('@aws-sdk/client-ec2');
const { ECSClient, DescribeClustersCommand } = require('@aws-sdk/client-ecs');
const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');

const snsClient = new SNSClient({});
const ec2Client = new EC2Client({});
const ecsClient = new ECSClient({});
const rdsClient = new RDSClient({});

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const environment = process.env.ENVIRONMENT;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;

  try {
    // Check for configuration drift
    const driftMessages = [];

    // Example: Check VPC configuration
    const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
      VpcIds: [process.env.VPC_ID]
    }));

    if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
      const vpc = vpcResponse.Vpcs[0];
      if (!vpc.EnableDnsHostnames || !vpc.EnableDnsSupport) {
        driftMessages.push('VPC DNS configuration drift detected');
      }
    }

    // Send alert if drift detected
    if (driftMessages.length > 0) {
      await snsClient.send(new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: \`Configuration Drift Detected - \${environment}\`,
        Message: \`The following drift has been detected:\\n\\n\${driftMessages.join('\\n')}\`
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Drift detection completed', drifts: driftMessages.length })
    };
  } catch (error) {
    console.error('Error:', error);
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
