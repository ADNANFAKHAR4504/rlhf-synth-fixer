// Database construct for production
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpcId: string;
  privateSubnetIds: string[];
  securityGroupId: string;
  environmentSuffix: string;
}

export class DatabaseConstruct extends Construct {
  public readonly dbInstanceId: string;
  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${props.environmentSuffix}-db`,
      engine: 'mysql',
      username: 'admin',
      password: 'changeMe123!',
      dbName: `${props.environmentSuffix}db`,
      instanceClass: 'db.t3.micro',
      multiAz: true,
      allocatedStorage: 20,
      vpcSecurityGroupIds: [props.securityGroupId],
      // dbSubnetGroupName: 'your-subnet-group', // Add subnet group if needed
      tags: {
        Name: `${props.environmentSuffix}-db`,
        Environment: props.environmentSuffix,
      },
    });
    this.dbInstanceId = dbInstance.id;
  }
}
