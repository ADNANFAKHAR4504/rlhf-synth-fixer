import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

export interface LambdaApiConstructProps {
  environmentSuffix: string;
  dataBucket: s3.Bucket;
  dynamoTable: dynamodb.Table;
  kmsKeyId?: string;
  tags: { [key: string]: string };
}

export class LambdaApiConstruct extends Construct {
  public readonly lambdaFunction: lambda.Function;
  public readonly apiGateway: apigateway.RestApi;
  public readonly deploymentGroup: codedeploy.LambdaDeploymentGroup;
  public readonly lambdaRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: LambdaApiConstructProps) {
    super(scope, id);

    // Create log group
    const isProd = props.environmentSuffix.toLowerCase().includes('prod');
    const account = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    this.logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/financeapp-api-${props.environmentSuffix}-${account}-${region}`,
      retention: isProd
        ? logs.RetentionDays.ONE_MONTH
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda execution role with least privilege
    this.lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `financeapp-lambda-role-${props.environmentSuffix}-${account}-${region}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for FinanceApp Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Grant S3 permissions
    props.dataBucket.grantReadWrite(this.lambdaRole);

    // Grant DynamoDB permissions
    props.dynamoTable.grantReadWriteData(this.lambdaRole);

    // Grant Parameter Store permissions
    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParameterHistory',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/financeapp/${props.environmentSuffix}/*`,
        ],
      })
    );

    // Grant KMS permissions for Parameter Store decryption
    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `ssm.${cdk.Aws.REGION}.amazonaws.com`,
          },
        },
      })
    );

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `financeapp-api-${props.environmentSuffix}-${account}-${region}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash',
            '-c',
            [
              'npm install --cache /tmp/.npm --no-audit --no-fund',
              'npm run build', // or npx tsc if you don't have a build script
              'cp -r node_modules /asset-output/',
              'cp -r dist/* /asset-output/', // adjust based on your tsconfig outDir
              'cp package*.json /asset-output/',
            ].join(' && '),
          ],
          environment: {
            npm_config_cache: '/tmp/.npm',
          },
        },
      }),
      role: this.lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        ENVIRONMENT_SUFFIX: props.environmentSuffix,
        DATA_BUCKET: props.dataBucket.bucketName,
        DYNAMO_TABLE: props.dynamoTable.tableName,
        DATA_BUCKET_KMS_KEY_ID: props.kmsKeyId ?? '',
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        FUNCTION_VERSION: '$LATEST',
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: this.logGroup,
      reservedConcurrentExecutions: isProd ? 100 : 1,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        retryAttempts: 2,
      },
    });

    // Create alias for blue/green deployments
    const alias = new lambda.Alias(this, 'ApiAlias', {
      aliasName: 'live',
      version: this.lambdaFunction.currentVersion,
    });

    // Create API Gateway
    this.apiGateway = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `financeapp-api-${props.environmentSuffix}-${account}-${region}`,
      description: 'FinanceApp REST API',
      deployOptions: {
        stageName: props.environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
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

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(alias, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add proxy resource
    const proxyResource = this.apiGateway.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);
    this.apiGateway.root.addMethod('ANY', lambdaIntegration);

    // Create deployment group for blue/green deployments
    // IMPORTANT: Do not couple deployments to alarms to avoid rollbacks due to transient spikes.
    // Alarms are still created in the monitoring construct for observability.
    this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(
      this,
      'DeploymentGroup',
      {
        deploymentGroupName: `financeapp-lambda-dg-${props.environmentSuffix}-${account}-${region}`,
        alias,
        deploymentConfig:
          codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: false,
        },
        // No alarms here; rely on monitoring stack alarms that notify without blocking deploys
      }
    );

    // Apply tags
    Object.entries(props.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
