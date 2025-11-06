import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly databaseCluster: rds.DatabaseCluster;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);
    const minCapacity = 2;
    const maxCapacity = 4;
    const backupRetentionDays = 14;

    // Create database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `streamflix-db-credentials-${props.environmentSuffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Create Aurora Serverless v2 PostgreSQL cluster for faster provisioning
    this.databaseCluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_10,
      }),
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: minCapacity,
      serverlessV2MaxCapacity: maxCapacity,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.databaseSecurityGroup],
      defaultDatabaseName: 'streamflix',
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(backupRetentionDays),
      },
    });

    // Output database configuration
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseCluster.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'DatabaseCapacity', {
      value: `Min: ${minCapacity} ACU, Max: ${maxCapacity} ACU`,
      description: 'Aurora Serverless v2 capacity configuration',
    });

    new cdk.CfnOutput(this, 'DatabaseBackupRetention', {
      value: `${backupRetentionDays} days`,
      description: 'Backup retention period',
    });
  }
}
