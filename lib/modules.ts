// lib/modules.ts
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

// VPC Module
export interface VpcModuleConfig {
  projectName: string;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  enableFlowLogs: boolean;
  tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly natGatewayId: string;
  public readonly natGatewayEip: string;
  private flowLog?: FlowLog;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-vpc`,
      },
    });
    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-igw`,
      },
    });

    // Public Subnets and Route Tables
    const publicSubnets: Subnet[] = [];
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-public-subnet-${index + 1}`,
        },
      });
      publicSubnets.push(subnet);

      new RouteTableAssociation(this, `public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });
    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-nat-eip`,
      },
    });
    this.natGatewayEip = natEip.publicIp;

    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-nat-gateway`,
      },
    });
    this.natGatewayId = natGateway.id;

    // Private Subnets and Route Tables
    const privateSubnets: Subnet[] = [];
    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-private-rt`,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-private-subnet-${index + 1}`,
        },
      });
      privateSubnets.push(subnet);

      new RouteTableAssociation(this, `private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Network ACLs
    this.createNetworkAcls(vpc.id, publicSubnets, privateSubnets, config);
  }

  private createNetworkAcls(
    vpcId: string,
    publicSubnets: Subnet[],
    privateSubnets: Subnet[],
    config: VpcModuleConfig
  ) {
    // Public NACL
    const publicNacl = new NetworkAcl(this, 'public-nacl', {
      vpcId,
      subnetIds: publicSubnets.map(s => s.id),
      tags: {
        ...config.tags,
        Name: `${config.projectName}-public-nacl`,
      },
    });

    // Public NACL Rules
    const publicRules = [
      // Inbound
      {
        ruleNumber: 100,
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlock: '0.0.0.0/0',
        egress: false,
      },
      {
        ruleNumber: 110,
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlock: '0.0.0.0/0',
        egress: false,
      },
      {
        ruleNumber: 120,
        protocol: 'tcp',
        fromPort: 22,
        toPort: 22,
        cidrBlock: '0.0.0.0/0',
        egress: false,
      },
      {
        ruleNumber: 130,
        protocol: 'tcp',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
        egress: false,
      },
      // Outbound
      {
        ruleNumber: 100,
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      {
        ruleNumber: 110,
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      {
        ruleNumber: 120,
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlock: '10.0.0.0/16',
        egress: true,
      },
      {
        ruleNumber: 130,
        protocol: 'tcp',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
    ];

    publicRules.forEach((rule, index) => {
      new NetworkAclRule(this, `public-nacl-rule-${index}`, {
        networkAclId: publicNacl.id,
        ruleNumber: rule.ruleNumber,
        protocol: rule.protocol,
        ruleAction: 'allow',
        cidrBlock: rule.cidrBlock,
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        egress: rule.egress,
      });
    });

    // Private NACL
    const privateNacl = new NetworkAcl(this, 'private-nacl', {
      vpcId,
      subnetIds: privateSubnets.map(s => s.id),
      tags: {
        ...config.tags,
        Name: `${config.projectName}-private-nacl`,
      },
    });

    // Private NACL Rules
    const privateRules = [
      // Inbound
      {
        ruleNumber: 100,
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlock: '10.0.0.0/16',
        egress: false,
      },
      {
        ruleNumber: 110,
        protocol: 'tcp',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '0.0.0.0/0',
        egress: false,
      },
      // Outbound
      {
        ruleNumber: 100,
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      {
        ruleNumber: 110,
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      {
        ruleNumber: 120,
        protocol: 'tcp',
        fromPort: 1024,
        toPort: 65535,
        cidrBlock: '10.0.0.0/16',
        egress: true,
      },
    ];

    privateRules.forEach((rule, index) => {
      new NetworkAclRule(this, `private-nacl-rule-${index}`, {
        networkAclId: privateNacl.id,
        ruleNumber: rule.ruleNumber,
        protocol: rule.protocol,
        ruleAction: 'allow',
        cidrBlock: rule.cidrBlock,
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        egress: rule.egress,
      });
    });
  }

  public enableFlowLogs(logGroup: CloudwatchLogGroup) {
    if (!this.flowLog) {
      // IAM role for VPC Flow Logs
      const flowLogsRole = new IamRole(this, 'flow-logs-role', {
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
      });

      new IamRolePolicy(this, 'flow-logs-policy', {
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
      });

      this.flowLog = new FlowLog(this, 'vpc-flow-log', {
        iamRoleArn: flowLogsRole.arn,
        logDestinationType: 'cloud-watch-logs',
        logDestination: logGroup.arn,
        trafficType: 'ALL',
        vpcId: this.vpcId,
      });
    }
  }
}

// Security Module
export interface SecurityModuleConfig {
  vpcId: string;
  sshAllowedCidr: string;
  tags: { [key: string]: string };
}

export class SecurityModule extends Construct {
  public readonly publicInstanceSecurityGroupId: string;
  public readonly rdsSecurityGroupId: string;
  private readonly publicInstanceSg: SecurityGroup;
  private readonly rdsSg: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityModuleConfig) {
    super(scope, id);

    // Public Instance Security Group
    this.publicInstanceSg = new SecurityGroup(this, 'public-instance-sg', {
      vpcId: config.vpcId,
      description: 'Security group for public EC2 instances',
      tags: {
        ...config.tags,
        Name: 'public-instance-sg',
      },
    });
    this.publicInstanceSecurityGroupId = this.publicInstanceSg.id;

    // Public Instance Security Group Rules
    new SecurityGroupRule(this, 'public-sg-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicInstanceSg.id,
      description: 'Allow HTTP from anywhere',
    });

    new SecurityGroupRule(this, 'public-sg-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicInstanceSg.id,
      description: 'Allow HTTPS from anywhere',
    });

    new SecurityGroupRule(this, 'public-sg-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.sshAllowedCidr],
      securityGroupId: this.publicInstanceSg.id,
      description: 'Allow SSH from specific CIDR',
    });

    new SecurityGroupRule(this, 'public-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.publicInstanceSg.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    this.rdsSg = new SecurityGroup(this, 'rds-sg', {
      vpcId: config.vpcId,
      description: 'Security group for RDS MySQL instance',
      tags: {
        ...config.tags,
        Name: 'rds-sg',
      },
    });
    this.rdsSecurityGroupId = this.rdsSg.id;

    // Egress rule for RDS
    new SecurityGroupRule(this, 'rds-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.rdsSg.id,
      description: 'Allow all outbound traffic',
    });
  }

  public allowDatabaseAccess(instanceIds: string[], dbPort: number) {
    // Allow MySQL access from public instances
    new SecurityGroupRule(this, 'rds-sg-mysql', {
      type: 'ingress',
      fromPort: dbPort,
      toPort: dbPort,
      protocol: 'tcp',
      sourceSecurityGroupId: this.publicInstanceSg.id,
      securityGroupId: this.rdsSg.id,
      description: 'Allow MySQL from public instances',
    });
  }
}

// Compute Module
export interface ComputeModuleConfig {
  projectName: string;
  publicSubnetIds: string[];
  securityGroupId: string;
  instanceType: string;
  amiId: string;
  tags: { [key: string]: string };
}

export class ComputeModule extends Construct {
  public readonly instanceIds: string[];

  constructor(scope: Construct, id: string, config: ComputeModuleConfig) {
    super(scope, id);

    // IAM Role for EC2 instances
    const instanceRole = new IamRole(this, 'instance-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        ...config.tags,
        Name: `${config.projectName}-instance-role`,
      },
    });

    // Attach minimal policies for SSM and CloudWatch
    new IamRolePolicyAttachment(this, 'ssm-policy', {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new IamRolePolicyAttachment(this, 'cloudwatch-policy', {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      role: instanceRole.name,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-instance-profile`,
      },
    });

    // Create instances
    const instances: Instance[] = [];
    config.publicSubnetIds.forEach((subnetId, index) => {
      const instance = new Instance(this, `public-instance-${index + 1}`, {
        ami: config.amiId,
        instanceType: config.instanceType,
        subnetId: subnetId,
        vpcSecurityGroupIds: [config.securityGroupId],
        iamInstanceProfile: instanceProfile.name,
        associatePublicIpAddress: true,
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
        tags: {
          ...config.tags,
          Name: `${config.projectName}-public-instance-${index + 1}`,
        },
      });
      instances.push(instance);
    });

    this.instanceIds = instances.map(i => i.id);
  }
}

