# Ideal Response

## index.ts

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecureApiStackProps {
  environmentSuffix: string;
  region: string;
}

export class SecureApiStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    props: SecureApiStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:secure-api:SecureApiStack', name, {}, opts);

    const { environmentSuffix, region } = props;

    // Get current AWS account ID for KMS policy
    const current = aws.getCallerIdentity({});

    // Create KMS key for CloudWatch Logs encryption
    // CRITICAL: Key must be created BEFORE log groups and include CloudWatch Logs service permissions
    const kmsKey = new aws.kms.Key(
      `cloudwatch-logs-key-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption (${environmentSuffix})`,
        enableKeyRotation: true,
        policy: pulumi.all([current]).apply(([identity]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.${region}.amazonaws.com`,
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${identity.accountId}:log-group:/aws/lambda/*`,
                  },
                },
              },
            ],
          })
        ),
        tags: {
          Name: `cloudwatch-logs-key-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create KMS key alias for easier reference
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const kmsKeyAlias = new aws.kms.Alias(
      `cloudwatch-logs-key-alias-${environmentSuffix}`,
      {
        name: `alias/cloudwatch-logs-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // Create IAM role for Lambda execution
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
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
        tags: {
          Name: `lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicExecutionAttachment = new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create Lambda function code
    const lambdaCode = `
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Secure API with KMS-encrypted logs',
                timestamp: new Date().toISOString(),
                environment: process.env.ENVIRONMENT_SUFFIX,
                path: event.path || '/',
                method: event.httpMethod || 'GET',
            }),
        };

        console.log('Returning response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message,
            }),
        };
    }
};
`;

    // Create Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `api-handler-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            LOG_LEVEL: 'INFO',
          },
        },
        timeout: 30,
        memorySize: 256,
        tags: {
          Name: `api-handler-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [lambdaBasicExecutionAttachment] }
    );

    // Create CloudWatch Log Group with KMS encryption
    // CRITICAL: This must be created AFTER the KMS key with proper permissions
    const logGroup = new aws.cloudwatch.LogGroup(
      `lambda-log-group-${environmentSuffix}`,
      {
        name: lambdaFunction.name.apply(name => `/aws/lambda/${name}`),
        kmsKeyId: kmsKey.arn,
        retentionInDays: 7,
        tags: {
          Name: `lambda-log-group-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [kmsKey, lambdaFunction] }
    );

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `secure-api-${environmentSuffix}`,
      {
        name: `secure-api-${environmentSuffix}`,
        description: `Secure REST API with KMS-encrypted logs (${environmentSuffix})`,
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `secure-api-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create API Gateway resource (proxy)
    const apiResource = new aws.apigateway.Resource(
      `api-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: '{proxy+}',
      },
      { parent: this }
    );

    // Create API Gateway method (ANY)
    const apiMethod = new aws.apigateway.Method(
      `api-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: 'ANY',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Create API Gateway integration with Lambda
    const apiIntegration = new aws.apigateway.Integration(
      `api-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Create root method for GET /
    const rootMethod = new aws.apigateway.Method(
      `api-root-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: api.rootResourceId,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Create root integration
    const rootIntegration = new aws.apigateway.Integration(
      `api-root-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: api.rootResourceId,
        httpMethod: rootMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Create API Gateway deployment
    const apiDeployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi
            .all([
              apiMethod.id,
              apiIntegration.id,
              rootMethod.id,
              rootIntegration.id,
            ])
            .apply(() => Date.now().toString()),
        },
      },
      { parent: this, dependsOn: [apiIntegration, rootIntegration] }
    );

    // Create API Gateway stage
    const apiStage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: apiDeployment.id,
        stageName: 'prod',
        tags: {
          Name: `api-stage-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Grant API Gateway permission to invoke Lambda
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lambdaPermission = new aws.lambda.Permission(
      `lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Export outputs
    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/${apiStage.stageName}`;
    this.functionName = lambdaFunction.name;
    this.kmsKeyId = kmsKey.id;
    this.logGroupName = logGroup.name;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      functionName: this.functionName,
      kmsKeyId: this.kmsKeyId,
      logGroupName: this.logGroupName,
    });
  }
}
```
