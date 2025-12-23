import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface NetworkingConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
}

export class NetworkingConstruct extends Construct {
  public readonly primaryVpcId: string;
  public readonly secondaryVpcId: string;
  public readonly primaryPrivateSubnetIds: string[];
  public readonly secondaryPrivateSubnetIds: string[];
  public readonly primaryDbSecurityGroupId: string;
  public readonly secondaryDbSecurityGroupId: string;
  public readonly primaryLambdaSecurityGroupId: string;
  public readonly secondaryLambdaSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix, primaryProvider, secondaryProvider } = props;

    // Primary Region VPC
    const primaryVpc = new Vpc(this, 'PrimaryVPC', {
      provider: primaryProvider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `dr-vpc-primary-${environmentSuffix}`,
      },
    });

    // Secondary Region VPC
    const secondaryVpc = new Vpc(this, 'SecondaryVPC', {
      provider: secondaryProvider,
      cidrBlock: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `dr-vpc-secondary-${environmentSuffix}`,
      },
    });

    // Primary Region - Internet Gateway
    const primaryIgw = new InternetGateway(this, 'PrimaryIGW', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: {
        Name: `dr-igw-primary-${environmentSuffix}`,
      },
    });

    // Secondary Region - Internet Gateway
    const secondaryIgw = new InternetGateway(this, 'SecondaryIGW', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      tags: {
        Name: `dr-igw-secondary-${environmentSuffix}`,
      },
    });

    // Primary Region - Private Subnets (for Lambda and RDS)
    const primaryPrivateSubnet1 = new Subnet(this, 'PrimaryPrivateSubnet1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: `dr-private-subnet-1-primary-${environmentSuffix}`,
      },
    });

    const primaryPrivateSubnet2 = new Subnet(this, 'PrimaryPrivateSubnet2', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `dr-private-subnet-2-primary-${environmentSuffix}`,
      },
    });

    // Primary Region - Public Subnets (for NAT gateway alternatives or public access)
    const primaryPublicSubnet1 = new Subnet(this, 'PrimaryPublicSubnet1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `dr-public-subnet-1-primary-${environmentSuffix}`,
      },
    });

    // Primary Region - Route Table for Public Subnets
    const primaryPublicRouteTable = new RouteTable(this, 'PrimaryPublicRT', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: {
        Name: `dr-public-rt-primary-${environmentSuffix}`,
      },
    });

    new Route(this, 'PrimaryPublicRoute', {
      provider: primaryProvider,
      routeTableId: primaryPublicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: primaryIgw.id,
    });

    new RouteTableAssociation(this, 'PrimaryPublicRTAssoc', {
      provider: primaryProvider,
      subnetId: primaryPublicSubnet1.id,
      routeTableId: primaryPublicRouteTable.id,
    });

    // Secondary Region - Private Subnets
    const secondaryPrivateSubnet1 = new Subnet(
      this,
      'SecondaryPrivateSubnet1',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.1.0/24',
        availabilityZone: 'us-east-2a',
        tags: {
          Name: `dr-private-subnet-1-secondary-${environmentSuffix}`,
        },
      }
    );

    const secondaryPrivateSubnet2 = new Subnet(
      this,
      'SecondaryPrivateSubnet2',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.2.0/24',
        availabilityZone: 'us-east-2b',
        tags: {
          Name: `dr-private-subnet-2-secondary-${environmentSuffix}`,
        },
      }
    );

    // Secondary Region - Public Subnets
    const secondaryPublicSubnet1 = new Subnet(this, 'SecondaryPublicSubnet1', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      cidrBlock: '10.1.10.0/24',
      availabilityZone: 'us-east-2a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `dr-public-subnet-1-secondary-${environmentSuffix}`,
      },
    });

    // Secondary Region - Route Table for Public Subnets
    const secondaryPublicRouteTable = new RouteTable(
      this,
      'SecondaryPublicRT',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        tags: {
          Name: `dr-public-rt-secondary-${environmentSuffix}`,
        },
      }
    );

    new Route(this, 'SecondaryPublicRoute', {
      provider: secondaryProvider,
      routeTableId: secondaryPublicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: secondaryIgw.id,
    });

    new RouteTableAssociation(this, 'SecondaryPublicRTAssoc', {
      provider: secondaryProvider,
      subnetId: secondaryPublicSubnet1.id,
      routeTableId: secondaryPublicRouteTable.id,
    });

    // Primary Region - Security Group for RDS
    const primaryDbSecurityGroup = new SecurityGroup(
      this,
      'PrimaryDBSecurityGroup',
      {
        provider: primaryProvider,
        vpcId: primaryVpc.id,
        name: `dr-db-sg-primary-${environmentSuffix}`,
        description: 'Security group for Aurora database in primary region',
        tags: {
          Name: `dr-db-sg-primary-${environmentSuffix}`,
        },
      }
    );

    // Allow Lambda to access RDS on port 5432
    new SecurityGroupRule(this, 'PrimaryDBIngressFromLambda', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: primaryDbSecurityGroup.id,
      sourceSecurityGroupId: primaryDbSecurityGroup.id,
      description: 'Allow PostgreSQL access from Lambda',
    });

    new SecurityGroupRule(this, 'PrimaryDBEgress', {
      provider: primaryProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryDbSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Secondary Region - Security Group for RDS
    const secondaryDbSecurityGroup = new SecurityGroup(
      this,
      'SecondaryDBSecurityGroup',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        name: `dr-db-sg-secondary-${environmentSuffix}`,
        description: 'Security group for Aurora database in secondary region',
        tags: {
          Name: `dr-db-sg-secondary-${environmentSuffix}`,
        },
      }
    );

    new SecurityGroupRule(this, 'SecondaryDBIngressFromLambda', {
      provider: secondaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: secondaryDbSecurityGroup.id,
      sourceSecurityGroupId: secondaryDbSecurityGroup.id,
      description: 'Allow PostgreSQL access from Lambda',
    });

    new SecurityGroupRule(this, 'SecondaryDBEgress', {
      provider: secondaryProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: secondaryDbSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Primary Region - Security Group for Lambda
    const primaryLambdaSecurityGroup = new SecurityGroup(
      this,
      'PrimaryLambdaSecurityGroup',
      {
        provider: primaryProvider,
        vpcId: primaryVpc.id,
        name: `dr-lambda-sg-primary-${environmentSuffix}`,
        description: 'Security group for Lambda functions in primary region',
        tags: {
          Name: `dr-lambda-sg-primary-${environmentSuffix}`,
        },
      }
    );

    new SecurityGroupRule(this, 'PrimaryLambdaEgress', {
      provider: primaryProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryLambdaSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Allow Lambda to access RDS
    new SecurityGroupRule(this, 'PrimaryLambdaToDBIngress', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: primaryDbSecurityGroup.id,
      sourceSecurityGroupId: primaryLambdaSecurityGroup.id,
      description: 'Allow Lambda to access Aurora',
    });

    // Secondary Region - Security Group for Lambda
    const secondaryLambdaSecurityGroup = new SecurityGroup(
      this,
      'SecondaryLambdaSecurityGroup',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        name: `dr-lambda-sg-secondary-${environmentSuffix}`,
        description: 'Security group for Lambda functions in secondary region',
        tags: {
          Name: `dr-lambda-sg-secondary-${environmentSuffix}`,
        },
      }
    );

    new SecurityGroupRule(this, 'SecondaryLambdaEgress', {
      provider: secondaryProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: secondaryLambdaSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    new SecurityGroupRule(this, 'SecondaryLambdaToDBIngress', {
      provider: secondaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: secondaryDbSecurityGroup.id,
      sourceSecurityGroupId: secondaryLambdaSecurityGroup.id,
      description: 'Allow Lambda to access Aurora',
    });

    // Export values
    this.primaryVpcId = primaryVpc.id;
    this.secondaryVpcId = secondaryVpc.id;
    this.primaryPrivateSubnetIds = [
      primaryPrivateSubnet1.id,
      primaryPrivateSubnet2.id,
    ];
    this.secondaryPrivateSubnetIds = [
      secondaryPrivateSubnet1.id,
      secondaryPrivateSubnet2.id,
    ];
    this.primaryDbSecurityGroupId = primaryDbSecurityGroup.id;
    this.secondaryDbSecurityGroupId = secondaryDbSecurityGroup.id;
    this.primaryLambdaSecurityGroupId = primaryLambdaSecurityGroup.id;
    this.secondaryLambdaSecurityGroupId = secondaryLambdaSecurityGroup.id;
  }
}
