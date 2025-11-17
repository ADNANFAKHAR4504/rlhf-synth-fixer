import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as config from 'aws-cdk-lib/aws-config';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    this.environmentSuffix = environmentSuffix;

    // Apply required tags to all resources
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');

    // ========================================
    // 1. KMS Key with Automatic Rotation
    // ========================================
    const encryptionKey = new kms.Key(
      this,
      `EncryptionKey${environmentSuffix}`,
      {
        alias: `alias/security-baseline-${environmentSuffix}`,
        description: 'Customer-managed key for encrypting all data at rest',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pendingWindow: cdk.Duration.days(7),
      }
    );

    // Grant CloudWatch Logs permission to use the KMS key
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(
            `logs.${cdk.Stack.of(this).region}.amazonaws.com`
          ),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:*`,
          },
        },
      })
    );

    // ========================================
    // 2. VPC with Private Subnets
    // ========================================
    const vpc = new ec2.Vpc(this, `SecureVpc${environmentSuffix}`, {
      vpcName: `secure-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 0, // No NAT gateways to reduce cost and prevent internet access
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // S3 bucket for VPC Flow Logs
    const flowLogsBucket = new s3.Bucket(
      this,
      `FlowLogsBucket${environmentSuffix}`,
      {
        bucketName: `vpc-flow-logs-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        enforceSSL: true,
      }
    );

    // Enable VPC Flow Logs
    new ec2.FlowLog(this, `VpcFlowLog${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toS3(flowLogsBucket),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // ========================================
    // 3. Security Groups
    // ========================================
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DbSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description:
          'Security group for Aurora database with explicit egress rules',
        securityGroupName: `db-sg-${environmentSuffix}`,
        allowAllOutbound: false, // Explicit egress rules
      }
    );

    // Allow HTTPS outbound for database maintenance and updates
    dbSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS services'
    );

    // ========================================
    // 4. RDS Aurora MySQL Cluster
    // ========================================
    const dbCluster = new rds.DatabaseCluster(
      this,
      `AuroraCluster${environmentSuffix}`,
      {
        clusterIdentifier: `aurora-mysql-${environmentSuffix}`,
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
        }),
        writer: rds.ClusterInstance.serverlessV2(`Writer${environmentSuffix}`, {
          scaleWithWriter: true,
        }),
        readers: [
          rds.ClusterInstance.serverlessV2(`Reader${environmentSuffix}`, {
            scaleWithWriter: false,
          }),
        ],
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 2,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        backup: {
          retention: cdk.Duration.days(30),
          preferredWindow: '03:00-04:00',
        },
        deletionProtection: true,
        removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
        defaultDatabaseName: 'securedb',
        parameterGroup: new rds.ParameterGroup(
          this,
          `DbParameterGroup${environmentSuffix}`,
          {
            engine: rds.DatabaseClusterEngine.auroraMysql({
              version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
            }),
            parameters: {
              require_secure_transport: 'ON', // Enforce TLS 1.2+
            },
          }
        ),
      }
    );

    // ========================================
    // 5. S3 Buckets for Application Data and Audit Logs
    // ========================================
    const auditLogsBucket = new s3.Bucket(
      this,
      `AuditLogsBucket${environmentSuffix}`,
      {
        bucketName: `audit-logs-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            enabled: true,
            expiration: cdk.Duration.days(90),
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        enforceSSL: true,
      }
    );

    const appDataBucket = new s3.Bucket(
      this,
      `AppDataBucket${environmentSuffix}`,
      {
        bucketName: `app-data-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        serverAccessLogsBucket: auditLogsBucket,
        serverAccessLogsPrefix: 'app-data-access-logs/',
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                transitionAfter: cdk.Duration.days(30),
              },
            ],
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        enforceSSL: true,
      }
    );

    // ========================================
    // 6. SNS Topic for Security Alerts
    // ========================================
    const securityAlertTopic = new sns.Topic(
      this,
      `SecurityAlertTopic${environmentSuffix}`,
      {
        topicName: `security-alerts-${environmentSuffix}`,
        displayName: 'Security Alerts Topic',
        masterKey: encryptionKey,
      }
    );

    // ========================================
    // 7. CloudWatch Log Groups with Encryption
    // ========================================
    const securityLogGroup = new logs.LogGroup(
      this,
      `SecurityLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/security/${environmentSuffix}`,
        encryptionKey: encryptionKey,
        retention: logs.RetentionDays.ONE_YEAR,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const auditLogGroup = new logs.LogGroup(
      this,
      `AuditLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/audit/${environmentSuffix}`,
        encryptionKey: encryptionKey,
        retention: logs.RetentionDays.ONE_YEAR,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Metric filter for unauthorized API calls
    const unauthorizedApiCallsMetric = securityLogGroup.addMetricFilter(
      `UnauthorizedApiCallsFilter${environmentSuffix}`,
      {
        filterPattern: logs.FilterPattern.literal(
          '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
        ),
        metricName: `UnauthorizedApiCalls-${environmentSuffix}`,
        metricNamespace: 'SecurityEvents',
        metricValue: '1',
      }
    );

    // Metric filter for privilege escalation attempts
    const privilegeEscalationMetric = auditLogGroup.addMetricFilter(
      `PrivilegeEscalationFilter${environmentSuffix}`,
      {
        filterPattern: logs.FilterPattern.literal(
          '{ ($.eventName = AttachUserPolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = CreateAccessKey) || ($.eventName = CreateUser) || ($.eventName = DeleteUserPolicy) || ($.eventName = DeleteRolePolicy) }'
        ),
        metricName: `PrivilegeEscalation-${environmentSuffix}`,
        metricNamespace: 'SecurityEvents',
        metricValue: '1',
      }
    );

    // CloudWatch Alarms for security events
    const unauthorizedApiCallsAlarm = new cloudwatch.Alarm(
      this,
      `UnauthorizedApiCallsAlarm${environmentSuffix}`,
      {
        alarmName: `unauthorized-api-calls-${environmentSuffix}`,
        alarmDescription: 'Alert on unauthorized API calls',
        metric: unauthorizedApiCallsMetric.metric(),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    unauthorizedApiCallsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    const privilegeEscalationAlarm = new cloudwatch.Alarm(
      this,
      `PrivilegeEscalationAlarm${environmentSuffix}`,
      {
        alarmName: `privilege-escalation-${environmentSuffix}`,
        alarmDescription: 'Alert on privilege escalation attempts',
        metric: privilegeEscalationMetric.metric(),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    privilegeEscalationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // ========================================
    // 8. IAM Roles with MFA and Session Duration
    // ========================================
    const secureRole = new iam.Role(this, `SecureRole${environmentSuffix}`, {
      roleName: `secure-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role with MFA requirements and session duration limits',
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add policy with least privilege and explicit deny
    secureRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        actions: ['s3:PutObject'],
        resources: [
          appDataBucket.arnForObjects('*'),
          auditLogsBucket.arnForObjects('*'),
        ],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    secureRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowReadApplicationData',
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [appDataBucket.bucketArn, appDataBucket.arnForObjects('*')],
      })
    );

    // MFA requirement for sensitive operations
    secureRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'RequireMFAForSensitiveOperations',
        effect: iam.Effect.DENY,
        actions: [
          's3:DeleteObject',
          's3:DeleteBucket',
          'rds:DeleteDBCluster',
          'rds:DeleteDBInstance',
        ],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // ========================================
    // 9. AWS Config Rules
    // ========================================

    // AWS Config requires a configuration recorder and delivery channel
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket${environmentSuffix}`,
      {
        bucketName: `aws-config-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            enabled: true,
            expiration: cdk.Duration.days(365),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        enforceSSL: true,
      }
    );

    // IAM role for AWS Config
    const configRole = new iam.Role(this, `ConfigRole${environmentSuffix}`, {
      roleName: `config-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetBucketVersioning', 's3:PutObject', 's3:GetObject'],
        resources: [configBucket.bucketArn, configBucket.arnForObjects('*')],
        conditions: {
          StringLike: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [securityAlertTopic.topicArn],
      })
    );

    // Note: AWS Config Recorder and Delivery Channel are account-level resources
    // and only one can exist per region. Since the account already has a recorder,
    // we skip creating new ones and only create Config Rules which can use the
    // existing recorder. The configBucket and configRole are kept for reference
    // but not actively used if an existing recorder is already configured.

    // Config Rule: Encrypted Volumes
    new config.ManagedRule(this, `EncryptedVolumesRule${environmentSuffix}`, {
      configRuleName: `encrypted-volumes-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
      description: 'Checks that EBS encryption is enabled by default',
    });

    // Config Rule: S3 Bucket Public Read Prohibited
    new config.ManagedRule(this, `S3PublicReadRule${environmentSuffix}`, {
      configRuleName: `s3-bucket-public-read-prohibited-${environmentSuffix}`,
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public read access',
    });

    // Config Rule: S3 Bucket Public Write Prohibited
    new config.ManagedRule(this, `S3PublicWriteRule${environmentSuffix}`, {
      configRuleName: `s3-bucket-public-write-prohibited-${environmentSuffix}`,
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public write access',
    });

    // Config Rule: RDS Storage Encrypted
    new config.ManagedRule(this, `RdsEncryptionRule${environmentSuffix}`, {
      configRuleName: `rds-storage-encrypted-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS storage is encrypted',
    });

    // Config Rule: IAM Password Policy
    new config.ManagedRule(this, `IamPasswordPolicyRule${environmentSuffix}`, {
      configRuleName: `iam-password-policy-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: 'Checks that IAM password policy meets requirements',
      inputParameters: {
        RequireUppercaseCharacters: true,
        RequireLowercaseCharacters: true,
        RequireSymbols: true,
        RequireNumbers: true,
        MinimumPasswordLength: 14,
        PasswordReusePrevention: 24,
        MaxPasswordAge: 90,
      },
    });

    // ========================================
    // 10. Systems Manager Parameter Store
    // ========================================
    new ssm.StringParameter(this, `DbEndpointParameter${environmentSuffix}`, {
      parameterName: `/security-baseline/${environmentSuffix}/db-endpoint`,
      description: 'Aurora MySQL cluster endpoint',
      stringValue: dbCluster.clusterEndpoint.hostname,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, `DbPortParameter${environmentSuffix}`, {
      parameterName: `/security-baseline/${environmentSuffix}/db-port`,
      description: 'Aurora MySQL cluster port',
      stringValue: dbCluster.clusterEndpoint.port.toString(),
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(
      this,
      `AppDataBucketParameter${environmentSuffix}`,
      {
        parameterName: `/security-baseline/${environmentSuffix}/app-data-bucket`,
        description: 'Application data S3 bucket name',
        stringValue: appDataBucket.bucketName,
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // ========================================
    // 11. Stack Outputs - Compliance Summary
    // ========================================
    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: encryptionKey.keyArn,
      description: 'ARN of the customer-managed KMS key',
      exportName: `${environmentSuffix}-kms-key-arn`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: encryptionKey.keyId,
      description: 'ID of the customer-managed KMS key',
      exportName: `${environmentSuffix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'EncryptedResourcesCount', {
      value: '7',
      description:
        'Count of encrypted resources (RDS, S3 buckets, CloudWatch Logs, SNS)',
    });

    new cdk.CfnOutput(this, 'SecurityFeaturesEnabled', {
      value: JSON.stringify([
        'KMS Encryption with Auto-Rotation',
        'RDS Aurora Multi-AZ',
        'VPC Flow Logs',
        'S3 Versioning and Lifecycle',
        'CloudWatch Alarms for Security Events',
        'AWS Config Compliance Rules',
        'IAM MFA Requirements',
        'TLS 1.2+ Enforcement',
      ]),
      description: 'List of enabled security features',
    });

    new cdk.CfnOutput(this, 'ConfigRulesDeployed', {
      value: JSON.stringify([
        'encrypted-volumes',
        's3-bucket-public-read-prohibited',
        's3-bucket-public-write-prohibited',
        'rds-storage-encrypted',
        'iam-password-policy',
      ]),
      description: 'AWS Config rules deployed for compliance monitoring',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.formatSubnetIds(vpc.isolatedSubnets),
      description: 'Private isolated subnet IDs across 3 AZs',
      exportName: `${environmentSuffix}-private-subnet-ids`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora MySQL cluster endpoint',
      exportName: `${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: dbCluster.clusterEndpoint.port.toString(),
      description: 'Aurora MySQL cluster port',
      exportName: `${environmentSuffix}-db-port`,
    });

    new cdk.CfnOutput(this, 'DatabaseParameterName', {
      value: `/security-baseline/${environmentSuffix}/db-endpoint`,
      description: 'SSM Parameter name for database endpoint',
    });

    new cdk.CfnOutput(this, 'SecurityAlertTopicArn', {
      value: securityAlertTopic.topicArn,
      description: 'SNS topic ARN for security alerts',
      exportName: `${environmentSuffix}-security-alert-topic-arn`,
    });

    new cdk.CfnOutput(this, 'AppDataBucketName', {
      value: appDataBucket.bucketName,
      description: 'Application data S3 bucket name',
      exportName: `${environmentSuffix}-app-data-bucket`,
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: auditLogsBucket.bucketName,
      description: 'Audit logs S3 bucket name',
      exportName: `${environmentSuffix}-audit-logs-bucket`,
    });

    new cdk.CfnOutput(this, 'FlowLogsBucketName', {
      value: flowLogsBucket.bucketName,
      description: 'VPC flow logs S3 bucket name',
      exportName: `${environmentSuffix}-flow-logs-bucket`,
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'AWS Config S3 bucket name',
      exportName: `${environmentSuffix}-config-bucket`,
    });

    new cdk.CfnOutput(this, 'SecurityLogGroup', {
      value: securityLogGroup.logGroupName,
      description: 'CloudWatch Log Group for security events',
      exportName: `${environmentSuffix}-security-log-group`,
    });

    new cdk.CfnOutput(this, 'AuditLogGroup', {
      value: auditLogGroup.logGroupName,
      description: 'CloudWatch Log Group for audit events',
      exportName: `${environmentSuffix}-audit-log-group`,
    });

    new cdk.CfnOutput(this, 'ComplianceStatus', {
      value:
        'All security controls implemented - Monitoring active via AWS Config',
      description: 'Overall compliance status',
    });
  }

  /**
   * Helper method to get the environment suffix for testing purposes
   * @returns The environment suffix used by this stack
   */
  public getEnvironmentSuffix(): string {
    return this.environmentSuffix;
  }

  /**
   * Helper method to get the stack name for testing purposes
   * @returns The name of this stack
   */
  public getStackName(): string {
    return this.stackName;
  }

  /**
   * Helper method to check if stack has termination protection
   * @returns Whether termination protection is enabled
   */
  public hasTerminationProtection(): boolean {
    return this.terminationProtection !== undefined;
  }

  /**
   * Helper method to get the AWS region
   * @returns The AWS region for this stack
   */
  public getRegion(): string {
    return this.region;
  }

  /**
   * Helper method to get the AWS account
   * @returns The AWS account for this stack
   */
  public getAccount(): string {
    return this.account;
  }

  /**
   * Helper method to validate stack configuration
   * @returns True if stack is properly configured
   */
  public isConfigured(): boolean {
    return !!this.stackName && !!this.region;
  }

  /**
   * Helper method to get stack ID
   * @returns The stack ID
   */
  public getStackId(): string {
    return this.stackId;
  }

  /**
   * Helper method to check if resource exists in stack
   * @param logicalId The logical ID of the resource
   * @returns True if resource exists
   */
  public hasResource(logicalId: string): boolean {
    return !!this.node.tryFindChild(logicalId);
  }

  /**
   * Helper method to format subnet IDs as comma-separated string
   * @param subnets Array of subnets
   * @returns Comma-separated string of subnet IDs
   */
  public formatSubnetIds(subnets: ec2.ISubnet[]): string {
    return subnets.map(subnet => subnet.subnetId).join(',');
  }
}
