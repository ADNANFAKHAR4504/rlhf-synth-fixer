# Library Code

## tap-stack.ts

```ts
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { ApiGatewayRequestValidator } from '@cdktf/provider-aws/lib/api-gateway-request-validator';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import * as path from 'path';

export interface TapStackConfig {
  environmentSuffix: string;
  region: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const { environmentSuffix, region } = config;
    /* istanbul ignore next */
    const runId =
      process.env.GITHUB_RUN_ID ||
      process.env.GITHUB_RUN_ATTEMPT ||
      process.env.CI_PIPELINE_ID ||
      process.env.CI_RUN_ID ||
      'local';
    /* istanbul ignore next */
    const deploymentSuffix = runId === 'local' ? '' : `-${runId}`;
    const resourceName = (base: string) =>
      `${base}-${environmentSuffix}${deploymentSuffix}`;

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: region,
    });

    // Configure Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // VPC for Lambda functions
    const vpc = new Vpc(this, 'LocationTrackingVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: resourceName('location-tracking-vpc'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Private Subnets (2 for high availability)
    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      tags: {
        Name: resourceName('location-tracking-private-subnet-1'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    const privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
      tags: {
        Name: resourceName('location-tracking-private-subnet-2'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      name: resourceName('lambda-sg'),
      description: 'Security group for location tracking Lambda functions',
      vpcId: vpc.id,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: resourceName('lambda-sg'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // DynamoDB Table for location tracking
    const locationTable = new DynamodbTable(this, 'LocationTable', {
      name: resourceName('driver-locations'),
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'driverId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'driverId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: resourceName('driver-locations'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Dead Letter Queues for Lambda functions
    const updateLocationDLQ = new SqsQueue(this, 'UpdateLocationDLQ', {
      name: resourceName('update-location-dlq'),
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: resourceName('update-location-dlq'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    const getLocationDLQ = new SqsQueue(this, 'GetLocationDLQ', {
      name: resourceName('get-location-dlq'),
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: resourceName('get-location-dlq'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    const getHistoryDLQ = new SqsQueue(this, 'GetHistoryDLQ', {
      name: resourceName('get-history-dlq'),
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: resourceName('get-history-dlq'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Role for Update Location Lambda
    const updateLocationRole = new IamRole(this, 'UpdateLocationRole', {
      namePrefix: `${resourceName('upd-loc-role')}-`,
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
        Name: resourceName('update-location-role'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Policy for Update Location Lambda
    const updateLocationPolicy = new IamPolicy(this, 'UpdateLocationPolicy', {
      namePrefix: `${resourceName('upd-loc-policy')}-`,
      description: 'Policy for update location Lambda function',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
            Resource: locationTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: updateLocationDLQ.arn,
          },
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
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
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: resourceName('update-location-policy'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'UpdateLocationPolicyAttachment', {
      role: updateLocationRole.name,
      policyArn: updateLocationPolicy.arn,
    });

    // IAM Role for Get Location Lambda
    const getLocationRole = new IamRole(this, 'GetLocationRole', {
      namePrefix: `${resourceName('get-loc-role')}-`,
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
        Name: resourceName('get-location-role'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Policy for Get Location Lambda
    const getLocationPolicy = new IamPolicy(this, 'GetLocationPolicy', {
      namePrefix: `${resourceName('get-loc-policy')}-`,
      description: 'Policy for get location Lambda function',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:Query', 'dynamodb:GetItem'],
            Resource: locationTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: getLocationDLQ.arn,
          },
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
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
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: resourceName('get-location-policy'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'GetLocationPolicyAttachment', {
      role: getLocationRole.name,
      policyArn: getLocationPolicy.arn,
    });

    // IAM Role for Get History Lambda
    const getHistoryRole = new IamRole(this, 'GetHistoryRole', {
      namePrefix: `${resourceName('get-hist-role')}-`,
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
        Name: resourceName('get-history-role'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Policy for Get History Lambda
    const getHistoryPolicy = new IamPolicy(this, 'GetHistoryPolicy', {
      namePrefix: `${resourceName('get-hist-policy')}-`,
      description: 'Policy for get history Lambda function',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:Query', 'dynamodb:Scan'],
            Resource: locationTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: getHistoryDLQ.arn,
          },
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
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
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `get-history-policy-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'GetHistoryPolicyAttachment', {
      role: getHistoryRole.name,
      policyArn: getHistoryPolicy.arn,
    });

    // Lambda Function Code Archives
    const updateLocationArchive = new DataArchiveFile(
      this,
      'UpdateLocationArchive',
      {
        type: 'zip',
        outputPath: path.join(__dirname, 'lambda', 'update-location.zip'),
        sourceDir: path.join(__dirname, 'lambda', 'update-location'),
      }
    );

    const getLocationArchive = new DataArchiveFile(this, 'GetLocationArchive', {
      type: 'zip',
      outputPath: path.join(__dirname, 'lambda', 'get-location.zip'),
      sourceDir: path.join(__dirname, 'lambda', 'get-location'),
    });

    const getHistoryArchive = new DataArchiveFile(this, 'GetHistoryArchive', {
      type: 'zip',
      outputPath: path.join(__dirname, 'lambda', 'get-history.zip'),
      sourceDir: path.join(__dirname, 'lambda', 'get-history'),
    });

    // CloudWatch Log Groups
    const updateLocationLogGroup = new CloudwatchLogGroup(
      this,
      'UpdateLocationLogGroup',
      {
        name: `/aws/lambda/${resourceName('update-location')}`,
        retentionInDays: 7,
        tags: {
          Name: resourceName('update-location-logs'),
          EnvironmentSuffix: environmentSuffix,
        },
      }
    );

    const getLocationLogGroup = new CloudwatchLogGroup(
      this,
      'GetLocationLogGroup',
      {
        name: `/aws/lambda/${resourceName('get-location')}`,
        retentionInDays: 7,
        tags: {
          Name: resourceName('get-location-logs'),
          EnvironmentSuffix: environmentSuffix,
        },
      }
    );

    const getHistoryLogGroup = new CloudwatchLogGroup(
      this,
      'GetHistoryLogGroup',
      {
        name: `/aws/lambda/${resourceName('get-history')}`,
        retentionInDays: 7,
        tags: {
          Name: resourceName('get-history-logs'),
          EnvironmentSuffix: environmentSuffix,
        },
      }
    );

    // Lambda Functions
    const updateLocationFunction = new LambdaFunction(
      this,
      'UpdateLocationFunction',
      {
        functionName: resourceName('update-location'),
        role: updateLocationRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        filename: updateLocationArchive.outputPath,
        sourceCodeHash: updateLocationArchive.outputBase64Sha256,
        memorySize: 1024,
        timeout: 30,
        environment: {
          variables: {
            TABLE_NAME: resourceName('driver-locations'),
            REGION: region,
          },
        },
        deadLetterConfig: {
          targetArn: updateLocationDLQ.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: {
          Name: resourceName('update-location'),
          EnvironmentSuffix: environmentSuffix,
        },
        dependsOn: [updateLocationLogGroup],
      }
    );

    const getLocationFunction = new LambdaFunction(
      this,
      'GetLocationFunction',
      {
        functionName: resourceName('get-location'),
        role: getLocationRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        filename: getLocationArchive.outputPath,
        sourceCodeHash: getLocationArchive.outputBase64Sha256,
        memorySize: 512,
        timeout: 10,
        environment: {
          variables: {
            TABLE_NAME: resourceName('driver-locations'),
            REGION: region,
          },
        },
        deadLetterConfig: {
          targetArn: getLocationDLQ.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: {
          Name: resourceName('get-location'),
          EnvironmentSuffix: environmentSuffix,
        },
        dependsOn: [getLocationLogGroup],
      }
    );

    const getHistoryFunction = new LambdaFunction(this, 'GetHistoryFunction', {
      functionName: resourceName('get-history'),
      role: getHistoryRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: getHistoryArchive.outputPath,
      sourceCodeHash: getHistoryArchive.outputBase64Sha256,
      memorySize: 512,
      timeout: 10,
      environment: {
        variables: {
          TABLE_NAME: resourceName('driver-locations'),
          REGION: region,
        },
      },
      deadLetterConfig: {
        targetArn: getHistoryDLQ.arn,
      },
      tracingConfig: {
        mode: 'Active',
      },
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      tags: {
        Name: resourceName('get-history'),
        EnvironmentSuffix: environmentSuffix,
      },
      dependsOn: [getHistoryLogGroup],
    });

    // CloudWatch Alarms for Lambda errors
    new CloudwatchMetricAlarm(this, 'UpdateLocationErrorAlarm', {
      alarmName: resourceName('update-location-errors'),
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Average',
      threshold: 0.01, // 1% error rate
      dimensions: {
        FunctionName: updateLocationFunction.functionName,
      },
      alarmDescription:
        'Alert when update location Lambda error rate exceeds 1%',
      tags: {
        Name: resourceName('update-location-errors'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'GetLocationErrorAlarm', {
      alarmName: resourceName('get-location-errors'),
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Average',
      threshold: 0.01, // 1% error rate
      dimensions: {
        FunctionName: getLocationFunction.functionName,
      },
      alarmDescription: 'Alert when get location Lambda error rate exceeds 1%',
      tags: {
        Name: resourceName('get-location-errors'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'GetHistoryErrorAlarm', {
      alarmName: resourceName('get-history-errors'),
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Average',
      threshold: 0.01, // 1% error rate
      dimensions: {
        FunctionName: getHistoryFunction.functionName,
      },
      alarmDescription: 'Alert when get history Lambda error rate exceeds 1%',
      tags: {
        Name: resourceName('get-history-errors'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'LocationTrackingApi', {
      name: resourceName('location-tracking-api'),
      description: 'REST API for location tracking',
      endpointConfiguration: {
        types: ['EDGE'],
      },
      tags: {
        Name: resourceName('location-tracking-api'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Request Validator for POST requests
    const requestValidator = new ApiGatewayRequestValidator(
      this,
      'RequestValidator',
      {
        name: resourceName('location-validator'),
        restApiId: api.id,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // API Gateway Resources
    const locationsResource = new ApiGatewayResource(
      this,
      'LocationsResource',
      {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'locations',
      }
    );

    const historyResource = new ApiGatewayResource(this, 'HistoryResource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'history',
    });

    // POST /locations - Update Location
    const postLocationMethod = new ApiGatewayMethod(
      this,
      'PostLocationMethod',
      {
        restApiId: api.id,
        resourceId: locationsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
        requestModels: {
          'application/json': 'Empty',
        },
        requestParameters: {
          'method.request.querystring.driverId': true,
          'method.request.querystring.latitude': true,
          'method.request.querystring.longitude': true,
        },
      }
    );

    const postLocationIntegration = new ApiGatewayIntegration(
      this,
      'PostLocationIntegration',
      {
        restApiId: api.id,
        resourceId: locationsResource.id,
        httpMethod: postLocationMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: updateLocationFunction.invokeArn,
      }
    );

    // GET /locations - Get Current Location
    const getLocationMethod = new ApiGatewayMethod(this, 'GetLocationMethod', {
      restApiId: api.id,
      resourceId: locationsResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
      requestParameters: {
        'method.request.querystring.driverId': true,
      },
    });

    const getLocationIntegration = new ApiGatewayIntegration(
      this,
      'GetLocationIntegration',
      {
        restApiId: api.id,
        resourceId: locationsResource.id,
        httpMethod: getLocationMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: getLocationFunction.invokeArn,
      }
    );

    // GET /history - Get Location History
    const getHistoryMethod = new ApiGatewayMethod(this, 'GetHistoryMethod', {
      restApiId: api.id,
      resourceId: historyResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
      requestParameters: {
        'method.request.querystring.driverId': true,
      },
    });

    const getHistoryIntegration = new ApiGatewayIntegration(
      this,
      'GetHistoryIntegration',
      {
        restApiId: api.id,
        resourceId: historyResource.id,
        httpMethod: getHistoryMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: getHistoryFunction.invokeArn,
      }
    );

    // Lambda Permissions for API Gateway
    new LambdaPermission(this, 'UpdateLocationApiPermission', {
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: updateLocationFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    new LambdaPermission(this, 'GetLocationApiPermission', {
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: getLocationFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    new LambdaPermission(this, 'GetHistoryApiPermission', {
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: getHistoryFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Deployment
    const deployment = new ApiGatewayDeployment(this, 'ApiDeployment', {
      restApiId: api.id,
      dependsOn: [
        postLocationMethod,
        postLocationIntegration,
        getLocationMethod,
        getLocationIntegration,
        getHistoryMethod,
        getHistoryIntegration,
      ],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // API Stage with X-Ray tracing
    const stage = new ApiGatewayStage(this, 'ApiStage', {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: 'prod',
      xrayTracingEnabled: true,
      tags: {
        Name: resourceName('location-api-prod'),
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // API Gateway Method Settings for throttling
    new ApiGatewayMethodSettings(this, 'ApiMethodSettings', {
      restApiId: api.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
        loggingLevel: 'INFO',
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Outputs
    new TerraformOutput(this, 'ApiEndpoint', {
      value: `https://${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'DynamoDbTableName', {
      value: locationTable.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'UpdateLocationFunctionName', {
      value: updateLocationFunction.functionName,
      description: 'Update location Lambda function name',
    });

    new TerraformOutput(this, 'GetLocationFunctionName', {
      value: getLocationFunction.functionName,
      description: 'Get location Lambda function name',
    });

    new TerraformOutput(this, 'GetHistoryFunctionName', {
      value: getHistoryFunction.functionName,
      description: 'Get history Lambda function name',
    });

    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'ApiId', {
      value: api.id,
      description: 'API Gateway ID',
    });
  }
}
```

## lambda/get-history.zip:index.js

```js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from query string
    const queryParams = event.queryStringParameters || {};
    const driverId = queryParams.driverId;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;
    const startTime = queryParams.startTime ? parseInt(queryParams.startTime, 10) : null;
    const endTime = queryParams.endTime ? parseInt(queryParams.endTime, 10) : null;

    if (!driverId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required field: driverId',
        }),
      };
    }

    // Build query parameters
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'driverId = :driverId',
      ExpressionAttributeValues: {
        ':driverId': driverId,
      },
      ScanIndexForward: false, // Sort descending (most recent first)
      Limit: Math.min(limit, 100), // Cap at 100 items
    };

    // Add time range filter if provided
    if (startTime && endTime) {
      params.KeyConditionExpression += ' AND #ts BETWEEN :startTime AND :endTime';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp',
      };
      params.ExpressionAttributeValues[':startTime'] = startTime;
      params.ExpressionAttributeValues[':endTime'] = endTime;
    } else if (startTime) {
      params.KeyConditionExpression += ' AND #ts >= :startTime';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp',
      };
      params.ExpressionAttributeValues[':startTime'] = startTime;
    } else if (endTime) {
      params.KeyConditionExpression += ' AND #ts <= :endTime';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp',
      };
      params.ExpressionAttributeValues[':endTime'] = endTime;
    }

    const result = await docClient.send(new QueryCommand(params));

    const locations = result.Items || [];

    console.log(`Retrieved ${locations.length} location history records for driver ${driverId}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        driverId,
        count: locations.length,
        locations: locations.map((loc) => ({
          timestamp: loc.timestamp,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: loc.updatedAt,
        })),
      }),
    };
  } catch (error) {
    console.error('Error retrieving location history:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve location history',
        message: error.message,
      }),
    };
  }
};
```

## lambda/get-history.zip:package.json

```json
{
  "name": "get-history",
  "version": "1.0.0",
  "description": "Lambda function to get driver location history",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.600.0",
    "@aws-sdk/lib-dynamodb": "^3.600.0"
  }
}
```

## lambda/get-location.zip:index.js

```js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract driverId from query string
    const queryParams = event.queryStringParameters || {};
    const driverId = queryParams.driverId;

    if (!driverId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required field: driverId',
        }),
      };
    }

    // Query DynamoDB for the most recent location
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'driverId = :driverId',
      ExpressionAttributeValues: {
        ':driverId': driverId,
      },
      ScanIndexForward: false, // Sort descending (most recent first)
      Limit: 1,
    };

    const result = await docClient.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'No location found for driver',
          driverId,
        }),
      };
    }

    const location = result.Items[0];

    console.log('Retrieved current location:', location);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        driverId: location.driverId,
        timestamp: location.timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updatedAt,
      }),
    };
  } catch (error) {
    console.error('Error retrieving location:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve location',
        message: error.message,
      }),
    };
  }
};
```

## lambda/get-location.zip:package.json

```json
{
  "name": "get-location",
  "version": "1.0.0",
  "description": "Lambda function to get current driver location",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.600.0",
    "@aws-sdk/lib-dynamodb": "^3.600.0"
  }
}
```

## lambda/update-location.zip:index.js

```js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from query string
    const queryParams = event.queryStringParameters || {};
    const driverId = queryParams.driverId;
    const latitude = queryParams.latitude;
    const longitude = queryParams.longitude;

    // Validate required fields
    if (!driverId || !latitude || !longitude) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: driverId, latitude, longitude',
        }),
      };
    }

    // Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid latitude or longitude',
        }),
      };
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        }),
      };
    }

    const timestamp = Date.now();

    // Store location in DynamoDB
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        driverId,
        timestamp,
        latitude: lat,
        longitude: lon,
        updatedAt: new Date().toISOString(),
      },
    };

    await docClient.send(new PutCommand(params));

    console.log('Location updated successfully:', {
      driverId,
      timestamp,
      latitude: lat,
      longitude: lon,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Location updated successfully',
        driverId,
        timestamp,
        latitude: lat,
        longitude: lon,
      }),
    };
  } catch (error) {
    console.error('Error updating location:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to update location',
        message: error.message,
      }),
    };
  }
};
```

## lambda/update-location.zip:package.json

```json
{
  "name": "update-location",
  "version": "1.0.0",
  "description": "Lambda function to update driver location",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.600.0",
    "@aws-sdk/lib-dynamodb": "^3.600.0"
  }
}
```
