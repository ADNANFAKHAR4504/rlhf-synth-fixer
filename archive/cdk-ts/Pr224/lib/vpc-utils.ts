// lib/vpc-utils.ts
import {
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));
  const vpc = result.Vpcs?.find(v => v.CidrBlock === cidr);
  console.log(`VPC found by CIDR ${cidr}: ${vpc?.VpcId}`);
  if (!vpc?.VpcId) {
    return undefined;
  }

  // Validate that this VPC has the required subnet configuration
  const hasValidSubnets = await validateVpcSubnetConfiguration(vpc.VpcId);
  return hasValidSubnets ? vpc.VpcId : undefined;
}

export async function findVpcById(vpcId: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(
    new DescribeVpcsCommand({
      VpcIds: [vpcId],
    })
  );
  const vpc = result.Vpcs?.find(v => v.VpcId === vpcId);

  if (!vpc?.VpcId) {
    return undefined;
  }

  // Validate that this VPC has the required subnet configuration
  const hasValidSubnets = await validateVpcSubnetConfiguration(vpc.VpcId);
  return hasValidSubnets ? vpc.VpcId : undefined;
}

// Specific function for the target VPC ID
export async function findTargetVpc(): Promise<string | undefined> {
  return findVpcById('vpc-0ea3cebfe865ee72f');
}

// Function to validate VPC has exactly 2 private and 1 public subnet
export async function validateVpcSubnetConfiguration(
  vpcId: string
): Promise<boolean> {
  const subnetConfig = await getSubnetConfiguration(vpcId);

  const hasValidConfiguration =
    subnetConfig.privateSubnets.length >= 2 &&
    subnetConfig.publicSubnets.length >= 1;

  if (!hasValidConfiguration) {
    console.log(
      `VPC ${vpcId} does not have the required subnet configuration:`
    );
    console.log(
      `  - Private subnets: ${subnetConfig.privateSubnets.length} (required: 2)`
    );
    console.log(
      `  - Public subnets: ${subnetConfig.publicSubnets.length} (required: 1)`
    );
  }

  return hasValidConfiguration;
}

// Interface for subnet information
export interface SubnetInfo {
  subnetId: string;
  cidrBlock: string;
  availabilityZone: string;
  isPublic: boolean;
}

// Function to get all subnets for a VPC
export async function getVpcSubnets(vpcId: string): Promise<SubnetInfo[]> {
  if (!vpcId || !vpcId.startsWith('vpc-')) {
    throw new Error(`Invalid VPC ID: ${vpcId}`);
  }

  const client = new EC2Client({ region: 'us-east-1' });

  const result = await client.send(
    new DescribeSubnetsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    })
  );

  if (!result.Subnets) {
    return [];
  }

  return result.Subnets.map(subnet => ({
    subnetId: subnet.SubnetId!,
    cidrBlock: subnet.CidrBlock!,
    availabilityZone: subnet.AvailabilityZone!,
    isPublic: subnet.MapPublicIpOnLaunch || false,
  }));
}

// Function to check if a subnet has a route to Internet Gateway
async function hasInternetGatewayRoute(
  subnetId: string,
  vpcId: string
): Promise<boolean> {
  if (!vpcId || !vpcId.startsWith('vpc-')) {
    throw new Error(`Invalid VPC ID: ${vpcId}`);
  }
  if (!subnetId || !subnetId.startsWith('subnet-')) {
    throw new Error(`Invalid Subnet ID: ${subnetId}`);
  }

  const client = new EC2Client({ region: 'us-east-1' });

  try {
    const result = await client.send(
      new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [subnetId],
          },
        ],
      })
    );

    // If no explicit route table association, check the main route table
    if (!result.RouteTables || result.RouteTables.length === 0) {
      const mainRouteTableResult = await client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'association.main',
              Values: ['true'],
            },
          ],
        })
      );

      if (
        mainRouteTableResult.RouteTables &&
        mainRouteTableResult.RouteTables.length > 0
      ) {
        const routes = mainRouteTableResult.RouteTables[0].Routes || [];
        return routes.some(
          route => route.GatewayId && route.GatewayId.startsWith('igw-')
        );
      }
    }

    // Check explicit route table associations
    for (const routeTable of result.RouteTables || []) {
      const routes = routeTable.Routes || [];
      if (
        routes.some(
          route => route.GatewayId && route.GatewayId.startsWith('igw-')
        )
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error checking IGW route for subnet ${subnetId}:`, error);
    return false;
  }
}

// Function to get private subnets (subnets without IGW route)
export async function getPrivateSubnets(vpcId: string): Promise<SubnetInfo[]> {
  const allSubnets = await getVpcSubnets(vpcId);
  const privateSubnets: SubnetInfo[] = [];

  for (const subnet of allSubnets) {
    const hasIGW = await hasInternetGatewayRoute(subnet.subnetId, vpcId);
    if (!hasIGW) {
      privateSubnets.push({
        ...subnet,
        isPublic: false,
      });
    }
  }

  console.log(`Private subnets found: ${privateSubnets.length}`);
  return privateSubnets;
}

// Function to get public subnets (subnets with IGW route)
export async function getPublicSubnets(vpcId: string): Promise<SubnetInfo[]> {
  const allSubnets = await getVpcSubnets(vpcId);
  const publicSubnets: SubnetInfo[] = [];

  for (const subnet of allSubnets) {
    const hasIGW = await hasInternetGatewayRoute(subnet.subnetId, vpcId);
    if (hasIGW) {
      publicSubnets.push({
        ...subnet,
        isPublic: true,
      });
    }
  }

  console.log(`Public subnets found: ${publicSubnets.length}`);
  return publicSubnets;
}

// Function to get subnet configuration (2 private + 1 public)
export async function getSubnetConfiguration(vpcId: string): Promise<{
  privateSubnets: SubnetInfo[];
  publicSubnets: SubnetInfo[];
}> {
  const privateSubnets = await getPrivateSubnets(vpcId);
  const publicSubnets = await getPublicSubnets(vpcId);

  return {
    privateSubnets: privateSubnets.slice(0, 2), // Take first 2 private subnets
    publicSubnets: publicSubnets.slice(0, 1), // Take first 1 public subnet
  };
}
