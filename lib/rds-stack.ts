// lib/rds-stack.ts

import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Construct } from 'constructs';

interface RdsStackProps {
  environmentSuffix?: string;
  vpcId?: string;
  kmsKeyId?: string;
  subnetIds?: string[];
}

export class RdsStack extends Construct {
  constructor(scope: Construct, id: string, props?: RdsStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'prodDbSubnetGroup', {
      subnetIds: props?.subnetIds || [],
      tags: {
        Name: `prod-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // RDS Instance
    new DbInstance(this, 'prodRdsInstance', {
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageEncrypted: true,
      kmsKeyId: props?.kmsKeyId,
      dbSubnetGroupName: dbSubnetGroup.name,
      dbName: 'proddb',
      username: 'admin',
      password: 'changeme123!',
      publiclyAccessible: false,
      tags: {
        Name: `prod-rds-instance-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
