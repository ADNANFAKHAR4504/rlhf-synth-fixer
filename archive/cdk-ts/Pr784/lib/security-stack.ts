import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cr from 'aws-cdk-lib/custom-resources';
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

    // Custom resource to ensure KMS key is fully propagated
    const kmsKeyValidator = new cr.AwsCustomResource(this, 'KMSKeyValidator', {
      onCreate: {
        service: 'KMS',
        action: 'describeKey',
        parameters: {
          KeyId: this.kmsKey.keyId,
        },
        physicalResourceId: cr.PhysicalResourceId.of('KMSKeyValidator'),
      },
      onUpdate: {
        service: 'KMS',
        action: 'describeKey',
        parameters: {
          KeyId: this.kmsKey.keyId,
        },
        physicalResourceId: cr.PhysicalResourceId.of('KMSKeyValidator'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    // Grant CloudFormation execution role permission to use the KMS key
    this.kmsKey.grantEncryptDecrypt(
      new iam.ServicePrincipal('cloudformation.amazonaws.com')
    );
    this.kmsKey.grantEncryptDecrypt(
      new iam.ServicePrincipal('logs.amazonaws.com')
    );

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

    // Note: GuardDuty is removed as it can only be enabled once per AWS account
    // If you need to enable GuardDuty, do it manually via AWS Console or CLI
    // and ensure it's not included in subsequent deployments

    // Note: Security Hub is removed as it can only be enabled once per AWS account
    // If you need to enable Security Hub, do it manually via AWS Console or CLI
    // and ensure it's not included in subsequent deployments

    // CloudWatch Log Group for application logs
    // Using KMS encryption with proper dependency management
    // Using a much more unique identifier with multiple factors to prevent any conflicts
    const uniqueId = `${props.environmentSuffix}-${this.node.id}-${this.node.addr.substring(0, 8)}-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}-${Date.now()}`;
    const logGroup = new logs.LogGroup(this, 'WebAppLogs', {
      logGroupName: `/aws/webapp/${uniqueId}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
    });

    // Ensure the Log Group depends on the KMS key validator being completed
    logGroup.node.addDependency(kmsKeyValidator);

    // Alternative approach: If KMS encryption fails, you can uncomment this:
    // const logGroupFallback = new logs.LogGroup(this, 'WebAppLogsFallback', {
    //   logGroupName: `/aws/webapp/${props.environmentSuffix}`,
    //   retention: logs.RetentionDays.ONE_MONTH,
    //   // No encryption key - uses default CloudWatch Logs encryption
    // });

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
