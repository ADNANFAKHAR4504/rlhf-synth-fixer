import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.IVpc;
  privateSubnets: ec2.ISubnet[];
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    this.encryptionKey = new kms.Key(
      this,
      `DbEncryptionKey-${props.environmentSuffix}`,
      {
        alias: `rds-key-${props.environmentSuffix}`,
        description: `Encryption key for RDS in ${props.region}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pendingWindow: cdk.Duration.days(7),
      }
    );

    const securityGroup = new ec2.SecurityGroup(
      this,
      `DbSecurityGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for RDS PostgreSQL',
        allowAllOutbound: false,
      }
    );

    this.database = new rds.DatabaseInstance(
      this,
      `PostgresDb-${props.environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_3,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.privateSubnets,
        },
        securityGroups: [securityGroup],
        allocatedStorage: 100,
        maxAllocatedStorage: 200,
        storageEncrypted: true,
        storageEncryptionKey: this.encryptionKey,
        multiAz: true,
        databaseName: `fintechdb${props.environmentSuffix.replace(/-/g, '')}`,
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        backupRetention: cdk.Duration.days(7),
      }
    );

    cdk.Tags.of(this.database).add('Region', props.region);
  }
}
