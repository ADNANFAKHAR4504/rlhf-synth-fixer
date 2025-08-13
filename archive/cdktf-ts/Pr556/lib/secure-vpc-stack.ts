import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface SecureVpcStackOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export class SecureVpcStack extends Construct {
  public readonly outputs: SecureVpcStackOutputs;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    // VPC
    const mainVpc = new Vpc(this, 'MainVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...commonTags, Name: `${projectName}-${environment}-vpc` },
    });

    // IGW
    const igw = new InternetGateway(this, 'Igw', {
      vpcId: mainVpc.id,
      tags: { ...commonTags, Name: `${projectName}-${environment}-igw` },
    });

    // Availability Zones (dynamic)
    const azs = new DataAwsAvailabilityZones(this, 'availableAzs', {
      state: 'available',
    });
    const selectedAzs = [Fn.element(azs.names, 0), Fn.element(azs.names, 1)];

    // CIDRs
    const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
    const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24'];

    // Public subnets
    const publicSubnets: Subnet[] = publicCidrs.map(
      (cidr, i) =>
        new Subnet(this, `PublicSubnet${i + 1}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: selectedAzs[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-public-subnet-${i + 1}`,
            Type: 'Public',
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // Private subnets
    const privateSubnets: Subnet[] = privateCidrs.map(
      (cidr, i) =>
        new Subnet(this, `PrivateSubnet${i + 1}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: selectedAzs[i],
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-private-subnet-${i + 1}`,
            Type: 'Private',
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // EIPs for NATs
    const eips: Eip[] = publicSubnets.map(
      (_, i) =>
        new Eip(this, `NatEip${i + 1}`, {
          domain: 'vpc', // ✅ correct field
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-nat-eip-${i + 1}`,
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // NAT Gateways
    const natGateways: NatGateway[] = eips.map(
      (eip, i) =>
        new NatGateway(this, `NatGateway${i + 1}`, {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-nat-gateway-${i + 1}`,
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // Public route table + associations
    const publicRouteTable = new RouteTable(this, 'PublicRT', {
      vpcId: mainVpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...commonTags, Name: `${projectName}-${environment}-public-rt` },
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `PublicRTA${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables + associations
    privateSubnets.forEach((subnet, i) => {
      const rt = new RouteTable(this, `PrivateRT${i + 1}`, {
        vpcId: mainVpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateways[i].id }],
        tags: {
          ...commonTags,
          Name: `${projectName}-${environment}-private-rt-${i + 1}`,
        },
      });

      new RouteTableAssociation(this, `PrivateRTA${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: rt.id,
      });
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', { value: mainVpc.id });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: publicSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: privateSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'internet_gateway_id', { value: igw.id });
    new TerraformOutput(this, 'nat_gateway_ids', {
      value: natGateways.map(n => n.id),
    });

    this.outputs = {
      vpcId: mainVpc.id,
      publicSubnetIds: publicSubnets.map(s => s.id),
      privateSubnetIds: privateSubnets.map(s => s.id),
    };
  }
}
