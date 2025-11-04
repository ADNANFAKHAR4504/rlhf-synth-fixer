import { Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface VpcInfrastructureProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class VpcInfrastructure extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly isolatedSubnets: Subnet[];
  public readonly webSecurityGroup: SecurityGroup;
  public readonly appSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcInfrastructureProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Get available availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support
    this.vpc = new Vpc(this, `payment-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-gateway-vpc-${environmentSuffix}`,
        Environment: 'Production',
        Project: 'PaymentGateway',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, `payment-igw-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-gateway-igw-${environmentSuffix}`,
        Environment: 'Production',
        Project: 'PaymentGateway',
      },
    });

    // Initialize subnet arrays
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.isolatedSubnets = [];

    // Define subnet CIDR blocks
    const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
    const isolatedCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];

    // Create subnets in 3 availability zones
    const natGateways: NatGateway[] = [];
    const eips: Eip[] = [];

    for (let i = 0; i < 3; i++) {
      const azIndex = i;
      const azName = Fn.element(azs.names, azIndex);

      // Create Public Subnet
      const publicSubnet = new Subnet(
        this,
        `public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: publicCidrs[i],
          availabilityZone: azName,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `payment-gateway-public-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'public',
            Tier: 'web',
            Environment: 'Production',
            Project: 'PaymentGateway',
          },
        }
      );
      this.publicSubnets.push(publicSubnet);

      // Create Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i}-${environmentSuffix}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-gateway-nat-eip-${i + 1}-${environmentSuffix}`,
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      });
      eips.push(eip);

      // Create NAT Gateway in each public subnet
      const natGateway = new NatGateway(
        this,
        `nat-gateway-${i}-${environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `payment-gateway-nat-gateway-${i + 1}-${environmentSuffix}`,
            Environment: 'Production',
            Project: 'PaymentGateway',
          },
        }
      );
      natGateways.push(natGateway);

      // Create Private Subnet
      const privateSubnet = new Subnet(
        this,
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: privateCidrs[i],
          availabilityZone: azName,
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `payment-gateway-private-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'private',
            Tier: 'application',
            Environment: 'Production',
            Project: 'PaymentGateway',
          },
        }
      );
      this.privateSubnets.push(privateSubnet);

      // Create Isolated Subnet (for database)
      const isolatedSubnet = new Subnet(
        this,
        `isolated-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: isolatedCidrs[i],
          availabilityZone: azName,
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `payment-gateway-isolated-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'isolated',
            Tier: 'database',
            Environment: 'Production',
            Project: 'PaymentGateway',
          },
        }
      );
      this.isolatedSubnets.push(isolatedSubnet);

      // Store subnet IDs in Parameter Store
      new SsmParameter(this, `ssm-public-subnet-${i}-${environmentSuffix}`, {
        name: `/vpc/production/public-subnet/az${i + 1}`,
        type: 'String',
        value: publicSubnet.id,
        description: `Public subnet ID in AZ ${i + 1}`,
        tags: {
          Name: `public-subnet-${i + 1}-parameter-${environmentSuffix}`,
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      });

      new SsmParameter(this, `ssm-private-subnet-${i}-${environmentSuffix}`, {
        name: `/vpc/production/private-subnet/az${i + 1}`,
        type: 'String',
        value: privateSubnet.id,
        description: `Private subnet ID in AZ ${i + 1}`,
        tags: {
          Name: `private-subnet-${i + 1}-parameter-${environmentSuffix}`,
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      });

      new SsmParameter(this, `ssm-isolated-subnet-${i}-${environmentSuffix}`, {
        name: `/vpc/production/isolated-subnet/az${i + 1}`,
        type: 'String',
        value: isolatedSubnet.id,
        description: `Isolated subnet ID in AZ ${i + 1}`,
        tags: {
          Name: `isolated-subnet-${i + 1}-parameter-${environmentSuffix}`,
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      });
    }

    // Store VPC ID in Parameter Store
    new SsmParameter(this, `ssm-vpc-id-${environmentSuffix}`, {
      name: '/vpc/production/vpc-id',
      type: 'String',
      value: this.vpc.id,
      description: 'Production VPC ID',
      tags: {
        Name: `vpc-id-parameter-${environmentSuffix}`,
        Environment: 'Production',
        Project: 'PaymentGateway',
      },
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(
      this,
      `public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-gateway-public-rt-${environmentSuffix}`,
          Type: 'public',
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      }
    );

    // Add route to Internet Gateway for public subnets
    new Route(this, `public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `public-rta-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Create separate route tables for each private subnet (one per AZ with its own NAT Gateway)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-rt-${index}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `payment-gateway-private-rt-${index + 1}-${environmentSuffix}`,
            Type: 'private',
            AZ: `${index + 1}`,
            Environment: 'Production',
            Project: 'PaymentGateway',
          },
        }
      );

      // Add route to NAT Gateway for this AZ
      new Route(this, `private-route-${index}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(
        this,
        `private-rta-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Create route tables for isolated subnets (no internet access)
    this.isolatedSubnets.forEach((subnet, index) => {
      const isolatedRouteTable = new RouteTable(
        this,
        `isolated-rt-${index}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `payment-gateway-isolated-rt-${index + 1}-${environmentSuffix}`,
            Type: 'isolated',
            AZ: `${index + 1}`,
            Environment: 'Production',
            Project: 'PaymentGateway',
          },
        }
      );

      // Associate isolated subnet with its route table (no routes to internet)
      new RouteTableAssociation(
        this,
        `isolated-rta-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: isolatedRouteTable.id,
        }
      );
    });

    // Create Security Group for Web Tier
    this.webSecurityGroup = new SecurityGroup(
      this,
      `web-sg-${environmentSuffix}`,
      {
        name: `payment-gateway-web-sg-${environmentSuffix}`,
        description: 'Security group for web tier - allows HTTP and HTTPS',
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-gateway-web-sg-${environmentSuffix}`,
          Tier: 'web',
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      }
    );

    // Allow HTTP inbound to web tier
    new SecurityGroupRule(this, `web-sg-http-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow HTTP from internet',
    });

    // Allow HTTPS inbound to web tier
    new SecurityGroupRule(this, `web-sg-https-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow HTTPS from internet',
    });

    // Allow all outbound from web tier
    new SecurityGroupRule(this, `web-sg-egress-${environmentSuffix}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create Security Group for App Tier
    this.appSecurityGroup = new SecurityGroup(
      this,
      `app-sg-${environmentSuffix}`,
      {
        name: `payment-gateway-app-sg-${environmentSuffix}`,
        description: 'Security group for application tier',
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-gateway-app-sg-${environmentSuffix}`,
          Tier: 'application',
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      }
    );

    // Allow port 8080 from web tier to app tier
    new SecurityGroupRule(this, `app-sg-from-web-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.appSecurityGroup.id,
      description: 'Allow port 8080 from web tier',
    });

    // Allow all outbound from app tier
    new SecurityGroupRule(this, `app-sg-egress-${environmentSuffix}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.appSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create Security Group for Database Tier
    this.dbSecurityGroup = new SecurityGroup(
      this,
      `db-sg-${environmentSuffix}`,
      {
        name: `payment-gateway-db-sg-${environmentSuffix}`,
        description: 'Security group for database tier',
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-gateway-db-sg-${environmentSuffix}`,
          Tier: 'database',
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      }
    );

    // Allow PostgreSQL port from app tier to database tier
    new SecurityGroupRule(this, `db-sg-from-app-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.appSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
      description: 'Allow PostgreSQL from app tier',
    });

    // Allow all outbound from database tier (for updates, etc.)
    new SecurityGroupRule(this, `db-sg-egress-${environmentSuffix}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.dbSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new CloudwatchLogGroup(
      this,
      `vpc-flow-logs-${environmentSuffix}`,
      {
        name: `/aws/vpc/payment-gateway-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `payment-gateway-flow-logs-${environmentSuffix}`,
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      }
    );

    // Create IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(
      this,
      `vpc-flow-log-role-${environmentSuffix}`,
      {
        name: `payment-gateway-vpc-flow-log-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `payment-gateway-flow-log-role-${environmentSuffix}`,
          Environment: 'Production',
          Project: 'PaymentGateway',
        },
      }
    );

    // Create IAM Policy for Flow Logs to write to CloudWatch
    new IamRolePolicy(this, `vpc-flow-log-policy-${environmentSuffix}`, {
      name: `payment-gateway-vpc-flow-log-policy-${environmentSuffix}`,
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Create VPC Flow Log
    new FlowLog(this, `vpc-flow-log-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
      tags: {
        Name: `payment-gateway-flow-log-${environmentSuffix}`,
        Environment: 'Production',
        Project: 'PaymentGateway',
      },
    });

    // Create Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: this.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: this.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'isolated-subnet-ids', {
      value: this.isolatedSubnets.map(subnet => subnet.id),
      description: 'Isolated subnet IDs',
    });

    new TerraformOutput(this, 'web-security-group-id', {
      value: this.webSecurityGroup.id,
      description: 'Web tier security group ID',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: this.appSecurityGroup.id,
      description: 'App tier security group ID',
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: this.dbSecurityGroup.id,
      description: 'Database tier security group ID',
    });
  }
}
