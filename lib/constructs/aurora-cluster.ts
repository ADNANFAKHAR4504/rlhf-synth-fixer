import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AuroraClusterProps {
  vpc: ec2.IVpc;
  isPrimary: boolean;
  globalClusterIdentifier?: string;
  secret: secretsmanager.ISecret;
  encryptionKey: kms.IKey;
}

export class AuroraClusterConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly globalClusterIdentifier: string;

  constructor(scope: Construct, id: string, props: AuroraClusterProps) {
    super(scope, id);

    // Create subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'SubnetGroup', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      description: 'Subnet group for Aurora cluster',
    });

    // Create parameter group
    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7,
      }),
      parameters: {
        shared_preload_libraries: 'pg_stat_statements',
        log_statement: 'all',
        log_duration: '1',
        ssl: '1',
        ssl_min_protocol_version: 'TLSv1.2',
      },
    });

    // Create security group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Aurora cluster',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from within VPC
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'PostgreSQL from VPC'
    );

    // For cross-region replication (if needed)
    if (!props.isPrimary && props.globalClusterIdentifier) {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4('10.0.0.0/8'),
        ec2.Port.tcp(5432),
        'Cross-region replication'
      );
    }

    if (props.isPrimary && !props.globalClusterIdentifier) {
      // Create global cluster if this is the primary
      const globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: `aurora-dr-global-${Date.now()}`,
        sourceDbClusterIdentifier: undefined,
        engine: 'aurora-postgresql',
        engineVersion: '13.7',
        storageEncrypted: true,
      });
      this.globalClusterIdentifier = globalCluster.ref;
    } else {
      this.globalClusterIdentifier = props.globalClusterIdentifier!;
    }

    // Create the Aurora cluster
    this.cluster = new rds.DatabaseCluster(this, 'Cluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7,
      }),
      credentials: rds.Credentials.fromSecret(props.secret),
      instanceProps: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc: props.vpc,
        securityGroups: [securityGroup],
        parameterGroup,
      },
      instances: 2, // Start with 2 instances
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      storageEncrypted: true,
      storageEncryptionKey: props.encryptionKey,
      parameterGroup,
      subnetGroup,
      copyTagsToSnapshot: true,
      cloudwatchLogsExports: ['postgresql'],
      enableDataApi: true,
    });

    // Note: Aurora auto-scaling for provisioned instances is managed through AWS Console or CloudFormation
    // CDK DatabaseCluster construct uses fixed instance count specified in 'instances' property
    // For production, consider Aurora Serverless v2 for automatic scaling

    // Associate with global cluster
    if (this.globalClusterIdentifier) {
      const cfnCluster = this.cluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier = this.globalClusterIdentifier;

      if (!props.isPrimary) {
        // For secondary clusters, don't create a master user
        cfnCluster.masterUsername = undefined;
        cfnCluster.masterUserPassword = undefined;
      }
    }
  }
}
