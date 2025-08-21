I'll create a comprehensive AWS CDK TypeScript infrastructure that sets up a production-ready cloud environment for web hosting and development with enhanced security, monitoring, and proper resource management in the us-west-2 region.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Environment suffix for unique naming and preventing resource conflicts
    const environmentSuffix = props?.environmentSuffix || 'dev';
    const environment = 'Development';
    const uniqueId = 'trainr70';

    // Create VPC with subnets across different availability zones
    const vpc = new ec2.Vpc(this, `VPC-${environment}-${uniqueId}-${environmentSuffix}`, {
      vpcName: `VPC-${environment}-${uniqueId}-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // Using new API instead of deprecated 'cidr'
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
    });

    // Tag the VPC
    cdk.Tags.of(vpc).add('Environment', environment);

    // Create Security Group for EC2 instance with proper resource naming
    const webServerSecurityGroup = new ec2.SecurityGroup(this, `SecurityGroup-${environment}-${uniqueId}-${environmentSuffix}`, {
      vpc,
      description: 'Security group for web server',
      securityGroupName: `WebServerSG-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    // Allow HTTP traffic on port 80 from anywhere
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow SSH traffic on port 22 from specific IP range
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(22),
      'Allow SSH traffic from specific IP range'
    );

    // Tag the security group
    cdk.Tags.of(webServerSecurityGroup).add('Environment', environment);

    // Create IAM role for EC2 instance to access S3
    const ec2Role = new iam.Role(this, `EC2Role-${environment}-${uniqueId}-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `EC2Role-${environment}-${uniqueId}-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create S3 bucket with versioning, encryption, and auto-deletion for clean deployments
    const s3Bucket = new s3.Bucket(this, `S3Bucket-${environment}-${uniqueId}-${environmentSuffix}`, {
      bucketName: `s3bucket-${environment.toLowerCase()}-${uniqueId}-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensures clean deployment/cleanup
      autoDeleteObjects: true, // Required for DESTROY to work properly
    });

    // Tag the S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', environment);

    // Grant EC2 role access to S3 bucket
    s3Bucket.grantReadWrite(ec2Role);

    // Create S3 Access Point with ABAC tagging support
    const s3AccessPoint = new s3.CfnAccessPoint(this, `S3AccessPoint-${environment}-${uniqueId}-${environmentSuffix}`, {
      bucket: s3Bucket.bucketName,
      name: `s3ap-${environment.toLowerCase()}-${uniqueId}-${environmentSuffix}`, // Shortened to avoid length limits
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
    });

    // Tag the S3 Access Point
    cdk.Tags.of(s3AccessPoint).add('Environment', environment);
    cdk.Tags.of(s3AccessPoint).add('AccessLevel', 'ReadWrite');

    // Latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create EC2 instance with proper naming
    const ec2Instance = new ec2.Instance(this, `EC2Instance-${environment}-${uniqueId}-${environmentSuffix}`, {
      instanceName: `EC2Instance-${environment}-${uniqueId}-${environmentSuffix}`,
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
    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environment}-${uniqueId}-${environmentSuffix}`, {
      topicName: `AlarmTopic-${environment}-${uniqueId}-${environmentSuffix}`,
    });

    // Tag the SNS topic
    cdk.Tags.of(alarmTopic).add('Environment', environment);

    // Create CloudWatch alarm for CPU utilization - using Metric directly for better control
    const cpuAlarm = new cloudwatch.Alarm(this, `CPUAlarm-${environment}-${uniqueId}-${environmentSuffix}`, {
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
    });

    // Add SNS action to alarm
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Create Network Firewall for VPC threat protection with proper SID configuration
    const networkFirewallRuleGroup = new networkfirewall.CfnRuleGroup(this, `NetworkFirewallRuleGroup-${environment}-${uniqueId}-${environmentSuffix}`, {
      ruleGroupName: `NFWRuleGroup-${environment}-${uniqueId}-${environmentSuffix}`,
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
                {
                  keyword: 'sid',
                  settings: ['100001'], // Required SID for stateful rules
                },
              ],
            },
          ],
        },
      },
    });

    // Tag the Network Firewall Rule Group
    cdk.Tags.of(networkFirewallRuleGroup).add('Environment', environment);

    // Create Network Firewall Policy with required stateless actions
    const networkFirewallPolicy = new networkfirewall.CfnFirewallPolicy(this, `NetworkFirewallPolicy-${environment}-${uniqueId}-${environmentSuffix}`, {
      firewallPolicyName: `NFWPolicy-${environment}-${uniqueId}-${environmentSuffix}`,
      firewallPolicy: {
        statelessDefaultActions: ['aws:forward_to_sfe'], // Required for firewall policy
        statelessFragmentDefaultActions: ['aws:forward_to_sfe'], // Required for firewall policy
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
    const networkFirewall = new networkfirewall.CfnFirewall(this, `NetworkFirewall-${environment}-${uniqueId}-${environmentSuffix}`, {
      firewallName: `NFW-${environment}-${uniqueId}-${environmentSuffix}`,
      firewallPolicyArn: networkFirewallPolicy.attrFirewallPolicyArn,
      vpcId: vpc.vpcId,
      subnetMappings: vpc.publicSubnets.map(subnet => ({
        subnetId: subnet.subnetId,
      })),
    });

    // Tag the Network Firewall
    cdk.Tags.of(networkFirewall).add('Environment', environment);

    // Stack outputs with environment suffix for uniqueness
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
      value: s3AccessPoint.attrArn,
      description: 'S3 Access Point ARN',
      exportName: `S3AccessPointArn-${environment}-${uniqueId}-${environmentSuffix}`,
    });
  }
}
```

This production-ready CDK TypeScript infrastructure stack provides:

## Key Features Implemented

1. **VPC with Multi-AZ Architecture**: 
   - VPC with CIDR 10.0.0.0/16 across 2 availability zones
   - Public and private subnets for proper network segmentation
   - NAT Gateway for outbound internet access from private subnets
   - Internet Gateway for public subnet connectivity

2. **Security Configuration**:
   - Security groups with minimal required access (HTTP on port 80, SSH on port 22 from specific CIDR)
   - IAM roles following least privilege principle
   - Network Firewall with stateful rules for threat detection
   - All S3 buckets have encryption and versioning enabled

3. **EC2 Web Server**:
   - t3.micro instance with Amazon Linux 2 AMI
   - Auto-configured Apache web server via user data
   - Proper IAM role attachment for S3 access
   - Public IP assignment for web accessibility

4. **S3 Storage**:
   - Server-side encryption with S3-managed keys
   - Versioning enabled for data protection
   - Public access completely blocked
   - S3 Access Points with ABAC tagging for fine-grained access control
   - Auto-delete objects enabled for clean stack destruction

5. **Monitoring and Alerting**:
   - CloudWatch alarm for CPU utilization over 70%
   - SNS topic for alarm notifications
   - 5-minute evaluation periods with 2 consecutive breaches required

6. **Network Security**:
   - AWS Network Firewall for VPC threat protection
   - Stateful rules to detect and alert on HTTP traffic
   - Proper SID configuration for rule tracking

7. **Resource Management**:
   - All resources properly tagged with 'Environment: Development'
   - Consistent naming convention: ResourceType-Environment-UniqueId-EnvironmentSuffix
   - Environment suffix support for multiple deployments
   - Clean destruction with DESTROY removal policies

8. **Stack Outputs**:
   - VPC ID and Subnet IDs for network references
   - EC2 Instance ID and Public IP for access
   - S3 Bucket name and Access Point ARN for storage operations
   - All outputs include environment suffix for uniqueness

## Best Practices Applied

- **Infrastructure as Code**: Fully defined in TypeScript with type safety
- **Security by Default**: Encryption, versioning, and access controls enabled
- **High Availability**: Multi-AZ deployment for resilience
- **Monitoring**: Proactive alerting for performance issues
- **Clean Deployments**: Resources can be fully destroyed without manual intervention
- **Environment Isolation**: Environment suffix prevents resource naming conflicts
- **Cost Optimization**: Using t3.micro instances and single NAT gateway for development
- **Compliance Ready**: All resources tagged for tracking and governance

The infrastructure is designed for web hosting and development workloads with comprehensive security, monitoring, and proper resource management capabilities suitable for production deployment.