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
