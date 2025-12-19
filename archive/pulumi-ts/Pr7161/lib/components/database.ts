import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface DatabaseComponentArgs {
  environment: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  instanceClass: string;
  tags: { [key: string]: string };
}

export class DatabaseComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstances: aws.rds.ClusterInstance[];
  public readonly endpoint: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly instanceClass: string;
  private readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: DatabaseComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:DatabaseComponent', name, {}, opts);

    const resourceOpts = { parent: this };
    this.instanceClass = args.instanceClass;

    // Generate random password
    const dbPassword = new random.RandomPassword(
      `${args.environment}-payment-db-password`,
      {
        length: 32,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      },
      resourceOpts
    );

    // Store password in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `${args.environment}-payment-db-secret`,
      {
        name: `${args.environment}-payment-db-credentials`,
        description: `Database credentials for ${args.environment} environment`,
        tags: args.tags,
      },
      resourceOpts
    );

    // Initial secret version with empty host (will be updated after cluster creation)
    new aws.secretsmanager.SecretVersion(
      `${args.environment}-payment-db-secret-version`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.jsonStringify({
          username: 'paymentadmin',
          password: dbPassword.result,
          engine: 'postgres',
          host: '',
          port: 5432,
          dbname: 'paymentdb',
        }),
      },
      resourceOpts
    );

    this.secretArn = dbSecret.arn;

    // Create DB subnet group (name must be lowercase for AWS RDS)
    const subnetGroupName =
      `${args.environment}-payment-db-subnet-group`.toLowerCase();
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${args.environment}-payment-db-subnet-group`,
      {
        name: subnetGroupName,
        subnetIds: args.privateSubnetIds,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-db-subnet-group`,
        },
      },
      resourceOpts
    );

    // Create security group for RDS
    this.securityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-payment-db-sg`,
      {
        name: `${args.environment}-payment-db-sg`,
        description: 'Security group for RDS Aurora PostgreSQL',
        vpcId: args.vpcId,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/8'],
            description: 'PostgreSQL access from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-db-sg`,
        },
      },
      resourceOpts
    );

    // Create RDS Aurora cluster (identifier must be lowercase for AWS RDS)
    const clusterIdentifier =
      `${args.environment}-payment-db-cluster`.toLowerCase();
    this.cluster = new aws.rds.Cluster(
      `${args.environment}-payment-db-cluster`,
      {
        clusterIdentifier: clusterIdentifier,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '14.6',
        databaseName: 'paymentdb',
        masterUsername: 'paymentadmin',
        masterPassword: dbPassword.result,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [this.securityGroup.id],
        skipFinalSnapshot: true,
        deletionProtection: false,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-db-cluster`,
        },
      },
      resourceOpts
    );

    // Create cluster instances (identifiers must be lowercase for AWS RDS)
    this.clusterInstances = [];
    for (let i = 0; i < 2; i++) {
      const instanceIdentifier =
        `${args.environment}-payment-db-instance-${i}`.toLowerCase();
      const instance = new aws.rds.ClusterInstance(
        `${args.environment}-payment-db-instance-${i}`,
        {
          identifier: instanceIdentifier,
          clusterIdentifier: this.cluster.id,
          instanceClass: args.instanceClass,
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          performanceInsightsEnabled: true,
          tags: {
            ...args.tags,
            Name: `${args.environment}-payment-db-instance-${i}`,
          },
        },
        resourceOpts
      );

      this.clusterInstances.push(instance);
    }

    this.endpoint = this.cluster.endpoint;

    // Update secret with actual endpoint
    this.cluster.endpoint.apply(endpoint => {
      new aws.secretsmanager.SecretVersion(
        `${args.environment}-payment-db-secret-version-updated`,
        {
          secretId: dbSecret.id,
          secretString: pulumi.interpolate`{
          "username": "paymentadmin",
          "password": "${dbPassword.result}",
          "engine": "postgres",
          "host": "${endpoint}",
          "port": 5432,
          "dbname": "paymentdb"
        }`,
        },
        resourceOpts
      );
    });

    this.registerOutputs({
      endpoint: this.endpoint,
      secretArn: this.secretArn,
      instanceClass: this.instanceClass,
    });
  }

  public getSecurityGroupId(): pulumi.Output<string> {
    return this.securityGroup.id;
  }
}
