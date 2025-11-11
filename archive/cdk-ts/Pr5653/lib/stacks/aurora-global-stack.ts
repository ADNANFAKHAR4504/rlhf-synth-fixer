import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { AuroraClusterConstruct } from '../constructs/aurora-cluster';
import { NetworkingConstruct } from '../constructs/networking';

export interface AuroraGlobalStackProps extends cdk.StackProps {
  isPrimary: boolean;
  globalClusterIdentifier?: string;
  environmentSuffix: string;
}

export class AuroraGlobalStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly cluster: rds.DatabaseCluster;
  public readonly globalClusterIdentifier: string;
  public readonly clusterEndpoint: string;
  public readonly dbProxy: rds.DatabaseProxy;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: AuroraGlobalStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      isPrimary: props.isPrimary,
      maxAzs: 3,
      environmentSuffix: suffix,
    });
    this.vpc = networking.vpc;

    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'AuroraEncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for Aurora cluster (${suffix})`,
      alias: `aurora-dr-${props.isPrimary ? 'primary' : 'secondary'}-${suffix}`,
    });

    // Create database credentials secret
    this.secret = new secretsmanager.Secret(this, 'DBSecret', {
      description: `Aurora PostgreSQL admin credentials (${suffix})`,
      secretName: `aurora-dr-${props.isPrimary ? 'primary' : 'secondary'}-secret-${suffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres_admin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey,
    });

    // Create Aurora cluster
    const auroraCluster = new AuroraClusterConstruct(this, 'AuroraCluster', {
      vpc: this.vpc,
      isPrimary: props.isPrimary,
      globalClusterIdentifier: props.globalClusterIdentifier,
      secret: this.secret,
      encryptionKey,
      environmentSuffix: suffix,
    });

    this.cluster = auroraCluster.cluster;
    this.globalClusterIdentifier = auroraCluster.globalClusterIdentifier;
    this.clusterEndpoint = this.cluster.clusterEndpoint.hostname;

    // Create RDS Proxy for connection management
    this.dbProxy = new rds.DatabaseProxy(this, 'DBProxy', {
      proxyTarget: rds.ProxyTarget.fromCluster(this.cluster),
      secrets: [this.secret],
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      requireTLS: true,
      idleClientTimeout: cdk.Duration.minutes(30),
      maxConnectionsPercent: 100,
      maxIdleConnectionsPercent: 50,
      debugLogging: false,
      iamAuth: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint.hostname,
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'ProxyEndpoint', {
      value: this.dbProxy.endpoint,
      exportName: `${this.stackName}-ProxyEndpoint`,
    });

    new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
      value: this.globalClusterIdentifier,
      exportName: `${this.stackName}-GlobalClusterIdentifier`,
    });
  }
}
