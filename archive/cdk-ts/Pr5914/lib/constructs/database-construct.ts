import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly secret: secretsmanager.Secret;
  public readonly clusterEndpoint: string;
  public readonly readerEndpoint: string;
  public readonly clusterEndpointHostname: string;
  public readonly clusterEndpointPort: number;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create secret for database credentials
    this.secret = new secretsmanager.Secret(
      this,
      `db-credentials-${props.environmentSuffix}`,
      {
        secretName: `aurora-credentials-${props.environmentSuffix}`,
        description: 'Aurora PostgreSQL database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'postgres' }),
          generateStringKey: 'password',
          excludePunctuation: true,
          includeSpace: false,
          passwordLength: 32,
        },
      }
    );

    // Disable automatic rotation
    // Note: CDK doesn't enable rotation by default, so we don't need to explicitly disable it

    // Create custom parameter group with max_connections=1000
    const parameterGroup = new rds.ParameterGroup(
      this,
      `db-params-${props.environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_13,
        }),
        description: 'Custom parameter group with max_connections=1000',
        parameters: {
          max_connections: '1000',
        },
      }
    );

    // Create Aurora PostgreSQL cluster
    this.cluster = new rds.DatabaseCluster(
      this,
      `aurora-cluster-${props.environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${props.environmentSuffix}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_13,
        }),
        credentials: rds.Credentials.fromSecret(this.secret),
        writer: rds.ClusterInstance.provisioned(
          `writer-${props.environmentSuffix}`,
          {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.R5,
              ec2.InstanceSize.LARGE
            ),
            publiclyAccessible: false,
          }
        ),
        readers: [
          rds.ClusterInstance.provisioned(
            `reader-1-${props.environmentSuffix}`,
            {
              instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.R5,
                ec2.InstanceSize.LARGE
              ),
              publiclyAccessible: false,
            }
          ),
          rds.ClusterInstance.provisioned(
            `reader-2-${props.environmentSuffix}`,
            {
              instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.R5,
                ec2.InstanceSize.LARGE
              ),
              publiclyAccessible: false,
            }
          ),
        ],
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [props.securityGroup],
        parameterGroup: parameterGroup,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: 7,
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow clean destruction
      }
    );

    this.clusterEndpoint = this.cluster.clusterEndpoint.socketAddress;
    this.readerEndpoint = this.cluster.clusterReadEndpoint.socketAddress;
    this.clusterEndpointHostname = this.cluster.clusterEndpoint.hostname;
    this.clusterEndpointPort = this.cluster.clusterEndpoint.port;

    // Tag resources
    cdk.Tags.of(this.cluster).add('Environment', 'production');
    cdk.Tags.of(this.cluster).add('MigrationProject', '2024Q1');
    cdk.Tags.of(this.secret).add('Environment', 'production');
    cdk.Tags.of(this.secret).add('MigrationProject', '2024Q1');
    cdk.Tags.of(parameterGroup).add('Environment', 'production');
    cdk.Tags.of(parameterGroup).add('MigrationProject', '2024Q1');
  }
}
