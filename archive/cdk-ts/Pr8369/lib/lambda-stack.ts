import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  userDataTable: dynamodb.Table;
  orderDataTable: dynamodb.Table;
  analyticsTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly userDataProcessor: lambda.Function;
  public readonly orderDataProcessor: lambda.Function;
  public readonly analyticsProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // User Data Processor Lambda
    const userDataProcessorRole = new iam.Role(this, 'UserDataProcessorRole', {
      roleName: `${props.environmentSuffix}-userdataprocessor-role-synth`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDbStreamPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              resources: [props.userDataTable.tableStreamArn!],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
              resources: [props.analyticsTable.tableArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.userDataProcessor = new lambda.Function(this, 'UserDataProcessor', {
      functionName: `${props.environmentSuffix}-userdataprocessor-synth`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      role: userDataProcessorRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: {
        ANALYTICS_TABLE_NAME: props.analyticsTable.tableName,
        REGION: cdk.Stack.of(this).region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('Processing user data stream records:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            try {
              if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                const userId = newImage.userId.S;
                const timestamp = parseInt(newImage.timestamp.N);
                
                // Process and store analytics
                await dynamodb.put({
                  TableName: process.env.ANALYTICS_TABLE_NAME,
                  Item: {
                    dataType: 'USER_ACTIVITY',
                    processedAt: Date.now(),
                    sourceUserId: userId,
                    sourceTimestamp: timestamp,
                    eventType: record.eventName,
                    processedBy: 'userDataProcessor'
                  }
                }).promise();
                
                console.log(\`Processed user data for userId: \${userId}\`);
              }
            } catch (error) {
              console.error('Error processing record:', error);
              throw error;
            }
          }
          
          return { statusCode: 200, body: 'Successfully processed user data stream' };
        };
      `),
    });

    // Order Data Processor Lambda
    const orderDataProcessorRole = new iam.Role(
      this,
      'OrderDataProcessorRole',
      {
        roleName: `${props.environmentSuffix}-orderdataprocessor-role-synth`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          DynamoDbStreamPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'dynamodb:DescribeStream',
                  'dynamodb:GetRecords',
                  'dynamodb:GetShardIterator',
                  'dynamodb:ListStreams',
                ],
                resources: [props.orderDataTable.tableStreamArn!],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                resources: [props.analyticsTable.tableArn],
              }),
            ],
          }),
        },
      }
    );

    this.orderDataProcessor = new lambda.Function(this, 'OrderDataProcessor', {
      functionName: `${props.environmentSuffix}-orderdataprocessor-synth`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      role: orderDataProcessorRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ANALYTICS_TABLE_NAME: props.analyticsTable.tableName,
        REGION: cdk.Stack.of(this).region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('Processing order data stream records:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            try {
              if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                const orderId = newImage.orderId.S;
                const createdAt = parseInt(newImage.createdAt.N);
                
                // Process and store analytics
                await dynamodb.put({
                  TableName: process.env.ANALYTICS_TABLE_NAME,
                  Item: {
                    dataType: 'ORDER_ACTIVITY',
                    processedAt: Date.now(),
                    sourceOrderId: orderId,
                    sourceTimestamp: createdAt,
                    eventType: record.eventName,
                    processedBy: 'orderDataProcessor'
                  }
                }).promise();
                
                console.log(\`Processed order data for orderId: \${orderId}\`);
              }
            } catch (error) {
              console.error('Error processing record:', error);
              throw error;
            }
          }
          
          return { statusCode: 200, body: 'Successfully processed order data stream' };
        };
      `),
    });

    // Analytics Processor Lambda (for batch processing)
    const analyticsProcessorRole = new iam.Role(
      this,
      'AnalyticsProcessorRole',
      {
        roleName: `${props.environmentSuffix}-analyticsprocessor-role-synth`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          AnalyticsPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'dynamodb:Query',
                  'dynamodb:Scan',
                  'dynamodb:PutItem',
                ],
                resources: [props.analyticsTable.tableArn],
              }),
            ],
          }),
        },
      }
    );

    this.analyticsProcessor = new lambda.Function(this, 'AnalyticsProcessor', {
      functionName: `${props.environmentSuffix}-analyticsprocessor-synth`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      role: analyticsProcessorRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        ANALYTICS_TABLE_NAME: props.analyticsTable.tableName,
        REGION: cdk.Stack.of(this).region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('Running analytics processor:', JSON.stringify(event, null, 2));
          
          try {
            // Query recent analytics data
            const params = {
              TableName: process.env.ANALYTICS_TABLE_NAME,
              FilterExpression: 'processedAt > :timestamp',
              ExpressionAttributeValues: {
                ':timestamp': Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
              }
            };
            
            const result = await dynamodb.scan(params).promise();
            console.log(\`Found \${result.Items.length} analytics records from last 24 hours\`);
            
            // Create summary analytics
            const summary = {
              dataType: 'DAILY_SUMMARY',
              processedAt: Date.now(),
              totalRecords: result.Items.length,
              userActivityCount: result.Items.filter(item => item.dataType === 'USER_ACTIVITY').length,
              orderActivityCount: result.Items.filter(item => item.dataType === 'ORDER_ACTIVITY').length,
              processedBy: 'analyticsProcessor'
            };
            
            await dynamodb.put({
              TableName: process.env.ANALYTICS_TABLE_NAME,
              Item: summary
            }).promise();
            
            console.log('Analytics summary created:', summary);
            
          } catch (error) {
            console.error('Error processing analytics:', error);
            throw error;
          }
          
          return { statusCode: 200, body: 'Successfully processed analytics' };
        };
      `),
    });
  }
}
