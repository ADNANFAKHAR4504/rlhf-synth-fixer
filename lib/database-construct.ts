// Database construct for production
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Construct } from 'constructs';
export class DatabaseConstruct extends Construct {
  public readonly dbInstanceId: string;
  constructor(
    scope: Construct,
    id: string,
    props: {
      vpcId: string;
      privateSubnetIds: string[];
      securityGroupId: string;
    }
  ) {
    super(scope, id);

    const dbInstance = new DbInstance(this, 'db-instance', {
      identifier: 'production-db',
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      username: 'admin',
      password: 'changeMe123!',
      dbName: 'productiondb',
      multiAz: true,
      vpcSecurityGroupIds: [props.securityGroupId],
      // dbSubnetGroupName: 'your-subnet-group', // Add subnet group if needed
      skipFinalSnapshot: true,
      tags: {
        Name: 'production-db',
        Environment: 'production',
      },
    });

    this.dbInstanceId = dbInstance.id;
  }
}
