import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly credentials: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create database credentials
    this.credentials = new rds.DatabaseSecret(
      this,
      `DBSecret-${props.environmentSuffix}`,
      {
        username: 'dbadmin',
        secretName: `db-credentials-${props.environmentSuffix}`,
      }
    );

    // FIX 2: Parse RDS instance type from config string
    const instanceParts = props.config.rdsInstanceClass.split('.');
    const instanceClass =
      instanceParts[1].toUpperCase() as keyof typeof ec2.InstanceClass;
    const instanceSize =
      instanceParts[2].toUpperCase() as keyof typeof ec2.InstanceSize;

    // Create RDS instance
    this.database = new rds.DatabaseInstance(
      this,
      `Database-${props.environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14_15,
        }),
        // FIX 2: Use parsed instance type from config
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass[instanceClass],
          ec2.InstanceSize[instanceSize]
        ),
        credentials: rds.Credentials.fromSecret(this.credentials),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [props.securityGroup],
        multiAz: props.config.rdsMultiAz,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        // FIX 1: Enable RDS storage encryption
        storageEncrypted: true,
        backupRetention: cdk.Duration.days(props.config.rdsBackupRetention),
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
        databaseName: 'analytics',
      }
    );

    cdk.Tags.of(this.database).add(
      'Name',
      `database-${props.environmentSuffix}`
    );
  }
}
