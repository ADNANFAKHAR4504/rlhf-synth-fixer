import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Tags } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // 1. VPC Configuration (Best Practice: Multi-AZ with Public and Private Subnets)
    // LocalStack Compatibility: NAT Gateway not fully supported, using PRIVATE_ISOLATED subnets
    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      maxAzs: 2, // Spans across 2 Availability Zones for high availability
      natGateways: 0, // LocalStack: NAT Gateway not fully supported in Community Edition
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // LocalStack: Changed from PRIVATE_WITH_EGRESS
        },
      ],
    });

    // 2. IAM Role for EC2 Instances (Least Privilege)
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // Requirement 6: Define an IAM Role and Instance Profile for EC2 instances.
    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // 3. Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Allow HTTP traffic to ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Allow HTTP from ALB and SSH',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );
    // SSH access replaced with AWS Systems Manager Session Manager for security

    // Add SSM permissions to EC2 role for secure access
    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // 4. Auto Scaling Group Configuration
    // LocalStack: Basic ASG supported, using public subnets since NAT not available
    const asg = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      minCapacity: 2,
      maxCapacity: 5,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // LocalStack: Using public subnets (no NAT available)
      },
      // LocalStack: Removed advanced features like health check grace period, update policy
    });

    // 5. Application Load Balancer
    // LocalStack: ALB supported but DNS will show "unknown"
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets('ASGTargets', {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.minutes(1),
        // LocalStack: Using basic health check settings
      },
    });

    // 6. Stack Outputs
    // VPC outputs (fully supported by LocalStack)
    new CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${this.stackName}-VpcCidr`,
    });

    // Subnet outputs (fully supported by LocalStack)
    new CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map((s) => s.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${this.stackName}-PublicSubnetIds`,
    });

    new CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.isolatedSubnets.map((s) => s.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });

    // Security Group outputs (fully supported by LocalStack)
    new CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `${this.stackName}-ALBSecurityGroupId`,
    });

    new CfnOutput(this, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
      exportName: `${this.stackName}-EC2SecurityGroupId`,
    });

    // IAM outputs (fully supported by LocalStack)
    new CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 Instance Role ARN',
      exportName: `${this.stackName}-EC2RoleArn`,
    });

    new CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.instanceProfileArn,
      description: 'EC2 Instance Profile ARN',
      exportName: `${this.stackName}-InstanceProfileArn`,
    });

    // ALB output (LocalStack: DNS may show "unknown" - this is expected)
    new CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Public DNS of the Application Load Balancer',
    });

    new CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'ARN of the Application Load Balancer',
      exportName: `${this.stackName}-LoadBalancerArn`,
    });

    // ASG output
    new CfnOutput(this, 'AutoScalingGroupName', {
      value: asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `${this.stackName}-ASGName`,
    });

    // 7. Tagging
    Tags.of(this).add('Application', 'WebApp');
    Tags.of(this).add('Environment', 'Production');
  }
}
