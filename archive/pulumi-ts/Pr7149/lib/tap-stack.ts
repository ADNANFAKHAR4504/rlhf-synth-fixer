import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { BackupStack } from './backup-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly staticBucketName: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Security resources (KMS keys for encryption)
    const securityStack = new SecurityStack(
      'security',
      { environmentSuffix, tags },
      { parent: this }
    );

    // 2. Network infrastructure (VPC, subnets, NAT gateways, VPC endpoints)
    const networkStack = new NetworkStack(
      'network',
      { environmentSuffix, tags },
      { parent: this }
    );

    // 3. Storage (S3 buckets with encryption)
    const storageStack = new StorageStack(
      'storage',
      {
        environmentSuffix,
        tags,
        kmsKeyId: securityStack.s3KmsKey.arn,
      },
      { parent: this }
    );

    // 4. Database (Aurora PostgreSQL cluster)
    const databaseStack = new DatabaseStack(
      'database',
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.vpcId,
        privateSubnetIds: networkStack.privateSubnetIds,
        kmsKeyId: securityStack.rdsKmsKey.arn,
      },
      { parent: this }
    );

    // 5. Monitoring (CloudWatch Log Groups)
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        tags,
        kmsKeyId: securityStack.cloudwatchKmsKey.arn,
      },
      { parent: this }
    );

    // 6. Compute (ECS Fargate, ALB, WAF)
    const computeStack = new ComputeStack(
      'compute',
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.vpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        ecsTaskRole: securityStack.ecsTaskRole,
        ecsExecutionRole: securityStack.ecsExecutionRole,
        logGroupName: monitoringStack.ecsLogGroupName,
        databaseEndpoint: databaseStack.clusterEndpoint,
        staticBucketName: storageStack.staticBucketName,
      },
      { parent: this }
    );

    // 7. Backup (AWS Backup plans for RDS)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const backupStack = new BackupStack(
      'backup',
      {
        environmentSuffix,
        tags,
        clusterArn: databaseStack.clusterArn,
      },
      { parent: this }
    );

    // Export outputs
    this.albDnsName = computeStack.albDnsName;
    this.clusterEndpoint = databaseStack.clusterEndpoint;
    this.staticBucketName = storageStack.staticBucketName;
    this.auditBucketName = storageStack.auditBucketName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterEndpoint: this.clusterEndpoint,
      staticBucketName: this.staticBucketName,
      auditBucketName: this.auditBucketName,
    });
  }
}
