import {
  Duration,
  aws_ec2 as ec2,
  aws_kms as kms,
  aws_rds as rds,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface PostgresProps {
  vpc: ec2.IVpc;
  kmsKey: kms.IKey;
  idSuffix: string;
}

export class PostgresRds extends Construct {
  public readonly instance: rds.DatabaseInstance;
  constructor(scope: Construct, id: string, props: PostgresProps) {
    super(scope, id);

    if (
      !props.idSuffix ||
      typeof props.idSuffix !== 'string' ||
      props.idSuffix.trim() === ''
    ) {
      throw new Error('idSuffix is required for PostgresRds');
    }
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: props.vpc,
      description: 'RDS SG',
      allowAllOutbound: true,
    }); // no inbound rules by default

    const subnetGroup = new rds.SubnetGroup(this, 'DbSubnets', {
      vpc: props.vpc,
      description: 'DB Isolated Subnets',
      removalPolicy: RemovalPolicy.DESTROY,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.instance = new rds.DatabaseInstance(this, 'Db', {
      instanceIdentifier: `pg-${props.idSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroup,
      securityGroups: [dbSg],
      allocatedStorage: 20,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      publiclyAccessible: false,
      removalPolicy: RemovalPolicy.RETAIN,
      deleteAutomatedBackups: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      multiAz: true,
    });
  }
}
