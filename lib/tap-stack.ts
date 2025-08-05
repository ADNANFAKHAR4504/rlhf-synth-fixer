import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

interface EnvironmentConfig {
  vpcCidr: string;
  publicSubnetCount: number;
  privateSubnetCount: number;
  natGatewayCount: number;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateways: NatGateway[];
  public readonly securityGroups: { [key: string]: SecurityGroup };

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Environment-specific configurations
    const environmentConfigs: { [key: string]: EnvironmentConfig } = {
      dev: {
        vpcCidr: '10.0.0.0/16',
        publicSubnetCount: 2,
        privateSubnetCount: 4,
        natGatewayCount: 1,
      },
      staging: {
        vpcCidr: '172.16.0.0/16',
        publicSubnetCount: 2,
        privateSubnetCount: 4,
        natGatewayCount: 2,
      },
      prod: {
        vpcCidr: '192.168.0.0/16',
        publicSubnetCount: 3,
        privateSubnetCount: 6,
        natGatewayCount: 3,
      },
    };

    const config =
      environmentConfigs[environmentSuffix] || environmentConfigs.dev;

    // Data source for availability zones
    const azs = new DataAwsAvailabilityZones(
      this,
      `${environmentSuffix}-available-azs`,
      {
        state: 'available',
      }
    );

