import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface RdsComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
}

/**
 * RDS Component for PostgreSQL database
 */
export class RdsComponent extends pulumi.ComponentResource {
  public readonly dbInstance: aws.rds.Instance;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly kmsKey: aws.kms.Key;

  constructor(
    name: string,
    args: RdsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:RdsComponent', name, {}, opts);

    const { config, tags, environmentSuffix, vpcId, privateSubnetIds } = args;

    // Create KMS key for encryption
    this.kmsKey = new aws.kms.Key(
      `rds-kms-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption in ${config.environment}`,
        enableKeyRotation: true,
        tags: {
          ...tags,
          Name: `rds-kms-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS alias with unique name per environment suffix
    new aws.kms.Alias(
      `rds-kms-alias-${environmentSuffix}`,
      {
        name: `alias/rds-${environmentSuffix}`,
        targetKeyId: this.kmsKey.keyId,
      },
      { parent: this }
    );

    // Create security group for RDS
    this.securityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: `Security group for RDS PostgreSQL in ${config.environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [config.vpcCidr],
            description: 'PostgreSQL access from VPC',
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
          Name: `rds-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB subnet group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: {
          ...tags,
          Name: `rds-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance
    this.dbInstance = new aws.rds.Instance(
      `postgres-${environmentSuffix}`,
      {
        identifier: `postgres-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15',
        instanceClass: config.rdsInstanceClass,
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        dbName: 'paymentdb',
        username: 'dbadmin',
        password: pulumi.secret('TempPassword123!'), // Should use Secrets Manager in production
        dbSubnetGroupName: this.subnetGroup.name,
        vpcSecurityGroupIds: [this.securityGroup.id],
        backupRetentionPeriod: 1,
        skipFinalSnapshot: true,
        deletionProtection: false,
        publiclyAccessible: false,
        multiAz: false,
        tags: {
          ...tags,
          Name: `postgres-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      dbInstanceId: this.dbInstance.id,
      dbEndpoint: this.dbInstance.endpoint,
    });
  }
}
