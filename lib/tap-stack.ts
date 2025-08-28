import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ======================
    // VPC AND NETWORKING
    // ======================

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 2, // One per AZ for high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for monitoring
    new ec2.FlowLog(this, 'TapVpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // ======================
    // SECURITY GROUPS
    // ======================

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to RDS on MySQL port
    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow Lambda functions to connect to RDS'
    );

    // ======================
    // RDS DATABASE
    // ======================

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Database credentials stored in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(this, 'TapDbCredentials', {
      description: 'RDS database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // RDS instance with Multi-AZ deployment
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true, // Multi-AZ for high availability
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      deleteAutomatedBackups: false,
      databaseName: 'tapdb',
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
    });

    // ======================
    // S3 BUCKET FOR BACKUPS
    // ======================

    const backupBucket = new s3.Bucket(this, 'TapBackupBucket', {
      bucketName: `tap-app-backups-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'backup-lifecycle',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // ======================
    // IAM ROLES AND POLICIES
    // ======================

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Policy for Lambda to access RDS credentials
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [dbCredentials.secretArn],
      })
    );

    // Policy for Lambda to access S3 backup bucket
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [backupBucket.bucketArn, `${backupBucket.bucketArn}/*`],
      })
    );

    // ======================
    // LAMBDA FUNCTIONS
    // ======================

    // Lambda function for handling API requests
    const apiLambda = new lambda.Function(this, 'TapApiLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const mysql = require('mysql2/promise');

        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
            // Example response - replace with your actual logic
            const response = {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              },
              body: JSON.stringify({
                message: 'API Lambda function executed successfully',
                timestamp: new Date().toISOString(),
                path: event.path,
                method: event.httpMethod,
              }),
            };
            
            return response;
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
              }),
            };
          }
        };
      `),
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_HOST: database.instanceEndpoint.hostname,
        DB_PORT: database.instanceEndpoint.port.toString(),
        DB_NAME: 'tapdb',
        BACKUP_BUCKET: backupBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for database operations
    const dbLambda = new lambda.Function(this, 'TapDbLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const mysql = require('mysql2/promise');

        const secretsManager = new AWS.SecretsManager();

        exports.handler = async (event) => {
          console.log('DB Lambda Event:', JSON.stringify(event, null, 2));
          
          try {
            // Get database credentials from Secrets Manager
            const secret = await secretsManager.getSecretValue({
              SecretId: process.env.DB_SECRET_ARN
            }).promise();
            
            const credentials = JSON.parse(secret.SecretString);
            
            // Example database connection - replace with your actual logic
            const connection = await mysql.createConnection({
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              user: credentials.username,
              password: credentials.password,
              database: process.env.DB_NAME,
            });
            
            // Example query
            const [rows] = await connection.execute('SELECT 1 as test');
            await connection.end();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Database connection successful',
                result: rows,
              }),
            };
          } catch (error) {
            console.error('Database error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: 'Database connection failed',
                message: error.message,
              }),
            };
          }
        };
      `),
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_HOST: database.instanceEndpoint.hostname,
        DB_PORT: database.instanceEndpoint.port.toString(),
        DB_NAME: 'tapdb',
        BACKUP_BUCKET: backupBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ======================
    // API GATEWAY
    // ======================

    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: 'Tap Application API',
      description: 'API Gateway for Tap application backend',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // API Gateway Lambda integrations
    const apiLambdaIntegration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const dbLambdaIntegration = new apigateway.LambdaIntegration(dbLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API routes
    const apiResource = api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    // Health check endpoint
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', apiLambdaIntegration);

    // Database endpoint
    const dbResource = v1Resource.addResource('db');
    dbResource.addMethod('GET', dbLambdaIntegration);
    dbResource.addMethod('POST', dbLambdaIntegration);

    // Users endpoint example
    const usersResource = v1Resource.addResource('users');
    usersResource.addMethod('GET', apiLambdaIntegration);
    usersResource.addMethod('POST', apiLambdaIntegration);

    const userResource = usersResource.addResource('{id}');
    userResource.addMethod('GET', apiLambdaIntegration);
    userResource.addMethod('PUT', apiLambdaIntegration);
    userResource.addMethod('DELETE', apiLambdaIntegration);

    // ======================
    // CLOUDWATCH MONITORING
    // ======================

    // CloudWatch Log Groups are automatically created by Lambda functions
    // Additional monitoring can be added here

    // ======================
    // OUTPUTS
    // ======================

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbCredentials.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: apiLambda.functionArn,
      description: 'Main API Lambda Function ARN',
    });
  }
}
