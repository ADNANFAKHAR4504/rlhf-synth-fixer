import * as aws from '@pulumi/aws';
import {
  commonTags,
  dbInstanceClass,
  primaryRegion,
  secondaryRegion,
} from './config';
import { primaryKmsKey, secondaryKmsKey } from './kms';
import {
  primaryDbSecurityGroup,
  secondaryDbSecurityGroup,
} from './security-groups';
import {
  primaryPrivateSubnet1,
  primaryPrivateSubnet2,
  secondaryPrivateSubnet1,
  secondaryPrivateSubnet2,
} from './vpc';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

// Primary region DB subnet group
export const primaryDbSubnetGroup = new aws.rds.SubnetGroup(
  'primary-db-subnet-group',
  {
    name: 'primary-db-subnet-group',
    subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
    tags: {
      ...commonTags,
      Name: 'Primary DB Subnet Group',
    },
  },
  { provider: primaryProvider }
);

// Secondary region DB subnet group
export const secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
  'secondary-db-subnet-group',
  {
    name: 'secondary-db-subnet-group',
    subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
    tags: {
      ...commonTags,
      Name: 'Secondary DB Subnet Group',
    },
  },
  { provider: secondaryProvider }
);

// Primary RDS instance
export const primaryRdsInstance = new aws.rds.Instance(
  'primary-mysql-db',
  {
    identifier: 'primary-mysql-database',
    allocatedStorage: 20,
    storageType: 'gp2',
    storageEncrypted: true,
    kmsKeyId: primaryKmsKey.arn,
    engine: 'mysql',
    engineVersion: '5.7',
    instanceClass: dbInstanceClass,
    dbName: 'productiondb',
    username: 'admin',
    password: 'changeme123!', // In production, use AWS Secrets Manager
    vpcSecurityGroupIds: [primaryDbSecurityGroup.id],
    dbSubnetGroupName: primaryDbSubnetGroup.name,
    backupRetentionPeriod: 7,
    backupWindow: '03:00-04:00',
    maintenanceWindow: 'sun:04:00-sun:05:00',
    skipFinalSnapshot: true,
    deletionProtection: false, // Set to true in production
    tags: {
      ...commonTags,
      Name: 'Primary MySQL Database',
    },
  },
  { provider: primaryProvider }
);

// Cross-region read replica
export const secondaryRdsReadReplica = new aws.rds.Instance(
  'secondary-mysql-read-replica',
  {
    identifier: 'secondary-mysql-read-replica',
    replicateSourceDb: primaryRdsInstance.arn,
    instanceClass: dbInstanceClass,
    storageEncrypted: true,
    kmsKeyId: secondaryKmsKey.arn,
    vpcSecurityGroupIds: [secondaryDbSecurityGroup.id],
    dbSubnetGroupName: secondaryDbSubnetGroup.name,
    skipFinalSnapshot: true,
    deletionProtection: false, // Set to true in production
    tags: {
      ...commonTags,
      Name: 'Secondary MySQL Read Replica',
    },
  },
  { provider: secondaryProvider }
);
