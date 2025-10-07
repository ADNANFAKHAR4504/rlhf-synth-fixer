import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  isReplica: boolean;
  replicationSourceIdentifier?: string;
  sourceDatabaseInstance?: rds.IDatabaseInstance;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance:
    | rds.DatabaseInstance
    | rds.DatabaseInstanceReadReplica;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create a security group for the RDS instance
    const dbSg = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow database access from EC2 instances',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from EC2 instances in the VPC
    dbSg.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow database traffic from within the VPC'
    );

    // Also allow from all private subnets explicitly
    props.vpc.privateSubnets.forEach((subnet, index) => {
      dbSg.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(5432),
        `Allow database traffic from private subnet ${index + 1}`
      );
    });

    // Create a parameter group
    const parameterGroup = new rds.ParameterGroup(this, 'DbParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_8,
      }),
      description: 'Parameter group for PostgreSQL 15.8',
      parameters: {
        log_statement: 'all', // Log all SQL statements for debugging
        log_min_duration_statement: '1000', // Log statements running longer than 1s
      },
    });

    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    if (props.isReplica && props.sourceDatabaseInstance) {
      // Create a read replica in the standby region
      this.dbInstance = new rds.DatabaseInstanceReadReplica(
        this,
        'DbReadReplica',
        {
          sourceDatabaseInstance: props.sourceDatabaseInstance,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3,
            ec2.InstanceSize.MEDIUM
          ),
          vpc: props.vpc,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          securityGroups: [dbSg],
          parameterGroup,
          storageEncrypted: true,
          storageEncryptionKey: props.kmsKey,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          instanceIdentifier: `db-replica-${environmentSuffix}`,
        }
      );
    } else {
      // Create the primary database instance
      this.dbInstance = new rds.DatabaseInstance(this, 'DbInstance', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_8,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSg],
        parameterGroup,
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        multiAz: true,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        databaseName: 'appdb',
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
        instanceIdentifier: `db-primary-${environmentSuffix}`,
      });
    }

    // Output the database endpoint
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.instanceEndpoint.hostname,
      description: 'The endpoint of the database',
    });

    // Output the database credentials secret ARN
    if (!props.isReplica && this.dbInstance instanceof rds.DatabaseInstance) {
      new cdk.CfnOutput(this, 'DbCredentialsSecret', {
        value: this.dbInstance.secret?.secretArn || 'No secret available',
        description: 'The ARN of the secret containing database credentials',
      });
    }
  }
}
