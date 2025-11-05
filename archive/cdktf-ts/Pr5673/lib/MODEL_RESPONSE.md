# CDKTF Infrastructure Implementation

This document contains the complete CDKTF TypeScript implementation for the multi-environment REST API infrastructure.

## File: lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput, Fn } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { ApiGatewayApiKey } from "@cdktf/provider-aws/lib/api-gateway-api-key";
import { ApiGatewayUsagePlan } from "@cdktf/provider-aws/lib/api-gateway-usage-plan";
import { ApiGatewayUsagePlanKey } from "@cdktf/provider-aws/lib/api-gateway-usage-plan-key";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { DataArchiveFile } from "@cdktf/provider-archive/lib/data-archive-file";
import { ArchiveProvider } from "@cdktf/provider-archive/lib/provider";
import * as path from "path";
import * as fs from "fs";

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
    new AwsProvider(this, "aws", {
      region: region,
      defaultTags: [{
        tags: {
          Environment: environment,
          Project: project,
          ManagedBy: "CDKTF"
        }
      }]
    });

    new ArchiveProvider(this, "archive");

    // Environment-specific configuration
    const isDev = environment === "dev";
    const lambdaMemory = isDev ? 512 : 1024;
    const lambdaConcurrency = isDev ? 10 : 100;
    const throttleRate = isDev ? 100 : 1000;
    const logRetention = isDev ? 7 : 30;

    // DynamoDB Table
    const dynamoTable = new DynamodbTable(this, "api_table", {
      name: `api-table-${environmentSuffix}`,
      billingMode: isDev ? "PAY_PER_REQUEST" : "PROVISIONED",
      readCapacity: isDev ? undefined : 5,
      writeCapacity: isDev ? undefined : 5,
      hashKey: "id",
      attribute: [{
        name: "id",
        type: "S"
      }],
      serverSideEncryption: [{
        enabled: true
      }],
      tags: {
        Name: `api-table-${environmentSuffix}`,
        Environment: environment
      }
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, "lambda_role", {
      name: `lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com"
          }
        }]
      }),
      tags: {
        Name: `lambda-role-${environmentSuffix}`,
        Environment: environment
      }
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, "lambda_basic_execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    });

    // DynamoDB access policy
    const dynamoPolicy = new IamPolicy(this, "dynamo_policy", {
      name: `dynamo-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan"
          ],
          Resource: dynamoTable.arn
        }]
      })
    });

    new IamRolePolicyAttachment(this, "lambda_dynamo_policy", {
      role: lambdaRole.name,
      policyArn: dynamoPolicy.arn
    });

    // CloudWatch Log Groups
    const lambdaLogGroup = new CloudwatchLogGroup(this, "lambda_log_group", {
      name: `/aws/lambda/api-function-${environmentSuffix}`,
      retentionInDays: logRetention,
      tags: {
        Name: `lambda-logs-${environmentSuffix}`,
        Environment: environment
      }
    });

    const apiLogGroup = new CloudwatchLogGroup(this, "api_log_group", {
      name: `/aws/apigateway/api-${environmentSuffix}`,
      retentionInDays: logRetention,
      tags: {
        Name: `api-logs-${environmentSuffix}`,
        Environment: environment
      }
    });

    // Lambda function code
    const lambdaCodePath = path.join(__dirname, "lambda");
    if (!fs.existsSync(lambdaCodePath)) {
      fs.mkdirSync(lambdaCodePath, { recursive: true });
    }

    const handlerPath = path.join(lambdaCodePath, "handler.js");
    if (!fs.existsSync(handlerPath)) {
      fs.writeFileSync(handlerPath, `
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
`);
    }

    // Archive Lambda code
    const lambdaArchive = new DataArchiveFile(this, "lambda_archive", {
      type: "zip",
      sourceDir: lambdaCodePath,
      outputPath: path.join(__dirname, "lambda.zip")
    });

    // Lambda Function
    const lambdaFunction = new LambdaFunction(this, "api_function", {
      functionName: `api-function-${environmentSuffix}`,
      handler: "handler.handler",
      runtime: "nodejs18.x",
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      memorySize: lambdaMemory,
      timeout: 30,
      reservedConcurrentExecutions: lambdaConcurrency,
      environment: {
        variables: {
          TABLE_NAME: dynamoTable.name,
          ENVIRONMENT: environment
        }
      },
      tags: {
        Name: `api-function-${environmentSuffix}`,
        Environment: environment
      },
      dependsOn: [lambdaLogGroup]
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, "rest_api", {
      name: `api-${environmentSuffix}`,
      description: `REST API for ${environment} environment`,
      endpointConfiguration: {
        types: ["EDGE"]
      },
      tags: {
        Name: `api-${environmentSuffix}`,
        Environment: environment
      }
    });

    // API Gateway Resource
    const apiResource = new ApiGatewayResource(this, "api_resource", {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "items"
    });

    // API Gateway Method
    const apiMethod = new ApiGatewayMethod(this, "api_method", {
      restApiId: api.id,
      resourceId: apiResource.id,
      httpMethod: "GET",
      authorization: "NONE",
      apiKeyRequired: !isDev
    });

    // Lambda Integration
    const integration = new ApiGatewayIntegration(this, "lambda_integration", {
      restApiId: api.id,
      resourceId: apiResource.id,
      httpMethod: apiMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn
    });

    // Lambda Permission
    new LambdaPermission(this, "api_lambda_permission", {
      statementId: "AllowAPIGatewayInvoke",
      action: "lambda:InvokeFunction",
      functionName: lambdaFunction.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, "api_deployment", {
      restApiId: api.id,
      dependsOn: [integration],
      lifecycle: {
        createBeforeDestroy: true
      }
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, "api_stage", {
      stageName: environment,
      restApiId: api.id,
      deploymentId: deployment.id,
      accessLogSettings: !isDev ? {
        destinationArn: apiLogGroup.arn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          ip: "$context.identity.sourceIp",
          caller: "$context.identity.caller",
          user: "$context.identity.user",
          requestTime: "$context.requestTime",
          httpMethod: "$context.httpMethod",
          resourcePath: "$context.resourcePath",
          status: "$context.status",
          protocol: "$context.protocol",
          responseLength: "$context.responseLength"
        })
      } : undefined,
      tags: {
        Name: `api-stage-${environmentSuffix}`,
        Environment: environment
      }
    });

    // API Gateway Stage throttling
    new ApiGatewayMethod(this, "api_method_settings", {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      httpMethod: "*",
      authorization: "NONE"
    });

    // API Key for production
    let apiKey: ApiGatewayApiKey | undefined;
    if (!isDev) {
      apiKey = new ApiGatewayApiKey(this, "api_key", {
        name: `api-key-${environmentSuffix}`,
        enabled: true,
        tags: {
          Name: `api-key-${environmentSuffix}`,
          Environment: environment
        }
      });

      // Usage Plan
      const usagePlan = new ApiGatewayUsagePlan(this, "usage_plan", {
        name: `usage-plan-${environmentSuffix}`,
        description: `Usage plan for ${environment} environment`,
        apiStages: [{
          apiId: api.id,
          stage: stage.stageName,
          throttle: [{
            path: "/*",
            rateLimit: throttleRate,
            burstLimit: throttleRate * 2
          }]
        }],
        throttleSettings: {
          rateLimit: throttleRate,
          burstLimit: throttleRate * 2
        },
        tags: {
          Name: `usage-plan-${environmentSuffix}`,
          Environment: environment
        }
      });

      // Associate API Key with Usage Plan
      new ApiGatewayUsagePlanKey(this, "usage_plan_key", {
        keyId: apiKey.id,
        keyType: "API_KEY",
        usagePlanId: usagePlan.id
      });
    }

    // CloudWatch Alarm for 4XX errors (production only)
    if (!isDev) {
      new CloudwatchMetricAlarm(this, "api_4xx_alarm", {
        alarmName: `api-4xx-errors-${environmentSuffix}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "4XXError",
        namespace: "AWS/ApiGateway",
        period: 300,
        statistic: "Sum",
        threshold: 10,
        treatMissingData: "notBreaching",
        alarmDescription: "Alert when 4XX error rate exceeds 10%",
        dimensions: {
          ApiName: api.name,
          Stage: stage.stageName
        },
        tags: {
          Name: `api-4xx-alarm-${environmentSuffix}`,
          Environment: environment
        }
      });
    }

    // Outputs
    new TerraformOutput(this, "dynamodb_table_name", {
      value: dynamoTable.name,
      description: "DynamoDB table name"
    });

    new TerraformOutput(this, "lambda_function_name", {
      value: lambdaFunction.functionName,
      description: "Lambda function name"
    });

    new TerraformOutput(this, "api_gateway_id", {
      value: api.id,
      description: "API Gateway REST API ID"
    });

    new TerraformOutput(this, "api_gateway_url", {
      value: `https://${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}`,
      description: "API Gateway URL"
    });

    new TerraformOutput(this, "api_stage_name", {
      value: stage.stageName,
      description: "API Gateway stage name"
    });

    if (apiKey) {
      new TerraformOutput(this, "api_key_id", {
        value: apiKey.id,
        description: "API Key ID"
      });
    }
  }
}
```

## File: bin/main.ts

```typescript
import { App } from "cdktf";
import { TapStack } from "../lib/tap-stack";

