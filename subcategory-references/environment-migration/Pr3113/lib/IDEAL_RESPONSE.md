Alright, I'll create a complete AWS CDK stack using TypeScript to deploy a secure and highly available three-tier web application architecture. Let's break down the requirements and implement them one by one.

First, let's set up the basic structure of the CDK stack. We'll need to import the necessary AWS CDK libraries and define the stack class.

1. **VPC and Subnet Configuration**:
   - Create a new VPC with CIDR block `192.168.0.0/16`
   - Span two Availability Zones
   - Configure three subnet tiers:
     - Public Subnets
     - Private Application Subnets
     - Private Database Subnets

2. **Load Balancing and Compute**:
   - Deploy an ALB in the public subnets
   - Launch EC2 instances in each private application subnet
   - Install and run a simple web server on the EC2 instances

3. **Network Security and Routing**:
   - Deploy a NAT Gateway in each public subnet
   - No public IPs for EC2 instances in private subnets
   - Configure Security Groups with strict rules

4. **Bastion Host for Management and Testing**:
   - Place a bastion host in a public subnet
   - Create a dedicated security group for the bastion host
   - Allow inbound SSH traffic from a configurable IP

Let's start by writing the CDK stack TypeScript file:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { KeyPair } from 'cdk-ec2-key-pair';
import { Construct } from 'constructs';

export interface MigrationStackProps extends cdk.StackProps {
  // Allow for customization of bastion host source IP
  bastionSourceIp?: string;
}

export class MigrationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MigrationStackProps) {
    super(scope, id, props);

    // Default bastion source IP if not provided
    const bastionSourceIp = props?.bastionSourceIp || '0.0.0.0/0';

    // 1. VPC and Subnet Configuration
    const vpc = new ec2.Vpc(this, 'MigrationVPC', {
      cidr: '192.168.0.0/16',
      maxAzs: 2, // Span 2 AZs
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateApplication',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'PrivateDatabase',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ
    });

    // 2. Security Groups

    // ALB Security Group: Allow inbound HTTP from anywhere
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the internet'
    );

    // Web Tier Security Group: Only allow inbound from ALB
    const webTierSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebTierSecurityGroup',
      {
        vpc,
        description: 'Security group for the Web Tier EC2 instances',
        allowAllOutbound: true,
      }
    );
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // Bastion Host Security Group: Allow SSH from specified IP
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc,
        description: 'Security group for the Bastion Host',
        allowAllOutbound: true,
      }
    );
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(bastionSourceIp),
      ec2.Port.tcp(22),
      'Allow SSH traffic from specified IP'
    );

    // 3. EC2 Instances

    // AMI for EC2 Instances
    const ami = ec2.MachineImage.latestAmazonLinux2({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    const webTierAsg = new autoscaling.AutoScalingGroup(this, 'WebTierASG', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: webTierSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2, // One instance per AZ for high availability
      maxCapacity: 4,
      desiredCapacity: 2,
    });

    webTierAsg.addUserData(
      '#!/bin/bash -xe',
      'sudo yum update -y',
      'sudo amazon-linux-extras install nginx1 -y',
      'sudo cat > /usr/share/nginx/html/index.html <<EOF',
      '<html><head><title>Migration Web App</title></head><body><h1>Welcome to the Migration Web App!</h1><p>This is a simple web server deployed as part of a three-tier architecture.</p></body></html>',
      'EOF',
      'sudo systemctl start nginx',
      'sudo systemctl enable nginx'
    );

    webTierAsg.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // 4. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebTierALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Add listener to ALB
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      open: true,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebTierTargetGroup',
      {
        vpc,
        port: 80,
        targets: [webTierAsg],
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addTargetGroups('DefaultTargetGroup', {
      targetGroups: [targetGroup],
    });

    // 5. Bastion Host
    const key = new KeyPair(this, 'BastionKeyPair', {
      keyPairName: 'bastion-key-pair',
      description: 'Key pair for bastion host',
      storePublicKey: true, // Also store the public key in SSM Parameter Store
    });

    const bastionRole = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    bastionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: ami,
      securityGroup: bastionSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      keyName: key.keyPairName,
      role: bastionRole,
    });

    // 6. Output the ALB DNS name and Bastion Host public IP
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'The ARN of the load balancer',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'BastionInstanceId', {
      value: bastionHost.instanceId,
      description: 'The ID of the bastion host instance',
    });

    new cdk.CfnOutput(this, 'BastionHostIP', {
      value: bastionHost.instancePublicIp,
      description: 'The public IP address of the bastion host',
    });

    new cdk.CfnOutput(this, 'BastionKeyPairName', {
      value: key.keyPairName,
      description: 'The name of the bastion key pair',
    });

    new cdk.CfnOutput(this, 'WebServerAsgName', {
      value: webTierAsg.autoScalingGroupName,
      description: 'The name of the web server auto scaling group',
    });

    new cdk.CfnOutput(this, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'The ARN of the target group',
    });

    new cdk.CfnOutput(this, 'DatabaseSubnetAId', {
      value: vpc.isolatedSubnets[0].subnetId,
      description: 'The ID of the database subnet A',
    });

    new cdk.CfnOutput(this, 'DatabaseSubnetBId', {
      value: vpc.isolatedSubnets[1].subnetId,
      description: 'The ID of the database subnet B',
    });

    new cdk.CfnOutput(this, 'BastionKeySecretName', {
      value: `ec2-ssh-key/${key.keyPairName}/private`,
      description: 'The name of the secret containing the bastion key pair',
    });
  }
}

## Architecture Overview

This CDK stack implements a complete three-tier architecture with:

1. **Networking Layer**:
   - Custom VPC (CIDR: 192.168.0.0/16) spanning 2 Availability Zones
   - Three subnet tiers in each AZ (public, private application, private database)
   - NAT Gateways in each public subnet for high availability

2. **Security Layer**:
   - Dedicated security groups for each component with principle of least privilege
   - ALB security group allows HTTP (port 80) from the internet
   - Web tier security group only allows traffic from the ALB
   - Bastion host security group only allows SSH from a configurable IP address

3. **Compute Layer**:
   - Auto Scaling Group with EC2 instances in private application subnets
   - Simple web server (nginx) installed via user data script using `amazon-linux-extras`
   - Application Load Balancer in public subnets to route traffic to web instances
   - Bastion host in a public subnet for secure administrative access

## Deployment Notes

1. The bastion host's SSH key pair (`bastion-key-pair`) is automatically generated and stored in AWS Systems Manager Parameter Store by the `cdk-ec2-key-pair` construct. You can retrieve the private key from Parameter Store to connect to the bastion host.

2. For production use, replace the `bastionSourceIp` parameter with your specific IP address or CIDR range instead of the default '0.0.0.0/0'.

3. The stack outputs the Load Balancer DNS and Bastion Host IP address for easy access to the application and management infrastructure.