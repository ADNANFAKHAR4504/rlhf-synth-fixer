import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { VpcStack } from './vpc-stack';

export interface RdsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcStack: VpcStack;
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly dbInstance: aws.rds.Instance;
  public readonly dbEndpoint: pulumi.Output<string>;

  constructor(name: string, args: RdsStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:rds:RdsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create RDS instance with gp2 storage and automatic backups
    this.dbInstance = new aws.rds.Instance(
      `tap-db-${environmentSuffix}`,
      {
        identifier: `tap-db-${environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro', // Cost-effective for development
        allocatedStorage: 20,
        storageType: 'gp2', // Required storage type
        storageEncrypted: true,

        dbName: 'tapapp',
        username: 'admin',
        password: 'changeme123!', // In production, use AWS Secrets Manager

        // Backup configuration
        backupRetentionPeriod: 7, // At least 7 days as required
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',

        // Network configuration
        dbSubnetGroupName: args.vpcStack.dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.vpcStack.dbSecurityGroup.id],

        // Performance and monitoring
        monitoringInterval: 0, // Disabled for cost savings
        performanceInsightsEnabled: false,

        // Deletion protection (set to false for development)
        deletionProtection: false,
        skipFinalSnapshot: true,

        tags: {
          Name: `tap-db-${environmentSuffix}`,
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    this.dbEndpoint = this.dbInstance.endpoint;

    this.registerOutputs({
      dbEndpoint: this.dbEndpoint,
      dbPort: this.dbInstance.port,
    });
  }
}
