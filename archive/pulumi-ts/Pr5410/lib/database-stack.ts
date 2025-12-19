import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  dbSecretArn?: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly dbInstanceId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    // Create KMS key for RDS encryption
    const kmsKey = new aws.kms.Key(
      `payment-db-kms-${args.environmentSuffix}`,
      {
        description: 'KMS key for RDS encryption',
        enableKeyRotation: true,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-kms-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-db-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/payment-db-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: args.subnetIds,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-subnet-group-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Fetch database credentials from Secrets Manager
    let dbUsername: pulumi.Input<string> = 'postgres';
    let dbPassword: pulumi.Output<string> = pulumi.secret(
      'temporarypassword123'
    );

    if (args.dbSecretArn) {
      const dbSecret = pulumi.output(
        aws.secretsmanager.getSecretVersion({
          secretId: args.dbSecretArn,
        })
      );

      const secretString = dbSecret.apply(s => JSON.parse(s.secretString));
      dbUsername = secretString.apply(
        (s: { username?: string; password: string }) => s.username || 'postgres'
      );
      dbPassword = pulumi.secret(
        secretString.apply(
          (s: { username?: string; password: string }) => s.password
        )
      ) as pulumi.Output<string>;
    }

    // Create RDS PostgreSQL instance
    const dbInstance = new aws.rds.Instance(
      `payment-db-${args.environmentSuffix}`,
      {
        identifier: `payment-db-${args.environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15.14',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,

        dbName: 'paymentdb',
        username: dbUsername,
        password: dbPassword,

        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],

        multiAz: true,
        publiclyAccessible: false,

        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'mon:04:00-mon:05:00',

        skipFinalSnapshot: true,
        deletionProtection: false, // Must be destroyable for testing

        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],

        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.dbEndpoint = dbInstance.endpoint;
    this.dbInstanceId = dbInstance.id;

    this.registerOutputs({
      dbEndpoint: this.dbEndpoint,
      dbInstanceId: this.dbInstanceId,
    });
  }
}
