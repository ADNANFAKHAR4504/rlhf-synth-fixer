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
  uniqueId: string;
}

export class RDSStack extends pulumi.ComponentResource {
  public readonly endpoint: pulumi.Output<string>;
  public readonly instanceId: pulumi.Output<string>;

  constructor(name: string, args: RDSStackArgs, opts?: ResourceOptions) {
    super('tap:rds:RDSStack', name, args, opts);

    // RDS Subnet Group
    const rdsSubnetGroupName = `${args.namePrefix}-rds-subnet-main-${args.uniqueId}`;
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      rdsSubnetGroupName,
      {
        name: rdsSubnetGroupName,
        subnetIds: aws.ec2
          .getSubnets({
            filters: [
              {
                name: 'default-for-az',
                values: ['true'],
              },
            ],
          })
          .then(subnets => subnets.ids),
        tags: {
          ...args.tags,
          ResourceType: 'RDSSubnetGroup',
          Purpose: 'DatabaseSubnets',
        },
      },
      { parent: this }
    );

    // RDS Parameter Group for security configurations
    const rdsParameterGroupName = `${args.namePrefix}-rds-params-secure-${args.uniqueId}`;
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
      { parent: this }
    );

    // RDS Instance with encryption at rest using AWS-managed KMS key
    const rdsInstanceName = `${args.namePrefix}-rds-primary-${args.uniqueId}`;

    // Create a dedicated security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-security-group',
      {
        name: `${rdsInstanceName}-sg`,
        description: 'Security group for RDS instance',
        vpcId: aws.ec2.getVpc({ default: true }).then(vpc => vpc.id),
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
      { parent: this }
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
      { parent: this }
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
        kmsKeyId: 'alias/aws/rds', // AWS-managed KMS key for RDS

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
      { parent: this }
    );

    this.endpoint = rdsInstance.endpoint;
    this.instanceId = rdsInstance.id;

    this.registerOutputs({
      endpoint: this.endpoint,
      instanceId: this.instanceId,
    });
  }
}
