import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

/**
 * Arguments for the TapStack component.
 */
export interface TapStackArgs {
  /**
   * A set of key-value pairs to apply as tags to all resources.
   */
  tags: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  // --- Publicly accessible resources for testing ---
  public readonly apiUrl: pulumi.Output<string>;
  public readonly dynamoTable: aws.dynamodb.Table;
  public readonly lambdaRole: aws.iam.Role;
  public readonly lambdaPolicy: aws.iam.Policy;
  public readonly lambda: aws.lambda.Function;
  public readonly lambdaSecurityGroup: aws.ec2.SecurityGroup;
  public readonly api: aws.apigatewayv2.Api;
  public readonly apiStage: aws.apigatewayv2.Stage;
  public readonly route: aws.apigatewayv2.Route;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    // Hardcode AWS region to us-east-1
    const awsRegion = 'us-east-1';

    // Configure AWS provider and common tags
    const provider = new aws.Provider(
      'provider',
      {
        region: awsRegion as aws.Region,
      },
      { parent: this }
    );

    const projectTags = args.tags;

    // Create DynamoDB table for data storage
    this.dynamoTable = new aws.dynamodb.Table(
      'my-app-table',
      {
        attributes: [{ name: 'id', type: 'S' }],
        hashKey: 'id',
        billingMode: 'PAY_PER_REQUEST',
        tags: projectTags,
      },
      { provider, parent: this }
    );

    // Set up IAM role and permissions for Lambda
    this.lambdaRole = new aws.iam.Role(
      'my-lambda-role',
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: projectTags,
      },
      { provider, parent: this }
    );

    this.lambdaPolicy = new aws.iam.Policy(
      'my-lambda-policy',
      {
        description: 'A policy for the serverless application Lambda function.',
        policy: pulumi.all([this.dynamoTable.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                Effect: 'Allow',
                Resource: tableArn,
              },
              {
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Effect: 'Allow',
                Resource: 'arn:aws:logs:*:*:*',
              },
            ],
          })
        ),
        tags: projectTags,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      'my-lambda-policy-attachment',
      {
        role: this.lambdaRole.name,
        policyArn: this.lambdaPolicy.arn,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      'my-lambda-xray-attachment',
      {
        role: this.lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { provider, parent: this }
    );

    // Configure logging for Lambda function
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      'my-lambda-log-group',
      {
        name: pulumi.interpolate`/aws/lambda/my-api-lambda`,
        retentionInDays: 7,
        tags: projectTags,
      },
      { provider, parent: this }
    );

    // Set up security group for Lambda network access
    this.lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      'my-lambda-sg',
      {
        description: 'Allow outbound HTTPS traffic for Lambda',
        egress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: projectTags,
      },
      { provider, parent: this }
    );

    // Define and deploy Lambda function
    const lambdaFunctionCode = `
        exports.handler = async (event) => {
            console.log("Request received:", JSON.stringify(event, null, 2));
            const tableName = process.env.TABLE_NAME;
            const awsRegion = process.env.AWS_REGION;

            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Hello from Lambda!",
                    table: tableName,
                    region: awsRegion
                }),
            };
        };
        `;

    this.lambda = new aws.lambda.Function(
      'my-api-lambda',
      {
        runtime: aws.lambda.Runtime.NodeJS20dX,
        handler: 'index.handler',
        role: this.lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaFunctionCode),
        }),
        loggingConfig: {
          logGroup: lambdaLogGroup.name,
          logFormat: 'Text',
        },
        environment: {
          variables: {
            TABLE_NAME: this.dynamoTable.name,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: projectTags,
      },
      { provider, parent: this }
    );

    // Set up API Gateway and related resources
    this.api = new aws.apigatewayv2.Api(
      'my-http-api',
      {
        protocolType: 'HTTP',
        description: 'An HTTP API to trigger a Lambda function.',
        tags: projectTags,
      },
      { provider, parent: this }
    );

    const apiLogGroup = new aws.cloudwatch.LogGroup(
      'my-api-log-group',
      {
        name: pulumi.interpolate`/aws/api-gateway/${this.api.name}`,
        retentionInDays: 7,
        tags: projectTags,
      },
      { provider, parent: this }
    );

    this.apiStage = new aws.apigatewayv2.Stage(
      'my-api-stage',
      {
        apiId: this.api.id,
        name: '$default',
        autoDeploy: true,
        defaultRouteSettings: {
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 10000,
        },
        accessLogSettings: {
          destinationArn: apiLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            routeKey: '$context.routeKey',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
      },
      { provider, parent: this }
    );

    const integration = new aws.apigatewayv2.Integration(
      'my-lambda-integration',
      {
        apiId: this.api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: this.lambda.invokeArn,
        payloadFormatVersion: '2.0',
      },
      { provider, parent: this }
    );

    this.route = new aws.apigatewayv2.Route(
      'my-api-route',
      {
        apiId: this.api.id,
        routeKey: 'GET /',
        target: pulumi.interpolate`integrations/${integration.id}`,
      },
      { provider, parent: this }
    );

    new aws.lambda.Permission(
      'api-lambda-permission',
      {
        action: 'lambda:InvokeFunction',
        function: this.lambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { provider, parent: this }
    );

    // Export the API endpoint URL
    this.apiUrl = this.api.apiEndpoint;

    // Register outputs for the component resource.
    this.registerOutputs({
      apiUrl: this.apiUrl,
    });
  }
}
