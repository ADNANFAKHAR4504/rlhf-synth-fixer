import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayApiKey } from '@cdktf/provider-aws/lib/api-gateway-api-key';
import { ApiGatewayUsagePlan } from '@cdktf/provider-aws/lib/api-gateway-usage-plan';
import { ApiGatewayUsagePlanKey } from '@cdktf/provider-aws/lib/api-gateway-usage-plan-key';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import * as path from 'path';
import * as fs from 'fs';

export interface TapStackConfig {
  environmentSuffix: string;
  environment: string;
  region: string;
  project: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const { environmentSuffix, environment, region, project } = config;

    // Provider configuration
    new AwsProvider(this, 'aws', {
      region: region,
      defaultTags: [
        {
          tags: {
            Environment: environment,
            Project: project,
            ManagedBy: 'CDKTF',
          },
        },
      ],
    });

    new ArchiveProvider(this, 'archive');

    // Environment-specific configuration
    const isDev = environment === 'dev';
    const lambdaMemory = isDev ? 512 : 1024;
    const lambdaConcurrency = isDev ? 10 : 100;
    const throttleRate = isDev ? 100 : 1000;
    const logRetention = isDev ? 7 : 30;

    // DynamoDB Table
    const dynamoTable = new DynamodbTable(this, 'api_table', {
      name: `api-table-${environmentSuffix}`,
      billingMode: isDev ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      readCapacity: isDev ? undefined : 5,
      writeCapacity: isDev ? undefined : 5,
      hashKey: 'id',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
      ],
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `api-table-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, 'lambda_role', {
      name: `lambda-role-${environmentSuffix}`,
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
        Name: `lambda-role-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'lambda_basic_execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // DynamoDB access policy
    const dynamoPolicy = new IamPolicy(this, 'dynamo_policy', {
      name: `dynamo-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: dynamoTable.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda_dynamo_policy', {
      role: lambdaRole.name,
      policyArn: dynamoPolicy.arn,
    });

    // CloudWatch Log Groups
    const lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda_log_group', {
      name: `/aws/lambda/api-function-${environmentSuffix}`,
      retentionInDays: logRetention,
      tags: {
        Name: `lambda-logs-${environmentSuffix}`,
        Environment: environment,
      },
    });

    const apiLogGroup = new CloudwatchLogGroup(this, 'api_log_group', {
      name: `/aws/apigateway/api-${environmentSuffix}`,
      retentionInDays: logRetention,
      tags: {
        Name: `api-logs-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Lambda function code
    const lambdaCodePath = path.join(__dirname, 'lambda');
    if (!fs.existsSync(lambdaCodePath)) {
      fs.mkdirSync(lambdaCodePath, { recursive: true });
    }

    const handlerPath = path.join(lambdaCodePath, 'handler.js');
    if (!fs.existsSync(handlerPath)) {
      fs.writeFileSync(
        handlerPath,
        `
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const tableName = process.env.TABLE_NAME;
  const environment = process.env.ENVIRONMENT;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'API function executed successfully',
      environment: environment,
      tableName: tableName
    })
  };
};
`
      );
    }

    // Archive Lambda code
    const lambdaArchive = new DataArchiveFile(this, 'lambda_archive', {
      type: 'zip',
      sourceDir: lambdaCodePath,
      outputPath: path.join(__dirname, 'lambda.zip'),
    });

    // Lambda Function
    const lambdaFunction = new LambdaFunction(this, 'api_function', {
      functionName: `api-function-${environmentSuffix}`,
      handler: 'handler.handler',
      runtime: 'nodejs18.x',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      memorySize: lambdaMemory,
      timeout: 30,
      reservedConcurrentExecutions: lambdaConcurrency,
      environment: {
        variables: {
          TABLE_NAME: dynamoTable.name,
          ENVIRONMENT: environment,
        },
      },
      tags: {
        Name: `api-function-${environmentSuffix}`,
        Environment: environment,
      },
      dependsOn: [lambdaLogGroup],
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'rest_api', {
      name: `api-${environmentSuffix}`,
      description: `REST API for ${environment} environment`,
      endpointConfiguration: {
        types: ['EDGE'],
      },
      tags: {
        Name: `api-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // API Gateway Resource
    const apiResource = new ApiGatewayResource(this, 'api_resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'items',
    });

    // API Gateway Method
    const apiMethod = new ApiGatewayMethod(this, 'api_method', {
      restApiId: api.id,
      resourceId: apiResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
      apiKeyRequired: !isDev,
    });

    // Lambda Integration
    const integration = new ApiGatewayIntegration(this, 'lambda_integration', {
      restApiId: api.id,
      resourceId: apiResource.id,
      httpMethod: apiMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFunction.invokeArn,
    });

    // Lambda Permission
    new LambdaPermission(this, 'api_lambda_permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, 'api_deployment', {
      restApiId: api.id,
      dependsOn: [integration],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, 'api_stage', {
      stageName: environment,
      restApiId: api.id,
      deploymentId: deployment.id,
      accessLogSettings: !isDev
        ? {
            destinationArn: apiLogGroup.arn,
            format: JSON.stringify({
              requestId: '$context.requestId',
              ip: '$context.identity.sourceIp',
              caller: '$context.identity.caller',
              user: '$context.identity.user',
              requestTime: '$context.requestTime',
              httpMethod: '$context.httpMethod',
              resourcePath: '$context.resourcePath',
              status: '$context.status',
              protocol: '$context.protocol',
              responseLength: '$context.responseLength',
            }),
          }
        : undefined,
      tags: {
        Name: `api-stage-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // API Key for production
    let apiKey: ApiGatewayApiKey | undefined;
    if (!isDev) {
      apiKey = new ApiGatewayApiKey(this, 'api_key', {
        name: `api-key-${environmentSuffix}`,
        enabled: true,
        tags: {
          Name: `api-key-${environmentSuffix}`,
          Environment: environment,
        },
      });

      // Usage Plan
      const usagePlan = new ApiGatewayUsagePlan(this, 'usage_plan', {
        name: `usage-plan-${environmentSuffix}`,
        description: `Usage plan for ${environment} environment`,
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
            throttle: [
              {
                path: '/*',
                rateLimit: throttleRate,
                burstLimit: throttleRate * 2,
              },
            ],
          },
        ],
        throttleSettings: {
          rateLimit: throttleRate,
          burstLimit: throttleRate * 2,
        },
        tags: {
          Name: `usage-plan-${environmentSuffix}`,
          Environment: environment,
        },
      });

      // Associate API Key with Usage Plan
      new ApiGatewayUsagePlanKey(this, 'usage_plan_key', {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      });
    }

    // CloudWatch Alarm for 4XX errors (production only)
    if (!isDev) {
      new CloudwatchMetricAlarm(this, 'api_4xx_alarm', {
        alarmName: `api-4xx-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '4XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        alarmDescription: 'Alert when 4XX error rate exceeds 10%',
        dimensions: {
          ApiName: api.name,
          Stage: stage.stageName,
        },
        tags: {
          Name: `api-4xx-alarm-${environmentSuffix}`,
          Environment: environment,
        },
      });
    }

    // Outputs
    new TerraformOutput(this, 'dynamodb_table_name', {
      value: dynamoTable.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'lambda_function_name', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 'api_gateway_id', {
      value: api.id,
      description: 'API Gateway REST API ID',
    });

    new TerraformOutput(this, 'api_gateway_url', {
      value: `https://${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}`,
      description: 'API Gateway URL',
    });

    new TerraformOutput(this, 'api_stage_name', {
      value: stage.stageName,
      description: 'API Gateway stage name',
    });

    if (apiKey) {
      new TerraformOutput(this, 'api_key_id', {
        value: apiKey.id,
        description: 'API Key ID',
      });
    }
  }
}
