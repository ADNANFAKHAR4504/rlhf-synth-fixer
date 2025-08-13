```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class SecureEnterpriseInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        account: props?.env?.account
      }
    });

    // KMS Key for encryption at rest
    const kmsKey = new kms.Key(this, 'EnterpriseKMSKey', {
      description: 'Enterprise KMS key for encryption at rest',
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(90),
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

    // VPC with public and private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      maxAzs: 3,
      natGateways: 3,
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
    });

    // VPC Flow Logs for monitoring
    const vpcFlowLogRole = new iam.Role(this, 'VPCFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy')
      ]
    });

    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogRole),
    });

    // Security Groups
    const webServerSG = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc,
      description: 'Security group for web servers',
      allowAllOutbound: false,
    });

    webServerSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic'
    );

    webServerSG.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    const databaseSG = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for databases',
      allowAllOutbound: false,
    });

    databaseSG.addIngressRule(
      webServerSG,
      ec2.Port.tcp(5432),
      'PostgreSQL from web servers'
    );

    // S3 Bucket with encryption and security configurations
    const secureBucket = new s3.Bucket(this, 'SecureDataBucket', {
      bucketName: `secure-enterprise-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      eventBridgeEnabled: true,
    });

    // CloudTrail for API logging
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
    });

    // IAM Roles with least privilege access
    const webServerRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        S3ReadOnlyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: [`${secureBucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    const databaseRole = new iam.Role(this, 'DatabaseRole', {
      assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
      ],
    });

    // Secrets Manager for sensitive data
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      description: 'Database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 32,
      },
      encryptionKey: kmsKey,
    });

    // RDS Database in private subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      description: 'Subnet group for RDS database',
    });

    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [databaseSG],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      deletionProtection: true,
      multiAz: true,
      monitoringInterval: cdk.Duration.minutes(1),
      monitoringRole: databaseRole,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['postgresql'],
    });

    // WAF for web application protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebApplicationFirewall', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebACLMetric',
      },
    });

    // SNS Topic for security alerts
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: 'Security Alerts',
      masterKey: kmsKey,
    });

    // CloudWatch Alarms for security monitoring
    const unauthorizedApiCallsAlarm = new cloudwatch.Alarm(this, 'UnauthorizedAPICalls', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudTrail',
        metricName: 'ErrorCount',
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    unauthorizedApiCallsAlarm.addAlarmAction(
      new targets.SnsTopic(securityAlertsTopic)
    );

    // Lambda function for key rotation
    const keyRotationFunction = new lambda.Function(this, 'KeyRotationFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    iam = boto3.client('iam')
    
    try:
        # List all users
        users = iam.list_users()
        
        for user in users['Users']:
            username = user['UserName']
            
            # Get access keys for user
            keys = iam.list_access_keys(UserName=username)
            
            for key in keys['AccessKeyMetadata']:
                key_id = key['AccessKeyId']
                key_age = (context.aws_request_id - key['CreateDate']).days
                
                # Rotate keys older than 90 days
                if key_age > 90:
                    logger.info(f'Rotating key {key_id} for user {username}')
                    # Create new key
                    new_key = iam.create_access_key(UserName=username)
                    # Store in Secrets Manager
                    # Delete old key after verification
                    iam.delete_access_key(UserName=username, AccessKeyId=key_id)
                    
        return {
            'statusCode': 200,
            'body': json.dumps('Key rotation completed successfully')
        }
    except Exception as e:
        logger.error(f'Error during key rotation: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
      `),
      environment: {
        KMS_KEY_ID: kmsKey.keyId,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions to key rotation function
    keyRotationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:ListUsers',
          'iam:ListAccessKeys',
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'secretsmanager:CreateSecret',
          'secretsmanager:UpdateSecret',
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:GenerateDataKey',
        ],
        resources: ['*'],
      })
    );

    // EventBridge rule for key rotation (every 90 days)
    const keyRotationRule = new events.Rule(this, 'KeyRotationRule', {
      schedule: events.Schedule.rate(cdk.Duration.days(90)),
    });

    keyRotationRule.addTarget(new targets.LambdaFunction(keyRotationFunction));

    // MFA enforcement policy
    const mfaPolicy = new iam.ManagedPolicy(this, 'MFAEnforcementPolicy', {
      description: 'Enforces MFA for sensitive operations',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            's3:DeleteObject',
            's3:DeleteBucket',
            'rds:DeleteDBInstance',
            'ec2:TerminateInstances',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    // User group with MFA enforcement
    const secureUserGroup = new iam.Group(this, 'SecureUserGroup', {
      groupName: 'SecureUsers',
      managedPolicies: [mfaPolicy],
    });

    // CloudWatch Log Groups for application logs
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/application/secure-app',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
    });

    // Custom metric filter for failed login attempts
    const failedLoginMetricFilter = new logs.MetricFilter(this, 'FailedLoginMetricFilter', {
      logGroup: applicationLogGroup,
      metricNamespace: 'Security',
      metricName: 'FailedLogins',
      filterPattern: logs.FilterPattern.literal('[timestamp, request_id, "FAILED_LOGIN"]'),
      metricValue: '1',
    });

    // Alarm for failed login attempts
    const failedLoginAlarm = new cloudwatch.Alarm(this, 'FailedLoginAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'Security',
        metricName: 'FailedLogins',
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    failedLoginAlarm.addAlarmAction(
      new targets.SnsTopic(securityAlertsTopic)
    );

    // Output important resource ARNs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'SecureBucketName', {
      value: secureBucket.bucketName,
      description: 'Secure S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database Endpoint',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}

// App instantiation
const app = new cdk.App();
new SecureEnterpriseInfrastructureStack(app, 'SecureEnterpriseInfrastructureStack', {
  env: {
    region: 'us-west-2',
  },
});
```