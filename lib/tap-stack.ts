// lib/tap-stack.ts

import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn, App } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Route } from '@cdktf/provider-aws/lib/route';

/**
 * Interface for stack properties to make it configurable and testable.
 */
export interface TapStackProps {
  /** The AWS region to deploy to. */
  awsRegion?: string;
  /** The CIDR block for the VPC. */
  vpcCidr?: string;
  /** Common tags to apply to all resources. */
  tags?: { [key: string]: string };
  /** A list of CIDR blocks to allow for ingress traffic (e.g., HTTP, SSH). */
  allowedIngressCidrBlocks?: string[];
}

/**
 * TapStack is a comprehensive CDKTF stack that provisions a complete AWS
 * infrastructure, including networking, security, IAM, storage, and compute.
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id);

    // Apply default values if not provided.
    const awsRegion = props.awsRegion || 'us-east-1';
    const vpcCidr = props.vpcCidr || '10.0.0.0/16';
    const tags = {
      Project: 'MyProject',
      Environment: 'Dev',
      Owner: 'Akshat Jain',
      ...props.tags,
    };
    const allowedIngressCidrBlocks = props.allowedIngressCidrBlocks || [
      '0.0.0.0/0',
    ];

    // 1. Provider and Data Sources
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [{ tags }],
    });

    const azs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // 2. Networking
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      tags: { Name: `${id}-vpc`, ...tags }, // Explicitly apply tags
    });

    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: `${id}-igw`, ...tags },
    });

    const publicSubnetIds: string[] = [];
    const privateSubnetIds: string[] = [];

    // Create subnets and their route tables
    for (let i = 0; i < 3; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, i),
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: { Name: `${id}-public-subnet-${i}`, ...tags },
      });
      publicSubnetIds.push(publicSubnet.id);

      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, i + 10),
        availabilityZone: Fn.element(azs.names, i),
        tags: { Name: `${id}-private-subnet-${i}`, ...tags },
      });
      privateSubnetIds.push(privateSubnet.id);

      const publicRouteTable = new RouteTable(this, `public-rt-${i}`, {
        vpcId: vpc.id,
        tags: { Name: `${id}-public-rt-${i}`, ...tags },
      });

      // Corrected: Use destination_cidr_block
      new Route(this, `public-route-${i}`, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      });

      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });
    }

    const natEip = new Eip(this, 'nat-eip', {
      tags: { Name: `${id}-nat-eip`, ...tags },
    });

    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnetIds[0],
      tags: { Name: `${id}-nat-gateway`, ...tags },
    });

    // Private route tables depend on the NAT Gateway
    for (let i = 0; i < 3; i++) {
      const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
        vpcId: vpc.id,
        tags: { Name: `${id}-private-rt-${i}`, ...tags },
      });

      // Corrected: Use destination_cidr_block
      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: privateSubnetIds[i],
        routeTableId: privateRouteTable.id,
      });
    }

    // 3. Security
    const securityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${id}-web-sg`,
      vpcId: vpc.id,
      tags: { Name: `${id}-web-sg`, ...tags },
      ingress: [], // Rules will be added dynamically
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    new SecurityGroupRule(this, 'http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: allowedIngressCidrBlocks,
      securityGroupId: securityGroup.id,
    });

    new SecurityGroupRule(this, 'ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: allowedIngressCidrBlocks,
      securityGroupId: securityGroup.id,
    });

    // 4. IAM
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `${id}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
      tags: { Name: `${id}-ec2-role`, ...tags },
    });

    const s3Policy = new IamPolicy(this, 's3-policy', {
      name: `${id}-s3-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: [
              `arn:aws:s3:::my-tap-bucket-*`,
              `arn:aws:s3:::my-tap-bucket-*/*`,
            ],
          },
        ],
      }),
      tags: { Name: `${id}-s3-policy`, ...tags },
    });

    new IamRolePolicyAttachment(this, 's3-policy-attachment', {
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${id}-ec2-instance-profile`,
        role: ec2Role.name,
        tags: { Name: `${id}-ec2-instance-profile`, ...tags },
      }
    );

    // 5. Storage
    const s3Bucket = new S3Bucket(this, 'data-bucket', {
      bucket: `my-tap-bucket-${tags.Environment.toLowerCase()}-${id}`,
      tags: { Name: `${id}-data-bucket`, ...tags },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
          },
        },
      ],
    });

    // 6. Compute
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${id}-launch-template`,
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: { name: instanceProfile.name },
      tags: { Name: `${id}-launch-template`, ...tags },
    });

    new AutoscalingGroup(this, 'web-asg', {
      name: `${id}-web-asg`,
      launchTemplate: {
        id: launchTemplate.id,
        version: `${launchTemplate.latestVersion}`,
      },
      vpcZoneIdentifier: privateSubnetIds,
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      // Corrected: use the `tag` property with an array of objects
      tag: [
        {
          key: 'Name',
          value: `${id}-web-instance`,
          propagateAtLaunch: true,
        },
      ],
    });

    // 7. Monitoring
    new CloudwatchLogGroup(this, 'log-group', {
      name: `/${id}/web-server`,
      retentionInDays: 7,
      tags: { Name: `${id}-log-group`, ...tags },
    });
  }
}