    // VPC
    this.vpc = new Vpc(this, `${environmentSuffix}-vpc`, {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${environmentSuffix}-vpc`,
        Environment: environmentSuffix,
        Type: 'vpc',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `${environmentSuffix}-igw`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `${environmentSuffix}-igw`,
        Environment: environmentSuffix,
        Type: 'internet-gateway',
      },
    });

    // Public Subnets
    this.publicSubnets = [];
    for (let i = 0; i < config.publicSubnetCount; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${environmentSuffix}-public-subnet-${i + 1}`,
          Environment: environmentSuffix,
          Type: 'public-subnet',
          Tier: 'public',
        },
      });
      this.publicSubnets.push(subnet);
    }

    // Private Subnets
    this.privateSubnets = [];
    for (let i = 0; i < config.privateSubnetCount; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${i + config.publicSubnetCount}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i % 3}]}`,
        tags: {
          Name: `${environmentSuffix}-private-subnet-${i + 1}`,
          Environment: environmentSuffix,
          Type: 'private-subnet',
          Tier: 'private',
        },
      });
      this.privateSubnets.push(subnet);
    }

    // Elastic IPs for NAT Gateways
    const eips = [];
    for (let i = 0; i < config.natGatewayCount; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        dependsOn: [igw],
        tags: {
          Name: `${environmentSuffix}-nat-eip-${i + 1}`,
          Environment: environmentSuffix,
          Type: 'elastic-ip',
        },
      });
      eips.push(eip);
    }

    // NAT Gateways
    this.natGateways = [];
    for (let i = 0; i < config.natGatewayCount; i++) {
      const natGw = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eips[i].id,
        subnetId: this.publicSubnets[i].id,
        dependsOn: [igw],
        tags: {
          Name: `${environmentSuffix}-nat-gateway-${i + 1}`,
          Environment: environmentSuffix,
          Type: 'nat-gateway',
        },
      });
      this.natGateways.push(natGw);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(
      this,
      `${environmentSuffix}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${environmentSuffix}-public-rt`,
          Environment: environmentSuffix,
          Type: 'route-table',
          Tier: 'public',
        },
      }
    );

    new Route(this, `${environmentSuffix}-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `${environmentSuffix}-public-rt-assoc-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private Route Tables
    const privateRouteTables: RouteTable[] = [];
    for (let i = 0; i < config.natGatewayCount; i++) {
      const privateRt = new RouteTable(this, `private-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${environmentSuffix}-private-rt-${i + 1}`,
          Environment: environmentSuffix,
          Type: 'route-table',
          Tier: 'private',
        },
      });

      new Route(this, `${environmentSuffix}-private-route-${i}`, {
        routeTableId: privateRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[i].id,
      });

      privateRouteTables.push(privateRt);
    }

    // Associate private subnets with private route tables
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `${environmentSuffix}-private-rt-assoc-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[index % config.natGatewayCount].id,
        }
      );
    });

    // Security Groups
    this.securityGroups = {};

    // Web tier security group
    this.securityGroups.web = new SecurityGroup(
      this,
      `${environmentSuffix}-web-sg`,
      {
        name: `${environmentSuffix}-web-sg`,
        description: 'Security group for web tier',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS access',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: `${environmentSuffix}-web-sg`,
          Environment: environmentSuffix,
          Type: 'security-group',
          Tier: 'web',
        },
      }
    );

    // Database tier security group
    this.securityGroups.database = new SecurityGroup(
      this,
      `${environmentSuffix}-database-sg`,
      {
        name: `${environmentSuffix}-database-sg`,
        description: 'Security group for database tier',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [this.securityGroups.web.id],
            description: 'MySQL access from web tier',
          },
        ],
        tags: {
          Name: `${environmentSuffix}-database-sg`,
          Environment: environmentSuffix,
          Type: 'security-group',
          Tier: 'database',
        },
      }
    );

    // Network ACLs
    const networkAcl = new NetworkAcl(
      this,
      `${environmentSuffix}-network-acl`,
      {
        vpcId: this.vpc.id,
        subnetIds: [
          ...this.publicSubnets.map(s => s.id),
          ...this.privateSubnets.map(s => s.id),
        ],
        tags: {
          Name: `${environmentSuffix}-network-acl`,
          Environment: environmentSuffix,
          Type: 'network-acl',
        },
      }
    );

    // Network ACL Rules
    new NetworkAclRule(this, `${environmentSuffix}-network-acl-ingress-http`, {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 80,
      toPort: 80,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, `${environmentSuffix}-network-acl-ingress-https`, {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, `${environmentSuffix}-network-acl-egress-all`, {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      egress: true,
      cidrBlock: '0.0.0.0/0',
    });

    // VPC Endpoints
    new VpcEndpoint(this, `${environmentSuffix}-s3-endpoint`, {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `${environmentSuffix}-s3-endpoint`,
        Environment: environmentSuffix,
        Type: 'vpc-endpoint',
      },
    });

    new VpcEndpoint(this, `${environmentSuffix}-dynamodb-endpoint`, {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.dynamodb`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `${environmentSuffix}-dynamodb-endpoint`,
        Environment: environmentSuffix,
        Type: 'vpc-endpoint',
      },
    });

    // Generate a deterministic suffix for flow logs resources based on stack ID
    const flowLogsUniqueId = id
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);

    // CloudWatch Log Group for VPC Flow Logs
    const logGroup = new CloudwatchLogGroup(
      this,
      `${environmentSuffix}-vpc-flow-logs-group-${flowLogsUniqueId}`,
      {
        name: `/aws/vpc/flowlogs/${environmentSuffix}`,
        retentionInDays: 14,
        tags: {
          Name: `${environmentSuffix}-vpc-flow-logs`,
          Environment: environmentSuffix,
          Type: 'cloudwatch-log-group',
        },
      }
    );

    // IAM Role for VPC Flow Logs
    const flowLogsRole = new IamRole(
      this,
      `${environmentSuffix}-vpc-flow-logs-role-${flowLogsUniqueId}`,
      {
        name: `${environmentSuffix}-vpc-flow-logs-role`,
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
          Name: `${environmentSuffix}-vpc-flow-logs-role`,
          Environment: environmentSuffix,
          Type: 'iam-role',
        },
      }
    );

    new IamRolePolicy(
      this,
      `${environmentSuffix}-vpc-flow-logs-policy-${flowLogsUniqueId}`,
      {
        role: flowLogsRole.id,
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
      }
    );

    // VPC Flow Logs
    new FlowLog(
      this,
      `${environmentSuffix}-vpc-flow-logs-resource-${flowLogsUniqueId}`,
      {
        iamRoleArn: flowLogsRole.arn,
        logDestination: logGroup.arn,
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        tags: {
          Name: `${environmentSuffix}-vpc-flow-logs`,
          Environment: environmentSuffix,
          Type: 'flow-log',
        },
      }
    );

    // Outputs
    new TerraformOutput(this, `${environmentSuffix}-vpc-id`, {
      value: this.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, `${environmentSuffix}-vpc-cidr`, {
      value: this.vpc.cidrBlock,
      description: 'VPC CIDR block',
    });

    new TerraformOutput(this, `${environmentSuffix}-public-subnet-ids`, {
      value: this.publicSubnets.map(s => s.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, `${environmentSuffix}-private-subnet-ids`, {
      value: this.privateSubnets.map(s => s.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, `${environmentSuffix}-nat-gateway-ids`, {
      value: this.natGateways.map(n => n.id),
      description: 'NAT Gateway IDs',
    });
  }
}
