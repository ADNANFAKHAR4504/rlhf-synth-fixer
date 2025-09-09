import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

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

    // Common tags for all resources
    const commonTags = {
      project: 'serverless_app',
    };

    // 1. DynamoDB Table
    const dataTable = new dynamodb.Table(this, 'ServerlessDataTable', {
      tableName: `serverless-data-table-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      pointInTimeRecovery: true,
    });

    // Apply tags to DynamoDB table
    cdk.Tags.of(dataTable).add('project', commonTags.project);

    // 2. Lambda Execution Role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [dataTable.tableArn],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `arn:aws:s3:::prod-${this.account}-data-storage-${environmentSuffix}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Apply tags to IAM role
    cdk.Tags.of(lambdaExecutionRole).add('project', commonTags.project);

    // 3. CloudWatch Log Group with 14-day retention
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags to log group
    cdk.Tags.of(lambdaLogGroup).add('project', commonTags.project);

    // 4. Lambda Function
    const processorFunction = new lambda.Function(this, 'ServerlessProcessor', {
      functionName: `serverless-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(10),
      logGroup: lambdaLogGroup,
      environment: {
        STAGE: 'production',
        DYNAMODB_TABLE_NAME: dataTable.tableName,
        REGION: this.region,
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({ region: process.env.REGION });
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          try {
            // Handle S3 event
            if (event.Records && event.Records[0].eventSource === 'aws:s3') {
              const s3Record = event.Records[0].s3;
              const bucketName = s3Record.bucket.name;
              const objectKey = s3Record.object.key;
              
              // Store S3 event info in DynamoDB
              const params = {
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: {
                  id: \`s3-event-\${Date.now()}\`,
                  bucket: bucketName,
                  key: objectKey,
                  timestamp: new Date().toISOString(),
                  eventName: event.Records[0].eventName
                }
              };
              
              await docClient.send(new PutCommand(params));
              
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'S3 event processed successfully',
                  bucket: bucketName,
                  key: objectKey
                })
              };
            }
            
            // Handle API Gateway event
            if (event.httpMethod) {
              const response = {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                  message: 'Hello from Serverless API!',
                  stage: process.env.STAGE,
                  timestamp: new Date().toISOString()
                })
              };
              
              return response;
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Event processed' })
            };
            
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
              })
            };
          }
        };
      `),
    });

    // Apply tags to Lambda function
    cdk.Tags.of(processorFunction).add('project', commonTags.project);

    // 5. S3 Bucket with specific naming pattern
    const dataBucket = new s3.Bucket(this, 'DataStorageBucket', {
      bucketName: `prod-${this.account}-data-storage-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      autoDeleteObjects: true, // Only for development
    });

    // Apply tags to S3 bucket
    cdk.Tags.of(dataBucket).add('project', commonTags.project);

    // 6. S3 Event Notification to trigger Lambda
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorFunction),
      { prefix: 'uploads/' } // Only trigger for objects in uploads/ prefix
    );

    // Grant S3 bucket permissions to Lambda
    dataBucket.grantReadWrite(processorFunction);

    // 7. API Gateway with HTTPS and rate limiting
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${environmentSuffix}`,
      description: 'Serverless application API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Apply tags to API Gateway
    cdk.Tags.of(api).add('project', commonTags.project);

    // 8. API Gateway Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      processorFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add API Gateway resources and methods
    const dataResource = api.root.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration);
    dataResource.addMethod('POST', lambdaIntegration);

    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // 9. Usage Plan for Rate Limiting (1000 requests/second)
    const usagePlan = api.addUsagePlan('ServerlessUsagePlan', {
      name: `serverless-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Apply tags to usage plan
    cdk.Tags.of(usagePlan).add('project', commonTags.project);

    // 10. CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      'ServerlessDashboard',
      {
        dashboardName: `serverless-dashboard-${environmentSuffix}`,
      }
    );

    // Add widgets to monitor Lambda, API Gateway, and DynamoDB
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          processorFunction.metricInvocations(),
          processorFunction.metricErrors(),
          processorFunction.metricDuration(),
        ],
      })
    );

    // Apply tags to dashboard
    cdk.Tags.of(dashboard).add('project', commonTags.project);

    // 11. Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      description: 'API Gateway URL',
      value: api.url,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      description: 'S3 Bucket Name',
      value: dataBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      description: 'DynamoDB Table Name',
      value: dataTable.tableName,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      description: 'Lambda Function Name',
      value: processorFunction.functionName,
    });

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
