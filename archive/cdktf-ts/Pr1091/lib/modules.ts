// lib/modules.ts
// Reusable modules for CDKTF (TypeScript). Exports helper classes/functions to create S3 backend bucket,
// a highly-available VPC (public + private subnets across two AZs) and an IAM role limited to the
// S3 state bucket.

import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn, TerraformStack } from 'cdktf';

// ---- Interfaces ----
export interface VpcOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export interface S3StateOutputs {
  bucketName: string;
  bucketArn: string;
}

// ---- S3 State Bucket Module ----
export function createStateBucket(
  stack: TerraformStack,
  id: string,
  opts: { namePrefix: string; region?: string }
): S3StateOutputs {
  const bucketName = `${opts.namePrefix}-tfstate`;

  const bucket = new S3Bucket(stack, `${id}-state-bucket`, {
    bucket: bucketName,
    acl: 'private',
    forceDestroy: false,
    tags: {
      Name: bucketName,
      ManagedBy: 'cdktf',
      Environment: 'shared',
    },
  });

  // Versioning for safe state history
  new S3BucketVersioningA(stack, `${id}-state-bucket-versioning`, {
    bucket: bucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  });

  return { bucketName: bucket.bucket, bucketArn: bucket.arn };
}

// ---- VPC Module ----
export function createHighAvailabilityVpc(
  stack: TerraformStack,
  id: string,
  opts: { cidr?: string; azCount?: number; namePrefix: string }
): VpcOutputs {
  const cidr = opts.cidr ?? '10.217.10.0/23';
  const azCount = opts.azCount ?? 2;

  // discover AZs
  const azs = new DataAwsAvailabilityZones(stack, `${id}-azs`, {
    state: 'available',
  });

  const vpc = new Vpc(stack, `${id}-vpc`, {
    cidrBlock: cidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `${opts.namePrefix}-vpc`,
      ManagedBy: 'cdktf',
    },
  });

  // Internet gateway
  const igw = new InternetGateway(stack, `${id}-igw`, {
    vpcId: vpc.id,
    tags: { Name: `${opts.namePrefix}-igw` },
  });

  // Create one NAT gateway per AZ for high availability
  const natEips: Eip[] = [];
  const natGateways: NatGateway[] = [];

  const publicSubnetIds: string[] = [];
  const privateSubnetIds: string[] = [];

  for (let i = 0; i < azCount; i++) {
    const az = Fn.element(azs.names, i);

    const pubCidr = Fn.cidrsubnet(cidr, 4, i);

    const privCidr = Fn.cidrsubnet(cidr, 4, i + azCount);

    const pubSubnet = new Subnet(stack, `${id}-pub-subnet-${i}`, {
      vpcId: vpc.id,
      cidrBlock: pubCidr,
      availabilityZone: az,
      mapPublicIpOnLaunch: true,
      tags: { Name: `${opts.namePrefix}-public-${i}` },
    });

    const privSubnet = new Subnet(stack, `${id}-priv-subnet-${i}`, {
      vpcId: vpc.id,
      cidrBlock: privCidr,
      availabilityZone: az,
      mapPublicIpOnLaunch: false,
      tags: { Name: `${opts.namePrefix}-private-${i}` },
    });

    publicSubnetIds.push(pubSubnet.id);
    privateSubnetIds.push(privSubnet.id);

    // Allocate EIP for NAT
    const eip = new Eip(stack, `${id}-nat-eip-${i}`, {
      tags: { Name: `${opts.namePrefix}-nat-eip-${i}` },
    });
    natEips.push(eip);

    const nat = new NatGateway(stack, `${id}-nat-${i}`, {
      allocationId: eip.id,
      subnetId: pubSubnet.id,
      tags: { Name: `${opts.namePrefix}-nat-${i}` },
    });
    natGateways.push(nat);

    // Public route table -> IGW
    const pubRt = new RouteTable(stack, `${id}-pub-rt-${i}`, {
      vpcId: vpc.id,
      tags: { Name: `${opts.namePrefix}-pub-rt-${i}` },
    });
    new Route(stack, `${id}-pub-route-igw-${i}`, {
      routeTableId: pubRt.id,
      gatewayId: igw.id,
      destinationCidrBlock: '0.0.0.0/0',
    });
    new RouteTableAssociation(stack, `${id}-pub-rta-${i}`, {
      subnetId: pubSubnet.id,
      routeTableId: pubRt.id,
    });

    // Private route table -> NAT
    const privRt = new RouteTable(stack, `${id}-priv-rt-${i}`, {
      vpcId: vpc.id,
      tags: { Name: `${opts.namePrefix}-priv-rt-${i}` },
    });
    new Route(stack, `${id}-priv-route-nat-${i}`, {
      routeTableId: privRt.id,
      natGatewayId: nat.id,
      destinationCidrBlock: '0.0.0.0/0',
    });
    new RouteTableAssociation(stack, `${id}-priv-rta-${i}`, {
      subnetId: privSubnet.id,
      routeTableId: privRt.id,
    });
  }

  return { vpcId: vpc.id, publicSubnetIds, privateSubnetIds };
}

// ---- IAM Role Module: EC2 role with restricted S3 access to the state bucket ----
export function createEc2S3StateRole(
  stack: TerraformStack,
  id: string,
  opts: { roleNamePrefix: string; bucketArn: string; bucketName: string }
): IamRole {
  const role = new IamRole(stack, `${id}-ec2-role`, {
    name: `${opts.roleNamePrefix}-ec2-s3-state-roles`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: ['ec2.amazonaws.com'] },
          Action: ['sts:AssumeRole'],
        },
      ],
    }),
    tags: { ManagedBy: 'cdktf' },
  });

  // Minimal policy to allow EC2 instances to Get/Put/Delete the terraform state object(s) in the bucket
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowListBucket',
        Effect: 'Allow',
        Action: ['s3:ListBucket'],
        Resource: [opts.bucketArn],
        Condition: {
          StringLike: { 's3:prefix': ['*'] },
        },
      },
      {
        Sid: 'AllowObjectOps',
        Effect: 'Allow',
        Action: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetObjectVersion',
        ],
        Resource: [`${opts.bucketArn}/*`],
      },
    ],
  };

  new IamRolePolicy(stack, `${id}-ec2-role-policy`, {
    name: `${opts.roleNamePrefix}-ec2-s3-state-policy`,
    role: role.name,
    policy: JSON.stringify(policy),
  });

  return role;
}
