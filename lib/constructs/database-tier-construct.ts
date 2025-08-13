import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * Database Tier Construct that creates a highly available RDS instance
 * with Multi-AZ deployment and automated backups
 */
export class DatabaseTierConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.Vpc, config: StackConfig) {
    super(scope, id);

    // Create security group for RDS database
    // This follows the principle of least privilege
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description:
          'Security group for RDS database - allows MySQL/Aurora access from application tier',
        allowAllOutbound: false, // Explicitly deny all outbound traffic
      }
    );

    // Create DB subnet group using isolated subnets for maximum security
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database in isolated subnets',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Generate a secure random password for the database
    const databaseCredentials = rds.Credentials.fromGeneratedSecret('admin', {
      excludeCharacters: '"@/\\',
    });

    // Create RDS database instance with high availability configuration
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_37,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      credentials: databaseCredentials,

      // High availability and backup configuration
      multiAz: config.database.multiAz,
      allocatedStorage: config.database.allocatedStorage,
      storageType: rds.StorageType.GP2,
      storageEncrypted: config.database.storageEncrypted,

      // Backup and maintenance configuration
      backupRetention: cdk.Duration.days(config.database.backupRetention),
      deleteAutomatedBackups: false,
      deletionProtection: config.database.deletionProtection,

      // Network configuration
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [this.databaseSecurityGroup],

      // Monitoring and logging
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: config.database.performanceInsights,
      ...(config.database.performanceInsights && {
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      }),

      // Maintenance window (during low-traffic hours)
      preferredMaintenanceWindow: 'sun:03:00-sun:04:00',
      preferredBackupWindow: '02:00-03:00',

      // Parameter group for optimization
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DefaultParameterGroup',
        'default.mysql8.0'
      ),
    });

    // Apply comprehensive tagging
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.database).add(key, value);
      cdk.Tags.of(this.databaseSecurityGroup).add(key, value);
    });

    cdk.Tags.of(this.database).add(
      'Name',
      `MultiRegionApp-Database-${config.region}`
    );
    cdk.Tags.of(this.databaseSecurityGroup).add(
      'Name',
      `MultiRegionApp-DB-SG-${config.region}`
    );
  }

  /**
   * Allow inbound connections from application tier security group
   * This method should be called after the application tier is created
   */
  public allowConnectionsFrom(
    applicationSecurityGroup: ec2.SecurityGroup
  ): void {
    this.databaseSecurityGroup.addIngressRule(
      applicationSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application tier'
    );
  }
}
