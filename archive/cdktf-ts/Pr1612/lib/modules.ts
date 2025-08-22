import { Construct } from 'constructs';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';

import { Instance } from '@cdktf/provider-aws/lib/instance';

import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';

import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface NetworkingModuleProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  instanceType: string;
  keyPairName: string;
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateway: NatGateway;
  public readonly publicInstances: Instance[];
  public readonly privateInstances: Instance[];

  constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
    super(scope, id);

    // Get availability zones for the region
    const availabilityZones = new DataAwsAvailabilityZones(
      this,
      'availability-zones',
      {
        state: 'available',
      }
    );

    // Get the latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux-ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create VPC with DNS support enabled for proper hostname resolution
    this.vpc = new Vpc(this, 'MyApp-VPC-Main', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'MyApp-VPC-Main',
        Environment: 'production',
      },
    });

    // Internet Gateway for public subnet internet access
    const internetGateway = new InternetGateway(this, 'MyApp-IGW-Main', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-IGW-Main',
      },
    });

    // Create public subnets across different AZs for high availability
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `MyApp-Subnet-Public-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs for instances in public subnets
        tags: {
          Name: `MyApp-Subnet-Public-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create private subnets across different AZs for high availability
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `MyApp-Subnet-Private-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: false, // Private subnets should not auto-assign public IPs
        tags: {
          Name: `MyApp-Subnet-Private-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Elastic IP for NAT Gateway (required for NAT Gateway creation)
    const natEip = new Eip(this, 'MyApp-EIP-NAT', {
      domain: 'vpc',
      tags: {
        Name: 'MyApp-EIP-NAT',
      },
    });

    // NAT Gateway in first public subnet for private subnet internet access
    // Placed in public subnet to have internet connectivity
    this.natGateway = new NatGateway(this, 'MyApp-NAT-Main', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: 'MyApp-NAT-Main',
      },
    });

    // Route table for public subnets with internet access
    const publicRouteTable = new RouteTable(this, 'MyApp-RT-Public', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-RT-Public',
      },
    });

    // Route for public subnets to reach internet via Internet Gateway
    new Route(this, 'MyApp-Route-Public-Internet', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `MyApp-RTA-Public-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Route table for private subnets with NAT Gateway access
    const privateRouteTable = new RouteTable(this, 'MyApp-RT-Private', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-RT-Private',
      },
    });

    // Route for private subnets to reach internet via NAT Gateway
    new Route(this, 'MyApp-Route-Private-NAT', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `MyApp-RTA-Private-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Group for public instances (web servers)
    // Allows HTTP/HTTPS inbound from internet, SSH from specific IP ranges
    const publicSecurityGroup = new SecurityGroup(this, 'MyApp-SG-Public', {
      name: 'MyApp-SG-Public',
      description:
        'Security group for public subnet instances - allows web traffic and SSH',
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-SG-Public',
      },
    });

    // Allow HTTP inbound from anywhere (for web servers)
    new SecurityGroupRule(this, 'MyApp-SGR-Public-HTTP-In', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: publicSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    // Allow HTTPS inbound from anywhere (for web servers)
    new SecurityGroupRule(this, 'MyApp-SGR-Public-HTTPS-In', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: publicSecurityGroup.id,
      description: 'Allow HTTPS traffic from internet',
    });

    // Allow SSH inbound from VPC CIDR only (not from internet for security)
    new SecurityGroupRule(this, 'MyApp-SGR-Public-SSH-In', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [props.vpcCidr],
      securityGroupId: publicSecurityGroup.id,
      description: 'Allow SSH from within VPC only',
    });

    // Allow all outbound traffic (instances need to download updates, etc.)
    new SecurityGroupRule(this, 'MyApp-SGR-Public-All-Out', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: publicSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Security Group for private instances (application/database servers)
    // More restrictive - only allows traffic from within VPC
    const privateSecurityGroup = new SecurityGroup(this, 'MyApp-SG-Private', {
      name: 'MyApp-SG-Private',
      description:
        'Security group for private subnet instances - internal traffic only',
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-SG-Private',
      },
    });

    // Allow SSH from public security group (bastion host pattern)
    new SecurityGroupRule(this, 'MyApp-SGR-Private-SSH-In', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      sourceSecurityGroupId: publicSecurityGroup.id,
      securityGroupId: privateSecurityGroup.id,
      description: 'Allow SSH from public instances (bastion pattern)',
    });

    // Allow application traffic from public security group (e.g., web to app tier)
    new SecurityGroupRule(this, 'MyApp-SGR-Private-App-In', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: publicSecurityGroup.id,
      securityGroupId: privateSecurityGroup.id,
      description: 'Allow application traffic from public tier',
    });

    // Allow database traffic within private security group (app to database)
    new SecurityGroupRule(this, 'MyApp-SGR-Private-DB-In', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: privateSecurityGroup.id,
      securityGroupId: privateSecurityGroup.id,
      description: 'Allow MySQL traffic within private tier',
    });

    // Allow all outbound traffic for updates and external API calls
    new SecurityGroupRule(this, 'MyApp-SGR-Private-All-Out', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: privateSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Network ACL for public subnets - additional layer of security
    const publicNetworkAcl = new NetworkAcl(this, 'MyApp-NACL-Public', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-NACL-Public',
      },
    });

    // Public NACL Rules - Allow HTTP/HTTPS inbound
    new NetworkAclRule(this, 'MyApp-NACL-Public-HTTP-In', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 80,
      toPort: 80,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'MyApp-NACL-Public-HTTPS-In', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
    });

    // Allow SSH from VPC CIDR
    new NetworkAclRule(this, 'MyApp-NACL-Public-SSH-In', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 22,
      toPort: 22,
      cidrBlock: props.vpcCidr,
    });

    // Allow ephemeral ports for return traffic (required for outbound connections)
    new NetworkAclRule(this, 'MyApp-NACL-Public-Ephemeral-In', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 130,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
    });

    // Allow all outbound traffic
    new NetworkAclRule(this, 'MyApp-NACL-Public-All-Out', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Associate public subnets with public NACL
    this.publicSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `MyApp-NACL-Assoc-Public-${index + 1}`, {
        networkAclId: publicNetworkAcl.id,
        subnetId: subnet.id,
      });
    });

    // Network ACL for private subnets - more restrictive
    const privateNetworkAcl = new NetworkAcl(this, 'MyApp-NACL-Private', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-NACL-Private',
      },
    });

    // Private NACL Rules - Only allow traffic from within VPC
    new NetworkAclRule(this, 'MyApp-NACL-Private-VPC-In', {
      networkAclId: privateNetworkAcl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: props.vpcCidr,
    });

    // Allow ephemeral ports for return traffic from internet (for NAT Gateway)
    new NetworkAclRule(this, 'MyApp-NACL-Private-Ephemeral-In', {
      networkAclId: privateNetworkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
    });

    // Allow all outbound traffic
    new NetworkAclRule(this, 'MyApp-NACL-Private-All-Out', {
      networkAclId: privateNetworkAcl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Associate private subnets with private NACL
    this.privateSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `MyApp-NACL-Assoc-Private-${index + 1}`, {
        networkAclId: privateNetworkAcl.id,
        subnetId: subnet.id,
      });
    });

    // Create EC2 instances in public subnets
    this.publicInstances = this.publicSubnets.map((subnet, index) => {
      return new Instance(this, `MyApp-Instance-Public-${index + 1}`, {
        ami: amazonLinuxAmi.id,
        instanceType: props.instanceType,
        keyName: props.keyPairName,
        subnetId: subnet.id,
        vpcSecurityGroupIds: [publicSecurityGroup.id],
        associatePublicIpAddress: true,
        userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Public Instance ${index + 1}</h1>" > /var/www/html/index.html`,
        tags: {
          Name: `MyApp-Instance-Public-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create EC2 instances in private subnets
    this.privateInstances = this.privateSubnets.map((subnet, index) => {
      return new Instance(this, `MyApp-Instance-Private-${index + 1}`, {
        ami: amazonLinuxAmi.id,
        instanceType: props.instanceType,
        keyName: props.keyPairName,
        subnetId: subnet.id,
        vpcSecurityGroupIds: [privateSecurityGroup.id],
        associatePublicIpAddress: false, // Private instances should not have public IPs
        userData: `#!/bin/bash
yum update -y
echo "Private Instance ${index + 1} - $(date)" > /tmp/instance-info.txt`,
        tags: {
          Name: `MyApp-Instance-Private-${index + 1}`,
          Type: 'Private',
        },
      });
    });
  }
}
