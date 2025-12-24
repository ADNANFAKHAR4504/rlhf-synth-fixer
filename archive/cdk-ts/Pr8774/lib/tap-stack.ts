import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Environment suffix for naming
    const environmentSuffix = props?.environmentSuffix || 'dev';
    const environment = 'Development';
    const uniqueId = 'trainr70';

    // Create VPC with subnets across different availability zones
    const vpc = new ec2.Vpc(
      this,
      `VPC-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        vpcName: `VPC-${environment}-${uniqueId}-${environmentSuffix}`,
        maxAzs: 2,
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: `PublicSubnet-${environment}-${uniqueId}-${environmentSuffix}`,
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: `PrivateSubnet-${environment}-${uniqueId}-${environmentSuffix}`,
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      }
    );

    // Tag the VPC
    cdk.Tags.of(vpc).add('Environment', environment);

    // Create Security Group for EC2 instance
    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      `SecurityGroup-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for web server',
        securityGroupName: `WebServerSG-${environment}-${uniqueId}-${environmentSuffix}`,
      }
    );

    // Allow HTTP traffic on port 80 from anywhere (adjust CIDR as needed)
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow SSH traffic on port 22 from specific IP range (adjust as needed)
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'), // Adjust this CIDR to your specific IP range
      ec2.Port.tcp(22),
      'Allow SSH traffic from specific IP range'
    );

    // Tag the security group
    cdk.Tags.of(webServerSecurityGroup).add('Environment', environment);

    // Create IAM role for EC2 instance to access S3
    const ec2Role = new iam.Role(
      this,
      `EC2Role-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        roleName: `EC2Role-${environment}-${uniqueId}-${environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // Create S3 bucket with versioning and encryption
    const s3Bucket = new s3.Bucket(
      this,
      `S3Bucket-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        bucketName: `s3bucket-${environment.toLowerCase()}-${uniqueId}-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For development environment
        autoDeleteObjects: true, // Required for DESTROY to work
      }
    );

    // Tag the S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', environment);

    // Grant EC2 role access to S3 bucket
    s3Bucket.grantReadWrite(ec2Role);

    // Create S3 Access Point with ABAC tagging support (conditional for LocalStack)
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');
    let s3AccessPoint: s3.CfnAccessPoint | undefined;

    if (!isLocalStack) {
      s3AccessPoint = new s3.CfnAccessPoint(
        this,
        `S3AccessPoint-${environment}-${uniqueId}-${environmentSuffix}`,
        {
          bucket: s3Bucket.bucketName,
          name: `s3ap-${environment.toLowerCase()}-${uniqueId}-${environmentSuffix}`,
          policy: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: ec2Role.roleArn,
                },
                Action: ['s3:GetObject', 's3:PutObject'],
                Resource: `arn:aws:s3:${this.region}:${this.account}:accesspoint/s3ap-${environment.toLowerCase()}-${uniqueId}-${environmentSuffix}/object/*`,
              },
            ],
          },
        }
      );

      // Tag the S3 Access Point
      cdk.Tags.of(s3AccessPoint).add('Environment', environment);
      cdk.Tags.of(s3AccessPoint).add('AccessLevel', 'ReadWrite');
    }

    // Latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create EC2 instance
    const ec2Instance = new ec2.Instance(
      this,
      `EC2Instance-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        instanceName: `EC2Instance-${environment}-${uniqueId}-${environmentSuffix}`,
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: amazonLinuxAmi,
        securityGroup: webServerSecurityGroup,
        role: ec2Role,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        userData: ec2.UserData.custom(
          [
            '#!/bin/bash',
            'yum update -y',
            'yum install -y httpd',
            'systemctl start httpd',
            'systemctl enable httpd',
            'echo "<h1>Web Server is Running</h1>" > /var/www/html/index.html',
          ].join('\n')
        ),
      }
    );

    // Tag the EC2 instance
    cdk.Tags.of(ec2Instance).add('Environment', environment);

    // Create SNS topic for CloudWatch alarm notifications
    const alarmTopic = new sns.Topic(
      this,
      `AlarmTopic-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        topicName: `AlarmTopic-${environment}-${uniqueId}-${environmentSuffix}`,
      }
    );

    // Tag the SNS topic
    cdk.Tags.of(alarmTopic).add('Environment', environment);

    // Note: Network Firewall is not supported in LocalStack Community Edition
    // It has been removed to ensure LocalStack compatibility

    // Create CloudWatch alarm for CPU utilization
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `CPUAlarm-${environment}-${uniqueId}-${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: ec2Instance.instanceId,
          },
          period: cdk.Duration.minutes(5),
        }),
        threshold: 70,
        evaluationPeriods: 2,
        alarmName: `CPUAlarm-${environment}-${uniqueId}-${environmentSuffix}`,
        alarmDescription: 'Alarm when server CPU exceeds 70%',
      }
    );

    // Add SNS action to alarm
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Stack outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnetIds-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `PrivateSubnetIds-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `EC2InstanceId-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2PublicIp', {
      value: ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
      exportName: `EC2PublicIp-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `S3BucketName-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3AccessPointArn', {
      value: s3AccessPoint ? s3AccessPoint.attrArn : 'unknown',
      description: 'S3 Access Point ARN (not supported in LocalStack)',
      exportName: `S3AccessPointArn-${environment}-${uniqueId}-${environmentSuffix}`,
    });
  }
}