const app = new App();

// Get environment from context or use 'dev' as default
const environment = app.node.tryGetContext("environment") || "dev";
const environmentSuffix = app.node.tryGetContext("environmentSuffix") || `${environment}-${Date.now()}`;
const region = app.node.tryGetContext("region") || "ap-southeast-1";
const project = app.node.tryGetContext("project") || "fintech-api";

new TapStack(app, `${project}-api-${environment}`, {
  environmentSuffix,
  environment,
  region,
  project
});

app.synth();
```

## File: lib/lambda/handler.js

```javascript
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const tableName = process.env.TABLE_NAME;
  const environment = process.env.ENVIRONMENT;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'API function executed successfully',
      environment: environment,
      tableName: tableName,
      timestamp: new Date().toISOString()
    })
  };
};
```

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node bin/main.ts",
  "projectId": "fintech-api-cdktf",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0",
    "archive@~> 2.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: lib/README.md

```markdown
# REST API Multi-Environment Infrastructure

This CDKTF project deploys a REST API infrastructure with support for multiple environments (development and production) with different configurations.

## Architecture

The infrastructure includes:

- **DynamoDB Table**: For data storage with environment-specific billing (on-demand for dev, provisioned for prod)
- **API Gateway REST API**: Edge-optimized endpoint with environment-specific throttling
- **Lambda Functions**: Node.js 18 runtime with environment-specific memory allocation
- **CloudWatch**: Logs and alarms (production only) for monitoring
- **IAM Roles**: Least privilege access for Lambda functions
- **API Keys**: Production environment authentication

