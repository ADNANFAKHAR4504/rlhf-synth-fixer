import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class SecureEnterpriseInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: props?.env?.region || 'us-east-2',
        account: props?.env?.account,
      },
      tags: {
        Project: 'SecureEnterpriseInfrastructure',
        Environment: 'production',
        Owner: 'InfrastructureTeam',
        CostCenter: 'Engineering',
        CreatedBy: 'CDK',
        LastUpdated: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        Version: '1.0.0',
        Stack: 'TapStack',
        Region: props?.env?.region || 'us-east-2',
        UpdateTrigger: `update-${Date.now()}`, // Forces update with unique timestamp
        ...props?.tags,
      },
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
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': [
                  `arn:aws:logs:${this.region}:${this.account}:log-group:${this.stackName}-*`,
                  `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/application/secure-app*`,
                ],
              },
            },
          }),
        ],
      }),
    });

    // KMS Key Alias for better operational management
    new kms.Alias(this, 'EnterpriseKMSKeyAlias', {
      aliasName: `alias/enterprise-key-${this.stackName.toLowerCase()}`,
      targetKey: kmsKey,
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
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow log group deletion for cleanup
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup),
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
      encryption: s3.BucketEncryption.S3_MANAGED,
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
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow bucket deletion for cleanup
      autoDeleteObjects: true, // Delete objects when bucket is deleted
    });

    // CloudTrail for API logging - Log group for CloudTrail logs
    new logs.LogGroup(this, 'CloudTrailLogGroup', {
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow log group deletion for cleanup
    });

    // IAM Roles with least privilege access - Web server role for EC2 instances
    new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
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

    // Secrets Manager for sensitive data
    const dbCredentials = new secretsmanager.Secret(
      this,
      'DatabaseCredentials',
      {
        description: 'Database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
          includeSpace: false,
          passwordLength: 32,
        },
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow secret deletion for cleanup
      }
    );

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
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [databaseSG],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      deletionProtection: false, // Allow deletion for cleanup
      multiAz: true,
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['postgresql'],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow database deletion for cleanup
    });

    // WAF for web application protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebApplicationFirewall', {
      scope: 'REGIONAL',
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

    // GuardDuty for threat detection (conditional deployment)
    // Note: Only one GuardDuty detector allowed per account per region
    // Default: DO NOT deploy GuardDuty unless explicitly requested
    const deployGuardDuty =
      this.node.tryGetContext('deployGuardDuty') === 'true';

    let guardDutyDetectorId: string | undefined;

    if (deployGuardDuty) {
      const guardDutyDetector = new guardduty.CfnDetector(
        this,
        'GuardDutyDetector',
        {
          enable: true,
          findingPublishingFrequency: 'FIFTEEN_MINUTES',
          dataSources: {
            s3Logs: {
              enable: true,
            },
            malwareProtection: {
              scanEc2InstanceWithFindings: {
                ebsVolumes: true,
              },
            },
          },
        }
      );

      guardDutyDetectorId = guardDutyDetector.ref;

      // GuardDuty Threat Intel Set (optional - for custom threat intelligence)
      new guardduty.CfnThreatIntelSet(this, 'GuardDutyThreatIntelSet', {
        activate: true,
        detectorId: guardDutyDetector.ref,
        format: 'TXT',
        location: `https://s3.amazonaws.com/${secureBucket.bucketName}/threat-intel/threat-intel.txt`,
        name: 'CustomThreatIntelligence',
      });
    } else {
      // If GuardDuty already exists, you can optionally import the existing detector ID
      // guardDutyDetectorId = this.node.tryGetContext('existingGuardDutyDetectorId');
      console.log(
        'Skipping GuardDuty deployment - existing detector in region'
      );
    }

    // CloudWatch Alarms for security monitoring
    const unauthorizedApiCallsAlarm = new cloudwatch.Alarm(
      this,
      'UnauthorizedAPICalls',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CloudTrail',
          metricName: 'ErrorCount',
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    unauthorizedApiCallsAlarm.addAlarmAction(
      new actions.SnsAction(securityAlertsTopic)
    );

    // Lambda function for key rotation
    const keyRotationFunction = new lambda.Function(
      this,
      'KeyRotationFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import logging
from datetime import datetime

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
                key_created = key['CreateDate'].replace(tzinfo=None)
                key_age = (datetime.now() - key_created).days
                
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
      }
    );

    // Grant permissions to key rotation function
    keyRotationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:ListUsers',
          'iam:ListAccessKeys',
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
        ],
        resources: [`arn:aws:iam::${this.account}:user/*`],
      })
    );

    keyRotationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:CreateSecret', 'secretsmanager:UpdateSecret'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
        ],
      })
    );

    keyRotationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [kmsKey.keyArn],
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
    new iam.Group(this, 'SecureUserGroup', {
      groupName: `SecureUsers-${this.stackName}`,
      managedPolicies: [mfaPolicy],
    });

    // CloudWatch Log Groups for application logs
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/application/secure-app',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow log group deletion for cleanup
    });

    // Custom metric filter for failed login attempts
    new logs.MetricFilter(this, 'FailedLoginMetricFilter', {
      logGroup: applicationLogGroup,
      metricNamespace: 'Security',
      metricName: 'FailedLogins',
      filterPattern: logs.FilterPattern.stringValue(
        '$.message',
        '=',
        'FAILED_LOGIN'
      ),
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

    failedLoginAlarm.addAlarmAction(new actions.SnsAction(securityAlertsTopic));

    // Output important resource ARNs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: kmsKey.keyArn,
      description: 'KMS Key ARN',
    });

    new cdk.CfnOutput(this, 'SecureBucketName', {
      value: secureBucket.bucketName,
      description: 'Secure S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'SecureBucketArn', {
      value: secureBucket.bucketArn,
      description: 'Secure S3 Bucket ARN',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'Database Port',
    });

    new cdk.CfnOutput(this, 'DatabaseInstanceId', {
      value: database.instanceIdentifier,
      description: 'Database Instance Identifier',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'WebACLId', {
      value: webAcl.attrId,
      description: 'WAF Web ACL ID',
    });

    new cdk.CfnOutput(this, 'SecurityAlertTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'Security Alerts SNS Topic ARN',
    });

    new cdk.CfnOutput(this, 'WebServerSecurityGroupId', {
      value: webServerSG.securityGroupId,
      description: 'Web Server Security Group ID',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: databaseSG.securityGroupId,
      description: 'Database Security Group ID',
    });

    new cdk.CfnOutput(this, 'KeyRotationFunctionArn', {
      value: keyRotationFunction.functionArn,
      description: 'Key Rotation Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'KeyRotationFunctionName', {
      value: keyRotationFunction.functionName,
      description: 'Key Rotation Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecretArn', {
      value: dbCredentials.secretArn,
      description: 'Database Credentials Secret ARN',
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroupName', {
      value: applicationLogGroup.logGroupName,
      description: 'Application Log Group Name',
    });

    new cdk.CfnOutput(this, 'VPCFlowLogGroupName', {
      value: vpcFlowLogGroup.logGroupName,
      description: 'VPC Flow Log Group Name',
    });

    // Output subnet IDs for networking tests
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Isolated (Database) Subnet IDs',
    });

    if (guardDutyDetectorId) {
      new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
        value: guardDutyDetectorId,
        description: 'GuardDuty Detector ID',
      });
    }
  }
}

// App instantiation
const app = new cdk.App();
new SecureEnterpriseInfrastructureStack(
  app,
  'SecureEnterpriseInfrastructureStack'
);
