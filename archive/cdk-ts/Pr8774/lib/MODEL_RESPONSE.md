I'll create a comprehensive AWS CDK TypeScript infrastructure that sets up a basic cloud environment for web hosting and development with security and monitoring in the us-west-2 region.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
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

    // Common tags
    const commonTags = {
      Environment: environment,
    };

    // Create VPC with subnets across different availability zones
    const vpc = new ec2.Vpc(this, `VPC-${environment}-${uniqueId}`, {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environment}-${uniqueId}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environment}-${uniqueId}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Tag the VPC
    cdk.Tags.of(vpc).add('Environment', environment);

    // Create Security Group for EC2 instance
    const webServerSecurityGroup = new ec2.SecurityGroup(this, `SecurityGroup-${environment}-${uniqueId}`, {
      vpc,
      description: 'Security group for web server',
      securityGroupName: `WebServerSG-${environment}-${uniqueId}`,
    });

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
    const ec2Role = new iam.Role(this, `EC2Role-${environment}-${uniqueId}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `EC2Role-${environment}-${uniqueId}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create S3 bucket with versioning and encryption
    const s3Bucket = new s3.Bucket(this, `S3Bucket-${environment}-${uniqueId}`, {
      bucketName: `s3bucket-${environment.toLowerCase()}-${uniqueId}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development environment
    });

    // Tag the S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', environment);

    // Grant EC2 role access to S3 bucket
    s3Bucket.grantReadWrite(ec2Role);

    // Create S3 Access Point with ABAC tagging support
    const s3AccessPoint = new s3.CfnAccessPoint(this, `S3AccessPoint-${environment}-${uniqueId}`, {
      bucket: s3Bucket.bucketName,
      name: `s3accesspoint-${environment.toLowerCase()}-${uniqueId}`,
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: ec2Role.roleArn,
            },
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `arn:aws:s3:${this.region}:${this.account}:accesspoint/s3accesspoint-${environment.toLowerCase()}-${uniqueId}/object/*`,
          },
        ],
      },
    });

    // Tag the S3 Access Point
    cdk.Tags.of(s3AccessPoint).add('Environment', environment);
    cdk.Tags.of(s3AccessPoint).add('AccessLevel', 'ReadWrite');

    // Create instance profile for EC2
    const instanceProfile = new iam.CfnInstanceProfile(this, `InstanceProfile-${environment}-${uniqueId}`, {
      roles: [ec2Role.roleName],
      instanceProfileName: `InstanceProfile-${environment}-${uniqueId}`,
    });

    // Latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create EC2 instance
    const ec2Instance = new ec2.Instance(this, `EC2Instance-${environment}-${uniqueId}`, {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amazonLinuxAmi,
      securityGroup: webServerSecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      userData: ec2.UserData.custom([
        '#!/bin/bash',
        'yum update -y',
        'yum install -y httpd',
        'systemctl start httpd',
        'systemctl enable httpd',
        'echo "<h1>Web Server is Running</h1>" > /var/www/html/index.html',
      ].join('\n')),
    });

    // Tag the EC2 instance
    cdk.Tags.of(ec2Instance).add('Environment', environment);

    // Create SNS topic for CloudWatch alarm notifications
    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environment}-${uniqueId}`, {
      topicName: `AlarmTopic-${environment}-${uniqueId}`,
    });

    // Tag the SNS topic
    cdk.Tags.of(alarmTopic).add('Environment', environment);

    // Create CloudWatch alarm for CPU utilization
    const cpuAlarm = new cloudwatch.Alarm(this, `CPUAlarm-${environment}-${uniqueId}`, {
      metric: ec2Instance.metricCpuUtilization({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 70,
      evaluationPeriods: 2,
      alarmName: `CPUAlarm-${environment}-${uniqueId}`,
      alarmDescription: 'Alarm when server CPU exceeds 70%',
    });

    // Add SNS action to alarm
    cpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic));

    // Create Network Firewall for VPC threat protection
    const networkFirewallRuleGroup = new networkfirewall.CfnRuleGroup(this, `NetworkFirewallRuleGroup-${environment}-${uniqueId}`, {
      ruleGroupName: `NetworkFirewallRuleGroup-${environment}-${uniqueId}`,
      type: 'STATEFUL',
      capacity: 100,
      ruleGroup: {
        rulesSource: {
          statefulRules: [
            {
              action: 'ALERT',
              header: {
                protocol: 'HTTP',
                source: 'ANY',
                sourcePort: 'ANY',
                destination: 'ANY',
                destinationPort: '80',
                direction: 'ANY',
              },
              ruleOptions: [
                {
                  keyword: 'msg',
                  settings: ['"HTTP traffic detected"'],
                },
              ],
            },
          ],
        },
      },
    });

    // Tag the Network Firewall Rule Group
    cdk.Tags.of(networkFirewallRuleGroup).add('Environment', environment);

    // Create Network Firewall Policy
    const networkFirewallPolicy = new networkfirewall.CfnFirewallPolicy(this, `NetworkFirewallPolicy-${environment}-${uniqueId}`, {
      firewallPolicyName: `NetworkFirewallPolicy-${environment}-${uniqueId}`,
      firewallPolicy: {
        statefulRuleGroupReferences: [
          {
            resourceArn: networkFirewallRuleGroup.attrRuleGroupArn,
          },
        ],
      },
    });

    // Tag the Network Firewall Policy
    cdk.Tags.of(networkFirewallPolicy).add('Environment', environment);

    // Create Network Firewall
    const networkFirewall = new networkfirewall.CfnFirewall(this, `NetworkFirewall-${environment}-${uniqueId}`, {
      firewallName: `NetworkFirewall-${environment}-${uniqueId}`,
      firewallPolicyArn: networkFirewallPolicy.attrFirewallPolicyArn,
      vpcId: vpc.vpcId,
      subnetMappings: vpc.publicSubnets.map(subnet => ({
        subnetId: subnet.subnetId,
      })),
    });

    // Tag the Network Firewall
    cdk.Tags.of(networkFirewall).add('Environment', environment);

    // Stack outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environment}-${uniqueId}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnetIds-${environment}-${uniqueId}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `PrivateSubnetIds-${environment}-${uniqueId}`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `EC2InstanceId-${environment}-${uniqueId}`,
    });

    new cdk.CfnOutput(this, 'EC2PublicIp', {
      value: ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
      exportName: `EC2PublicIp-${environment}-${uniqueId}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `S3BucketName-${environment}-${uniqueId}`,
    });

    new cdk.CfnOutput(this, 'S3AccessPointArn', {
      value: s3AccessPoint.attrArn,
      description: 'S3 Access Point ARN',
      exportName: `S3AccessPointArn-${environment}-${uniqueId}`,
    });
  }
}
```

This CDK TypeScript infrastructure stack creates:

1. **VPC with Multi-AZ Subnets**: A VPC with public and private subnets across 2 availability zones
2. **Security Groups**: Properly configured to allow HTTP (port 80) and SSH (port 22) from specified IP ranges
3. **EC2 Instance**: t3.micro instance with public IP in public subnet, includes basic web server setup
4. **S3 Bucket**: With versioning and encryption enabled for storage
5. **IAM Roles**: EC2 role with S3 access permissions
6. **CloudWatch Monitoring**: CPU utilization alarm set at 70% threshold with 5-minute intervals
7. **S3 Access Points**: With ABAC tagging support for enhanced access control
8. **Network Firewall**: For VPC threat protection with stateful rules
9. **Resource Tagging**: All resources tagged with 'Environment: Development'
10. **Naming Convention**: Follows ResourceType-Environment-UniqueId pattern
11. **Stack Outputs**: VPC ID, Subnet IDs, and EC2 instance Public IP as required

The infrastructure is designed for web hosting and development workloads with comprehensive security and monitoring capabilities.