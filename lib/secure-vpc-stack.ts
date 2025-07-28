import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { NetworkAcl, SecurityGroup, Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export class SecureVpcStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    const vpc = new Vpc(this, 'main_vpc', {
      cidr: '10.0.0.0/16',
    });

    // Get availability zones
    const availabilityZones = ['us-west-2a', 'us-west-2b'];

    // Create public subnets
    const publicSubnets = availabilityZones.map(
      (az, i) =>
        new Subnet(this, `public_subnet_${i}`, {
          vpcId: vpc.vpcId,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
        })
    );

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.vpcId,
    });

    // Create Route Table
    const publicRouteTable = new RouteTable(this, 'public_route_table', {
      vpcId: vpc.vpcId,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
    });

    // Associate Route Table with public subnets
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public_rta_${i}`, {
        subnetId: subnet.subnetId,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Network ACL
    const networkAcl = new NetworkAcl(this, 'public_nacl', {
      vpc: vpc,
    });

    // Allow inbound HTTP/HTTPS
    new NetworkAclRule(this, 'allow_inbound_http', {
      networkAclId: networkAcl.networkAclId,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, 'allow_inbound_https', {
      networkAclId: networkAcl.networkAclId,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    // Deny all other inbound traffic
    new NetworkAclRule(this, 'deny_all_inbound', {
      networkAclId: networkAcl.networkAclId,
      ruleNumber: 32767,
      protocol: '-1',
      ruleAction: 'deny',
      egress: false,
      cidrBlock: '0.0.0.0/0',
    });

    // Create Security Group
    const securityGroup = new SecurityGroup(this, 'web_sg', {
      vpc: vpc,
    });

    // Allow inbound HTTP/HTTPS traffic in Security Group
    new SecurityGroupRule(this, 'allow_http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: securityGroup.securityGroupId,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'allow_https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      securityGroupId: securityGroup.securityGroupId,
      cidrBlocks: ['0.0.0.0/0'],
    });

    // allow all outbound traffic in Security Group
    new SecurityGroupRule(this, 'allow_all_outbound', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: securityGroup.securityGroupId,
      cidrBlocks: ['0.0.0.0/0'],
    });

    // Output the VPC ID and Subnet IDs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: publicSubnets.map(subnet => subnet.subnetId),
      description: 'The IDs of the public subnets',
    });
  }
}
