import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  getCommonTags,
  primaryRegion,
  secondaryRegion,
  dbInstanceClass,
} from './config';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';
import { KmsStack } from './kms';

// Detect if running in LocalStack
const isLocalStack = (): boolean => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
};

export class RdsStack extends pulumi.ComponentResource {
  public readonly primaryDbSubnetGroup: aws.rds.SubnetGroup;
  public readonly secondaryDbSubnetGroup: aws.rds.SubnetGroup;
  public readonly primaryRdsInstance: aws.rds.Instance;
  public readonly secondaryRdsReadReplica?: aws.rds.Instance;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      securityGroupsStack: SecurityGroupsStack;
      kmsStack: KmsStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:rds:RdsStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    // Primary region DB subnet group
    this.primaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `${args.environment}-primary-db-subnet-group`,
      {
        name: `${args.environment}-primary-db-subnet-group`,
        subnetIds: [
          args.vpcStack.primaryPrivateSubnet1.id,
          args.vpcStack.primaryPrivateSubnet2.id,
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-DB-Subnet-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region DB subnet group
    this.secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `${args.environment}-secondary-db-subnet-group`,
      {
        name: `${args.environment}-secondary-db-subnet-group`,
        subnetIds: [
          args.vpcStack.secondaryPrivateSubnet1.id,
          args.vpcStack.secondaryPrivateSubnet2.id,
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-DB-Subnet-Group`,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Primary RDS instance
    this.primaryRdsInstance = new aws.rds.Instance(
      `${args.environment}-primary-mysql-db`,
      {
        identifier: `${args.environment}-primary-mysql-database`,
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: args.kmsStack.primaryKmsKey.arn,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: dbInstanceClass,
        dbName: 'productiondb',
        username: 'admin',
        manageMasterUserPassword: true, // Use AWS managed password
        vpcSecurityGroupIds: [
          args.securityGroupsStack.primaryDbSecurityGroup.id,
        ],
        dbSubnetGroupName: this.primaryDbSubnetGroup.name,
        multiAz: true, // Enable Multi-AZ for high availability
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `${args.environment}-primary-mysql-final-snapshot`,
        deletionProtection: true, // Enable deletion protection for production
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-MySQL-Database`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Cross-region read replica (skip in LocalStack - not fully supported)
    /* istanbul ignore if -- @preserve LocalStack doesn't fully support cross-region RDS read replicas */
    if (!isLocalStack()) {
      this.secondaryRdsReadReplica = new aws.rds.Instance(
        `${args.environment}-secondary-mysql-read-replica`,
        {
          identifier: `${args.environment}-secondary-mysql-read-replica`,
          replicateSourceDb: this.primaryRdsInstance.arn,
          instanceClass: dbInstanceClass,
          storageEncrypted: true,
          kmsKeyId: args.kmsStack.secondaryKmsKey.arn,
          vpcSecurityGroupIds: [
            args.securityGroupsStack.secondaryDbSecurityGroup.id,
          ],
          dbSubnetGroupName: this.secondaryDbSubnetGroup.name,
          skipFinalSnapshot: false,
          finalSnapshotIdentifier: `${args.environment}-secondary-mysql-final-snapshot`,
          deletionProtection: true, // Enable deletion protection for production
          tags: {
            ...commonTags,
            Name: `${args.environment}-Secondary-MySQL-Read-Replica`,
          },
        },
        { provider: secondaryProvider, parent: this }
      );
    }

    const outputs: Record<string, pulumi.Output<unknown>> = {
      primaryDbEndpoint: this.primaryRdsInstance.endpoint,
      primaryDbPort: this.primaryRdsInstance.port,
    };

    /* istanbul ignore if -- @preserve secondaryRdsReadReplica only exists in non-LocalStack environments */
    if (this.secondaryRdsReadReplica) {
      outputs.secondaryDbEndpoint = this.secondaryRdsReadReplica.endpoint;
      outputs.secondaryDbPort = this.secondaryRdsReadReplica.port;
    }

    this.registerOutputs(outputs);
  }
}
