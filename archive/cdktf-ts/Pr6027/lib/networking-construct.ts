import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { EipAssociation } from '@cdktf/provider-aws/lib/eip-association';

interface NetworkingConstructProps {
  environmentSuffix: string;
  region: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly appSubnetIds: string[];
  public readonly dbSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly publicRouteTableId: string;
  public readonly privateRouteTableIds: string[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Availability zones for us-east-1
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC
    const vpc = new Vpc(this, 'VPC', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'IGW', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Create Public Subnets
    const publicSubnets: Subnet[] = [];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `PublicSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
          Tier: 'Public',
        },
      });
      publicSubnets.push(subnet);
    });

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Create Private Subnets - Application Tier
    const appSubnets: Subnet[] = [];
    const appSubnetCidrs = ['10.0.16.0/23', '10.0.18.0/23', '10.0.20.0/23'];

    appSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `AppSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-app-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
          Tier: 'Application',
        },
      });
      appSubnets.push(subnet);
    });

    this.appSubnetIds = appSubnets.map(s => s.id);

    // Create Private Subnets - Database Tier
    const dbSubnets: Subnet[] = [];
    const dbSubnetCidrs = ['10.0.32.0/23', '10.0.34.0/23', '10.0.36.0/23'];

    dbSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `DBSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-db-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
          Tier: 'Database',
        },
      });
      dbSubnets.push(subnet);
    });

    this.dbSubnetIds = dbSubnets.map(s => s.id);
    this.privateSubnetIds = [...this.appSubnetIds, ...this.dbSubnetIds];

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.publicRouteTableId = publicRouteTable.id;

    // Create route to Internet Gateway
    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `PublicRTAssoc${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Get latest Amazon Linux 2023 AMI for NAT instances
    const natAmi = new DataAwsAmi(this, 'NATAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create Security Group for NAT instances
    const natSecurityGroup = new SecurityGroup(this, 'NATSecurityGroup', {
      name: `payment-nat-sg-${environmentSuffix}`,
      description: 'Security group for NAT instances',
      vpcId: vpc.id,
      tags: {
        Name: `payment-nat-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Allow HTTP/HTTPS from private subnets
    new SecurityGroupRule(this, 'NATIngressHTTP', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: natSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'NATIngressHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: natSecurityGroup.id,
    });

    // Allow SSH from specific IP (example: corporate IP)
    new SecurityGroupRule(this, 'NATIngressSSH', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['203.0.113.0/24'], // Replace with actual corporate IP
      securityGroupId: natSecurityGroup.id,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'NATEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: natSecurityGroup.id,
    });

    // Create NAT instances in each public subnet
    const natInstances: Instance[] = [];
    const natInstanceEips: Eip[] = [];

    publicSubnets.forEach((subnet, index) => {
      // Create NAT instance
      const natInstance = new Instance(this, `NATInstance${index + 1}`, {
        ami: natAmi.id,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        sourceDestCheck: false, // Required for NAT functionality
        vpcSecurityGroupIds: [natSecurityGroup.id],
        userData: `#!/bin/bash
# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p

# Configure iptables for NAT
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i eth0 -o eth0 -j ACCEPT

# Save iptables rules
iptables-save > /etc/iptables.rules

# Restore iptables on boot
echo "iptables-restore < /etc/iptables.rules" >> /etc/rc.local
chmod +x /etc/rc.local
`,
        tags: {
          Name: `payment-nat-instance-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      });

      // Allocate Elastic IP
      const eip = new Eip(this, `NATInstanceEIP${index + 1}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      });

      // Associate EIP with NAT instance
      new EipAssociation(this, `NATInstanceEIPAssoc${index + 1}`, {
        instanceId: natInstance.id,
        allocationId: eip.id,
      });

      natInstances.push(natInstance);
      natInstanceEips.push(eip);
    });

    // Create Private Route Tables for each AZ
    const privateRouteTables: RouteTable[] = [];

    natInstances.forEach((natInstance, index) => {
      const routeTable = new RouteTable(this, `PrivateRouteTable${index + 1}`, {
        vpcId: vpc.id,
        tags: {
          Name: `payment-private-rt-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      });

      // Create route to NAT instance
      new Route(this, `PrivateRoute${index + 1}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        networkInterfaceId: natInstance.primaryNetworkInterfaceId,
      });

      privateRouteTables.push(routeTable);

      // Associate app subnet with private route table
      new RouteTableAssociation(this, `AppRTAssoc${index + 1}`, {
        subnetId: appSubnets[index].id,
        routeTableId: routeTable.id,
      });

      // Associate db subnet with private route table
      new RouteTableAssociation(this, `DBRTAssoc${index + 1}`, {
        subnetId: dbSubnets[index].id,
        routeTableId: routeTable.id,
      });
    });

    this.privateRouteTableIds = privateRouteTables.map(rt => rt.id);

    // Create Custom Network ACLs
    const customNacl = new NetworkAcl(this, 'CustomNACL', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-nacl-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Inbound Rules
    // Allow HTTPS (443)
    new NetworkAclRule(this, 'NACLIngressHTTPS', {
      networkAclId: customNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: false,
    });

    // Allow SSH (22) from specific IP
    new NetworkAclRule(this, 'NACLIngressSSH', {
      networkAclId: customNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '203.0.113.0/24', // Replace with actual corporate IP
      fromPort: 22,
      toPort: 22,
      egress: false,
    });

    // Allow Ephemeral Ports (1024-65535)
    new NetworkAclRule(this, 'NACLIngressEphemeral', {
      networkAclId: customNacl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: false,
    });

    // Outbound Rules
    // Allow HTTPS (443)
    new NetworkAclRule(this, 'NACLEgressHTTPS', {
      networkAclId: customNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: true,
    });

    // Allow Ephemeral Ports (1024-65535)
    new NetworkAclRule(this, 'NACLEgressEphemeral', {
      networkAclId: customNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: true,
    });

    // Associate NACL with public subnets
    publicSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `NACLPublicAssoc${index + 1}`, {
        subnetId: subnet.id,
        networkAclId: customNacl.id,
      });
    });

    // Associate NACL with private subnets
    [...appSubnets, ...dbSubnets].forEach((subnet, index) => {
      new NetworkAclAssociation(this, `NACLPrivateAssoc${index + 1}`, {
        subnetId: subnet.id,
        networkAclId: customNacl.id,
      });
    });
  }
}