// Database Module
export interface DatabaseModuleConfig {
  projectName: string;
  privateSubnetIds: string[];
  vpcSecurityGroupIds: string[];
  dbInstanceClass: string;
  allocatedStorage: number;
  backupRetentionPeriod: number;
  deletionProtection: boolean;
  kmsKeyId?: string;
  tags: { [key: string]: string };
}

export class DatabaseModule extends Construct {
  public readonly endpoint: string;
  public readonly port: number = 3306;
  public readonly instanceId: string;

  constructor(scope: Construct, id: string, config: DatabaseModuleConfig) {
    super(scope, id);

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      subnetIds: config.privateSubnetIds,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-subnet-group`,
      },
    });

    // RDS Instance
    const dbInstance = new DbInstance(this, 'mysql-instance', {
      identifier: `${config.projectName}-mysql`,
      engine: 'mysql',
      instanceClass: config.dbInstanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      ...(config.kmsKeyId && { kmsKeyId: config.kmsKeyId }), // Only set if provided
      username: 'admin',
      manageMasterUserPassword: true, // AWS-managed credentials
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds,
      multiAz: true,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: config.deletionProtection,
      skipFinalSnapshot: !config.deletionProtection,
      finalSnapshotIdentifier: config.deletionProtection
        ? `${config.projectName}-mysql-final-snapshot`
        : undefined,
      applyImmediately: false,
      autoMinorVersionUpgrade: true,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      lifecycle: {
        preventDestroy: config.deletionProtection,
      },
      tags: {
        ...config.tags,
        Name: `${config.projectName}-mysql`,
      },
    });

    this.endpoint = dbInstance.endpoint;
    this.instanceId = dbInstance.id;
  }
}

// Storage Module
export interface StorageModuleConfig {
  projectName: string;
  tags: { [key: string]: string };
}

export class StorageModule extends Construct {
  public readonly bucketName: string;
  public readonly bucketArn: string;

  constructor(scope: Construct, id: string, config: StorageModuleConfig) {
    super(scope, id);

    // Use a fixed suffix for deterministic bucket names in test/CI
    const uniqueSuffix = '0001';
    const bucketName = `${config.projectName}-app-logs-${uniqueSuffix}`;

    // S3 Bucket for application logs
    const bucket = new S3Bucket(this, 'app-logs-bucket', {
      bucket: bucketName,
      forceDestroy: true, // Allow destruction even with objects
      lifecycle: {
        preventDestroy: false, // Change to true for production
        createBeforeDestroy: true,
      },
      tags: {
        ...config.tags,
        Name: `${config.projectName}-app-logs`,
      },
    });

    // Ensure these are set after bucket creation
    this.bucketName = bucket.bucket;
    this.bucketArn = bucket.arn;

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });
  }
}

// Monitoring Module
export interface MonitoringModuleConfig {
  projectName: string;
  vpcId: string;
  tags: { [key: string]: string };
}

export class MonitoringModule extends Construct {
  public readonly flowLogsGroup: CloudwatchLogGroup;
  public readonly flowLogsGroupName: string;

  constructor(scope: Construct, id: string, config: MonitoringModuleConfig) {
    super(scope, id);

    // CloudWatch Log Group for VPC Flow Logs
    this.flowLogsGroup = new CloudwatchLogGroup(this, 'flow-logs-group', {
      name: `/aws/vpc/flowlogs/${config.projectName}`,
      retentionInDays: 7,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-flow-logs`,
      },
    });
    this.flowLogsGroupName = this.flowLogsGroup.name;
  }
}