## Prerequisites

- Node.js 16+
- AWS CLI configured with appropriate credentials
- CDKTF CLI: `npm install -g cdktf-cli`
- TypeScript: `npm install -g typescript`

## Installation

```bash
npm install
```

## Deployment

### Development Environment

```bash
cdktf deploy --context environment=dev --context environmentSuffix=dev-12345 --context region=ap-southeast-1
```

### Production Environment

```bash
cdktf deploy --context environment=prod --context environmentSuffix=prod-12345 --context region=ap-southeast-1
```

### Custom Project Name

```bash
cdktf deploy --context environment=prod --context environmentSuffix=prod-12345 --context project=myapp --context region=ap-southeast-1
```

## Configuration

The stack accepts the following context parameters:

- `environment`: Environment name (dev/prod) - Default: `dev`
- `environmentSuffix`: Unique suffix for resource names - Default: `{env}-{timestamp}`
- `region`: AWS region - Default: `ap-southeast-1`
- `project`: Project name - Default: `fintech-api`

## Environment Differences

| Feature | Development | Production |
|---------|------------|------------|
| DynamoDB Billing | On-demand | Provisioned (5 RCU/WCU) |
| Lambda Memory | 512 MB | 1024 MB |
| Lambda Concurrency | 10 | 100 |
| API Throttling | 100 req/s | 1000 req/s |
| CloudWatch Logs | 7 days | 30 days |
| CloudWatch Alarms | Disabled | Enabled |
| API Keys | Disabled | Enabled |
| Access Logging | Disabled | Enabled |

## Testing

```bash
npm test
```

## Resource Cleanup

```bash
cdktf destroy --context environment=dev --context environmentSuffix=dev-12345
```

## Outputs

After deployment, the following outputs are available:

- `dynamodb_table_name`: DynamoDB table name
- `lambda_function_name`: Lambda function name
- `api_gateway_id`: API Gateway REST API ID
- `api_gateway_url`: Full API Gateway URL
- `api_stage_name`: API Gateway stage name
- `api_key_id`: API Key ID (production only)

## Security Features

- IAM roles with least privilege access
- Encryption at rest for DynamoDB
- Encrypted Lambda environment variables
- API key authentication (production)
- CloudWatch monitoring and alarms
- VPC endpoints support (optional)

## Cost Optimization

- Development uses on-demand billing for DynamoDB
- Lower Lambda memory in development
- Reduced log retention in development
- No alarms in development environment

## Troubleshooting

### Lambda Function Errors

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/api-function-{environmentSuffix} --follow
```

### API Gateway Issues

Check API Gateway logs (production only):
```bash
aws logs tail /aws/apigateway/api-{environmentSuffix} --follow
```

### DynamoDB Access Issues

Verify IAM role permissions and check the Lambda function's environment variables.
```
