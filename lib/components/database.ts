import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { EnvironmentConfig, TagsConfig } from '../types';

export interface DatabaseComponentArgs {
  environmentSuffix: string;
  envConfig: EnvironmentConfig;
  tags: TagsConfig;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
}

export class DatabaseComponent extends pulumi.ComponentResource {
  public readonly kmsKey: aws.kms.Key;
  public readonly kmsAlias: aws.kms.Alias;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly dbInstance: aws.rds.Instance;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly dbArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:DatabaseComponent', name, {}, opts);

    const { environmentSuffix, envConfig, tags, vpcId, privateSubnetIds } =
      args;

    // Create environment-specific KMS key for RDS encryption
    this.kmsKey = new aws.kms.Key(
      `payment-rds-kms-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption in ${envConfig.environment} environment`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: {
          ...tags,
          Purpose: 'rds-encryption',
        },
      },
      { parent: this }
    );

    // Create KMS alias for easier reference
    this.kmsAlias = new aws.kms.Alias(
      `alias/payment-rds-${environmentSuffix}`,
      {
        name: `alias/payment-rds-${environmentSuffix}`,
        targetKeyId: this.kmsKey.id,
      },
      { parent: this }
    );

    // Create security group for RDS
    this.securityGroup = new aws.ec2.SecurityGroup(
      `payment-db-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: `Security group for RDS PostgreSQL in ${envConfig.environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'PostgreSQL from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...tags,
          Name: `payment-db-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB subnet group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: {
          ...tags,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance with encryption
    this.dbInstance = new aws.rds.Instance(
      `payment-db-${environmentSuffix}`,
      {
        engine: 'postgres',
        engineVersion: '15.8',
        instanceClass: envConfig.dbInstanceClass,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        identifier: `payment-db-${environmentSuffix}`,
        dbName: 'payments',
        username: 'dbadmin',
        password:
          new pulumi.Config().getSecret('dbPassword') ||
          pulumi.secret('TemporaryTestPassword123!'),
        dbSubnetGroupName: this.subnetGroup.name,
        vpcSecurityGroupIds: [this.securityGroup.id],
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        storageType: 'gp3',
        backupRetentionPeriod: envConfig.environment === 'prod' ? 7 : 3,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        deleteAutomatedBackups: true,
        multiAz: envConfig.environment === 'prod',
        publiclyAccessible: false,
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
        tags: {
          ...tags,
          Name: `payment-db-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.dbEndpoint = this.dbInstance.endpoint;
    this.dbArn = this.dbInstance.arn;

    this.registerOutputs({
      dbEndpoint: this.dbEndpoint,
      dbArn: this.dbArn,
      kmsKeyId: this.kmsKey.id,
    });
  }
}
