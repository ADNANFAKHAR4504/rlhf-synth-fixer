/**
 * rds-stack.ts
 *
 * This module defines the RDSStack component for creating secure RDS instances
 * with AWS-managed KMS encryption and production-ready configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface RDSStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  namePrefix: string;
}

export class RDSStack extends pulumi.ComponentResource {
  public readonly endpoint: pulumi.Output<string>;
  public readonly instanceId: pulumi.Output<string>;

  constructor(name: string, args: RDSStackArgs, opts?: ResourceOptions) {
    super('tap:rds:RDSStack', name, args, opts);

    // Create VPC for RDS
    const vpc = new aws.ec2.Vpc(
      'rds-vpc',
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...args.tags,
          Name: `${args.namePrefix}-rds-vpc-${args.environmentSuffix}`,
          ResourceType: 'VPC',
          Purpose: 'RDSNetworking',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // Get available AZs for the specific region
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: opts?.provider }
    );

    // Create private subnets for RDS in multiple AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      'rds-private-subnet-1',
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          ...args.tags,
          Name: `${args.namePrefix}-rds-private-subnet-1-${args.environmentSuffix}`,
          ResourceType: 'Subnet',
          Purpose: 'RDSPrivate',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      'rds-private-subnet-2',
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          ...args.tags,
          Name: `${args.namePrefix}-rds-private-subnet-2-${args.environmentSuffix}`,
          ResourceType: 'Subnet',
          Purpose: 'RDSPrivate',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // RDS Subnet Group
    // AWS RDS subnet group names must be lowercase
    const rdsSubnetGroupName =
      `${args.namePrefix}-rds-subnet-main-${args.environmentSuffix}`.toLowerCase();
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      rdsSubnetGroupName,
      {
        name: rdsSubnetGroupName,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          ...args.tags,
          ResourceType: 'RDSSubnetGroup',
          Purpose: 'DatabaseSubnets',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // RDS Parameter Group for security configurations
    // AWS RDS parameter group names must be lowercase and can contain letters, numbers, and hyphens
    const rdsParameterGroupName =
      `${args.namePrefix}-rds-params-secure-${args.environmentSuffix}`.toLowerCase();
    const rdsParameterGroup = new aws.rds.ParameterGroup(
      rdsParameterGroupName,
      {
        name: rdsParameterGroupName,
        family: 'postgres15',
        description: 'Secure parameter group for PostgreSQL',
        parameters: [
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
        ],
        tags: {
          ...args.tags,
          ResourceType: 'RDSParameterGroup',
          Purpose: 'DatabaseSecurity',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // RDS Instance with encryption at rest using AWS-managed KMS key
    // AWS RDS instance identifiers must be lowercase
    const rdsInstanceName =
      `${args.namePrefix}-rds-primary-${args.environmentSuffix}`.toLowerCase();

    // Create a dedicated security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-security-group',
      {
        name: `${rdsInstanceName}-sg`,
        description: 'Security group for RDS instance',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/8'], // Restrict to private networks only
            description: 'PostgreSQL access from private networks',
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
          ...args.tags,
          ResourceType: 'SecurityGroup',
          Purpose: 'RDSAccess',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // Create RDS Enhanced Monitoring Role
    const rdsMonitoringRole = new aws.iam.Role(
      'rds-monitoring-role',
      {
        name: `${rdsInstanceName}-monitoring-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        ],
        tags: {
          ...args.tags,
          ResourceType: 'IAMRole',
          Purpose: 'RDSMonitoring',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    const rdsInstance = new aws.rds.Instance(
      rdsInstanceName,
      {
        identifier: rdsInstanceName,
        engine: 'postgres',
        engineVersion: '15.7', // Updated to latest stable version
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,

        // Database configuration
        dbName: 'corpdb',
        username: 'dbadmin',
        manageMasterUserPassword: true, // Correct property for AWS-managed passwords

        // Security configurations
        storageEncrypted: true,
        // Using default AWS-managed KMS key for RDS (omitting kmsKeyId uses aws/rds key)

        // Network and access - use dedicated security group
        dbSubnetGroupName: rdsSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        publiclyAccessible: false, // Ensure RDS is not publicly accessible

        // Backup and maintenance
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',

        // Production settings
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `${rdsInstanceName}-final-snapshot`,
        deletionProtection: true,

        // Parameter group
        parameterGroupName: rdsParameterGroup.name,

        // Monitoring - Enhanced monitoring with proper role
        monitoringInterval: 60,
        monitoringRoleArn: rdsMonitoringRole.arn,
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,

        tags: {
          ...args.tags,
          ResourceType: 'RDSInstance',
          Purpose: 'PrimaryDatabase',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    this.endpoint = rdsInstance.endpoint;
    this.instanceId = rdsInstance.identifier;

    this.registerOutputs({
      endpoint: this.endpoint,
      instanceId: this.instanceId,
    });
  }
}