// Parameter Store Module
export interface ParameterStoreModuleConfig {
  projectName: string;
  dbEndpoint: string;
  dbPort: string;
  tags: { [key: string]: string };
}

export class ParameterStoreModule extends Construct {
  public readonly dbEndpointParameterArn: string;
  public readonly dbEndpointParameterName: string;
  public readonly dbPortParameterArn: string;
  public readonly dbPortParameterName: string;
  public readonly dbCredentialsRefParameterArn: string;
  public readonly dbCredentialsRefParameterName: string;

  constructor(
    scope: Construct,
    id: string,
    config: ParameterStoreModuleConfig
  ) {
    super(scope, id);

    // DB Endpoint Parameter
    const dbEndpointParam = new SsmParameter(this, 'db-endpoint-param', {
      name: `/${config.projectName}/db/endpoint`,
      type: 'String',
      value: config.dbEndpoint,
      description: 'RDS MySQL endpoint',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-endpoint`,
      },
    });
    this.dbEndpointParameterArn = dbEndpointParam.arn;
    this.dbEndpointParameterName = dbEndpointParam.name;

    // DB Port Parameter
    const dbPortParam = new SsmParameter(this, 'db-port-param', {
      name: `/${config.projectName}/db/port`,
      type: 'String',
      value: config.dbPort,
      description: 'RDS MySQL port',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-port`,
      },
    });
    this.dbPortParameterArn = dbPortParam.arn;
    this.dbPortParameterName = dbPortParam.name;

    // DB Credentials Reference Parameter (placeholder)
    const dbCredsRefParam = new SsmParameter(this, 'db-creds-ref-param', {
      name: `/${config.projectName}/db/credentials-ref`,
      type: 'String',
      value: 'Use AWS Secrets Manager integration with RDS for credentials',
      description: 'Reference to RDS credentials managed by AWS',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-credentials-ref`,
      },
    });
    this.dbCredentialsRefParameterArn = dbCredsRefParam.arn;
    this.dbCredentialsRefParameterName = dbCredsRefParam.name;
  }
}
