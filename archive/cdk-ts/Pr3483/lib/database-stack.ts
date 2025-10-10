import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Database Security Group
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for RDS PostgreSQL database',
        allowAllOutbound: false,
      }
    );

    // Database Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for wiki database',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS PostgreSQL Database
    this.database = new rds.DatabaseInstance(this, 'WikiDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [this.dbSecurityGroup],
      allocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      databaseName: 'wikidb',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      backupRetention: cdk.Duration.days(14),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_12,
      cloudwatchLogsExports: ['postgresql'],
      autoMinorVersionUpgrade: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable Database Insights (new feature)
    const cfnDatabase = this.database.node.defaultChild as rds.CfnDBInstance;
    cfnDatabase.addPropertyOverride('EnableCloudwatchLogsExports', [
      'postgresql',
    ]);
    cfnDatabase.addPropertyOverride('DatabaseInsightsMode', 'standard');

    // Tags
    cdk.Tags.of(this.database).add(
      'Name',
      `WikiDatabase-${props.environmentSuffix}`
    );
    cdk.Tags.of(this.database).add('Environment', props.environmentSuffix);
  }
}
