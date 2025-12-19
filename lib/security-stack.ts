import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly bastionHosts: ec2.Instance[];

  constructor(scope: Construct, id: string, _props: SecurityStackProps) {
    super(scope, id);

    // Create VPC with public and private subnets across 2 AZs
    // For LocalStack: NAT gateways have issues with EIP allocation
    // Using natGateways: 0 means private subnets won't have internet access via NAT
    // but they can still communicate within VPC and with VPC endpoints
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: false, // Disable custom resource for LocalStack
      natGateways: 0, // No NAT gateways for LocalStack compatibility
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Apply removal policy for LocalStack
    this.vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create VPC Endpoints for Systems Manager (Session Manager)
    // Note: VPC Endpoints have limited support in LocalStack Community Edition
    // These are created but may not be fully functional
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    let ssmVpcEndpoint: ec2.InterfaceVpcEndpoint | undefined;
    let vpcEndpointSecurityGroup: ec2.SecurityGroup | undefined;

    // Only create VPC endpoints if not in LocalStack, or create them with awareness
    if (!isLocalStack) {
      ssmVpcEndpoint = this.vpc.addInterfaceEndpoint('SSMEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        privateDnsEnabled: true,
      });

      this.vpc.addInterfaceEndpoint('SSMMessagesEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
        privateDnsEnabled: true,
      });

      this.vpc.addInterfaceEndpoint('EC2MessagesEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
        privateDnsEnabled: true,
      });

      // Shared security group for VPC endpoints (new feature)
      vpcEndpointSecurityGroup = new ec2.SecurityGroup(
        this,
        'VPCEndpointSecurityGroup',
        {
          vpc: this.vpc,
          description: 'Shared security group for VPC endpoints',
          allowAllOutbound: false,
        }
      );
      vpcEndpointSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

      // Allow HTTPS traffic from VPC CIDR to VPC endpoints
      vpcEndpointSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
        ec2.Port.tcp(443),
        'Allow HTTPS from VPC'
      );

      // Associate shared security group with VPC endpoints
      if (ssmVpcEndpoint) {
        ssmVpcEndpoint.addToPolicy(
          new iam.PolicyStatement({
            principals: [new iam.ArnPrincipal('*')],
            actions: ['ssm:*'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:PrincipalVpc': this.vpc.vpcId,
              },
            },
          })
        );
      }
    }

    // Security group for bastion hosts - restrictive access
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for bastion hosts',
        allowAllOutbound: false,
      }
    );
    bastionSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Allow SSH access from specific IP ranges only (replace with actual IPs)
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with actual allowed IP range
      ec2.Port.tcp(22),
      'SSH access from specific IPs only'
    );

    // Allow outbound HTTPS for updates and SSM
    bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for updates and SSM'
    );

    // Allow outbound HTTP for package updates
    bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound for package updates'
    );

    // Internal security group for private resources
    const internalSecurityGroup = new ec2.SecurityGroup(
      this,
      'InternalSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for internal communication',
        allowAllOutbound: false,
      }
    );
    internalSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Allow communication from bastion hosts to internal resources
    internalSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(22),
      'SSH access from bastion hosts'
    );

    // Allow internal communication within the security group
    internalSecurityGroup.addIngressRule(
      internalSecurityGroup,
      ec2.Port.allTcp(),
      'Internal communication within security group'
    );

    // Allow outbound to VPC endpoints (only if VPC endpoints exist)
    if (vpcEndpointSecurityGroup) {
      internalSecurityGroup.addEgressRule(
        vpcEndpointSecurityGroup,
        ec2.Port.tcp(443),
        'Access to VPC endpoints'
      );
    }

    // IAM role for private instances with Systems Manager access
    const privateInstanceRole = new iam.Role(this, 'PrivateInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });
    privateInstanceRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // IAM role for bastion hosts with SSM permissions
    const bastionRole = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });
    bastionRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Add SSM permissions to bastion role
    bastionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:UpdateInstanceInformation',
          'ssm:SendCommand',
          'ssmmessages:CreateControlChannel',
          'ssmmessages:CreateDataChannel',
          'ssmmessages:OpenControlChannel',
          'ssmmessages:OpenDataChannel',
          'ec2messages:GetEndpoint',
          'ec2messages:GetMessages',
          'ec2messages:SendReply',
        ],
        resources: ['*'],
      })
    );

    // Create bastion hosts in public subnets using standard EC2 instances
    // This avoids custom resources that require Lambda deployment
    this.bastionHosts = [];
    const publicSubnets = this.vpc.publicSubnets;

    publicSubnets.forEach((subnet, index) => {
      // For LocalStack: Use Amazon Linux 2023 which is better supported
      // For production: Use latest Amazon Linux 2
      const machineImage = isLocalStack
        ? ec2.MachineImage.latestAmazonLinux2023()
        : ec2.MachineImage.latestAmazonLinux2();

      const bastionHost = new ec2.Instance(this, `BastionHost${index + 1}`, {
        vpc: this.vpc,
        vpcSubnets: {
          subnets: [subnet],
        },
        securityGroup: bastionSecurityGroup,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.NANO
        ),
        machineImage,
        role: bastionRole,
      });

      // Apply removal policy for LocalStack
      bastionHost.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

      this.bastionHosts.push(bastionHost);

      // Add tags to bastion host
      cdk.Tags.of(bastionHost).add('Environment', 'Production');
      cdk.Tags.of(bastionHost).add('Name', `BastionHost-AZ${index + 1}`);
    });

    // Add tags to all resources
    cdk.Tags.of(this.vpc).add('Environment', 'Production');
    cdk.Tags.of(bastionSecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(internalSecurityGroup).add('Environment', 'Production');
    if (vpcEndpointSecurityGroup) {
      cdk.Tags.of(vpcEndpointSecurityGroup).add('Environment', 'Production');
    }
    cdk.Tags.of(privateInstanceRole).add('Environment', 'Production');

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'BastionSecurityGroupId', {
      value: bastionSecurityGroup.securityGroupId,
      description: 'Bastion Host Security Group ID',
    });

    new cdk.CfnOutput(this, 'InternalSecurityGroupId', {
      value: internalSecurityGroup.securityGroupId,
      description: 'Internal Resources Security Group ID',
    });

    // Add bastion host outputs
    this.bastionHosts.forEach((bastionHost, index) => {
      new cdk.CfnOutput(this, `BastionHost${index + 1}InstanceId`, {
        value: bastionHost.instanceId,
        description: `Bastion Host ${index + 1} Instance ID`,
      });

      new cdk.CfnOutput(this, `BastionHost${index + 1}BastionHostId`, {
        value: bastionHost.instanceId,
        description: `Bastion Host ${index + 1} ID (for compatibility)`,
      });
    });
  }
}
