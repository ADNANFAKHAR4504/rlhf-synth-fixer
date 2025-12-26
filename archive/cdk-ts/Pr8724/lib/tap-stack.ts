import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Project name for naming convention: project-stage-resource
    const projectName = 'tap';

    // Create a new VPC for LocalStack compatibility
    // LocalStack: NAT Gateway and restrictDefaultSecurityGroup not fully supported
    const vpc = new ec2.Vpc(this, `${projectName}-${environmentSuffix}-vpc`, {
      vpcName: `${projectName}-${environmentSuffix}-vpc`,
      maxAzs: 2,
      natGateways: 0, // LocalStack: NAT Gateway not fully supported
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // LocalStack: Changed from PRIVATE_WITH_EGRESS
        },
      ],
      restrictDefaultSecurityGroup: false, // LocalStack: Custom resource requires Lambda
    });

    // Create KMS key for encryption
    const kmsKey = new kms.Key(
      this,
      `${projectName}-${environmentSuffix}-kms-key`,
      {
        alias: `${projectName}-${environmentSuffix}-key`,
        description: 'KMS key for encrypting EBS volumes and RDS database',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Security Group for Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-${environmentSuffix}-alb-sg`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-${environmentSuffix}-ec2-sg`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(
      this,
      `${projectName}-${environmentSuffix}-ec2-role`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    // Create Instance Profile
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      `${projectName}-${environmentSuffix}-instance-profile`,
      {
        roles: [ec2Role.roleName],
        instanceProfileName: `${projectName}-${environmentSuffix}-instance-profile`,
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${projectName}-${environmentSuffix}-alb`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        loadBalancerName: `${projectName}-${environmentSuffix}-alb`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group (without EC2 instances - LocalStack limitation with Launch Templates)
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${projectName}-${environmentSuffix}-tg`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 3,
          healthyThresholdCount: 2,
        },
        targetGroupName: `${projectName}-${environmentSuffix}-tg`,
      }
    );

    // ALB Listener
    alb.addListener(`${projectName}-${environmentSuffix}-listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Note: CloudWatch Alarms for ALB metrics removed for LocalStack compatibility
    // LocalStack Community Edition has limited ELBv2 support

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${projectName}-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${projectName}-${environmentSuffix}-public-subnet-ids`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.isolatedSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${projectName}-${environmentSuffix}-private-subnet-ids`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `${projectName}-${environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'ARN of the Application Load Balancer',
      exportName: `${projectName}-${environmentSuffix}-alb-arn`,
    });

    new cdk.CfnOutput(this, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'Target Group ARN',
      exportName: `${projectName}-${environmentSuffix}-tg-arn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${projectName}-${environmentSuffix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: kmsKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `${projectName}-${environmentSuffix}-kms-key-arn`,
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 Instance Role ARN',
      exportName: `${projectName}-${environmentSuffix}-ec2-role-arn`,
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.attrArn,
      description: 'EC2 Instance Profile ARN',
      exportName: `${projectName}-${environmentSuffix}-instance-profile-arn`,
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `${projectName}-${environmentSuffix}-alb-sg-id`,
    });

    new cdk.CfnOutput(this, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
      exportName: `${projectName}-${environmentSuffix}-ec2-sg-id`,
    });

    // Tags for all resources (following naming convention)
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
