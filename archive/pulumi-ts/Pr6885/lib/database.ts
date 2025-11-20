import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseProps {
  environment: string;
  environmentSuffix: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  kmsKey: aws.kms.Key;
}

export class DatabaseComponent extends pulumi.ComponentResource {
  public cluster: aws.rds.Cluster;
  public clusterInstance: aws.rds.ClusterInstance;

  constructor(
    name: string,
    props: DatabaseProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:DatabaseComponent', name, {}, opts);

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${props.environment}-${props.environmentSuffix}`,
      {
        subnetIds: props.subnetIds,
        tags: {
          Name: `payments-db-subnet-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Retrieve database password from Secrets Manager
    const dbPasswordSecret = aws.secretsmanager.getSecretVersionOutput({
      secretId: 'payments/db/master-password',
    });

    // Create Aurora Serverless v2 cluster
    this.cluster = new aws.rds.Cluster(
      `aurora-cluster-${props.environment}-${props.environmentSuffix}`,
      {
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '15.8',
        databaseName: 'payments',
        masterUsername: 'dbadmin',
        masterPassword: dbPasswordSecret.apply(
          secret => secret.secretString || 'PaymentAdm1n!Temp'
        ),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [props.securityGroupId],
        storageEncrypted: true,
        kmsKeyId: props.kmsKey.arn,
        backupRetentionPeriod: 1,
        skipFinalSnapshot: true,
        deletionProtection: false,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 1,
        },
        tags: {
          Name: `payments-aurora-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Create cluster instance
    this.clusterInstance = new aws.rds.ClusterInstance(
      `aurora-instance-${props.environment}-${props.environmentSuffix}`,
      {
        clusterIdentifier: this.cluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        tags: {
          Name: `payments-aurora-instance-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      clusterId: this.cluster.id,
      clusterEndpoint: this.cluster.endpoint,
      clusterArn: this.cluster.arn,
    });
  }
}
