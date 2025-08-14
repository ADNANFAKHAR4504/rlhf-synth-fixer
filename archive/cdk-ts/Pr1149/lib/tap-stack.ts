import * as cdk from 'aws-cdk-lib';
import {
  aws_apigatewayv2 as apigwv2,
  aws_apigatewayv2_integrations as apigwv2i,
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

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

    cdk.Tags.of(this).add('Environment', 'Production');

    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const appBucket = new s3.Bucket(this, 'AppBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const table = new dynamodb.Table(this, 'AppTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const s3Endpoint = new ec2.GatewayVpcEndpoint(this, 'S3GatewayEndpoint', {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnets: vpc.privateSubnets }],
    });

    const ddbEndpoint = new ec2.GatewayVpcEndpoint(
      this,
      'DynamoDbGatewayEndpoint',
      {
        vpc,
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [{ subnets: vpc.privateSubnets }],
      }
    );

    // With PRIVATE_WITH_EGRESS subnets and NAT, interface endpoint for logs is optional; omit for minimalism

    appBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureTransport',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [appBucket.bucketArn, `${appBucket.bucketArn}/*`],
        conditions: { Bool: { 'aws:SecureTransport': 'false' } },
      })
    );

    appBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RestrictToVpcEndpoint',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${appBucket.bucketArn}/*`],
        conditions: {
          StringNotEqualsIfExists: {
            'aws:SourceVpce': s3Endpoint.vpcEndpointId,
          },
        },
      })
    );

    const appLambdaLogGroup = new logs.LogGroup(this, 'AppHandlerLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaFunction = new lambda.Function(this, 'AppHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(
        [
          'const respond = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });',
          'exports.handler = async (event) => {',
          '  const method = (event?.requestContext?.http?.method || event?.httpMethod || "GET").toUpperCase();',
          '  const path = event?.rawPath || event?.requestContext?.http?.path || event?.path || "/";',
          '  if (method === "GET" && (path === "/" || path === "/prod" || path.startsWith("/health"))) {',
          '    return respond(200, { ok: true });',
          '  }',
          '  if (method === "POST" && path.includes("/data")) {',
          '    return respond(200, { ok: true });',
          '  }',
          '  return respond(200, { ok: true });',
          '};',
        ].join('\n')
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      timeout: cdk.Duration.seconds(10),
      logGroup: appLambdaLogGroup,
      environment: {
        BUCKET_NAME: appBucket.bucketName,
        TABLE_NAME: table.tableName,
      },
    });

    appBucket.grantReadWrite(lambdaFunction);
    table.grantReadWriteData(lambdaFunction);

    // Permissions are granted by scoped helpers above; no extra wildcard grants

    const apiAccessLogs = new logs.LogGroup(this, 'ApiAccessLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const httpApi = new apigwv2.HttpApi(this, 'AppHttpApi', {
      apiName: 'tap-api',
      description: 'Tap serverless API',
    });

    const httpIntegration = new apigwv2i.HttpLambdaIntegration(
      'LambdaIntegration',
      lambdaFunction
    );

    httpApi.addRoutes({
      path: '/',
      methods: [apigwv2.HttpMethod.ANY],
      integration: httpIntegration,
    });
    httpApi.addRoutes({
      path: '/health',
      methods: [apigwv2.HttpMethod.GET],
      integration: httpIntegration,
    });
    httpApi.addRoutes({
      path: '/data',
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: httpIntegration,
    });

    // Explicit stage with access logging (use L1 for flexible format type)
    new apigwv2.CfnStage(this, 'ApiStage', {
      apiId: httpApi.apiId,
      stageName: 'prod',
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: apiAccessLogs.logGroupArn,
        format:
          '{"requestId":"$context.requestId","httpMethod":"$context.httpMethod","routeKey":"$context.routeKey","status":"$context.status","requestTime":"$context.requestTime","ip":"$context.identity.sourceIp","protocol":"$context.protocol","responseLength":"$context.responseLength"}',
      },
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `${httpApi.apiEndpoint}/prod/`,
    });
    new cdk.CfnOutput(this, 'BucketName', { value: appBucket.bucketName });
    new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'S3VpcEndpointId', {
      value: s3Endpoint.vpcEndpointId,
    });
    new cdk.CfnOutput(this, 'DynamoDbVpcEndpointId', {
      value: ddbEndpoint.vpcEndpointId,
    });
  }
}
