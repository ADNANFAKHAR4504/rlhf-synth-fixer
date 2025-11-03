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
        Name: `location-tracking-vpc-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Private Subnets (2 for high availability)
    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      tags: {
        Name: `location-tracking-private-subnet-1-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    const privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
      tags: {
        Name: `location-tracking-private-subnet-2-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      name: `lambda-sg-${environmentSuffix}`,
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
        Name: `lambda-sg-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // DynamoDB Table for location tracking
    const locationTable = new DynamodbTable(this, 'LocationTable', {
      name: `driver-locations-${environmentSuffix}`,
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
        Name: `driver-locations-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Dead Letter Queues for Lambda functions
    const updateLocationDLQ = new SqsQueue(this, 'UpdateLocationDLQ', {
      name: `update-location-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: `update-location-dlq-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    const getLocationDLQ = new SqsQueue(this, 'GetLocationDLQ', {
      name: `get-location-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: `get-location-dlq-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    const getHistoryDLQ = new SqsQueue(this, 'GetHistoryDLQ', {
      name: `get-history-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: `get-history-dlq-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Role for Update Location Lambda
    const updateLocationRole = new IamRole(this, 'UpdateLocationRole', {
      namePrefix: `update-location-role-${environmentSuffix}-`,
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
        Name: `update-location-role-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Policy for Update Location Lambda
    const updateLocationPolicy = new IamPolicy(this, 'UpdateLocationPolicy', {
      namePrefix: `update-location-policy-${environmentSuffix}-`,
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
        Name: `update-location-policy-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'UpdateLocationPolicyAttachment', {
      role: updateLocationRole.name,
      policyArn: updateLocationPolicy.arn,
    });

    // IAM Role for Get Location Lambda
    const getLocationRole = new IamRole(this, 'GetLocationRole', {
      namePrefix: `get-location-role-${environmentSuffix}-`,
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
        Name: `get-location-role-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Policy for Get Location Lambda
    const getLocationPolicy = new IamPolicy(this, 'GetLocationPolicy', {
      namePrefix: `get-location-policy-${environmentSuffix}-`,
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
        Name: `get-location-policy-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'GetLocationPolicyAttachment', {
      role: getLocationRole.name,
      policyArn: getLocationPolicy.arn,
    });

    // IAM Role for Get History Lambda
    const getHistoryRole = new IamRole(this, 'GetHistoryRole', {
      namePrefix: `get-history-role-${environmentSuffix}-`,
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
        Name: `get-history-role-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // IAM Policy for Get History Lambda
    const getHistoryPolicy = new IamPolicy(this, 'GetHistoryPolicy', {
      namePrefix: `get-history-policy-${environmentSuffix}-`,
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
        name: `/aws/lambda/update-location-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `update-location-logs-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      }
    );

    const getLocationLogGroup = new CloudwatchLogGroup(
      this,
      'GetLocationLogGroup',
      {
        name: `/aws/lambda/get-location-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `get-location-logs-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      }
    );

    const getHistoryLogGroup = new CloudwatchLogGroup(
      this,
      'GetHistoryLogGroup',
      {
        name: `/aws/lambda/get-history-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `get-history-logs-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      }
    );

    // Lambda Functions
    const updateLocationFunction = new LambdaFunction(
      this,
      'UpdateLocationFunction',
      {
        functionName: `update-location-${environmentSuffix}`,
        role: updateLocationRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        filename: updateLocationArchive.outputPath,
        sourceCodeHash: updateLocationArchive.outputBase64Sha256,
        memorySize: 1024,
        timeout: 30,
        environment: {
          variables: {
            TABLE_NAME: `driver-locations-${environmentSuffix}`,
            AWS_REGION: region,
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
          Name: `update-location-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
        dependsOn: [updateLocationLogGroup],
      }
    );

    const getLocationFunction = new LambdaFunction(
      this,
      'GetLocationFunction',
      {
        functionName: `get-location-${environmentSuffix}`,
        role: getLocationRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        filename: getLocationArchive.outputPath,
        sourceCodeHash: getLocationArchive.outputBase64Sha256,
        memorySize: 512,
        timeout: 10,
        environment: {
          variables: {
            TABLE_NAME: `driver-locations-${environmentSuffix}`,
            AWS_REGION: region,
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
          Name: `get-location-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
        dependsOn: [getLocationLogGroup],
      }
    );

    const getHistoryFunction = new LambdaFunction(this, 'GetHistoryFunction', {
      functionName: `get-history-${environmentSuffix}`,
      role: getHistoryRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: getHistoryArchive.outputPath,
      sourceCodeHash: getHistoryArchive.outputBase64Sha256,
      memorySize: 512,
      timeout: 10,
      environment: {
        variables: {
          TABLE_NAME: `driver-locations-${environmentSuffix}`,
          AWS_REGION: region,
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
        Name: `get-history-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
      dependsOn: [getHistoryLogGroup],
    });

    // CloudWatch Alarms for Lambda errors
    new CloudwatchMetricAlarm(this, 'UpdateLocationErrorAlarm', {
      alarmName: `update-location-errors-${environmentSuffix}`,
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
        Name: `update-location-errors-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'GetLocationErrorAlarm', {
      alarmName: `get-location-errors-${environmentSuffix}`,
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
        Name: `get-location-errors-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'GetHistoryErrorAlarm', {
      alarmName: `get-history-errors-${environmentSuffix}`,
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
        Name: `get-history-errors-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'LocationTrackingApi', {
      name: `location-tracking-api-${environmentSuffix}`,
      description: 'REST API for location tracking',
      endpointConfiguration: {
        types: ['EDGE'],
      },
      tags: {
        Name: `location-tracking-api-${environmentSuffix}`,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Request Validator for POST requests
    const requestValidator = new ApiGatewayRequestValidator(
      this,
      'RequestValidator',
      {
        name: `location-validator-${environmentSuffix}`,
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
        Name: `location-api-prod-${environmentSuffix}`,
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
