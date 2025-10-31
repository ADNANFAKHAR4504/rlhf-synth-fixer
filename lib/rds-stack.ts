import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RDSStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class RDSStack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: RDSStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:rds:RDSStack', name, {}, opts);

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: args.privateSubnetIds,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `rds-subnet-group-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create RDS instance
    const dbInstance = new aws.rds.Instance(
      `postgres-${args.environmentSuffix}`,
      {
        engine: 'postgres',
        engineVersion: '15.13',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        dbName: 'backuptest',
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'Mon:04:00-Mon:05:00',
        skipFinalSnapshot: true,
        storageEncrypted: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `postgres-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.instanceId = dbInstance.id;
    this.endpoint = dbInstance.endpoint;

    this.registerOutputs({
      instanceId: this.instanceId,
      endpoint: this.endpoint,
    });
  }
}
