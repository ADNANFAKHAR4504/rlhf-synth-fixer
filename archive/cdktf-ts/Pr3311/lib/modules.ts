import { Construct } from 'constructs';

// VPC & Networking
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';

export interface TagConfig {
  project: string;
  env: string;
  owner: string;
}

export class TaggingHelper {
  static createTags(
    config: TagConfig,
    resourceName: string
  ): { [key: string]: string } {
    return {
      Project: config.project,
      Env: config.env,
      Owner: config.owner,
      Name: `${config.project}-${config.env}-${resourceName}`,
      ManagedBy: 'cdktf',
    };
  }
}

export interface VpcModuleConfig {
  cidr: string;
  tagConfig: TagConfig;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidr,
      enableDnsHostnames: config.enableDnsHostnames ?? true,
      enableDnsSupport: config.enableDnsSupport ?? true,
      tags: TaggingHelper.createTags(config.tagConfig, 'vpc'),
    });
  }
}

export interface SubnetModuleConfig {
  vpc: Vpc;
  subnets: Array<{
    cidr: string;
    availabilityZone: string;
    type: 'public' | 'private';
    name: string;
  }>;
  tagConfig: TagConfig;
}

export class SubnetModule extends Construct {
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly allSubnets: Subnet[] = [];

  constructor(scope: Construct, id: string, config: SubnetModuleConfig) {
    super(scope, id);

    config.subnets.forEach((subnetConfig, index) => {
      const subnet = new Subnet(this, `subnet-${index}`, {
        vpcId: config.vpc.id,
        cidrBlock: subnetConfig.cidr,
        availabilityZone: subnetConfig.availabilityZone,
        mapPublicIpOnLaunch: subnetConfig.type === 'public',
        tags: TaggingHelper.createTags(config.tagConfig, subnetConfig.name),
      });

      this.allSubnets.push(subnet);
      if (subnetConfig.type === 'public') {
        this.publicSubnets.push(subnet);
      } else {
        this.privateSubnets.push(subnet);
      }
    });
  }
}

export interface InternetGatewayModuleConfig {
  vpc: Vpc;
  tagConfig: TagConfig;
}

export class InternetGatewayModule extends Construct {
  public readonly internetGateway: InternetGateway;

  constructor(
    scope: Construct,
    id: string,
    config: InternetGatewayModuleConfig
  ) {
    super(scope, id);

    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: config.vpc.id,
      tags: TaggingHelper.createTags(config.tagConfig, 'igw'),
    });
  }
}

export interface RouteTableModuleConfig {
  vpc: Vpc;
  internetGateway: InternetGateway;
  natGateway?: NatGateway;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  tagConfig: TagConfig;
}

export class RouteTableModule extends Construct {
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, config: RouteTableModuleConfig) {
    super(scope, id);

    // Public route table
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: config.vpc.id,
      tags: TaggingHelper.createTags(config.tagConfig, 'public-rt'),
    });

    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: config.internetGateway.id,
    });

    // Associate public subnets
    config.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Private route table
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: config.vpc.id,
      tags: TaggingHelper.createTags(config.tagConfig, 'private-rt'),
    });

    if (config.natGateway) {
      new Route(this, 'private-route', {
        routeTableId: this.privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: config.natGateway.id,
      });
    }

    // Associate private subnets
    config.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });
  }
}

export interface NatGatewayModuleConfig {
  publicSubnet: Subnet;
  tagConfig: TagConfig;
}

export class NatGatewayModule extends Construct {
  public readonly eip: Eip;
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string, config: NatGatewayModuleConfig) {
    super(scope, id);

    this.eip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: TaggingHelper.createTags(config.tagConfig, 'nat-eip'),
    });

    this.natGateway = new NatGateway(this, 'nat-gw', {
      allocationId: this.eip.id,
      subnetId: config.publicSubnet.id,
      tags: TaggingHelper.createTags(config.tagConfig, 'nat-gw'),
    });
  }
}

export interface SecurityGroupModuleConfig {
  vpc: Vpc;
  sshAllowCidr: string;
  tagConfig: TagConfig;
}

export class SecurityGroupModule extends Construct {
  public readonly publicSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Public security group for web-facing instances
    this.publicSecurityGroup = new SecurityGroup(this, 'public-sg', {
      name: `${config.tagConfig.project}-${config.tagConfig.env}-public-sg`,
      description: 'Security group for public-facing instances',
      vpcId: config.vpc.id,
      tags: TaggingHelper.createTags(config.tagConfig, 'public-sg'),
    });

    // HTTP access from anywhere
    new SecurityGroupRule(this, 'public-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'HTTP access from anywhere',
    });

    // HTTPS access from anywhere
    new SecurityGroupRule(this, 'public-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'HTTPS access from anywhere',
    });

    // SSH access from configurable CIDR
    new SecurityGroupRule(this, 'public-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.sshAllowCidr],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'SSH access from allowed CIDR',
    });

    // All outbound traffic
    new SecurityGroupRule(this, 'public-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicSecurityGroup.id,
      description: 'All outbound traffic',
    });

    // RDS security group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.tagConfig.project}-${config.tagConfig.env}-rds-sg`,
      description: 'Security group for RDS instances',
      vpcId: config.vpc.id,
      tags: TaggingHelper.createTags(config.tagConfig, 'rds-sg'),
    });

    // MySQL access from public security group (app instances)
    new SecurityGroupRule(this, 'rds-mysql-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.publicSecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'MySQL access from application instances',
    });
  }
}

