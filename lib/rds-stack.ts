// lib/rds-stack.ts

import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface RdsStackProps {
  environmentSuffix?: string;
  vpcId: string;
  kmsKeyId: string;
}

export class RdsStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // or use a region from props
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'prodDbSubnetGroup', {
      subnetIds: [props.vpcId],
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
      kmsKeyId: props.kmsKeyId,
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
