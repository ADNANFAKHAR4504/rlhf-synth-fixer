# AWS CDK TypeScript Stack Implementation

This document contains the complete implementation of the secure VPC stack in AWS CDK TypeScript.

## Secure VPC Stack Implementation

```typescript
// lib/secure-vpc-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecureVpcStackProps extends cdk.StackProps {
  vpcCidr?: string;
  allowedSshCidr?: string;
  existingVpcId?: string;
  companyTags?: { [key: string]: string };
}

export class SecureVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.Subnet[];
  public readonly privateSubnets: ec2.Subnet[];
  public readonly natGateway: ec2.NatGateway;
  public readonly ec2Instances: ec2.Instance[];

  constructor(scope: Construct, id: string, props?: SecureVpcStackProps) {
    super(scope, id, props);

    // Default values
    const vpcCidr = props?.vpcCidr || '10.0.0.0/16';
    const allowedSshCidr = props?.allowedSshCidr || '0.0.0.0/0';
    const companyTags = props?.companyTags || {
      Environment: 'Production',
      Project: 'SecureVPC',
      Owner: 'DevOps',
      CostCenter: 'IT-Infrastructure',
    };

    // Apply tags to all resources in the stack
    Object.entries(companyTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create VPC with DNS support
    this.vpc = new ec2.Vpc(this, 'SecureVPC', {
      cidr: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      natGateways: 1, // Single NAT Gateway for cost optimization
    });

    // Get subnet references
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Get NAT Gateway reference (created automatically by VPC)
    this.natGateway = this.vpc.publicSubnets[0].node.children.find(child =>
      child.node.id.includes('NATGateway')
    ) as ec2.NatGateway;

    // Create Security Group for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    // Allow SSH access from specific CIDR
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'SSH access from allowed CIDR'
    );

    // Allow HTTP traffic
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Create IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add S3 access policy
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          'arn:aws:s3:::company-bucket/*',
          'arn:aws:s3:::company-bucket',
        ],
      })
    );

    // Create Instance Profile
    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Get latest Amazon Linux 2 AMI
    const amzn2Ami = ec2.MachineImage.latestAmazonLinux({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create EC2 instances in public subnets
    this.ec2Instances = [];
    this.publicSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebServer${index + 1}`, {
        vpc: this.vpc,
        vpcSubnets: { subnets: [subnet] },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: amzn2Ami,
        securityGroup: webSecurityGroup,
        role: ec2Role,
        detailedMonitoring: true,
        userData: ec2.UserData.forLinux(),
        keyName: 'my-key-pair', // Replace with your key pair name
      });

      // Create Elastic IP and associate with instance
      const eip = new ec2.CfnEIP(this, `EIP${index + 1}`, {
        domain: 'vpc',
        instanceId: instance.instanceId,
      });

      this.ec2Instances.push(instance);
    });

    // Create SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'CPUAlertTopic', {
      displayName: 'CPU Usage Alerts',
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: '/aws/ec2/secure-vpc',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // Create CloudWatch Alarms for each EC2 instance
    this.ec2Instances.forEach((instance, index) => {
      const alarm = new cloudwatch.Alarm(this, `CPUAlarm${index + 1}`, {
        metric: instance.metricCpuUtilization({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 70,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `CPU utilization alarm for ${instance.instanceId}`,
      });

      alarm.addAlarmAction(
        new cdk.aws_cloudwatch_actions.SnsAction(alertTopic)
      );
    });

    // VPC Peering (conditional)
    if (props?.existingVpcId) {
      const peeringConnection = new ec2.CfnVPCPeeringConnection(
        this,
        'VPCPeering',
        {
          vpcId: this.vpc.vpcId,
          peerVpcId: props.existingVpcId,
        }
      );

      // Add routes for peering connection
      this.vpc.publicSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(this, `PeeringRoutePublic${index}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: '10.1.0.0/16', // Peer VPC CIDR
          vpcPeeringConnectionId: peeringConnection.ref,
        });
      });
    }

    // Store parameters in SSM
    new ssm.StringParameter(this, 'VPCIdParameter', {
      parameterName: '/secure-vpc/vpc-id',
      stringValue: this.vpc.vpcId,
      description: 'VPC ID for secure VPC stack',
    });

    // Outputs (keeping under 10KB limit)
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'SecureVPC-VPCId',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: 'SecureVPC-PublicSubnets',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: 'SecureVPC-PrivateSubnets',
    });

    new cdk.CfnOutput(this, 'NATGatewayId', {
      value:
        this.vpc.publicSubnets[0].node.children.find(child =>
          child.node.id.includes('NATGateway')
        )?.node.id || 'Not Found',
      description: 'NAT Gateway ID',
      exportName: 'SecureVPC-NATGateway',
    });
  }
}
```

## Implementation Notes

This stack provides a complete, secure VPC implementation with:

- High availability across 2 AZs
- Proper security group configurations
- CloudWatch monitoring and alerting
- IAM roles with least privilege access
- Company-standard tagging
- CloudFormation outputs for integration
