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
import { randomBytes } from 'crypto';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const randomId = randomBytes(4).toString('hex');
    const uniqueSuffix = `${environmentSuffix}-${randomId}`;

    // ======================
    // VPC AND NETWORKING
    // ======================

    const vpc = new ec2.Vpc(this, `TapVpc${environmentSuffix}`, {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 2,
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

    // VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs-${uniqueSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const flowLogRole = new iam.Role(this, `FlowLogRole${environmentSuffix}`, {
      roleName: `tap-flowlog-role-${uniqueSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [flowLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, `TapVpcFlowLog${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
    });

    // ======================
    // SECURITY GROUPS
    // ======================

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `tap-lambda-sg-${uniqueSuffix}`,
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `tap-rds-sg-${uniqueSuffix}`,
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow Lambda functions to connect to RDS'
    );

    // ======================
    // RDS DATABASE
    // ======================

    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `TapDbSubnetGroup${environmentSuffix}`,
      {
        subnetGroupName: `tap-db-subnet-group-${uniqueSuffix}`,
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    const dbCredentials = new secretsmanager.Secret(
      this,
      `TapDbCredentials${environmentSuffix}`,
      {
        secretName: `tap-db-credentials-${uniqueSuffix}`,
        description: 'RDS database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          includeSpace: false,
          passwordLength: 32,
        },
      }
    );

    const database = new rds.DatabaseInstance(
      this,
      `TapDatabase${environmentSuffix}`,
      {
        instanceIdentifier: `tap-database-${uniqueSuffix}`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_42,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        credentials: rds.Credentials.fromSecret(dbCredentials),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        multiAz: true,
        storageEncrypted: true,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        deleteAutomatedBackups: false,
        databaseName: 'tapdb',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        enablePerformanceInsights: false,
        cloudwatchLogsExports: ['error', 'general'],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ======================
    // S3 BUCKET FOR BACKUPS
    // ======================

    const backupBucket = new s3.Bucket(
      this,
      `TapBackupBucket${environmentSuffix}`,
      {
        bucketName: `tap-backup-bucket-${uniqueSuffix.toLowerCase()}`,
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
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ======================
    // IAM ROLES AND POLICIES
    // ======================

    const lambdaRole = new iam.Role(this, `TapLambdaRole${environmentSuffix}`, {
      roleName: `tap-lambda-role-${uniqueSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        SecretsManagerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [dbCredentials.secretArn],
            }),
          ],
        }),
        S3BackupPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                backupBucket.bucketArn,
                `${backupBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // ======================
    // LAMBDA FUNCTIONS
    // ======================

    const apiLambda = new lambda.Function(
      this,
      `TapApiLambda${environmentSuffix}`,
      {
        functionName: `tap-api-lambda-${uniqueSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
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
                path: event.path || '/',
                method: event.httpMethod || 'GET',
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
      }
    );

    const dbLambda = new lambda.Function(
      this,
      `TapDbLambda${environmentSuffix}`,
      {
        functionName: `tap-db-lambda-${uniqueSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
        
        const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });

        exports.handler = async (event) => {
          console.log('DB Lambda Event:', JSON.stringify(event, null, 2));
          
          try {
            const command = new GetSecretValueCommand({
              SecretId: process.env.DB_SECRET_ARN
            });
            
            const secret = await secretsManager.send(command);
            const credentials = JSON.parse(secret.SecretString);
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                message: 'Database Lambda function executed successfully',
                dbHost: process.env.DB_HOST,
                dbName: process.env.DB_NAME,
                timestamp: new Date().toISOString(),
              }),
            };
          } catch (error) {
            console.error('Database error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'Database operation failed',
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
      }
    );

    // ======================
    // API GATEWAY
    // ======================

    const api = new apigateway.RestApi(this, `TapApi${environmentSuffix}`, {
      restApiName: `Tap Application API ${environmentSuffix}`,
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

    const apiLambdaIntegration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const dbLambdaIntegration = new apigateway.LambdaIntegration(dbLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API routes
    const apiResource = api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', apiLambdaIntegration);

    const dbResource = v1Resource.addResource('db');
    dbResource.addMethod('GET', dbLambdaIntegration);
    dbResource.addMethod('POST', dbLambdaIntegration);

    const usersResource = v1Resource.addResource('users');
    usersResource.addMethod('GET', apiLambdaIntegration);
    usersResource.addMethod('POST', apiLambdaIntegration);

    const userResource = usersResource.addResource('{id}');
    userResource.addMethod('GET', apiLambdaIntegration);
    userResource.addMethod('PUT', apiLambdaIntegration);
    userResource.addMethod('DELETE', apiLambdaIntegration);

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
