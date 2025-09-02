I'll provide you with a complete CDK TypeScript template that meets all your requirements. This template will create a serverless application with Lambda, API Gateway, DynamoDB, and all the monitoring components.

## CDK Template

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';

interface ServerlessAppStackProps extends cdk.StackProps {
  environment?: string;
  logLevel?: string;
}

export class ServerlessAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ServerlessAppStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: props?.env?.account,
        region: 'us-east-1', // Explicitly set to us-east-1
      },
    });

    // Parameters
    const environmentParam = new cdk.CfnParameter(this, 'Environment', {
      type: 'String',
      allowedValues: ['dev', 'stage', 'prod'],
      default: 'dev',
      description: 'Environment for the application',
    });

    const logLevelParam = new cdk.CfnParameter(this, 'LogLevel', {
      type: 'String',
      allowedValues: ['INFO', 'WARN', 'ERROR'],
      default: 'INFO',
      description: 'Log level for the application',
    });

    // DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'DataTable', {
      tableName: `data-table-${environmentParam.valueAsString}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Be careful with this in production
    });

    // DynamoDB Auto Scaling
    const readScaling = dynamoTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 20,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = dynamoTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 20,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/data-processor-${environmentParam.valueAsString}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda (Principle of Least Privilege)
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `lambda-execution-role-${environmentParam.valueAsString}`,
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
        DynamoDBPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem'],
              resources: [dynamoTable.tableArn],
            }),
          ],
        }),
      },
    });

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, 'DataProcessorFunction', {
      functionName: `data-processor-${environmentParam.valueAsString}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: lambdaRole,
      logGroup: logGroup,
      environment: {
        STAGE: environmentParam.valueAsString,
        REGION: 'us-east-1',
        LOG_LEVEL: logLevelParam.valueAsString,
        TABLE_NAME: dynamoTable.tableName,
      },
      code: lambda.Code.fromInline(`
import json
import boto3
import os
import logging
import uuid
from datetime import datetime

# Configure logging
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logging.basicConfig(level=getattr(logging, log_level))
logger = logging.getLogger(__name__)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION'))
table = dynamodb.Table(os.environ.get('TABLE_NAME'))

def handler(event, context):
    try:
        logger.info(f"Processing request in {os.environ.get('STAGE')} environment")
        
        # Parse the request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        # Generate unique ID
        item_id = str(uuid.uuid4())
        
        # Prepare item for DynamoDB
        item = {
            'id': item_id,
            'data': body,
            'timestamp': datetime.utcnow().isoformat(),
            'stage': os.environ.get('STAGE')
        }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored item with ID: {item_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'id': item_id,
                'stage': os.environ.get('STAGE')
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
      `),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'DataProcessorApi', {
      restApiName: `data-processor-api-${environmentParam.valueAsString}`,
      description: 'API Gateway for data processing Lambda function',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // API Gateway Resource and Method
    const dataResource = api.root.addResource('data');
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    dataResource.addMethod('POST', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // CloudWatch Alarm for Lambda Error Rate
    const errorRateAlarm = new cloudwatch.Alarm(this, 'LambdaErrorRateAlarm', {
      alarmName: `lambda-error-rate-${environmentParam.valueAsString}`,
      alarmDescription:
        'Alarm when Lambda function error rate exceeds 5% for 5 consecutive minutes',
      metric: lambdaFunction
        .metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
        })
        .createMathExpression({
          expression: '(errors / invocations) * 100',
          usingMetrics: {
            errors: lambdaFunction.metricErrors({
              statistic: 'Sum',
              period: cdk.Duration.minutes(1),
            }),
            invocations: lambdaFunction.metricInvocations({
              statistic: 'Sum',
              period: cdk.Duration.minutes(1),
            }),
          },
          label: 'Error Rate (%)',
        }),
      threshold: 5,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `api-gateway-url-${environmentParam.valueAsString}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `lambda-function-name-${environmentParam.valueAsString}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `dynamodb-table-name-${environmentParam.valueAsString}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchAlarmName', {
      value: errorRateAlarm.alarmName,
      description: 'CloudWatch Alarm Name',
      exportName: `cloudwatch-alarm-name-${environmentParam.valueAsString}`,
    });
  }
}
```

## App Entry Point

Create an `app.ts` file to instantiate the stack:

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessAppStack } from './serverless-app-stack';

const app = new cdk.App();

new ServerlessAppStack(app, 'ServerlessAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Serverless application with Lambda, API Gateway, and DynamoDB',
});
```

## Package.json Dependencies

Make sure your `package.json` includes these dependencies:

```json
{
  "name": "serverless-app-cdk",
  "version": "1.0.0",
  "main": "lib/app.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "typescript": "~4.9.5",
    "aws-cdk": "2.87.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## Deployment Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy with parameters
cdk deploy --parameters Environment=dev --parameters LogLevel=INFO

# Or deploy to different environments
cdk deploy --parameters Environment=prod --parameters LogLevel=ERROR
```

## Key Features Implemented

1. **Serverless Components**:
   - Lambda function with Python 3.9 runtime
   - API Gateway REST API with POST method on `/data` path

2. **Configuration and Parameters**:
   - Environment parameter (dev/stage/prod, default: dev)
   - LogLevel parameter (INFO/WARN/ERROR, default: INFO)

3. **Lambda Function Specifics**:
   - Environment variables: STAGE, REGION (us-east-1), LOG_LEVEL
   - IAM role with least privilege (CloudWatch logs + DynamoDB PutItem only)

4. **Monitoring and Logging**:
   - Dedicated CloudWatch Log Group
   - CloudWatch Alarm for error rate > 5% for 5 consecutive minutes

5. **Data Storage**:
   - DynamoDB table with 'id' as primary key (String)
   - Provisioned throughput: 5 read/write capacity units
   - Auto Scaling: 70% utilization target, 5-20 capacity range

6. **Region Constraint**:
   - All resources explicitly deployed to us-east-1

The template includes a complete Python Lambda function that processes POST requests, stores data in DynamoDB, and includes proper error handling and logging.
