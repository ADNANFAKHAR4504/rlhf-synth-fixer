I'll help you create a secure web application infrastructure on AWS using CDK TypeScript that follows security best practices. Here's the implementation:

## lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply required tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Owner', 'DevOps');

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'SecurityKmsKey', {
      description: 'KMS key for encrypting sensitive data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create VPC with private subnets
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      natGateways: 1,
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

    // Enable VPC Flow Logs
    const vpcFlowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy'),
      ],
    });

    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      retention: logs.RetentionDays.SIX_MONTHS,
      encryptionKey: this.kmsKey,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create security groups with minimal permissions
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: false,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for database servers',
      allowAllOutbound: false,
    });

    databaseSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from web servers'
    );

    // Create database secret with automatic rotation
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'RDS database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Create RDS instance with encryption
    const rdsInstance = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      storageEncrypted: true,
      storageEncryptionKey: this.kmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: true,
      monitoringInterval: cdk.Duration.seconds(60),
    });

    // Enable automatic rotation for the database secret
    new secretsmanager.RotationSchedule(this, 'DatabaseSecretRotation', {
      secret: this.databaseSecret,
      rotationLambda: secretsmanager.RotationSchedule.mysqlSingleUser({
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroup: new ec2.SecurityGroup(this, 'RotationSecurityGroup', {
          vpc: this.vpc,
          description: 'Security group for secret rotation lambda',
        }),
      }),
      automaticallyAfter: cdk.Duration.days(30),
    });

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `secure-cloudtrail-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(2555), // 7 years
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

    // Enable CloudTrail
    const cloudTrail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      bucket: cloudTrailBucket,
      encryptionKey: this.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: this.kmsKey,
      }),
    });

    // Enable GuardDuty
    new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: { enable: true },
        kubernetesAuditLogs: { enable: true },
        malwareProtection: { 
          scanEc2InstanceWithFindings: { 
            ebsVolumes: true 
          } 
        },
      },
    });

    // Enable Security Hub
    new securityhub.CfnHub(this, 'SecurityHub', {
      tags: [
        { key: 'Environment', value: 'Production' },
        { key: 'Owner', value: 'DevOps' },
      ],
    });

    // Create Lambda function for security group monitoring
    const securityGroupMonitorRole = new iam.Role(this, 'SecurityGroupMonitorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        LoggingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const securityGroupMonitorFunction = new lambda.Function(this, 'SecurityGroupMonitor', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: securityGroupMonitorRole,
      code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Security Group Change Event: {json.dumps(event)}")
    
    # Extract relevant information
    detail = event.get('detail', {})
    event_name = detail.get('eventName', 'Unknown')
    source_ip = detail.get('sourceIPAddress', 'Unknown')
    user_identity = detail.get('userIdentity', {})
    
    log_message = {
        'event_name': event_name,
        'source_ip': source_ip,
        'user_identity': user_identity,
        'timestamp': event.get('time', 'Unknown'),
        'region': event.get('awsRegion', 'Unknown')
    }
    
    logger.warning(f"SECURITY GROUP CHANGE DETECTED: {json.dumps(log_message)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Security group change logged')
    }
      `),
    });

    // Create EventBridge rule for security group changes
    const securityGroupRule = new events.Rule(this, 'SecurityGroupChangeRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['ec2.amazonaws.com'],
          eventName: [
            'AuthorizeSecurityGroupIngress',
            'AuthorizeSecurityGroupEgress',
            'RevokeSecurityGroupIngress',
            'RevokeSecurityGroupEgress',
            'CreateSecurityGroup',
            'DeleteSecurityGroup',
          ],
        },
      },
    });

    securityGroupRule.addTarget(new targets.LambdaFunction(securityGroupMonitorFunction));

    // Create IAM roles with least privilege for EC2 instances
    const webServerRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for web server instances with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        SecretManagerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [this.databaseSecret.secretArn],
            }),
          ],
        }),
      },
    });

    const webServerInstanceProfile = new iam.InstanceProfile(this, 'WebServerInstanceProfile', {
      role: webServerRole,
    });

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'ARN of the database secret',
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'ARN of the KMS encryption key',
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the security stack with all security configurations
    new SecurityStack(this, `SecurityStack-${environmentSuffix}`, {
      env: props?.env,
      description: 'Secure web application infrastructure with security best practices',
    });
  }
}
```

This implementation provides:

1. **IAM roles with least privilege**: Created specific roles for web servers and Lambda functions with only necessary permissions
2. **Proper tagging**: All resources tagged with Environment=Production and Owner=DevOps
3. **Secrets management**: Database credentials stored in AWS Secrets Manager with automatic rotation
4. **Security group logging**: EventBridge rule captures security group changes and logs them via Lambda
5. **AWS Security Hub**: Enabled for centralized security findings
6. **AWS GuardDuty**: Enabled with malware protection and S3/Kubernetes monitoring
7. **AWS Secrets Manager**: Database secrets with 30-day automatic rotation
8. **CloudTrail**: API logging with encryption enabled
9. **KMS encryption**: Used throughout for data at rest encryption
10. **Secure networking**: VPC with private subnets, security groups with minimal access

The infrastructure follows AWS Well-Architected security pillar principles and implements defense in depth.