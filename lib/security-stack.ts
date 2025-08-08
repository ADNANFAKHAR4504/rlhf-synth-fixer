import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly s3AccessRole: iam.Role;
  public readonly alertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    this.kmsKey = new kms.Key(this, 'WebAppKMSKey', {
      description: 'KMS key for web application encryption',
      enableKeyRotation: true,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    });

    this.kmsKey.addAlias(`webapp-key-${props.environmentSuffix}`);

    // SNS Topic for alerts
    this.alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      displayName: `WebApp Alerts ${props.environmentSuffix}`,
      masterKey: this.kmsKey,
    });

    // IAM Role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // S3 Access Role with restricted permissions
    this.s3AccessRole = new iam.Role(this, 'S3AccessRole', {
      assumedBy: this.ec2Role,
      description: 'Restricted S3 access role for web application',
    });

    // Enable GuardDuty Extended Threat Detection (2025 feature)
    new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      features: [
        {
          name: 'S3_DATA_EVENTS',
          status: 'ENABLED',
        },
        {
          name: 'EKS_AUDIT_LOGS',
          status: 'ENABLED',
        },
        {
          name: 'EBS_MALWARE_PROTECTION',
          status: 'ENABLED',
        },
        {
          name: 'RDS_LOGIN_EVENTS',
          status: 'ENABLED',
        },
        {
          name: 'EKS_RUNTIME_MONITORING',
          status: 'ENABLED',
        },
      ],
    });

    // Enable Security Hub with new 2025 capabilities
    new securityhub.CfnHub(this, 'SecurityHub', {
      enableDefaultStandards: true,
      autoEnableControls: true,
      controlFindingGenerator: 'SECURITY_CONTROL',
    });

    // CloudWatch Log Group for application logs
    new logs.LogGroup(this, 'WebAppLogs', {
      logGroupName: `/aws/webapp/${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmDescription: 'High error rate detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Security');
  }
}
