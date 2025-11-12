### lib/my-serverless-app-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  isTest?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // ==============================================
    // VPC Configuration
    // ==============================================
    const vpc = new ec2.Vpc(this, 'MyWebAppVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ==============================================
    // S3 Bucket for Static Website Hosting
    // ==============================================
    const websiteBucket = new s3.Bucket(this, 'MyWebAppS3Bucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicPolicy: false,
        blockPublicAcls: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
    });

    // ==============================================
    // Database Credentials (Secrets Manager)
    // ==============================================
    const databaseSecret = new secretsmanager.Secret(
      this,
      'MyWebAppDatabaseSecret',
      {
        description: 'PostgreSQL database credentials for MyWebApp',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'postgres' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
          passwordLength: 32,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ==============================================
    // Security Groups
    // ==============================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'MyWebAppLambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      }
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      'MyWebAppRDSSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS PostgreSQL database',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // ==============================================
    // RDS PostgreSQL Database
    // ==============================================
    const database = new rds.DatabaseInstance(this, 'MyWebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(databaseSecret),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSecurityGroup],
      multiAz: false,
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      databaseName: 'mywebappdb',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==============================================
    // Lambda Function
    // ==============================================
    const lambdaRole = new iam.Role(this, 'MyWebAppLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for MyWebApp Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    databaseSecret.grantRead(lambdaRole);

    const targetArchitecture =
      process.env.TARGET_ARCHITECTURE === 'arm64'
        ? lambda.Architecture.ARM_64
        : lambda.Architecture.X86_64;

    const lambdaFunction = new lambda.Function(this, 'MyWebAppLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'handler.lambda_handler',
      architecture: targetArchitecture,

      code: props?.isTest
        ? lambda.Code.fromInline('def handler(event, context): pass')
        : lambda.Code.fromAsset(path.join(__dirname, 'lambda'), {
            bundling: {
              image: lambda.Runtime.PYTHON_3_8.bundlingImage,
              // THE FIX: Force the build to be for an x86 CPU
              platform: 'linux/amd64',
              command: [
                'bash',
                '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
              ],
            },
          }),

      role: lambdaRole,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(60),
      environment: {
        DB_SECRET_ARN: databaseSecret.secretArn,
        DB_NAME: 'mywebappdb',
        DB_HOST: database.instanceEndpoint.hostname,
      },
      description: 'Lambda function for MyWebApp API backend',
    });

    // ==============================================
    // API Gateway
    // ==============================================
    const api = new apigateway.RestApi(this, 'MyWebAppApiGateway', {
      restApiName: 'MyWebApp API',
      description: 'REST API for MyWebApp serverless application',
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
      deployOptions: { stageName: 'prod' },
    });

    const apiResource = api.root.addResource('api');
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    apiResource.addMethod('GET', lambdaIntegration);

    // ==============================================
    // CloudFormation Outputs
    // ==============================================
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'Name of the S3 bucket for static website hosting',
    });
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'URL of the static website hosted on S3',
    });
    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: api.url,
      description: 'Root endpoint URL for the API Gateway',
    });
    new cdk.CfnOutput(this, 'ApiEndpointURL', {
      value: `${api.url}api`,
      description: 'Complete API endpoint URL for testing the Lambda function',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Hostname of the RDS database instance',
    });
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseSecret.secretArn,
      description: 'ARN of the Secrets Manager secret for database credentials',
    });
  }
}

```