export interface RdsModuleConfig {
  vpc: Vpc;
  privateSubnets: Subnet[];
  securityGroup: SecurityGroup;
  dbName: string;
  dbInstanceClass: string;
  backupRetentionPeriod?: number;
  deletionProtection?: boolean;
  tagConfig: TagConfig;
  // New production-ready options
  environmentName: string;
  masterUsername?: string;
  enablePerformanceInsights?: boolean;
  monitoringInterval?: number;
  // Add engine version configuration
  engineVersion?: string;
}

export class RdsModule extends Construct {
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbParameterGroup: DbParameterGroup;
  public readonly dbInstance: DbInstance;
  public readonly masterUserSecret?: SecretsmanagerSecret;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Validate environment-specific settings
    const isProduction =
      config.environmentName.toLowerCase() === 'prod' ||
      config.environmentName.toLowerCase() === 'production';
    const masterUsername = config.masterUsername || 'admin';

    // Define engine version and corresponding parameter group family
    const engineVersion = config.engineVersion || '8.0.37'; // Default to MySQL 8.0.37
    const parameterGroupFamily = 'mysql8.0'; // Match the major version

    // Determine if Performance Insights should be enabled
    const performanceInsightsEnabled =
      config.enablePerformanceInsights ?? isProduction;

    // DB subnet group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.tagConfig.project}-${config.tagConfig.env}-db-subnet-group`,
      subnetIds: config.privateSubnets.map(subnet => subnet.id),
      description: 'Database subnet group for private subnets',
      tags: TaggingHelper.createTags(config.tagConfig, 'db-subnet-group'),
    });

    // DB parameter group with correct family
    this.dbParameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      name: `${config.tagConfig.project}-${config.tagConfig.env}-db-params`,
      family: parameterGroupFamily, // Use specific version family
      description: 'Custom parameter group for MySQL',
      tags: TaggingHelper.createTags(config.tagConfig, 'db-parameter-group'),
      parameter: [
        {
          name: 'innodb_buffer_pool_size',
          value: '{DBInstanceClassMemory*3/4}',
        },
        // Add production-specific parameters
        ...(isProduction
          ? [
              {
                name: 'slow_query_log',
                value: '1',
              },
              {
                name: 'long_query_time',
                value: '2',
              },
            ]
          : []),
      ],
    });

    // Prepare RDS instance configuration
    const rdsConfig: any = {
      identifier: `${config.tagConfig.project}-${config.tagConfig.env}-mysql`,
      engine: 'mysql',
      engineVersion: engineVersion, // Specify explicit version
      instanceClass: config.dbInstanceClass,

      // Storage configuration
      allocatedStorage: isProduction ? 100 : 20,
      maxAllocatedStorage: isProduction ? 1000 : 100,
      storageEncrypted: true,
      storageType: isProduction ? 'gp3' : 'gp2',

      // Database configuration
      dbName: config.dbName,
      username: masterUsername,
      manageMasterUserPassword: true, // AWS manages the master password

      // Network configuration
      vpcSecurityGroupIds: [config.securityGroup.id],
      dbSubnetGroupName: this.dbSubnetGroup.name,
      parameterGroupName: this.dbParameterGroup.name,
      publiclyAccessible: false,

      // High availability and backup
      multiAz: isProduction, // Enable Multi-AZ for production
      backupRetentionPeriod:
        config.backupRetentionPeriod ?? (isProduction ? 30 : 7),
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'Sun:04:00-Sun:05:00',
      autoMinorVersionUpgrade: !isProduction, // Disable auto-updates in production

      // Protection settings
      deletionProtection: config.deletionProtection ?? isProduction,
      skipFinalSnapshot: !isProduction,
      finalSnapshotIdentifier: isProduction
        ? `${config.tagConfig.project}-${config.tagConfig.env}-mysql-final-snapshot-${Date.now()}`
        : undefined,

      // Monitoring configuration
      monitoringInterval: config.monitoringInterval ?? (isProduction ? 60 : 0),
      monitoringRoleArn: isProduction
        ? 'arn:aws:iam::$\{data.aws_caller_identity.current.account_id}:role/rds-monitoring-role'
        : undefined,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],

      // Performance Insights - only set if enabled
      performanceInsightsEnabled: performanceInsightsEnabled,

      // Security
      copyTagsToSnapshot: true,

      tags: TaggingHelper.createTags(config.tagConfig, 'db-instance'),

      lifecycle: {
        ignoreChanges: ['password'],
      },
    };

    // Only set Performance Insights retention period if Performance Insights is enabled
    if (performanceInsightsEnabled) {
      rdsConfig.performanceInsightsRetentionPeriod = isProduction ? 731 : 7;
    }

    // Create RDS instance with the prepared configuration
    this.dbInstance = new DbInstance(this, 'db-instance', rdsConfig);

    // Create application-level database credentials if needed
    this.masterUserSecret = new SecretsmanagerSecret(this, 'app-db-secret', {
      name: `${config.tagConfig.project}-${config.tagConfig.env}-app-db-credentials`,
      description: 'Application database credentials',
      tags: TaggingHelper.createTags(config.tagConfig, 'app-db-secret'),
      forceOverwriteReplicaSecret: true,
    });
  }
}
