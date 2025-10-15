import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  primaryVpc: ec2.Vpc;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Create a secret for database credentials
    const dbCredentials = new secretsmanager.Secret(
      this,
      `DBCredentials${props.environmentSuffix}`,
      {
        secretName: `trading-platform/database-credentials${props.environmentSuffix}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludePunctuation: true,
          passwordLength: 16,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create the global cluster
    this.globalCluster = new rds.CfnGlobalCluster(
      this,
      `GlobalCluster${props.environmentSuffix}`,
      {
        globalClusterIdentifier: `trading-platform-global${props.environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        storageEncrypted: true,
      }
    );

    // Create the primary Aurora cluster in the primary region using Serverless v2
    this.primaryCluster = new rds.DatabaseCluster(
      this,
      `PrimaryCluster${props.environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromSecret(dbCredentials),
        vpc: props.primaryVpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        writer: rds.ClusterInstance.serverlessV2(
          `Writer${props.environmentSuffix}`
        ),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 1,
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        backup: {
          retention: cdk.Duration.days(1),
        },
      }
    );

    // Link the primary cluster to the global cluster
    const cfnPrimaryCluster = this.primaryCluster.node
      .defaultChild as rds.CfnDBCluster;
    cfnPrimaryCluster.globalClusterIdentifier = this.globalCluster.ref;
    cfnPrimaryCluster.addDependency(this.globalCluster);

    // Export DB endpoints and details for integration testing
    new cdk.CfnOutput(
      this,
      `PrimaryClusterEndpoint${props.environmentSuffix}`,
      {
        value: this.primaryCluster.clusterEndpoint.socketAddress,
        exportName: `PrimaryClusterEndpoint${props.environmentSuffix}`,
        description: 'Primary Aurora cluster endpoint (host:port)',
      }
    );

    new cdk.CfnOutput(
      this,
      `PrimaryClusterReadEndpoint${props.environmentSuffix}`,
      {
        value: this.primaryCluster.clusterReadEndpoint.socketAddress,
        exportName: `PrimaryClusterReadEndpoint${props.environmentSuffix}`,
        description: 'Primary Aurora cluster read endpoint (host:port)',
      }
    );

    new cdk.CfnOutput(
      this,
      `PrimaryClusterIdentifier${props.environmentSuffix}`,
      {
        value: this.primaryCluster.clusterIdentifier,
        exportName: `PrimaryClusterIdentifier${props.environmentSuffix}`,
        description: 'Primary Aurora cluster identifier',
      }
    );

    new cdk.CfnOutput(
      this,
      `GlobalClusterIdentifier${props.environmentSuffix}`,
      {
        value: this.globalCluster.ref,
        exportName: `GlobalClusterIdentifier${props.environmentSuffix}`,
        description: 'Aurora Global cluster identifier',
      }
    );

    new cdk.CfnOutput(this, `DBSecretArn${props.environmentSuffix}`, {
      value: dbCredentials.secretArn,
      exportName: `DBSecretArn${props.environmentSuffix}`,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, `DBUsername${props.environmentSuffix}`, {
      value: 'dbadmin',
      exportName: `DBUsername${props.environmentSuffix}`,
      description: 'Database username',
    });

    new cdk.CfnOutput(this, `DBEngine${props.environmentSuffix}`, {
      value: 'aurora-postgresql',
      exportName: `DBEngine${props.environmentSuffix}`,
      description: 'Database engine type',
    });

    new cdk.CfnOutput(this, `DBEngineVersion${props.environmentSuffix}`, {
      value: '15.4',
      exportName: `DBEngineVersion${props.environmentSuffix}`,
      description: 'Database engine version',
    });
  }
}
