import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc, securityGroup } = props;

    // Create database credentials secret
    this.secret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials for PostgreSQL',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 16,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for LocalStack testing
    });

    // Create subnet group for RDS
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create parameter group for PostgreSQL
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        description: 'Parameter group for PostgreSQL 15',
      }
    );

    // Create the RDS instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(this.secret),
      vpc,
      securityGroups: [securityGroup],
      subnetGroup,
      parameterGroup,
      multiAz: false, // Disabled for LocalStack compatibility
      storageEncrypted: true, // Enable encryption at rest
      storageEncryptionKey: undefined, // Use default AWS managed key
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      deleteAutomatedBackups: false,
      databaseName: 'devdb',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      enablePerformanceInsights: false, // Disabled for LocalStack compatibility
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for LocalStack testing
    });

    // Tag database resources
    cdk.Tags.of(this.database).add(
      'Name',
      `rds-postgres-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.database).add('Purpose', 'DevDatabase');
    cdk.Tags.of(this.database).add('Environment', environmentSuffix);
    cdk.Tags.of(this.database).add('Region', region);
    cdk.Tags.of(this.database).add('Engine', 'PostgreSQL');

    cdk.Tags.of(this.secret).add(
      'Name',
      `db-secret-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.secret).add('Purpose', 'DatabaseCredentials');

    cdk.Tags.of(subnetGroup).add(
      'Name',
      `db-subnet-group-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(parameterGroup).add(
      'Name',
      `db-param-group-${environmentSuffix}-${region}`
    );
  }
}
