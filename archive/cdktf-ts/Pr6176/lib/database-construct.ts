import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { TerraformVariable } from 'cdktf';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environment: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceClass?: string;
  allocatedStorage?: number;
  engineVersion?: string;
}

export class DatabaseConstruct extends Construct {
  public readonly instance: DbInstance;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const {
      environment,
      subnetIds,
      securityGroupIds,
      instanceClass = 'db.t4g.small',
      allocatedStorage = 20,
      engineVersion = '17.4',
    } = props;

    // Create DB Subnet Group
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `rds-subnet-group-${environment}`,
      subnetIds: subnetIds,
      tags: {
        Name: `rds-subnet-group-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Use Terraform variables for database credentials (set via TF_VAR_* environment variables)
    const dbUsername = new TerraformVariable(this, 'db_username', {
      type: 'string',
      description: 'Database master username',
      default: 'postgres',
    });

    const dbPassword = new TerraformVariable(this, 'db_password', {
      type: 'string',
      description: 'Database master password',
      sensitive: true,
      default: 'TempPassword123!',
    });

    // Create RDS Instance
    this.instance = new DbInstance(this, 'instance', {
      identifier: `postgres-${environment}`,
      engine: 'postgres',
      engineVersion: engineVersion,
      instanceClass: instanceClass,
      allocatedStorage: allocatedStorage,
      dbName: 'myapp',
      username: dbUsername.stringValue,
      password: dbPassword.stringValue,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,
      multiAz: true,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      skipFinalSnapshot: true,
      tags: {
        Name: `postgres-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });
  }
}
