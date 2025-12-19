import { Construct } from 'constructs';

// VPC
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// RDS
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

// Data Sources
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface NetworkModuleConfig {
  projectName: string;
  environment: string;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  tags: { [key: string]: string };
}

export class NetworkModule extends Construct {
  public vpc: Vpc;
  public publicSubnets: Subnet[];
  public privateSubnets: Subnet[];
  public internetGateway: InternetGateway;
  public natGateway: NatGateway;
  public elasticIp: Eip;
  public publicRouteTable: RouteTable;
  public privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, config: NetworkModuleConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-igw`,
      },
    });

    // Create public subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-public-subnet-${index + 1}`,
          Type: 'public',
          'kubernetes.io/role/elb': '1',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-subnet-${index + 1}`,
          Type: 'private',
          'kubernetes.io/role/internal-elb': '1',
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    this.elasticIp = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-nat-eip`,
      },
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: this.elasticIp.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-nat-gateway`,
      },
    });

    // Create public route table
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-public-rt`,
      },
    });

    // Add route to Internet Gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Create private route table
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-private-rt`,
      },
    });

    // Add route to NAT Gateway for private subnets
    new Route(this, 'private-route', {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rt-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });
  }
}

export interface SecurityGroupModuleConfig {
  projectName: string;
  environment: string;
  vpcId: string;
  sshAllowedCidr: string;
  tags: { [key: string]: string };
}

export class SecurityGroupModule extends Construct {
  public publicSecurityGroup: SecurityGroup;
  public privateSecurityGroup: SecurityGroup;
  public rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Public Security Group
    this.publicSecurityGroup = new SecurityGroup(this, 'public-sg', {
      name: `${config.projectName}-${config.environment}-public-sg`,
      description: 'Security group for public instances',
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-public-sg`,
      },
    });

    // Public SG Ingress Rules
    new SecurityGroupRule(this, 'public-sg-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'Allow HTTP from anywhere',
    });

    new SecurityGroupRule(this, 'public-sg-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'Allow HTTPS from anywhere',
    });

    new SecurityGroupRule(this, 'public-sg-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.sshAllowedCidr],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'Allow SSH from specific CIDR',
    });

    new SecurityGroupRule(this, 'public-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Private Security Group
    this.privateSecurityGroup = new SecurityGroup(this, 'private-sg', {
      name: `${config.projectName}-${config.environment}-private-sg`,
      description: 'Security group for private instances',
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-private-sg`,
      },
    });

    new SecurityGroupRule(this, 'private-sg-from-public', {
      type: 'ingress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      sourceSecurityGroupId: this.publicSecurityGroup.id,
      securityGroupId: this.privateSecurityGroup.id,
      description: 'Allow all traffic from public security group',
    });

    new SecurityGroupRule(this, 'private-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.privateSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.projectName}-${config.environment}-rds-sg`,
      description: 'Security group for RDS database',
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-rds-sg`,
      },
    });

    new SecurityGroupRule(this, 'rds-sg-mysql', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.privateSecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow MySQL access from private instances',
    });

    new SecurityGroupRule(this, 'rds-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });
  }
}

export interface RdsModuleConfig {
  projectName: string;
  environment: string;
  subnetIds: string[];
  securityGroupId: string;
  instanceClass: string;
  allocatedStorage: number;
  backupRetentionDays: number;
  deletionProtection: boolean;
  tags: { [key: string]: string };
}

export class RdsModule extends Construct {
  public dbSubnetGroup: DbSubnetGroup;
  public dbInstance: DbInstance;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Create DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.projectName}-${config.environment}-db-subnet-group`,
      description: `Database subnet group for ${config.projectName} ${config.environment}`,
      subnetIds: config.subnetIds,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-db-subnet-group`,
      },
    });

    // Create RDS Monitoring Role
    const monitoringRole = new IamRole(this, 'rds-monitoring-role', {
      name: `${config.projectName}-${config.environment}-rds-monitoring`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'monitoring.rds.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach AmazonRDS Enhanced Monitoring Policy
    new IamRolePolicyAttachment(this, 'rds-monitoring-policy-attachment', {
      role: monitoringRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    });

    // Create RDS Instance using AWS-managed credentials
    this.dbInstance = new DbInstance(this, 'rds-instance', {
      identifier: `${config.projectName}-${config.environment}-db`,
      engine: 'mysql',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,

      // Database configuration
      dbName: `${config.projectName}${config.environment}db`.replace(
        /[^a-zA-Z0-9]/g,
        ''
      ),
      username: 'admin',
      manageMasterUserPassword: true, // AWS-managed password

      // High availability
      multiAz: true,

      // Networking
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroupId],
      publiclyAccessible: false,

      // Backup & maintenance
      backupRetentionPeriod: config.backupRetentionDays,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Monitoring
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      performanceInsightsEnabled: false,
      // performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      monitoringRoleArn: monitoringRole.arn,

      // Protection settings
      deletionProtection: config.deletionProtection,
      skipFinalSnapshot: !config.deletionProtection,
      finalSnapshotIdentifier: config.deletionProtection
        ? `${config.projectName}-${config.environment}-final-snapshot-${Date.now()}`
        : undefined,

      // Security patches
      autoMinorVersionUpgrade: true,
      applyImmediately: false,

      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-db`,
      },
    });
  }
}

export interface OutputsModuleConfig {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  publicRouteTableId: string;
  privateRouteTableId: string;
  natGatewayId: string;
  natEipAddress: string;
  publicSecurityGroupId: string;
  privateSecurityGroupId: string;
  rdsSecurityGroupId: string;
  rdsEndpoint: string;
  rdsArn: string;
}

export class OutputsModule extends Construct {
  constructor(scope: Construct, id: string, config: OutputsModuleConfig) {
    super(scope, id);

    new DataAwsCallerIdentity(this, 'current');

    // Define outputs as properties that can be accessed
    Object.entries({
      vpcId: config.vpcId,
      publicSubnetIds: config.publicSubnetIds.join(','),
      privateSubnetIds: config.privateSubnetIds.join(','),
      publicRouteTableId: config.publicRouteTableId,
      privateRouteTableId: config.privateRouteTableId,
      natGatewayId: config.natGatewayId,
      natEipAddress: config.natEipAddress,
      publicSecurityGroupId: config.publicSecurityGroupId,
      privateSecurityGroupId: config.privateSecurityGroupId,
      rdsSecurityGroupId: config.rdsSecurityGroupId,
      rdsEndpoint: config.rdsEndpoint,
      rdsArn: config.rdsArn,
    }).forEach(([key, value]) => {
      (this as any)[key] = value;
    });
  }
}
