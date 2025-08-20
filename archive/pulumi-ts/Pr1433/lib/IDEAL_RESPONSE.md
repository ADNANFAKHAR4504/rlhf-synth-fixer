# IDEAL_RESPONSE for Pr1433

## components/backend.ts

```typescript
// lib/components/backend.ts

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackendInfrastructureArgs {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  vpcEndpointSgId: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class BackendInfrastructure extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly lambdaRole: aws.iam.Role;
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly apiGateway: aws.apigateway.RestApi;
  public readonly apiResource: aws.apigateway.Resource;
  public readonly apiResourceId: aws.apigateway.Resource;
  public readonly getMethod: aws.apigateway.Method;
  public readonly postMethod: aws.apigateway.Method;
  public readonly getItemMethod: aws.apigateway.Method;
  public readonly getIntegration: aws.apigateway.Integration;
  public readonly postIntegration: aws.apigateway.Integration;
  public readonly getItemIntegration: aws.apigateway.Integration;
  public readonly apiDeployment: aws.apigateway.Deployment;

  constructor(
    name: string,
    args: BackendInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:backend:Infrastructure', name, {}, opts);

    // DynamoDB Table
    this.table = new aws.dynamodb.Table(
      `${name}-table`,
      {
        name: `${name}-app-data`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Lambda IAM Role
    this.lambdaRole = new aws.iam.Role(
      `${name}-lambda-role`,
      {
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach VPC execution role policy
    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-vpc-policy`,
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Lambda custom policy
    const lambdaPolicy = pulumi
      .all([this.table.arn, args.snsTopicArn])
      .apply(([tableArn, snsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: 'sns:Publish',
              Resource: snsArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        })
      );

    new aws.iam.RolePolicy(
      `${name}-lambda-policy`,
      {
        role: this.lambdaRole.id,
        policy: lambdaPolicy,
      },
      { parent: this }
    );

    // Lambda Function
    const lambdaCode = this.getLambdaCode();

    this.lambdaFunction = new aws.lambda.Function(
      `${name}-function`,
      {
        name: `${name}-function`,
        runtime: 'nodejs18.x',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        handler: 'index.handler',
        role: this.lambdaRole.arn,
        timeout: 30,
        memorySize: 256,
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [args.vpcEndpointSgId],
        },
        environment: {
          variables: {
            TABLE_NAME: this.table.name,
            SNS_TOPIC_ARN: args.snsTopicArn,
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // API Gateway REST API
    this.apiGateway = new aws.apigateway.RestApi(
      `${name}-api`,
      {
        name: `${name}-api`,
        description: 'Multi-tier web application API',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // API Gateway resource for /items
    this.apiResource = new aws.apigateway.Resource(
      `${name}-api-resource`,
      {
        restApi: this.apiGateway.id,
        parentId: this.apiGateway.rootResourceId,
        pathPart: 'items',
      },
      { parent: this }
    );

    // API Gateway resource for /items/{id}
    this.apiResourceId = new aws.apigateway.Resource(
      `${name}-api-resource-id`,
      {
        restApi: this.apiGateway.id,
        parentId: this.apiResource.id,
        pathPart: '{id}',
      },
      { parent: this }
    );

    // GET method for /items
    this.getMethod = new aws.apigateway.Method(
      `${name}-get-method`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // POST method for /items
    this.postMethod = new aws.apigateway.Method(
      `${name}-post-method`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // GET method for /items/{id}
    this.getItemMethod = new aws.apigateway.Method(
      `${name}-get-item-method`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResourceId.id,
        httpMethod: 'GET',
        authorization: 'NONE',
        requestParameters: {
          'method.request.path.id': true,
        },
      },
      { parent: this }
    );

    // Create Lambda integrations
    this.createLambdaIntegrations(name);

    // API Gateway deployment - Fixed: removed stageName and created separate stage
    this.apiDeployment = new aws.apigateway.Deployment(
      `${name}-api-deployment`,
      {
        restApi: this.apiGateway.id,
      },
      {
        parent: this,
        dependsOn: [
          this.getMethod,
          this.postMethod,
          this.getItemMethod,
          this.getIntegration,
          this.postIntegration,
          this.getItemIntegration,
        ],
      }
    );

    // Create a separate stage for the deployment
    new aws.apigateway.Stage(
      `${name}-api-stage`,
      {
        deployment: this.apiDeployment.id,
        restApi: this.apiGateway.id,
        stageName: 'v1',
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    new aws.lambda.Permission(
      `${name}-api-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: this.lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.apiGateway.executionArn}/*/*`,
      },
      { parent: this }
    );

    this.registerOutputs({
      tableName: this.table.name,
      lambdaFunctionName: this.lambdaFunction.name,
      apiGatewayUrl: pulumi.interpolate`https://${this.apiGateway.id}.execute-api.${aws.getRegion().then(r => r.name)}.amazonaws.com/v1`,
      apiGatewayId: this.apiGateway.id,
    });
  }

  private createLambdaIntegrations(name: string): void {
    // GET /items integration
    const getIntegration = new aws.apigateway.Integration(
      `${name}-get-integration`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: this.getMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // POST /items integration
    const postIntegration = new aws.apigateway.Integration(
      `${name}-post-integration`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: this.postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // GET /items/{id} integration
    const getItemIntegration = new aws.apigateway.Integration(
      `${name}-get-item-integration`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResourceId.id,
        httpMethod: this.getItemMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Assign to readonly properties using Object.defineProperty
    Object.defineProperty(this, 'getIntegration', {
      value: getIntegration,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 'postIntegration', {
      value: postIntegration,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 'getItemIntegration', {
      value: getItemIntegration,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  private getLambdaCode(): string {
    return `
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const TABLE_NAME = process.env.TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event));
    
    try {
        const httpMethod = event.httpMethod;
        const path = event.path;
        
        if (httpMethod === 'GET' && path === '/items') {
            return await getAllItems();
        } else if (httpMethod === 'POST' && path === '/items') {
            return await createItem(event);
        } else if (httpMethod === 'GET' && path.includes('/items/')) {
            const itemId = event.pathParameters.id;
            return await getItem(itemId);
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Endpoint not found' })
            };
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        
        // Send error notification
        try {
            await sns.publish({
                TopicArn: SNS_TOPIC_ARN,
                Message: \`Lambda function error: \${error.message}\`,
                Subject: 'Backend API Error'
            }).promise();
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};

async function getAllItems() {
    try {
        const response = await dynamodb.scan({
            TableName: TABLE_NAME
        }).promise();
        
        const items = response.Items || [];
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                items: items,
                count: items.length
            })
        };
    } catch (error) {
        console.error('Error getting items:', error.message);
        throw error;
    }
}

async function createItem(event) {
    try {
        const body = JSON.parse(event.body);
        const itemId = uuidv4();
        const now = new Date().toISOString();
        
        const item = {
            id: itemId,
            name: body.name || '',
            description: body.description || '',
            created_at: now,
            updated_at: now
        };
        
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: item
        }).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(item)
        };
    } catch (error) {
        console.error('Error creating item:', error.message);
        throw error;
    }
}

async function getItem(itemId) {
    try {
        const response = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { id: itemId }
        }).promise();
        
        if (response.Item) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(response.Item)
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Item not found' })
            };
        }
    } catch (error) {
        console.error('Error getting item:', error.message);
        throw error;
    }
}
`;
  }
}
```

## components/data.ts

```typescript
// lib/components/data.ts

/**
 * Data Processing Infrastructure Component
 * Creates Amazon Kinesis Data Stream, an AWS Lambda consumer, and an S3 bucket for processed data.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DataProcessingInfrastructureArgs {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  vpcEndpointSgId: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class DataProcessingInfrastructure extends pulumi.ComponentResource {
  public readonly kinesisStream: aws.kinesis.Stream;
  public readonly processedDataBucket: aws.s3.Bucket;
  public readonly kinesisProcessorRole: aws.iam.Role;
  public readonly kinesisProcessor: aws.lambda.Function;
  public readonly kinesisEventSourceMapping: aws.lambda.EventSourceMapping;

  constructor(
    name: string,
    args: DataProcessingInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:data_processing:Infrastructure', name, {}, opts);

    // Kinesis Data Stream
    this.kinesisStream = new aws.kinesis.Stream(
      `${name}-stream`,
      {
        name: `${name}-realtime-events`,
        shardCount: 1, // For demonstration; adjust for production scale
        retentionPeriod: 24, // 24 hours
        tags: args.tags,
      },
      { parent: this }
    );

    // S3 Bucket for processed data
    this.processedDataBucket = new aws.s3.Bucket(
      `${name}-processed-data`,
      {
        // Let AWS auto-generate a unique bucket name
        acl: 'private',
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // IAM Role for Kinesis Processor Lambda
    this.kinesisProcessorRole = new aws.iam.Role(
      `${name}-processor-role`,
      {
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach VPC execution role policy
    new aws.iam.RolePolicyAttachment(
      `${name}-processor-vpc-policy`,
      {
        role: this.kinesisProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for Kinesis processor
    const kinesisProcessorPolicy = pulumi
      .all([
        this.kinesisStream.arn,
        this.processedDataBucket.arn,
        args.snsTopicArn,
      ])
      .apply(([kinesisArn, bucketArn, snsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'kinesis:GetRecords',
                'kinesis:GetShardIterator',
                'kinesis:DescribeStream',
                'kinesis:ListStreams',
              ],
              Resource: kinesisArn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:GetObject', // Added GetObject for potential read-back or validation
              ],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: snsArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        })
      );

    new aws.iam.RolePolicy(
      `${name}-processor-policy`,
      {
        role: this.kinesisProcessorRole.id,
        policy: kinesisProcessorPolicy,
      },
      { parent: this }
    );

    // Kinesis Processor Lambda Function
    const kinesisProcessorCode = this.getKinesisProcessorCode();

    this.kinesisProcessor = new aws.lambda.Function(
      `${name}-processor-function`,
      {
        name: `${name}-kinesis-processor`,
        runtime: 'nodejs18.x',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(kinesisProcessorCode),
        }),
        handler: 'index.handler',
        role: this.kinesisProcessorRole.arn,
        timeout: 60,
        memorySize: 256,
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [args.vpcEndpointSgId],
        },
        environment: {
          variables: {
            PROCESSED_DATA_BUCKET: this.processedDataBucket.id,
            SNS_TOPIC_ARN: args.snsTopicArn,
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Kinesis Event Source Mapping
    this.kinesisEventSourceMapping = new aws.lambda.EventSourceMapping(
      `${name}-kinesis-esm`,
      {
        eventSourceArn: this.kinesisStream.arn,
        functionName: this.kinesisProcessor.arn,
        startingPosition: 'LATEST',
        batchSize: 100,
      },
      { parent: this }
    );

    this.registerOutputs({
      kinesisStreamName: this.kinesisStream.name,
      processedDataBucketName: this.processedDataBucket.id,
      kinesisProcessorFunctionName: this.kinesisProcessor.name,
    });
  }

  private getKinesisProcessorCode(): string {
    return `
const AWS = require('aws-sdk');

const s3Client = new AWS.S3();
const snsClient = new AWS.SNS();
const processedDataBucket = process.env.PROCESSED_DATA_BUCKET;
const snsTopicArn = process.env.SNS_TOPIC_ARN;

exports.handler = async (event, context) => {
    console.log('Received Kinesis event:', JSON.stringify(event));
    let recordsProcessed = 0;
    
    try {
        for (const record of event.Records) {
            // Kinesis data is base64 encoded
            const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
            const data = JSON.parse(payload);
            
            // Add processing timestamp
            data.processed_at = new Date().toISOString();
            
            // Define S3 key (e.g., year/month/day/hour/lambda_request_id_record_sequence_number.json)
            const currentTime = new Date();
            const year = currentTime.getFullYear();
            const month = String(currentTime.getMonth() + 1).padStart(2, '0');
            const day = String(currentTime.getDate()).padStart(2, '0');
            const hour = String(currentTime.getHours()).padStart(2, '0');
            
            const s3Key = \`\${year}/\${month}/\${day}/\${hour}/\${context.awsRequestId}_\${record.kinesis.sequenceNumber}.json\`;
            
            await s3Client.putObject({
                Bucket: processedDataBucket,
                Key: s3Key,
                Body: JSON.stringify(data),
                ContentType: 'application/json'
            }).promise();
            
            console.log(\`Successfully processed record and saved to s3://\${processedDataBucket}/\${s3Key}\`);
            recordsProcessed++;
        }
    } catch (error) {
        console.error('Error processing Kinesis record:', error.message);
        
        // Publish an alert to SNS
        try {
            await snsClient.publish({
                TopicArn: snsTopicArn,
                Message: \`Error in Kinesis processor Lambda: \${error.message}\`,
                Subject: 'Kinesis Processor Error Alert'
            }).promise();
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }
        
        throw error; // Re-raise to indicate failure to Kinesis, allowing retries
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(\`Successfully processed \${recordsProcessed} records.\`)
    };
};
`;
  }
}
```

## components/monitoring.ts

```typescript
// lib/components/monitoring.ts

/**
 * Monitoring Infrastructure Component
 * Creates Amazon SNS Topic and configures CloudWatch Alarms for various services.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringInfrastructureArgs {
  tags: { [key: string]: string };
  emailEndpoint?: string; // Optional email for SNS subscription
}

export class MonitoringInfrastructure extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicSubscription: aws.sns.TopicSubscription;
  private readonly __name: string; // Add the missing __name property

  constructor(
    name: string,
    args: MonitoringInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:Infrastructure', name, {}, opts);

    // Store the name for use in alarm creation
    this.__name = name;

    // SNS Topic for alerts
    this.snsTopic = new aws.sns.Topic(
      `${name}-alerts-topic`,
      {
        name: `${name}-alerts`,
        tags: args.tags,
      },
      { parent: this }
    );

    // SNS Topic Subscription (email)
    this.snsTopicSubscription = new aws.sns.TopicSubscription(
      `${name}-email-subscription`,
      {
        topic: this.snsTopic.arn,
        protocol: 'email',
        endpoint: args.emailEndpoint || 'your-alert-email@example.com',
      },
      {
        parent: this,
        dependsOn: [this.snsTopic],
      }
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      snsTopicName: this.snsTopic.name,
    });
  }

  /**
   * Configures CloudWatch Alarms for various deployed services.
   */
  public setupAlarms(
    lambdaFunctionNames: pulumi.Output<string>[],
    kinesisStreamName: pulumi.Output<string>,
    cloudfrontDistributionId: pulumi.Output<string>,
    opts?: pulumi.ResourceOptions
  ): void {
    const defaultOpts = opts || { parent: this };

    // Lambda Error Alarms
    lambdaFunctionNames.forEach(lambdaNameOutput => {
      lambdaNameOutput.apply(name => {
        const sanitizedName = name.replace(/-/g, '');

        new aws.cloudwatch.MetricAlarm(
          `${this.__name}-${sanitizedName}-errors-alarm`,
          {
            name: `${this.__name}-${name}-errors`,
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            evaluationPeriods: 1,
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            period: 60,
            statistic: 'Sum',
            threshold: 1,
            dimensions: {
              FunctionName: name,
            },
            alarmDescription: `Alarm when Lambda function ${name} reports errors`,
            alarmActions: [this.snsTopic.arn],
            okActions: [this.snsTopic.arn],
          },
          defaultOpts
        );

        return name; // Return the name for the apply chain
      });
    });

    // Kinesis PutRecord.Errors Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.__name}-kinesis-put-errors-alarm`,
      {
        name: pulumi.interpolate`${this.__name}-kinesis-put-record-errors`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        metricName: 'PutRecord.Errors',
        namespace: 'AWS/Kinesis',
        period: 60,
        statistic: 'Sum',
        threshold: 1,
        dimensions: {
          StreamName: kinesisStreamName,
        },
        alarmDescription:
          'Alarm when Kinesis PutRecord operations experience errors',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
      },
      defaultOpts
    );

    // CloudFront Error Rate Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.__name}-cloudfront-error-rate-alarm`,
      {
        name: pulumi.interpolate`${this.__name}-cloudfront-error-rate`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        metricName: '4xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 1.0,
        dimensions: {
          DistributionId: cloudfrontDistributionId,
          Region: 'Global',
        },
        alarmDescription: 'Alarm when CloudFront error rate is high',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
      },
      defaultOpts
    );
  }

  /**
   * Setup additional custom alarms for specific metrics
   */
  public setupCustomAlarms(
    customAlarms: CustomAlarmConfig[],
    opts?: pulumi.ResourceOptions
  ): void {
    const defaultOpts = opts || { parent: this };

    customAlarms.forEach((config, index) => {
      new aws.cloudwatch.MetricAlarm(
        `${this.__name}-custom-alarm-${index}`,
        {
          name: config.name,
          comparisonOperator: config.comparisonOperator,
          evaluationPeriods: config.evaluationPeriods,
          metricName: config.metricName,
          namespace: config.namespace,
          period: config.period,
          statistic: config.statistic,
          threshold: config.threshold,
          dimensions: config.dimensions,
          alarmDescription: config.description,
          alarmActions: [this.snsTopic.arn],
          okActions: [this.snsTopic.arn],
        },
        defaultOpts
      );
    });
  }
}

/**
 * Interface for custom alarm configuration
 */
export interface CustomAlarmConfig {
  name: string;
  comparisonOperator: string;
  evaluationPeriods: number;
  metricName: string;
  namespace: string;
  period: number;
  statistic: string;
  threshold: number;
  dimensions: { [key: string]: pulumi.Input<string> };
  description: string;
}
```

## components/networking.ts

```typescript
// lib/components/networking.ts

/**
 * Network Infrastructure Component
 * Creates VPC, subnets, security groups, NAT gateways, and VPC endpoints
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkInfrastructureArgs {
  environment: string;
  tags: { [key: string]: string };
}

export class NetworkInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly igw: aws.ec2.InternetGateway;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly natEips: aws.ec2.Eip[];
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly lambdaSecurityGroup: aws.ec2.SecurityGroup;
  public readonly vpcEndpointSecurityGroup: aws.ec2.SecurityGroup;
  public readonly dynamodbEndpoint: aws.ec2.VpcEndpoint;
  public readonly s3Endpoint: aws.ec2.VpcEndpoint;
  public readonly kinesisEndpoint: aws.ec2.VpcEndpoint;

  constructor(
    name: string,
    args: NetworkInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:Infrastructure', name, {}, opts);

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...args.tags, Name: `${name}-vpc` },
      },
      { parent: this }
    );

    // Internet Gateway
    this.igw = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: { ...args.tags, Name: `${name}-igw` },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({ state: 'available' });
    console.log(
      `DEBUG: get_availability_zones returned: ${azs.then(zones => zones.names)}`
    );

    // Public Subnets
    this.publicSubnets = [];
    this.publicSubnetIds = [];

    for (let i = 0; i < 2; i++) {
      const azName = azs.then(zones => zones.names[i]);

      const subnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azName,
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `${name}-public-subnet-${i + 1}`,
            Type: 'Public',
          },
        },
        { parent: this }
      );

      this.publicSubnets.push(subnet);
      this.publicSubnetIds.push(subnet.id);
    }

    // Private Subnets
    this.privateSubnets = [];
    this.privateSubnetIds = [];

    for (let i = 0; i < 2; i++) {
      const azName = azs.then(zones => zones.names[i]);

      const subnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azName,
          tags: {
            ...args.tags,
            Name: `${name}-private-subnet-${i + 1}`,
            Type: 'Private',
          },
        },
        { parent: this }
      );

      this.privateSubnets.push(subnet);
      this.privateSubnetIds.push(subnet.id);
    }

    // NAT Gateway EIPs
    this.natEips = [];
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const eip = new aws.ec2.Eip(
        `${name}-nat-eip-${i + 1}`,
        {
          domain: 'vpc',
          tags: { ...args.tags, Name: `${name}-nat-eip-${i + 1}` },
        },
        {
          parent: this,
          dependsOn: [this.igw],
        }
      );
      this.natEips.push(eip);
    }

    // NAT Gateways
    this.natGateways = [];
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const nat = new aws.ec2.NatGateway(
        `${name}-nat-${i + 1}`,
        {
          allocationId: this.natEips[i].id,
          subnetId: this.publicSubnets[i].id,
          tags: { ...args.tags, Name: `${name}-nat-${i + 1}` },
        },
        { parent: this }
      );
      this.natGateways.push(nat);
    }

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: { ...args.tags, Name: `${name}-public-rt` },
      },
      { parent: this }
    );

    // Public Route
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.igw.id,
      },
      { parent: this }
    );

    // Public Route Table Associations
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i + 1}`,
        {
          subnetId: this.publicSubnets[i].id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Private Route Tables
    this.privateRouteTables = [];
    for (let i = 0; i < this.privateSubnets.length; i++) {
      const rt = new aws.ec2.RouteTable(
        `${name}-private-rt-${i + 1}`,
        {
          vpcId: this.vpc.id,
          tags: { ...args.tags, Name: `${name}-private-rt-${i + 1}` },
        },
        { parent: this }
      );

      // Private Route
      new aws.ec2.Route(
        `${name}-private-route-${i + 1}`,
        {
          routeTableId: rt.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[i].id,
        },
        { parent: this }
      );

      // Private Route Table Association
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i + 1}`,
        {
          subnetId: this.privateSubnets[i].id,
          routeTableId: rt.id,
        },
        { parent: this }
      );

      this.privateRouteTables.push(rt);
    }

    // Lambda Security Group
    this.lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-lambda-sg`,
      {
        name: `${name}-lambda-sg`,
        description: 'Security group for Lambda functions',
        vpcId: this.vpc.id,
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP outbound',
          },
        ],
        tags: { ...args.tags, Name: `${name}-lambda-sg` },
      },
      { parent: this }
    );

    // VPC Endpoint Security Group
    this.vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-vpc-endpoint-sg`,
      {
        name: `${name}-vpc-endpoint-sg`,
        description: 'Security group for VPC endpoints',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            securityGroups: [this.lambdaSecurityGroup.id],
            description: 'HTTPS from Lambda',
          },
        ],
        tags: { ...args.tags, Name: `${name}-vpc-endpoint-sg` },
      },
      { parent: this }
    );

    // Create VPC Endpoints and assign to readonly properties
    const vpcEndpoints = this.createVpcEndpoints(name, args.tags);

    // Use Object.defineProperty to assign to readonly properties
    Object.defineProperty(this, 'dynamodbEndpoint', {
      value: vpcEndpoints.dynamodbEndpoint,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 's3Endpoint', {
      value: vpcEndpoints.s3Endpoint,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 'kinesisEndpoint', {
      value: vpcEndpoints.kinesisEndpoint,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      lambdaSecurityGroupId: this.lambdaSecurityGroup.id,
      vpcEndpointSecurityGroupId: this.vpcEndpointSecurityGroup.id,
    });
  }

  /**
   * Create VPC endpoints for AWS services
   */
  private createVpcEndpoints(
    name: string,
    tags: { [key: string]: string }
  ): {
    dynamodbEndpoint: aws.ec2.VpcEndpoint;
    s3Endpoint: aws.ec2.VpcEndpoint;
    kinesisEndpoint: aws.ec2.VpcEndpoint;
  } {
    const region = aws.getRegion();

    // DynamoDB VPC Endpoint (Gateway)
    const dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `${name}-dynamodb-endpoint`,
      {
        vpcId: this.vpc.id,
        serviceName: region.then(r => `com.amazonaws.${r.name}.dynamodb`),
        vpcEndpointType: 'Gateway',
        routeTableIds: this.privateRouteTables.map(rt => rt.id),
        tags: { ...tags, Name: `${name}-dynamodb-endpoint` },
      },
      { parent: this }
    );

    // S3 VPC Endpoint (Gateway)
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `${name}-s3-endpoint`,
      {
        vpcId: this.vpc.id,
        serviceName: region.then(r => `com.amazonaws.${r.name}.s3`),
        vpcEndpointType: 'Gateway',
        routeTableIds: this.privateRouteTables.map(rt => rt.id),
        tags: { ...tags, Name: `${name}-s3-endpoint` },
      },
      { parent: this }
    );

    // Kinesis VPC Endpoint (Interface)
    const kinesisEndpoint = new aws.ec2.VpcEndpoint(
      `${name}-kinesis-endpoint`,
      {
        vpcId: this.vpc.id,
        serviceName: region.then(
          r => `com.amazonaws.${r.name}.kinesis-streams`
        ),
        vpcEndpointType: 'Interface',
        subnetIds: this.privateSubnetIds,
        securityGroupIds: [this.vpcEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `${name}-kinesis-endpoint` },
      },
      { parent: this }
    );

    return {
      dynamodbEndpoint,
      s3Endpoint,
      kinesisEndpoint,
    };
  }
}
```

## components/user.ts

```typescript
// lib/components/frontend.ts

/**
 * Frontend Infrastructure Component
 * Creates S3 bucket, CloudFront distribution, and related resources
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface FrontendInfrastructureArgs {
  tags: { [key: string]: string };
}

export class FrontendInfrastructure extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly oac: aws.cloudfront.OriginAccessControl;
  public readonly cloudfrontDistribution: aws.cloudfront.Distribution;

  constructor(
    name: string,
    args: FrontendInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:frontend:Infrastructure', name, {}, opts);

    // S3 bucket for static website content
    this.bucket = new aws.s3.Bucket(
      `${name}-website`,
      {
        website: {
          indexDocument: 'index.html',
          errorDocument: 'error.html',
        },
        acl: 'private',
        tags: { ...args.tags, Name: `${name}-website` },
      },
      { parent: this }
    );

    // Block public access to the S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `${name}-website-pab`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Origin Access Control for CloudFront to access S3
    this.oac = new aws.cloudfront.OriginAccessControl(
      `${name}-oac`,
      {
        name: `${name}-oac`,
        description: 'OAC for S3 bucket access',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
      { parent: this }
    );

    // CloudFront distribution with S3 origin
    this.cloudfrontDistribution = new aws.cloudfront.Distribution(
      `${name}-distribution`,
      {
        origins: [
          {
            domainName: this.bucket.bucketDomainName,
            originId: `${name}-s3-origin`,
            originAccessControlId: this.oac.id,
          },
        ],
        enabled: true,
        isIpv6Enabled: true,
        defaultRootObject: 'index.html',
        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: `${name}-s3-origin`,
          compress: true,
          viewerProtocolPolicy: 'redirect-to-https',
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        customErrorResponses: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 300,
          },
        ],
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        priceClass: 'PriceClass_100',
        tags: { ...args.tags, Name: `${name}-distribution` },
      },
      { parent: this }
    );

    // S3 bucket policy to allow CloudFront access
    const bucketPolicy = pulumi
      .all([this.bucket.arn, this.cloudfrontDistribution.arn])
      .apply(([bucketArn, distributionArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowCloudFrontServicePrincipal',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com',
              },
              Action: 's3:GetObject',
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  'AWS:SourceArn': distributionArn,
                },
              },
            },
          ],
        })
      );

    new aws.s3.BucketPolicy(
      `${name}-bucket-policy`,
      {
        bucket: this.bucket.id,
        policy: bucketPolicy,
      },
      { parent: this }
    );

    // Upload sample files
    this.uploadSampleFiles(name);

    this.registerOutputs({
      bucketName: this.bucket.id,
      cloudfrontDomain: this.cloudfrontDistribution.domainName,
      cloudfrontDistributionId: this.cloudfrontDistribution.id,
    });
  }

  /**
   * Upload sample HTML, CSS, and JS files
   */
  private uploadSampleFiles(name: string): void {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Tier Web Application</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Multi-Tier Web Application</h1>
    <p>This is a sample frontend for the multi-tier web application.</p>
    <div id="api-test">
      <button onclick="testAPI()">Test Backend API</button>
      <div id="api-result"></div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

    new aws.s3.BucketObject(
      `${name}-index-html`,
      {
        bucket: this.bucket.id,
        key: 'index.html',
        content: indexHtml,
        contentType: 'text/html',
      },
      { parent: this }
    );

    const cssContent = `
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

#api-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 50px;
}
`;

    new aws.s3.BucketObject(
      `${name}-css`,
      {
        bucket: this.bucket.id,
        key: 'styles.css',
        content: cssContent,
        contentType: 'text/css',
      },
      { parent: this }
    );

    const jsContent = `
async function testAPI() {
  const resultDiv = document.getElementById('api-result');
  resultDiv.innerHTML = 'Testing API...';

  try {
    // Placeholder for API testing
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = \`<strong>API Response:</strong> \${JSON.stringify(data, null, 2)}\`;
    } else {
      resultDiv.innerHTML = \`<strong>Error:</strong> \${response.status} - \${response.statusText}\`;
    }
  } catch (error) {
    resultDiv.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
  }
}
`;

    new aws.s3.BucketObject(
      `${name}-js`,
      {
        bucket: this.bucket.id,
        key: 'app.js',
        content: jsContent,
        contentType: 'application/javascript',
      },
      { parent: this }
    );

    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back to home</a>
  </div>
</body>
</html>`;

    new aws.s3.BucketObject(
      `${name}-error-html`,
      {
        bucket: this.bucket.id,
        key: 'error.html',
        content: errorHtml,
        contentType: 'text/html',
      },
      { parent: this }
    );
  }
}
```

## tap-stack.ts

```typescript
// lib/tap-stack.ts

/**
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the Multi-Tiered Web Application project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */

import * as pulumi from '@pulumi/pulumi';
import { NetworkInfrastructure } from './components/networking';
import { FrontendInfrastructure } from './components/user';
import { BackendInfrastructure } from './components/backend';
import { DataProcessingInfrastructure } from './components/data';
import { MonitoringInfrastructure } from './components/monitoring';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly environmentSuffix: string;
  public readonly tags: { [key: string]: string };
  public readonly network: NetworkInfrastructure;
  public readonly monitoring: MonitoringInfrastructure;
  public readonly backend: BackendInfrastructure;
  public readonly dataProcessing: DataProcessingInfrastructure;
  public readonly frontend: FrontendInfrastructure;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, {}, opts);

    this.environmentSuffix = args.environmentSuffix || 'dev';
    this.tags = args.tags || {};

    // Create network infrastructure
    this.network = new NetworkInfrastructure(
      `${name}-network`,
      {
        environment: this.environmentSuffix,
        tags: this.tags,
      },
      { parent: this }
    );

    // Create monitoring infrastructure
    this.monitoring = new MonitoringInfrastructure(
      `${name}-monitoring`,
      {
        tags: this.tags,
      },
      { parent: this }
    );

    // Create backend infrastructure
    this.backend = new BackendInfrastructure(
      `${name}-backend`,
      {
        vpcId: this.network.vpc.id,
        privateSubnetIds: this.network.privateSubnetIds,
        vpcEndpointSgId: this.network.vpcEndpointSecurityGroup.id,
        snsTopicArn: this.monitoring.snsTopic.arn,
        tags: this.tags,
      },
      {
        parent: this,
        dependsOn: [this.network, this.monitoring],
      }
    );

    // Create data processing infrastructure
    this.dataProcessing = new DataProcessingInfrastructure(
      `${name}-data`,
      {
        vpcId: this.network.vpc.id,
        privateSubnetIds: this.network.privateSubnetIds,
        vpcEndpointSgId: this.network.vpcEndpointSecurityGroup.id,
        snsTopicArn: this.monitoring.snsTopic.arn,
        tags: this.tags,
      },
      {
        parent: this,
        dependsOn: [this.network, this.monitoring],
      }
    );

    // Create frontend infrastructure
    this.frontend = new FrontendInfrastructure(
      `${name}-frontend`,
      {
        tags: this.tags,
      },
      {
        parent: this,
        dependsOn: [this.backend],
      }
    );

    // Setup monitoring alarms for all components
    this.monitoring.setupAlarms(
      [
        this.backend.lambdaFunction.name,
        this.dataProcessing.kinesisProcessor.name,
      ],
      this.dataProcessing.kinesisStream.name,
      this.frontend.cloudfrontDistribution.id,
      { parent: this }
    );

    // Register component outputs
    this.registerOutputs({
      vpcId: this.network.vpc.id,
      cloudfrontDomain: this.frontend.cloudfrontDistribution.domainName,
      kinesisStreamName: this.dataProcessing.kinesisStream.name,
      snsTopicArn: this.monitoring.snsTopic.arn,
    });

    // Note: pulumi.export should be called from the main index.ts file, not from within a ComponentResource
    // The exports are now available through the registerOutputs() call above
  }

  /**
   * Helper method to get all stack outputs for easy access
   */
  public getOutputs() {
    return {
      vpcId: this.network.vpc.id,
      cloudfrontDomain: this.frontend.cloudfrontDistribution.domainName,
      kinesisStreamName: this.dataProcessing.kinesisStream.name,
      snsTopicArn: this.monitoring.snsTopic.arn,
    };
  }
}

// Additional helper function to create TapStackArgs easily
export function createTapStackArgs(
  environmentSuffix?: string,
  tags?: { [key: string]: string }
): TapStackArgs {
  return {
    environmentSuffix: environmentSuffix || 'dev',
    tags: tags || {},
  };
}

// Export the component interfaces for external use
export { NetworkInfrastructure } from './components/networking';
export { FrontendInfrastructure } from './components/user';
export { BackendInfrastructure } from './components/backend';
export { DataProcessingInfrastructure } from './components/data';
export { MonitoringInfrastructure } from './components/monitoring';
```

