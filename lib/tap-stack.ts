import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bastionHost: ec2.Instance;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Detect LocalStack environment - check both env var and context
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566') ||
      this.node.tryGetContext('localstack') === true ||
      this.node.tryGetContext('localstack') === 'true';

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with public and private subnets across 2 AZs
    // CRITICAL: Disable restrictDefaultSecurityGroup for LocalStack to avoid Lambda custom resource
    // CRITICAL: Use PRIVATE_ISOLATED for LocalStack compatibility (no NAT Gateway needed)
    this.vpc = new ec2.Vpc(this, 'SecureVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: isLocalStack
            ? ec2.SubnetType.PRIVATE_ISOLATED
            : ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: isLocalStack ? 0 : 2, // Disable NAT Gateways for LocalStack (Community limitation)
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: false, // Disable for LocalStack - avoids Lambda custom resource
    });

    // Create IAM role for bastion host with least privilege
    const bastionRole = new iam.Role(this, 'BastionHostRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for bastion host with minimal permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Create security group for bastion host with restricted SSH access
    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc: this.vpc,
        description:
          'Security group for bastion host with restricted SSH access',
        allowAllOutbound: true,
      }
    );

    // Add SSH rule with restricted access (replace with specific IP/CIDR)
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Example restricted CIDR - replace with actual allowed IPs
      ec2.Port.tcp(22),
      'SSH access from trusted network only'
    );

    // Create security groups for internal application tiers
    const webTierSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebTierSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for web tier',
        allowAllOutbound: true,
      }
    );

    const appTierSecurityGroup = new ec2.SecurityGroup(
      this,
      'AppTierSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for application tier',
        allowAllOutbound: true,
      }
    );

    const dbTierSecurityGroup = new ec2.SecurityGroup(
      this,
      'DbTierSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for database tier',
        allowAllOutbound: false,
      }
    );

    // Configure security group rules for internal communication
    // Web tier can receive HTTP/HTTPS from internet and SSH from bastion
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access from internet'
    );
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access from internet'
    );
    webTierSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      ec2.Port.tcp(22),
      'SSH access from bastion host'
    );

    // App tier can receive traffic from web tier and SSH from bastion
    appTierSecurityGroup.addIngressRule(
      webTierSecurityGroup,
      ec2.Port.tcp(8080),
      'Application traffic from web tier'
    );
    appTierSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      ec2.Port.tcp(22),
      'SSH access from bastion host'
    );

    // Database tier can receive traffic from app tier only
    dbTierSecurityGroup.addIngressRule(
      appTierSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from application tier'
    );
    dbTierSecurityGroup.addIngressRule(
      appTierSecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from application tier'
    );

    // Create bastion host in public subnet
    this.bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.bastionSecurityGroup,
      role: bastionRole,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [this.vpc.availabilityZones[0]],
      },
      keyName: undefined, // Use SSM Session Manager instead of SSH keys
    });

    // Apply RemovalPolicy.DESTROY for LocalStack cleanup
    if (isLocalStack) {
      this.bastionHost.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Apply Environment:Production tag to all resources
    cdk.Tags.of(this).add('Environment', 'Production');

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `SecureVPC-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BastionInstanceId', {
      value: this.bastionHost.instanceId,
      description: 'Bastion Host Instance ID',
      exportName: `BastionHost-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BastionPublicIp', {
      value: this.bastionHost.instancePublicIp,
      description: 'Bastion Host Public IP',
      exportName: `BastionPublicIp-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnets-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `PrivateSubnets-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebTierSecurityGroupId', {
      value: webTierSecurityGroup.securityGroupId,
      description: 'Web Tier Security Group ID',
      exportName: `WebTierSG-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppTierSecurityGroupId', {
      value: appTierSecurityGroup.securityGroupId,
      description: 'Application Tier Security Group ID',
      exportName: `AppTierSG-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DbTierSecurityGroupId', {
      value: dbTierSecurityGroup.securityGroupId,
      description: 'Database Tier Security Group ID',
      exportName: `DbTierSG-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BastionRoleName', {
      value: bastionRole.roleName,
      description: 'Bastion Host IAM Role Name',
      exportName: `BastionRole-${environmentSuffix}`,
    });
  }
}
