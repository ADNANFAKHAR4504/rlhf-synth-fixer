import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  databaseSecret: secretsmanager.Secret;
  sourceDatabase?: rds.DatabaseCluster;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create security group for database
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        description: `Database security group for ${props.regionName}`,
        allowAllOutbound: false,
      }
    );

    // Create subnet group for database in isolated subnets
    // Note: CDK automatically creates a subnet group when using vpcSubnets in the cluster definition
    // This explicit subnet group is not needed and will be commented out
    // const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
    //   description: `Subnet group for database in ${props.regionName}`,
    //   vpc: props.vpc,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    //   },
    // });

    if (props.regionName === 'primary') {
      // Create primary Aurora Serverless v2 cluster
      this.cluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_5,
        }),
        credentials: rds.Credentials.fromSecret(props.databaseSecret),
        writer: rds.ClusterInstance.serverlessV2('Writer', {
          autoMinorVersionUpgrade: true,
        }),
        readers: [
          rds.ClusterInstance.serverlessV2('Reader1', {
            scaleWithWriter: true,
            autoMinorVersionUpgrade: true,
          }),
        ],
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 4,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
        deletionProtection: false, // Changed to false for testing - enable in production
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed for testing - use SNAPSHOT in production
      });

      // Enable Performance Insights
      this.cluster.node.children.forEach(child => {
        if (child instanceof rds.CfnDBInstance) {
          child.enablePerformanceInsights = true;
          child.performanceInsightsKmsKeyId = props.kmsKey.keyArn;
          child.performanceInsightsRetentionPeriod = 7;
        }
      });
    } else {
      // Create DR cluster as read replica
      this.cluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_5,
        }),
        credentials: rds.Credentials.fromSecret(props.databaseSecret),
        writer: rds.ClusterInstance.serverlessV2('Writer', {
          autoMinorVersionUpgrade: true,
        }),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 4,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
        deletionProtection: false, // Changed to false for testing - enable in production
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed for testing - use SNAPSHOT in production
      });
    }

    // Add tags
    cdk.Tags.of(this.cluster).add('Name', `healthcare-db-${props.regionName}`);
    cdk.Tags.of(this.cluster).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.cluster).add('Region', props.regionName);
  }
}
