import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Generate random suffix for unique resource naming
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // ============================================================================
    // KMS Keys for Encryption
    // ============================================================================

    const s3KmsKey = new kms.Key(this, 'S3KMSKey', {
      description: 'KMS Key for S3 bucket encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    const rdsKmsKey = new kms.Key(this, 'RDSKMSKey', {
      description: 'KMS Key for RDS encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    const cloudWatchKmsKey = new kms.Key(this, 'CloudWatchKMSKey', {
      description: 'KMS Key for CloudWatch Logs encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // ============================================================================
    // VPC Configuration with Public and Private Subnets
    // ============================================================================

    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      ipProtocol: ec2.IpProtocol.IPV4_ONLY,
      maxAzs: 3,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}-${randomSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: cloudWatchKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const vpcFlowLogRole = new iam.Role(this, 'VPCFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        CloudWatchLogPolicy: new iam.PolicyDocument({
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
              resources: [vpcFlowLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // ============================================================================
    // Security Groups
    // ============================================================================

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to RDS on MySQL port
    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow Lambda access to MySQL'
    );

    const apiGatewaySecurityGroup = new ec2.SecurityGroup(
      this,
      'APIGatewaySecurityGroup',
      {
        vpc,
        description: 'Security group for API Gateway VPC Link',
        allowAllOutbound: true,
      }
    );

    // ============================================================================
    // S3 Buckets with Server-Side Encryption
    // ============================================================================

    const applicationBucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `secure-app-bucket-${environmentSuffix}-${randomSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `secure-logs-bucket-${environmentSuffix}-${randomSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add bucket policy for CloudTrail
    logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:GetBucketLocation'],
        resources: [logsBucket.bucketArn],
      })
    );

    logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${logsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // ============================================================================
    // RDS Database with Encryption
    // ============================================================================

    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      description: 'RDS Database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
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
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      deleteAutomatedBackups: false,
      enablePerformanceInsights: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================================================
    // IAM Roles with Least Privilege
    // ============================================================================

    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                applicationBucket.bucketArn,
                `${applicationBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        SecretsManagerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [dbCredentials.secretArn],
            }),
          ],
        }),
        KMSPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [s3KmsKey.keyArn, rdsKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // IAM User with MFA requirement
    const applicationUser = new iam.User(this, 'ApplicationUser', {
      userName: `secure-app-user-${environmentSuffix}-${randomSuffix}`,
      managedPolicies: [
        new iam.ManagedPolicy(this, 'MFARequiredPolicy', {
          statements: [
            new iam.PolicyStatement({
              sid: 'AllowViewAccountInfo',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:GetAccountPasswordPolicy',
                'iam:GetAccountSummary',
                'iam:ListVirtualMFADevices',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'AllowManageOwnPasswords',
              effect: iam.Effect.ALLOW,
              actions: ['iam:ChangePassword', 'iam:GetUser'],
              resources: [`arn:aws:iam::${this.account}:user/\${aws:username}`],
            }),
            new iam.PolicyStatement({
              sid: 'AllowManageOwnMFA',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:CreateVirtualMFADevice',
                'iam:DeleteVirtualMFADevice',
                'iam:ListMFADevices',
                'iam:EnableMFADevice',
                'iam:ResyncMFADevice',
              ],
              resources: [
                `arn:aws:iam::${this.account}:mfa/\${aws:username}`,
                `arn:aws:iam::${this.account}:user/\${aws:username}`,
              ],
            }),
            new iam.PolicyStatement({
              sid: 'DenyAllExceptUnlessMFAAuthenticated',
              effect: iam.Effect.DENY,
              notActions: [
                'iam:CreateVirtualMFADevice',
                'iam:EnableMFADevice',
                'iam:GetUser',
                'iam:ListMFADevices',
                'iam:ListVirtualMFADevices',
                'iam:ResyncMFADevice',
                'sts:GetSessionToken',
              ],
              resources: ['*'],
              conditions: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            }),
          ],
        }),
      ],
    });

    // ============================================================================
    // Lambda Functions
    // ============================================================================

    const apiLambda = new lambda.Function(this, 'APILambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Secure API response',
              timestamp: new Date().toISOString(),
            }),
          };
        };
      `),
      role: lambdaExecutionRole,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      environment: {
        DB_SECRET_ARN: dbCredentials.secretArn,
        S3_BUCKET: applicationBucket.bucketName,
      },
    });

    // ============================================================================
    // API Gateway with SSL/TLS
    // ============================================================================

    const api = new apigateway.RestApi(this, 'SecureAPI', {
      restApiName: 'Secure Application API',
      description: 'Secure API with SSL/TLS encryption',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'true',
              },
            },
          }),
        ],
      }),
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    api.root.addMethod('GET', lambdaIntegration);
    api.root.addResource('health').addMethod('GET', lambdaIntegration);

    // ============================================================================
    // CloudWatch Logs with Retention
    // ============================================================================

    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/lambda/secure-application-${environmentSuffix}-${randomSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: cloudWatchKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiGatewayLogGroup = new logs.LogGroup(this, 'APIGatewayLogGroup', {
      logGroupName: `/aws/apigateway/secure-api-${environmentSuffix}-${randomSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: cloudWatchKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================================================
    // CloudTrail for Audit Logging
    // ============================================================================

    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/secure-trail-${environmentSuffix}-${randomSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: cloudWatchKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudTrail = new cloudtrail.Trail(this, 'SecureCloudTrail', {
      bucket: logsBucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: s3KmsKey,
      cloudWatchLogGroup: cloudTrailLogGroup,
    });

    // ============================================================================
    // Route 53 Private Hosted Zone with Health Checks
    // ============================================================================

    const privateHostedZone = new route53.PrivateHostedZone(
      this,
      'PrivateHostedZone',
      {
        zoneName: `internal.secure-app-${randomSuffix}.local`,
        vpc,
      }
    );

    // Health check for API Gateway using the correct CloudFormation properties
    const healthCheck = new route53.CfnHealthCheck(this, 'APIHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
        resourcePath: '/prod/health',
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    // Primary record with health check
    new route53.ARecord(this, 'PrimaryAPIRecord', {
      zone: privateHostedZone,
      recordName: 'api-primary',
      target: route53.RecordTarget.fromAlias({
        bind: () => ({
          dnsName: `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
          hostedZoneId: 'Z1UJRXOUMOOFQ8', // API Gateway hosted zone ID for us-east-1
        }),
      }),
      ttl: cdk.Duration.seconds(60),
    });

    // Failover record (points to the same API for demo purposes)
    new route53.ARecord(this, 'FailoverAPIRecord', {
      zone: privateHostedZone,
      recordName: 'api-failover',
      target: route53.RecordTarget.fromAlias({
        bind: () => ({
          dnsName: `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
          hostedZoneId: 'Z1UJRXOUMOOFQ8',
        }),
      }),
      ttl: cdk.Duration.seconds(60),
    });

    // ============================================================================
    // CloudWatch Alarms and Monitoring
    // ============================================================================

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: apiLambda.metricErrors(),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function errors',
    });

    const apiGateway4xxAlarm = new cloudwatch.Alarm(
      this,
      'APIGateway4xxAlarm',
      {
        metric: api.metricClientError(),
        threshold: 10,
        evaluationPeriods: 2,
        alarmDescription: 'API Gateway 4xx errors',
      }
    );

    const apiGateway5xxAlarm = new cloudwatch.Alarm(
      this,
      'APIGateway5xxAlarm',
      {
        metric: api.metricServerError(),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'API Gateway 5xx errors',
      }
    );

    // ============================================================================
    // Outputs
    // ============================================================================

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: applicationBucket.bucketName,
      description: 'Application S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'PrivateHostedZoneId', {
      value: privateHostedZone.hostedZoneId,
      description: 'Private Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: cloudTrail.trailArn,
      description: 'CloudTrail ARN',
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.ref,
      description: 'Route53 Health Check ID',
    });

    new cdk.CfnOutput(this, 'ApplicationUserId', {
      value: applicationUser.userName,
      description: 'Application User Name',
    });

    new cdk.CfnOutput(this, 'VPCFlowLogGroupArn', {
      value: vpcFlowLogGroup.logGroupArn,
      description: 'VPC Flow Log Group ARN',
    });

    new cdk.CfnOutput(this, 'VPCFlowLogGroupName', {
      value: vpcFlowLogGroup.logGroupName,
      description: 'VPC Flow Log Group Name',
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroupArn', {
      value: applicationLogGroup.logGroupArn,
      description: 'Application Log Group ARN',
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroupName', {
      value: applicationLogGroup.logGroupName,
      description: 'Application Log Group Name',
    });

    new cdk.CfnOutput(this, 'APIGatewayLogGroupArn', {
      value: apiGatewayLogGroup.logGroupArn,
      description: 'API Gateway Log Group ARN',
    });

    new cdk.CfnOutput(this, 'APIGatewayLogGroupName', {
      value: apiGatewayLogGroup.logGroupName,
      description: 'API Gateway Log Group Name',
    });

    new cdk.CfnOutput(this, 'CloudTrailLogGroupArn', {
      value: cloudTrailLogGroup.logGroupArn,
      description: 'CloudTrail Log Group ARN',
    });

    new cdk.CfnOutput(this, 'CloudTrailLogGroupName', {
      value: cloudTrailLogGroup.logGroupName,
      description: 'CloudTrail Log Group Name',
    });

    new cdk.CfnOutput(this, 'LambdaErrorAlarmArn', {
      value: lambdaErrorAlarm.alarmArn,
      description: 'Lambda Error Alarm ARN',
    });

    new cdk.CfnOutput(this, 'APIGateway4xxAlarmArn', {
      value: apiGateway4xxAlarm.alarmArn,
      description: 'API Gateway 4xx Error Alarm ARN',
    });

    new cdk.CfnOutput(this, 'APIGateway5xxAlarmArn', {
      value: apiGateway5xxAlarm.alarmArn,
      description: 'API Gateway 5xx Error Alarm ARN',
    });

    new cdk.CfnOutput(this, 'APIGatewaySecurityGroupId', {
      value: apiGatewaySecurityGroup.securityGroupId,
      description: 'API Gateway Security Group ID',
    });
  }
}
