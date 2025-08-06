import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

export interface SecurityConfigStackProps extends StackProps {
  approvedSshCidr: string;
  alarmEmail: string;
  testing?: boolean;
}

export class SecurityConfigStack extends Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly ec2Instance: ec2.Instance;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: SecurityConfigStackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' },
    });

    // IAM Role for EC2 (Least Privilege)
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'EC2 role with least privilege',
    });

    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
    );
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
        resources: ['*'],
      })
    );

    // MFA Enforcement - Output Notice
    new CfnOutput(this, 'MFAEnforcementNotice', {
      value:
        'Enable MFA for root and all IAM users with console access. CloudFormation/CDK cannot enforce this directly.',
    });

    // S3 Bucket - Encrypted, Not Public
    this.s3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    // CloudTrail - Multi-Region
    new cloudtrail.Trail(this, 'OrganizationTrail', {
      bucket: this.s3Bucket,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
    });

    // VPC (use dummy for testing, default for deploy)
    const vpc = props.testing
      ? new ec2.Vpc(this, 'TestVpc', { maxAzs: 1 })
      : ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // EC2 Security Group - Restrict SSH
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Restricts SSH access to approved IP range',
      allowAllOutbound: true,
    });
    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.approvedSshCidr),
      ec2.Port.tcp(22),
      'Allow SSH from approved IP range'
    );

    // EC2 Instance
    this.ec2Instance = new ec2.Instance(this, 'SecureEC2Instance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      vpc,
      securityGroup: sshSecurityGroup,
    });

    // SNS Topic for CloudWatch Alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmSNSTopic', {
      displayName: 'Security Alarm Topic',
    });
    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(props.alarmEmail)
    );

    // CloudWatch Alarm - EC2 CPU Utilization
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        InstanceId: this.ec2Instance.instanceId,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'EC2HighCPUAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      alarmDescription: 'Alarm if EC2 instance CPU exceeds 80%',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      actionsEnabled: true,
    });
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Outputs
    new CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
    });
    new CfnOutput(this, 'EC2InstanceId', {
      value: this.ec2Instance.instanceId,
    });
    new CfnOutput(this, 'AlarmSNSTopicArn', {
      value: this.alarmTopic.topicArn,
    });
  }
}