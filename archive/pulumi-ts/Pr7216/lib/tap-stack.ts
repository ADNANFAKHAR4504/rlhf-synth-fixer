import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly webhookHandlerArn: pulumi.Output<string>;
  public readonly alertEvaluatorArn: pulumi.Output<string>;
  public readonly alertsTableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {
      Environment: 'production',
      Service: 'price-alerts',
    };

    // KMS key for Lambda environment variable encryption
    const kmsKey = new aws.kms.Key(
      `crypto-alerts-kms-${environmentSuffix}`,
      {
        description: 'KMS key for encrypting Lambda environment variables',
        enableKeyRotation: true,
        tags: tags,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _kmsAlias = new aws.kms.Alias(
      `crypto-alerts-kms-alias-${environmentSuffix}`,
      {
        name: `alias/crypto-alerts-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // DynamoDB table for storing alerts
    const alertsTable = new aws.dynamodb.Table(
      `crypto-alerts-table-${environmentSuffix}`,
      {
        name: `crypto-alerts-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'userId',
        rangeKey: 'alertId',
        attributes: [
          { name: 'userId', type: 'S' },
          { name: 'alertId', type: 'S' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // SNS topic for notifications with encryption
    const notificationTopic = new aws.sns.Topic(
      `crypto-alerts-topic-${environmentSuffix}`,
      {
        name: `crypto-alerts-notifications-${environmentSuffix}`,
        kmsMasterKeyId: 'alias/aws/sns',
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for webhook handler Lambda
    const webhookHandlerRole = new aws.iam.Role(
      `webhook-handler-role-${environmentSuffix}`,
      {
        name: `crypto-webhook-handler-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const webhookHandlerBasicPolicy = new aws.iam.RolePolicyAttachment(
      `webhook-handler-basic-policy-${environmentSuffix}`,
      {
        role: webhookHandlerRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    const webhookHandlerXrayPolicy = new aws.iam.RolePolicyAttachment(
      `webhook-handler-xray-policy-${environmentSuffix}`,
      {
        role: webhookHandlerRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for DynamoDB access
    const webhookHandlerDynamoPolicy = new aws.iam.RolePolicy(
      `webhook-handler-dynamo-policy-${environmentSuffix}`,
      {
        role: webhookHandlerRole.id,
        policy: pulumi.all([alertsTable.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:Query',
                ],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Inline policy for KMS decryption
    const webhookHandlerKmsPolicy = new aws.iam.RolePolicy(
      `webhook-handler-kms-policy-${environmentSuffix}`,
      {
        role: webhookHandlerRole.id,
        policy: pulumi.all([kmsKey.arn]).apply(([keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt'],
                Resource: keyArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Webhook handler Lambda function
    const webhookHandler = new aws.lambda.Function(
      `webhook-handler-${environmentSuffix}`,
      {
        name: `crypto-webhook-handler-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: webhookHandlerRole.arn,
        architectures: ['arm64'],
        memorySize: 1024,
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const AWS = require('@aws-sdk/client-dynamodb');
  const { DynamoDBClient } = AWS;
  const { PutItemCommand } = AWS;
  const { marshall } = require('@aws-sdk/util-dynamodb');
  const { randomUUID } = require('crypto');

  const AWSXRay = require('aws-xray-sdk-core');
  const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: process.env.AWS_REGION }));

  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('ProcessWebhook');

  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, cryptocurrency, targetPrice, condition } = body;

    if (!userId || !cryptocurrency || !targetPrice || !condition) {
      subsegment.close();
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const alertId = randomUUID();
    const timestamp = new Date().toISOString();

    const command = new PutItemCommand({
      TableName: process.env.ALERTS_TABLE_NAME,
      Item: marshall({
        userId,
        alertId,
        cryptocurrency,
        targetPrice: parseFloat(targetPrice),
        condition,
        createdAt: timestamp,
        active: true,
      }),
    });

    await dynamoClient.send(command);

    subsegment.close();
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Alert created successfully',
        alertId,
      }),
    };
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
        `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
                '@aws-sdk/util-dynamodb': '^3.0.0',
                'aws-xray-sdk-core': '^3.5.0',
              },
            })
          ),
        }),
        environment: {
          variables: {
            ALERTS_TABLE_NAME: alertsTable.name,
            CRYPTO_API_KEY: 'placeholder-api-key',
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      {
        parent: this,
        dependsOn: [
          webhookHandlerBasicPolicy,
          webhookHandlerXrayPolicy,
          webhookHandlerDynamoPolicy,
          webhookHandlerKmsPolicy,
        ],
      }
    );

    // IAM role for alert evaluator Lambda
    const alertEvaluatorRole = new aws.iam.Role(
      `alert-evaluator-role-${environmentSuffix}`,
      {
        name: `crypto-alert-evaluator-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const evaluatorBasicPolicy = new aws.iam.RolePolicyAttachment(
      `evaluator-basic-policy-${environmentSuffix}`,
      {
        role: alertEvaluatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    const evaluatorXrayPolicy = new aws.iam.RolePolicyAttachment(
      `evaluator-xray-policy-${environmentSuffix}`,
      {
        role: alertEvaluatorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for DynamoDB access
    const evaluatorDynamoPolicy = new aws.iam.RolePolicy(
      `evaluator-dynamo-policy-${environmentSuffix}`,
      {
        role: alertEvaluatorRole.id,
        policy: pulumi.all([alertsTable.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:Scan', 'dynamodb:UpdateItem'],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Inline policy for SNS publish
    const evaluatorSnsPolicy = new aws.iam.RolePolicy(
      `evaluator-sns-policy-${environmentSuffix}`,
      {
        role: alertEvaluatorRole.id,
        policy: pulumi.all([notificationTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Inline policy for KMS decryption
    const evaluatorKmsPolicy = new aws.iam.RolePolicy(
      `evaluator-kms-policy-${environmentSuffix}`,
      {
        role: alertEvaluatorRole.id,
        policy: pulumi.all([kmsKey.arn]).apply(([keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt'],
                Resource: keyArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Alert evaluator Lambda function
    const alertEvaluator = new aws.lambda.Function(
      `alert-evaluator-${environmentSuffix}`,
      {
        name: `crypto-alert-evaluator-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: alertEvaluatorRole.arn,
        architectures: ['arm64'],
        memorySize: 1024,
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const AWS = require('@aws-sdk/client-dynamodb');
  const SNS = require('@aws-sdk/client-sns');
  const { DynamoDBClient, ScanCommand, UpdateItemCommand } = AWS;
  const { SNSClient, PublishCommand } = SNS;
  const { unmarshall, marshall } = require('@aws-sdk/util-dynamodb');

  const AWSXRay = require('aws-xray-sdk-core');
  const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: process.env.AWS_REGION }));
  const snsClient = AWSXRay.captureAWSv3Client(new SNSClient({ region: process.env.AWS_REGION }));

  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('EvaluateAlerts');

  try {
    // Scan for active alerts
    const scanCommand = new ScanCommand({
      TableName: process.env.ALERTS_TABLE_NAME,
      FilterExpression: 'active = :active',
      ExpressionAttributeValues: marshall({
        ':active': true,
      }),
    });

    const scanResult = await dynamoClient.send(scanCommand);
    const alerts = (scanResult.Items || []).map(item => unmarshall(item));

    // Mock price check (in production, this would call a crypto price API)
    const currentPrices = {
      'bitcoin': 45000,
      'ethereum': 3000,
      'btc': 45000,
      'eth': 3000,
    };

    const triggeredAlerts = [];

    for (const alert of alerts) {
      const currentPrice = currentPrices[alert.cryptocurrency.toLowerCase()] || 0;
      let triggered = false;

      if (alert.condition === 'above' && currentPrice > alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'below' && currentPrice < alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        triggeredAlerts.push(alert);

        // Send SNS notification
        const publishCommand = new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Message: \`Price alert triggered! \${alert.cryptocurrency} is now \${currentPrice}, target was \${alert.targetPrice} (\${alert.condition})\`,
          Subject: 'Crypto Price Alert Triggered',
        });

        await snsClient.send(publishCommand);

        // Deactivate the alert
        const updateCommand = new UpdateItemCommand({
          TableName: process.env.ALERTS_TABLE_NAME,
          Key: marshall({
            userId: alert.userId,
            alertId: alert.alertId,
          }),
          UpdateExpression: 'SET active = :active',
          ExpressionAttributeValues: marshall({
            ':active': false,
          }),
        });

        await dynamoClient.send(updateCommand);
      }
    }

    subsegment.close();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Alert evaluation complete',
        alertsChecked: alerts.length,
        alertsTriggered: triggeredAlerts.length,
      }),
    };
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
        `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
                '@aws-sdk/client-sns': '^3.0.0',
                '@aws-sdk/util-dynamodb': '^3.0.0',
                'aws-xray-sdk-core': '^3.5.0',
              },
            })
          ),
        }),
        environment: {
          variables: {
            ALERTS_TABLE_NAME: alertsTable.name,
            SNS_TOPIC_ARN: notificationTopic.arn,
            CRYPTO_API_KEY: 'placeholder-api-key',
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      {
        parent: this,
        dependsOn: [
          evaluatorBasicPolicy,
          evaluatorXrayPolicy,
          evaluatorDynamoPolicy,
          evaluatorSnsPolicy,
          evaluatorKmsPolicy,
        ],
      }
    );

    // EventBridge rule for scheduled execution
    const scheduleRule = new aws.cloudwatch.EventRule(
      `alert-schedule-${environmentSuffix}`,
      {
        name: `crypto-alert-schedule-${environmentSuffix}`,
        description: 'Triggers alert evaluation every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    // Lambda permission for EventBridge
    const scheduleLambdaPermission = new aws.lambda.Permission(
      `schedule-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: alertEvaluator.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduleRule.arn,
      },
      { parent: this }
    );

    // EventBridge target
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scheduleTarget = new aws.cloudwatch.EventTarget(
      `alert-schedule-target-${environmentSuffix}`,
      {
        rule: scheduleRule.name,
        arn: alertEvaluator.arn,
      },
      { parent: this, dependsOn: [scheduleLambdaPermission] }
    );

    // Store outputs
    this.webhookHandlerArn = webhookHandler.arn;
    this.alertEvaluatorArn = alertEvaluator.arn;
    this.alertsTableName = alertsTable.name;

    this.registerOutputs({
      webhookHandlerArn: this.webhookHandlerArn,
      alertEvaluatorArn: this.alertEvaluatorArn,
      alertsTableName: this.alertsTableName,
      notificationTopicArn: notificationTopic.arn,
      kmsKeyId: kmsKey.id,
    });
  }
}
