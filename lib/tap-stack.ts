import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway as apigw,
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
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'private-isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
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
      subnets: [{ subnets: vpc.isolatedSubnets }],
    });

    const ddbEndpoint = new ec2.GatewayVpcEndpoint(
      this,
      'DynamoDbGatewayEndpoint',
      {
        vpc,
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [{ subnets: vpc.isolatedSubnets }],
      }
    );

    // Allow private access from isolated subnets to CloudWatch Logs
    new ec2.InterfaceVpcEndpoint(this, 'CloudWatchLogsEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnets: vpc.isolatedSubnets },
    });

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
          'exports.handler = async () => ({ statusCode: 200, body: JSON.stringify({ ok: true }) });',
        ].join('\n')
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
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
    });

    const api = new apigw.RestApi(this, 'AppApi', {
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        accessLogDestination: new apigw.LogGroupLogDestination(apiAccessLogs),
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      cloudWatchRole: true,
      endpointConfiguration: { types: [apigw.EndpointType.REGIONAL] },
    });

    const lambdaIntegration = new apigw.LambdaIntegration(lambdaFunction, {
      proxy: true,
    });

    const proxyResource = api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);
    api.root.addMethod('ANY', lambdaIntegration);

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
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
