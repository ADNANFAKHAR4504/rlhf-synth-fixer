import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  encryptionKey: kms.IKey;
}

export class MonitoringStack extends cdk.Stack {
  public readonly securityAlertsTopicArn: string;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const region = props.env?.region || 'us-east-1';
    const regionSuffix = region.replace(/-/g, '');

    // CloudWatch Log Group with KMS encryption
    this.logGroup = new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/security-compliance/${props.environmentSuffix}/security-events`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: props.encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Metric filters for security events
    const unauthorizedApiCallsFilter = new logs.MetricFilter(
      this,
      'UnauthorizedApiCalls',
      {
        logGroup: this.logGroup,
        metricNamespace: 'SecurityCompliance',
        metricName: 'UnauthorizedAPICalls',
        filterPattern: logs.FilterPattern.literal(
          '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
        ),
        metricValue: '1',
      }
    );

    const privilegeEscalationFilter = new logs.MetricFilter(
      this,
      'PrivilegeEscalation',
      {
        logGroup: this.logGroup,
        metricNamespace: 'SecurityCompliance',
        metricName: 'PrivilegeEscalation',
        filterPattern: logs.FilterPattern.literal(
          '{ ($.eventName = "PutUserPolicy") || ($.eventName = "PutRolePolicy") || ($.eventName = "AttachUserPolicy") || ($.eventName = "AttachRolePolicy") }'
        ),
        metricValue: '1',
      }
    );

    // SNS topic for security alerts with encryption
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      topicName: `security-alerts-${props.environmentSuffix}`,
      displayName: 'Security Alerts Topic',
      masterKey: props.encryptionKey,
    });

    this.securityAlertsTopicArn = securityAlertsTopic.topicArn;

    // CloudWatch alarms for security events
    const unauthorizedApiCallsAlarm = new cloudwatch.Alarm(
      this,
      'UnauthorizedApiCallsAlarm',
      {
        alarmName: `unauthorized-api-calls-${props.environmentSuffix}`,
        alarmDescription: 'Alarm for unauthorized API calls',
        metric: unauthorizedApiCallsFilter.metric(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    unauthorizedApiCallsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    const privilegeEscalationAlarm = new cloudwatch.Alarm(
      this,
      'PrivilegeEscalationAlarm',
      {
        alarmName: `privilege-escalation-${props.environmentSuffix}`,
        alarmDescription: 'Alarm for privilege escalation attempts',
        metric: privilegeEscalationFilter.metric(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    privilegeEscalationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    // S3 bucket for AWS Config
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `aws-config-${props.environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM role for AWS Config
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `aws-config-role-${props.environmentSuffix}-${regionSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    configBucket.grantReadWrite(configRole);
    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetBucketVersioning', 's3:PutBucketVersioning'],
        resources: [configBucket.bucketArn],
      })
    );

    // Note: AWS Config Recorder and Delivery Channel are account-level resources
    // AWS allows only ONE configuration recorder per account/region
    // Using the existing account-level Config recorder instead of creating a new one
    // Config Rules can still be created and will use the existing recorder

    // AWS Config Rules - S3 Bucket Encryption
    new config.ManagedRule(this, 'S3BucketEncryptionRule', {
      configRuleName: `s3-bucket-encryption-${props.environmentSuffix}`,
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Check that S3 buckets have encryption enabled',
    });

    // AWS Config Rules - RDS Encryption
    new config.ManagedRule(this, 'RDSEncryptionRule', {
      configRuleName: `rds-encryption-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Check that RDS instances have encryption enabled',
    });

    // AWS Config Rules - EBS Encryption
    new config.ManagedRule(this, 'EBSEncryptionRule', {
      configRuleName: `ebs-encryption-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
      description: 'Check that EBS encryption is enabled by default',
    });

    // AWS Config Rules - IAM Password Policy
    new config.ManagedRule(this, 'IAMPasswordPolicyRule', {
      configRuleName: `iam-password-policy-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: 'Check that IAM password policy meets requirements',
      inputParameters: {
        RequireUppercaseCharacters: 'true',
        RequireLowercaseCharacters: 'true',
        RequireSymbols: 'true',
        RequireNumbers: 'true',
        MinimumPasswordLength: '14',
        PasswordReusePrevention: '24',
        MaxPasswordAge: '90',
      },
    });

    // AWS Config Rules - S3 Block Public Access
    new config.ManagedRule(this, 'S3BlockPublicAccessRule', {
      configRuleName: `s3-block-public-access-${props.environmentSuffix}`,
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      description: 'Check that S3 buckets do not allow public read access',
    });

    // Apply tags
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');

    // Outputs
    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'SNS Topic ARN for security alerts',
      exportName: `${props.environmentSuffix}-security-alerts-topic`,
    });

    new cdk.CfnOutput(this, 'SecurityLogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'CloudWatch Log Group for security events',
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 Bucket for AWS Config',
    });
  }
}
