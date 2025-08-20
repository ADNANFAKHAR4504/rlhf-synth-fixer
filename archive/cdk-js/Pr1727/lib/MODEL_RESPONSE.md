# AWS CDK JavaScript Security Configuration Infrastructure

## File: lib/security-kms-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityKmsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Customer-managed KMS key for data encryption
    this.encryptionKey = new kms.Key(this, `SecurityEncryptionKey${environmentSuffix}`, {
      description: 'Customer-managed key for data encryption across all security resources',
      enableKeyRotation: true,
      keyRotation: kms.KeyRotation.ENABLED,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
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
            sid: 'Allow use of the key for encryption/decryption',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('s3.amazonaws.com'),
              new iam.ServicePrincipal('ec2.amazonaws.com'),
              new iam.ServicePrincipal('config.amazonaws.com'),
              new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
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
              StringEquals: {
                'kms:ViaService': [
                  `s3.us-west-2.amazonaws.com`,
                  `ec2.us-west-2.amazonaws.com`,
                  `config.us-west-2.amazonaws.com`,
                  `cloudtrail.us-west-2.amazonaws.com`,
                ],
              },
            },
          }),
        ],
      }),
    });

    // KMS key alias for easier reference
    this.encryptionKeyAlias = new kms.Alias(this, `SecurityEncryptionKeyAlias${environmentSuffix}`, {
      aliasName: `alias/security-encryption-key-${environmentSuffix}`,
      targetKey: this.encryptionKey,
    });

    // Asymmetric key for digital signing
    this.signingKey = new kms.Key(this, `SecuritySigningKey${environmentSuffix}`, {
      description: 'Asymmetric key for digital signing and verification',
      keyUsage: kms.KeyUsage.SIGN_VERIFY,
      keySpec: kms.KeySpec.RSA_2048,
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
            sid: 'Allow signing operations',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('lambda.amazonaws.com'),
              new iam.ServicePrincipal('apigateway.amazonaws.com'),
            ],
            actions: [
              'kms:Sign',
              'kms:Verify',
              'kms:GetPublicKey',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Signing key alias
    this.signingKeyAlias = new kms.Alias(this, `SecuritySigningKeyAlias${environmentSuffix}`, {
      aliasName: `alias/security-signing-key-${environmentSuffix}`,
      targetKey: this.signingKey,
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'DataEncryptionAndSigning');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `EncryptionKeyId${environmentSuffix}`, {
      value: this.encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
      exportName: `SecurityStack-EncryptionKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EncryptionKeyArn${environmentSuffix}`, {
      value: this.encryptionKey.keyArn,
      description: 'KMS Encryption Key ARN',
      exportName: `SecurityStack-EncryptionKeyArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SigningKeyId${environmentSuffix}`, {
      value: this.signingKey.keyId,
      description: 'KMS Signing Key ID',
      exportName: `SecurityStack-SigningKeyId-${environmentSuffix}`,
    });
  }
}
```

## File: lib/security-iam-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityIamStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;

    // Security Audit Role with least privilege
    this.securityAuditRole = new iam.Role(this, `SecurityAuditRole${environmentSuffix}`, {
      roleName: `SecurityAuditRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('config.amazonaws.com'),
        new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      ),
      description: 'Role for security auditing and compliance monitoring',
      maxSessionDuration: cdk.Duration.hours(4),
      inlinePolicies: {
        SecurityAuditPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'ConfigServicePermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'config:Put*',
                'config:Get*',
                'config:List*',
                'config:Describe*',
                'config:BatchGet*',
                'config:Select*',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-west-2',
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'CloudTrailPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudtrail:CreateTrail',
                'cloudtrail:PutEventSelectors',
                'cloudtrail:PutInsightSelectors',
                'cloudtrail:StartLogging',
                'cloudtrail:StopLogging',
                'cloudtrail:DescribeTrails',
                'cloudtrail:GetTrailStatus',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-west-2',
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'KMSPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [encryptionKeyArn],
            }),
          ],
        }),
      },
    });

    // Security Monitoring Role
    this.securityMonitoringRole = new iam.Role(this, `SecurityMonitoringRole${environmentSuffix}`, {
      roleName: `SecurityMonitoringRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('events.amazonaws.com'),
      ),
      description: 'Role for security monitoring and alerting',
      maxSessionDuration: cdk.Duration.hours(2),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        SecurityMonitoringPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'CloudWatchPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-west-2',
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'SNSPublishPermissions',
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [`arn:aws:sns:us-west-2:${this.account}:security-alerts-*`],
            }),
          ],
        }),
      },
    });

    // Data Access Role with strict conditions
    this.dataAccessRole = new iam.Role(this, `DataAccessRole${environmentSuffix}`, {
      roleName: `DataAccessRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for accessing encrypted data with strict security conditions',
      maxSessionDuration: cdk.Duration.hours(1),
      inlinePolicies: {
        DataAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'S3DataAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
              ],
              resources: [`arn:aws:s3:::security-data-${environmentSuffix}/*`],
              conditions: {
                StringEquals: {
                  's3:ExistingObjectTag/Owner': 'SecurityTeam',
                  's3:ExistingObjectTag/Environment': environmentSuffix,
                },
                Bool: {
                  'aws:SecureTransport': 'true',
                },
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8', '172.16.0.0/12'],
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'KMSDecryptPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              resources: [encryptionKeyArn],
              conditions: {
                StringEquals: {
                  'kms:ViaService': `s3.us-west-2.amazonaws.com`,
                },
              },
            }),
          ],
        }),
      },
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'IAMSecurityRoles');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `SecurityAuditRoleArn${environmentSuffix}`, {
      value: this.securityAuditRole.roleArn,
      description: 'Security Audit Role ARN',
      exportName: `SecurityStack-AuditRoleArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SecurityMonitoringRoleArn${environmentSuffix}`, {
      value: this.securityMonitoringRole.roleArn,
      description: 'Security Monitoring Role ARN',
      exportName: `SecurityStack-MonitoringRoleArn-${environmentSuffix}`,
    });
  }
}
```

## File: lib/security-config-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class SecurityConfigStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;
    const serviceRoleArn = props.serviceRoleArn;

    // S3 bucket for Config snapshots and history
    this.configBucket = new s3.Bucket(this, `ConfigBucket${environmentSuffix}`, {
      bucketName: `aws-config-security-${environmentSuffix}-${this.account}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: cdk.aws_kms.Key.fromKeyArn(this, 'ConfigEncryptionKey', encryptionKeyArn),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiration: cdk.Duration.days(2555), // 7 years retention
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
      enforceSSL: true,
    });

    // SNS topic for compliance notifications
    this.complianceTopic = new sns.Topic(this, `ComplianceTopic${environmentSuffix}`, {
      topicName: `security-compliance-alerts-${environmentSuffix}`,
      displayName: 'Security Compliance Alerts',
      kmsKey: cdk.aws_kms.Key.fromKeyArn(this, 'TopicEncryptionKey', encryptionKeyArn),
    });

    // Config Configuration Recorder
    this.configRecorder = new config.CfnConfigurationRecorder(
      this,
      `ConfigRecorder${environmentSuffix}`,
      {
        name: `SecurityConfigRecorder${environmentSuffix}`,
        roleArn: serviceRoleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
          recordingModeOverrides: [
            {
              resourceTypes: ['AWS::EC2::Instance'],
              recordingFrequency: 'CONTINUOUS',
            },
            {
              resourceTypes: ['AWS::S3::Bucket'],
              recordingFrequency: 'CONTINUOUS', 
            },
            {
              resourceTypes: ['AWS::IAM::Role'],
              recordingFrequency: 'DAILY',
            },
          ],
        },
      }
    );

    // Config Delivery Channel
    this.deliveryChannel = new config.CfnDeliveryChannel(this, `DeliveryChannel${environmentSuffix}`, {
      name: `SecurityDeliveryChannel${environmentSuffix}`,
      s3BucketName: this.configBucket.bucketName,
      s3KeyPrefix: 'security-config',
      snsTopicArn: this.complianceTopic.topicArn,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'TwentyFour_Hours',
      },
    });

    // Security Config Rules

    // Rule 1: Ensure root access key check
    new config.ManagedRule(this, `RootAccessKeyCheckRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.ROOT_ACCESS_KEY_CHECK,
      description: 'Checks whether the root user access key is available',
      configRuleName: `root-access-key-check-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 2: S3 bucket public access prohibited
    new config.ManagedRule(this, `S3BucketPublicAccessProhibitedRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_ACCESS_PROHIBITED,
      description: 'Checks that Amazon S3 buckets do not allow public access',
      configRuleName: `s3-bucket-public-access-prohibited-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 3: S3 bucket server side encryption enabled
    new config.ManagedRule(this, `S3BucketServerSideEncryptionEnabledRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Checks that Amazon S3 bucket is encrypted by server-side encryption',
      configRuleName: `s3-bucket-server-side-encryption-enabled-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 4: IAM password policy check
    new config.ManagedRule(this, `IAMPasswordPolicyRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: 'Checks whether the account password policy for IAM users meets specified requirements',
      configRuleName: `iam-password-policy-${environmentSuffix}`,
      inputParameters: {
        RequireUppercaseCharacters: 'true',
        RequireLowercaseCharacters: 'true',
        RequireSymbols: 'true',
        RequireNumbers: 'true',
        MinimumPasswordLength: '14',
        PasswordReusePrevention: '24',
        MaxPasswordAge: '90',
      },
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 5: EBS volume encryption check
    new config.ManagedRule(this, `EBSVolumeEncryptionRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.ENCRYPTED_VOLUMES,
      description: 'Checks whether Amazon EBS volumes are encrypted',
      configRuleName: `ebs-volume-encryption-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 6: CloudTrail enabled
    new config.ManagedRule(this, `CloudTrailEnabledRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
      description: 'Checks whether AWS CloudTrail is enabled in your AWS account',
      configRuleName: `cloudtrail-enabled-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 7: KMS key rotation enabled
    new config.ManagedRule(this, `KMSKeyRotationRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.KMS_KEY_ROTATION_ENABLED,
      description: 'Checks whether key rotation is enabled for customer-created CMKs',
      configRuleName: `kms-key-rotation-enabled-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Rule 8: VPC security group restricted ingress
    new config.ManagedRule(this, `VPCSecurityGroupRestrictedIngressRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.EC2_SECURITY_GROUP_ATTACHED_TO_ENI,
      description: 'Checks if security groups are attached to Amazon EC2 instances or ENIs',
      configRuleName: `vpc-security-group-restricted-ingress-${environmentSuffix}`,
      evaluationModes: config.EvaluationMode.DETECTIVE_AND_PROACTIVE,
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `ConfigBucketName${environmentSuffix}`, {
      value: this.configBucket.bucketName,
      description: 'Config S3 Bucket Name',
      exportName: `SecurityStack-ConfigBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ComplianceTopicArn${environmentSuffix}`, {
      value: this.complianceTopic.topicArn,
      description: 'Compliance SNS Topic ARN',
      exportName: `SecurityStack-ComplianceTopic-${environmentSuffix}`,
    });
  }
}
```

## File: lib/security-monitoring-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class SecurityMonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;

    // S3 bucket for CloudTrail logs
    this.cloudTrailBucket = new s3.Bucket(this, `CloudTrailBucket${environmentSuffix}`, {
      bucketName: `aws-cloudtrail-security-${environmentSuffix}-${this.account}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: cdk.aws_kms.Key.fromKeyArn(this, 'CloudTrailEncryptionKey', encryptionKeyArn),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldLogs',
          expiration: cdk.Duration.days(2555), // 7 years retention
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
      ],
      enforceSSL: true,
    });

    // CloudWatch Log Group for CloudTrail
    this.cloudTrailLogGroup = new logs.LogGroup(this, `CloudTrailLogGroup${environmentSuffix}`, {
      logGroupName: `/aws/cloudtrail/security-trail-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_YEARS,
      encryptionKey: cdk.aws_kms.Key.fromKeyArn(this, 'LogsEncryptionKey', encryptionKeyArn),
    });

    // SNS topic for security alerts
    this.securityAlertsTopic = new sns.Topic(this, `SecurityAlertsTopic${environmentSuffix}`, {
      topicName: `security-alerts-${environmentSuffix}`,
      displayName: 'Security Alerts',
      kmsKey: cdk.aws_kms.Key.fromKeyArn(this, 'AlertsEncryptionKey', encryptionKeyArn),
    });

    // CloudTrail for comprehensive API logging
    this.securityTrail = new cloudtrail.Trail(this, `SecurityCloudTrail${environmentSuffix}`, {
      trailName: `SecurityTrail${environmentSuffix}`,
      bucket: this.cloudTrailBucket,
      s3KeyPrefix: 'security-logs',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false, // Single region deployment
      enableFileValidation: true,
      encryptionKey: cdk.aws_kms.Key.fromKeyArn(this, 'TrailEncryptionKey', encryptionKeyArn),
      cloudWatchLogGroup: this.cloudTrailLogGroup,
      cloudWatchLogGroupRetention: logs.RetentionDays.TWO_YEARS,
      sendToCloudWatchLogs: true,
      insightSelector: [
        {
          insightType: cloudtrail.InsightType.API_CALL_RATE,
        },
      ],
      eventRules: [
        {
          readWriteType: cloudtrail.ReadWriteType.ALL,
          includeManagementEvents: true,
          dataResources: [
            {
              type: 's3',
              values: ['arn:aws:s3:::security-*/*'],
            },
            {
              type: 'kms',
              values: [encryptionKeyArn],
            },
          ],
        },
      ],
    });

    // VPC for security monitoring (if needed for resources)
    this.securityVpc = new ec2.Vpc(this, `SecurityVPC${environmentSuffix}`, {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      vpcName: `SecurityVPC${environmentSuffix}`,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs
    this.vpcFlowLogs = new ec2.FlowLog(this, `VPCFlowLogs${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.securityVpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, `VPCFlowLogsGroup${environmentSuffix}`, {
          logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_YEAR,
          encryptionKey: cdk.aws_kms.Key.fromKeyArn(this, 'FlowLogsEncryptionKey', encryptionKeyArn),
        })
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // CloudWatch Alarms for Security Events

    // High number of failed logins
    new cloudwatch.Alarm(this, `HighFailedLoginsAlarm${environmentSuffix}`, {
      alarmName: `HighFailedLogins-${environmentSuffix}`,
      alarmDescription: 'Alert when there are high number of failed login attempts',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Events',
        metricName: 'FailedLogins',
        dimensionsMap: {
          Environment: environmentSuffix,
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.securityAlertsTopic));

    // Root account usage
    const rootUsageMetricFilter = new logs.MetricFilter(this, `RootUsageMetricFilter${environmentSuffix}`, {
      logGroup: this.cloudTrailLogGroup,
      metricNamespace: 'SecurityMonitoring',
      metricName: 'RootAccountUsage',
      filterPattern: logs.FilterPattern.literal('{ $.userIdentity.type = "Root" }'),
      metricValue: '1',
    });

    new cloudwatch.Alarm(this, `RootAccountUsageAlarm${environmentSuffix}`, {
      alarmName: `RootAccountUsage-${environmentSuffix}`,
      alarmDescription: 'Alert when root account is used',
      metric: rootUsageMetricFilter.metric({
        statistic: 'Sum',
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.securityAlertsTopic));

    // Unauthorized API calls
    const unauthorizedApiCallsMetricFilter = new logs.MetricFilter(this, `UnauthorizedApiCallsMetricFilter${environmentSuffix}`, {
      logGroup: this.cloudTrailLogGroup,
      metricNamespace: 'SecurityMonitoring',
      metricName: 'UnauthorizedApiCalls',
      filterPattern: logs.FilterPattern.literal('{ $.responseElements.message = "*Unauthorized*" || $.errorCode = "*Unauthorized*" || $.errorCode = "AccessDenied*" }'),
      metricValue: '1',
    });

    new cloudwatch.Alarm(this, `UnauthorizedApiCallsAlarm${environmentSuffix}`, {
      alarmName: `UnauthorizedApiCalls-${environmentSuffix}`,
      alarmDescription: 'Alert on unauthorized API calls',
      metric: unauthorizedApiCallsMetricFilter.metric({
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.securityAlertsTopic));

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'SecurityMonitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `CloudTrailBucketName${environmentSuffix}`, {
      value: this.cloudTrailBucket.bucketName,
      description: 'CloudTrail S3 Bucket Name',
      exportName: `SecurityStack-CloudTrailBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SecurityAlertsTopicArn${environmentSuffix}`, {
      value: this.securityAlertsTopic.topicArn,
      description: 'Security Alerts SNS Topic ARN',
      exportName: `SecurityStack-SecurityAlerts-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SecurityVPCId${environmentSuffix}`, {
      value: this.securityVpc.vpcId,
      description: 'Security VPC ID',
      exportName: `SecurityStack-VPCId-${environmentSuffix}`,
    });
  }
}
```

## File: lib/tap-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import { SecurityKmsStack } from './security-kms-stack.mjs';
import { SecurityIamStack } from './security-iam-stack.mjs';
import { SecurityConfigStack } from './security-config-stack.mjs';
import { SecurityMonitoringStack } from './security-monitoring-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create KMS Stack first (other stacks depend on encryption keys)
    const kmsStack = new SecurityKmsStack(scope, `SecurityKmsStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityKmsStack${environmentSuffix}`,
    });

    // Create IAM Stack (depends on KMS keys)
    const iamStack = new SecurityIamStack(scope, `SecurityIamStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityIamStack${environmentSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
    });

    // Create Config Stack (depends on KMS keys and IAM roles)
    const configStack = new SecurityConfigStack(scope, `SecurityConfigStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityConfigStack${environmentSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
      serviceRoleArn: iamStack.securityAuditRole.roleArn,
    });

    // Create Monitoring Stack (depends on KMS keys)
    const monitoringStack = new SecurityMonitoringStack(scope, `SecurityMonitoringStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityMonitoringStack${environmentSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
    });

    // Establish stack dependencies
    iamStack.addDependency(kmsStack);
    configStack.addDependency(kmsStack);
    configStack.addDependency(iamStack);
    monitoringStack.addDependency(kmsStack);

    // Apply global tags to all stacks
    const stacks = [kmsStack, iamStack, configStack, monitoringStack];
    stacks.forEach(stack => {
      cdk.Tags.of(stack).add('Owner', 'SecurityTeam');
      cdk.Tags.of(stack).add('Purpose', 'SecurityConfiguration');
      cdk.Tags.of(stack).add('Environment', environmentSuffix);
      cdk.Tags.of(stack).add('CostCenter', 'Security');
      cdk.Tags.of(stack).add('Compliance', 'Required');
      cdk.Tags.of(stack).add('Project', 'SecurityAsCode');
    });

    // Master outputs
    new cdk.CfnOutput(this, `SecurityDeploymentComplete${environmentSuffix}`, {
      value: 'SUCCESS',
      description: 'Indicates successful deployment of all security stacks',
    });
  }
}

export { TapStack };
```