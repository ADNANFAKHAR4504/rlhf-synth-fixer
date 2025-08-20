import * as aws from '@pulumi/aws';
import {
  commonTags,
  primaryRegion,
  primaryVpcCidr,
  secondaryRegion,
  secondaryVpcCidr,
} from './config';

// Primary region VPC
const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

export const primaryVpc = new aws.ec2.Vpc(
  'primary-vpc',
  {
    cidrBlock: primaryVpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: 'Primary VPC',
      Region: primaryRegion,
    },
  },
  { provider: primaryProvider }
);

export const primaryInternetGateway = new aws.ec2.InternetGateway(
  'primary-igw',
  {
    vpcId: primaryVpc.id,
    tags: {
      ...commonTags,
      Name: 'Primary Internet Gateway',
    },
  },
  { provider: primaryProvider }
);

// Primary region subnets
export const primaryPublicSubnet1 = new aws.ec2.Subnet(
  'primary-public-subnet-1',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: `${primaryRegion}a`,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: 'Primary Public Subnet 1',
      Type: 'Public',
    },
  },
  { provider: primaryProvider }
);

export const primaryPublicSubnet2 = new aws.ec2.Subnet(
  'primary-public-subnet-2',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: `${primaryRegion}b`,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: 'Primary Public Subnet 2',
      Type: 'Public',
    },
  },
  { provider: primaryProvider }
);

export const primaryPrivateSubnet1 = new aws.ec2.Subnet(
  'primary-private-subnet-1',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.3.0/24',
    availabilityZone: `${primaryRegion}a`,
    tags: {
      ...commonTags,
      Name: 'Primary Private Subnet 1',
      Type: 'Private',
    },
  },
  { provider: primaryProvider }
);

export const primaryPrivateSubnet2 = new aws.ec2.Subnet(
  'primary-private-subnet-2',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.4.0/24',
    availabilityZone: `${primaryRegion}b`,
    tags: {
      ...commonTags,
      Name: 'Primary Private Subnet 2',
      Type: 'Private',
    },
  },
  { provider: primaryProvider }
);

// Primary region route table
export const primaryPublicRouteTable = new aws.ec2.RouteTable(
  'primary-public-rt',
  {
    vpcId: primaryVpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: primaryInternetGateway.id,
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary Public Route Table',
    },
  },
  { provider: primaryProvider }
);

// Associate public subnets with route table
export const primaryPublicRtAssociation1 = new aws.ec2.RouteTableAssociation(
  'primary-public-rta-1',
  {
    subnetId: primaryPublicSubnet1.id,
    routeTableId: primaryPublicRouteTable.id,
  },
  { provider: primaryProvider }
);

export const primaryPublicRtAssociation2 = new aws.ec2.RouteTableAssociation(
  'primary-public-rta-2',
  {
    subnetId: primaryPublicSubnet2.id,
    routeTableId: primaryPublicRouteTable.id,
  },
  { provider: primaryProvider }
);

// Secondary region VPC
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

export const secondaryVpc = new aws.ec2.Vpc(
  'secondary-vpc',
  {
    cidrBlock: secondaryVpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: 'Secondary VPC',
      Region: secondaryRegion,
    },
  },
  { provider: secondaryProvider }
);

export const secondaryInternetGateway = new aws.ec2.InternetGateway(
  'secondary-igw',
  {
    vpcId: secondaryVpc.id,
    tags: {
      ...commonTags,
      Name: 'Secondary Internet Gateway',
    },
  },
  { provider: secondaryProvider }
);

// Secondary region subnets
export const secondaryPrivateSubnet1 = new aws.ec2.Subnet(
  'secondary-private-subnet-1',
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.1.0/24',
    availabilityZone: `${secondaryRegion}a`,
    tags: {
      ...commonTags,
      Name: 'Secondary Private Subnet 1',
      Type: 'Private',
    },
  },
  { provider: secondaryProvider }
);

export const secondaryPrivateSubnet2 = new aws.ec2.Subnet(
  'secondary-private-subnet-2',
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.2.0/24',
    availabilityZone: `${secondaryRegion}b`,
    tags: {
      ...commonTags,
      Name: 'Secondary Private Subnet 2',
      Type: 'Private',
    },
  },
  { provider: secondaryProvider }
);
