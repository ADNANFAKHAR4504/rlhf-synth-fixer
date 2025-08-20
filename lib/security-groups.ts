import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion, secondaryRegion } from './config';
import { primaryVpc, secondaryVpc } from './vpc';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

// Primary region security groups
export const primaryAlbSecurityGroup = new aws.ec2.SecurityGroup(
  'primary-alb-sg',
  {
    name: 'primary-alb-security-group',
    description: 'Security group for Application Load Balancer',
    vpcId: primaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP traffic from internet',
      },
    ],
    egress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow traffic to application instances',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary ALB Security Group',
    },
  },
  { provider: primaryProvider }
);

export const primaryAppSecurityGroup = new aws.ec2.SecurityGroup(
  'primary-app-sg',
  {
    name: 'primary-app-security-group',
    description: 'Security group for application instances',
    vpcId: primaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [primaryAlbSecurityGroup.id],
        description: 'Allow traffic from ALB',
      },
    ],
    egress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow MySQL traffic to RDS',
      },
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP outbound for updates',
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS outbound for updates',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary App Security Group',
    },
  },
  { provider: primaryProvider }
);

export const primaryDbSecurityGroup = new aws.ec2.SecurityGroup(
  'primary-db-sg',
  {
    name: 'primary-db-security-group',
    description: 'Security group for RDS database',
    vpcId: primaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [primaryAppSecurityGroup.id],
        description: 'Allow MySQL traffic from application instances',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary DB Security Group',
    },
  },
  { provider: primaryProvider }
);

// Secondary region security group for RDS read replica
export const secondaryDbSecurityGroup = new aws.ec2.SecurityGroup(
  'secondary-db-sg',
  {
    name: 'secondary-db-security-group',
    description: 'Security group for RDS read replica',
    vpcId: secondaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ['10.1.0.0/16'],
        description: 'Allow MySQL traffic within VPC',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Secondary DB Security Group',
    },
  },
  { provider: secondaryProvider }
);
