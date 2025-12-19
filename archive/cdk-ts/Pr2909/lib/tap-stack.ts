import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC for DynamoDB endpoint
    const vpc = new ec2.Vpc(this, `TapVpc-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // VPC Endpoint for DynamoDB
    vpc.addGatewayEndpoint(`DynamoDbEndpoint-${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // DynamoDB Table Configuration
    const dynamoTable = new dynamodb.Table(
      this,
      `TapTable-${environmentSuffix}`,
      {
        tableName: `tap-table-${environmentSuffix}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        readCapacity: 5,
        writeCapacity: 5,
        timeToLiveAttribute: 'ttl',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Dead Letter Queue for Lambda
    const deadLetterQueue = new sqs.Queue(this, `TapDLQ-${environmentSuffix}`, {
      queueName: `tap-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Note: Lambda layer removed as it requires external files
    // Dependencies are available in Lambda runtime environment

    // IAM Role for Lambda
    const lambdaRole = new iam.Role(
      this,
      `TapLambdaRole-${environmentSuffix}`,
      {
        roleName: `tap-lambda-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    // Add DynamoDB permissions to Lambda role
    dynamoTable.grantReadWriteData(lambdaRole);

    // Add SQS permissions to Lambda role
    deadLetterQueue.grantSendMessages(lambdaRole);

    // CloudWatch Logs group for Lambda
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `TapLambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/tap-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda Function with inline code
    const lambdaFunction = new lambda.Function(
      this,
      `TapFunction-${environmentSuffix}`,
      {
        functionName: `tap-function-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os
import logging
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(table_name) if table_name else None

def handler(event, context):
    """Main Lambda handler function"""
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        http_method = event.get('httpMethod', 'GET')
        
        if http_method == 'GET':
            return handle_get_request(event, context)
        elif http_method == 'POST':
            return handle_post_request(event, context)
        else:
            return create_response(405, {'error': 'Method not allowed'})
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_request(event, context):
    """Handle GET requests"""
    try:
        query_params = event.get('queryStringParameters') or {}
        item_id = query_params.get('id')
        
        if item_id:
            response = table.get_item(Key={'id': item_id})
            if 'Item' in response:
                return create_response(200, response['Item'])
            else:
                return create_response(404, {'error': 'Item not found'})
        else:
            response = table.scan(Limit=100)
            return create_response(200, {
                'items': response.get('Items', []),
                'count': response.get('Count', 0)
            })
            
    except Exception as e:
        logger.error(f"Error in GET request: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve data'})

def handle_post_request(event, context):
    """Handle POST requests"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        if 'id' not in body:
            return create_response(400, {'error': 'Missing required field: id'})
        
        ttl_timestamp = int((datetime.now() + timedelta(days=30)).timestamp())
        
        item = {
            'id': body['id'],
            'data': body.get('data', {}),
            'timestamp': int(datetime.now().timestamp()),
            'ttl': ttl_timestamp
        }
        
        table.put_item(Item=item)
        
        return create_response(201, {
            'message': 'Item created successfully',
            'id': body['id']
        })
        
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        logger.error(f"Error in POST request: {str(e)}")
        return create_response(500, {'error': 'Failed to create item'})

def create_response(status_code, body):
    """Create API Gateway response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }
`),
        role: lambdaRole,
        environment: {
          DYNAMODB_TABLE_NAME: dynamoTable.tableName,
          ENVIRONMENT: environmentSuffix,
          DLQ_URL: deadLetterQueue.queueUrl,
        },
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        deadLetterQueue: deadLetterQueue,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: lambdaLogGroup,
      }
    );

    // Lambda Version and Alias
    const lambdaVersion = new lambda.Version(
      this,
      `TapFunctionVersion-${environmentSuffix}`,
      {
        lambda: lambdaFunction,
        description: `Version for ${environmentSuffix} environment`,
      }
    );

    const lambdaAlias = new lambda.Alias(
      this,
      `TapFunctionAlias-${environmentSuffix}`,
      {
        aliasName: environmentSuffix,
        version: lambdaVersion,
      }
    );

    // API Gateway CloudWatch Log Group
    const apiLogGroup = new logs.LogGroup(
      this,
      `TapApiLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/apigateway/tap-api-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create CloudWatch Logs role for API Gateway
    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      `TapApiGatewayCloudWatchRole-${environmentSuffix}`,
      {
        roleName: `tap-api-gateway-cloudwatch-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          ),
        ],
      }
    );

    // Set the CloudWatch Logs role for API Gateway account settings
    new apigateway.CfnAccount(
      this,
      `TapApiGatewayAccount-${environmentSuffix}`,
      {
        cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
      }
    );

    // API Gateway REST API
    const api = new apigateway.RestApi(this, `TapApi-${environmentSuffix}`, {
      restApiName: `tap-api-${environmentSuffix}`,
      description: `TAP REST API for ${environmentSuffix} environment`,
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // API Key
    const apiKey = new apigateway.ApiKey(
      this,
      `TapApiKey-${environmentSuffix}`,
      {
        apiKeyName: `tap-api-key-${environmentSuffix}`,
        description: `API Key for TAP ${environmentSuffix} environment`,
      }
    );

    // Usage Plan
    const usagePlan = new apigateway.UsagePlan(
      this,
      `TapUsagePlan-${environmentSuffix}`,
      {
        name: `tap-usage-plan-${environmentSuffix}`,
        description: `Usage plan for TAP ${environmentSuffix} environment`,
        throttle: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
        quota: {
          limit: 10000,
          period: apigateway.Period.DAY,
        },
      }
    );

    // Associate API Key with Usage Plan
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaAlias, {
      proxy: true,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods':
              "'GET,POST,PUT,DELETE,OPTIONS'",
          },
        },
      ],
    });

    // API Gateway Methods
    const resource = api.root.addResource('tap');
    resource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
          },
        },
      ],
    });

    resource.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
          },
        },
      ],
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Project', 'TAP');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);

    // CloudFormation Outputs
    new cdk.CfnOutput(this, `TapApiEndpoint-${environmentSuffix}`, {
      value: api.url,
      description: `TAP REST API endpoint for ${environmentSuffix} environment`,
      exportName: `tap-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TapApiKeyId-${environmentSuffix}`, {
      value: apiKey.keyId,
      description: `TAP API Key ID for ${environmentSuffix} environment`,
      exportName: `tap-api-key-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TapDynamoTableName-${environmentSuffix}`, {
      value: dynamoTable.tableName,
      description: `TAP DynamoDB table name for ${environmentSuffix} environment`,
      exportName: `tap-dynamo-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TapLambdaFunctionName-${environmentSuffix}`, {
      value: lambdaFunction.functionName,
      description: `TAP Lambda function name for ${environmentSuffix} environment`,
      exportName: `tap-lambda-function-${environmentSuffix}`,
    });
  }
}
