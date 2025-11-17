import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  kmsKey: kms.IKey;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { environmentSuffix, vpc, kmsKey } = props;

    const dbSg = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Aurora cluster',
        securityGroupName: `dr-db-sg-${environmentSuffix}-${this.region}`,
      }
    );

    dbSg.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'PostgreSQL access from VPC'
    );

    this.cluster = new rds.DatabaseCluster(
      this,
      `Cluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_6,
        }),
        writer: rds.ClusterInstance.serverlessV2(`Writer-${environmentSuffix}`),
        readers: [
          rds.ClusterInstance.serverlessV2(`Reader-${environmentSuffix}`, {
            scaleWithWriter: true,
          }),
        ],
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 2,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [dbSg],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        clusterIdentifier: `dr-aurora-${environmentSuffix}-${this.region}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    cdk.Tags.of(this.cluster).add('Name', `dr-aurora-${environmentSuffix}`);
    cdk.Tags.of(this.cluster).add('Environment', environmentSuffix);
    cdk.Tags.of(this.cluster).add('Backup', 'true');
  }
}
