import { Construct } from 'constructs';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { Fn } from 'cdktf';

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
      instanceClass = 'db.t3.micro',
      allocatedStorage = 20,
      engineVersion = '14.7',
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

    // Fetch database credentials from Secrets Manager (existing secret)
    const dbSecret = new DataAwsSecretsmanagerSecret(this, 'db-secret', {
      name: `rds-credentials-${environment}`,
    });

    const dbSecretVersion = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: dbSecret.id,
      }
    );

    // Parse credentials from secret using Terraform jsondecode function
    const credentials = Fn.jsondecode(dbSecretVersion.secretString);

    // Create RDS Instance
    this.instance = new DbInstance(this, 'instance', {
      identifier: `postgres-${environment}`,
      engine: 'postgres',
      engineVersion: engineVersion,
      instanceClass: instanceClass,
      allocatedStorage: allocatedStorage,
      dbName: 'myapp',
      username: Fn.lookup(credentials, 'username', ''),
      password: Fn.lookup(credentials, 'password', ''),
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
