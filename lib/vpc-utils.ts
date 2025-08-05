// lib/vpc-utils.ts
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));
  const vpc = result.Vpcs?.find(v => v.CidrBlock === cidr);

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
    subnetConfig.privateSubnets.length === 2 &&
    subnetConfig.publicSubnets.length === 1;

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

// Function to get private subnets (subnets without public IP mapping)
export async function getPrivateSubnets(vpcId: string): Promise<SubnetInfo[]> {
  const allSubnets = await getVpcSubnets(vpcId);
  return allSubnets.filter(subnet => !subnet.isPublic);
}

// Function to get public subnets (subnets with public IP mapping)
export async function getPublicSubnets(vpcId: string): Promise<SubnetInfo[]> {
  const allSubnets = await getVpcSubnets(vpcId);
  return allSubnets.filter(subnet => subnet.isPublic);
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
