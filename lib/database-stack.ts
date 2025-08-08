import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ✅ NEW: imports to read Secrets Manager
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

export interface DatabaseStackProps {
  subnetIds: string[];
  securityGroupIds: string[];
  dbName: string;
  username: string;

  // ✅ CHANGED: make password optional; add secure options
  password?: string;
  passwordSecretArn?: string;        // preferred in CI/CD or prod
  passwordEnvVarName?: string;       // simple local/dev fallback

  finalSnapshotIdOverride?: string;
}

export class DatabaseStack extends Construct {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    const { subnetIds, securityGroupIds, dbName, username } = props;

    // ✅ NEW: Resolve password securely (secret ARN > env var > plain prop)
    let resolvedPassword: string;

    if (props.passwordSecretArn) {
      const secret = new DataAwsSecretsmanagerSecret(this, 'dbPwSecret', {
        arn: props.passwordSecretArn,
      });
      const secretVer = new DataAwsSecretsmanagerSecretVersion(
        this,
        'dbPwSecretVer',
        { secretId: secret.id }
      );
      resolvedPassword = secretVer.secretString;
    } else if (props.passwordEnvVarName) {
      const envVal = process.env[props.passwordEnvVarName];
      if (!envVal) {
        throw new Error(
          `DatabaseStack: environment variable ${props.passwordEnvVarName} is required for DB password`
        );
      }
      resolvedPassword = envVal;
    } else if (props.password) {
      // Backward compatible (keeps unit tests passing)
      resolvedPassword = props.password;
    } else {
      throw new Error(
        'DatabaseStack: one of passwordSecretArn | passwordEnvVarName | password must be provided'
      );
    }

    const subnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `${projectName}-${environment}-db-subnet-group`,
      subnetIds: subnetIds,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db-subnet-group`,
      },
    });

    const rds = new DbInstance(this, 'RdsInstance', {
      identifier: `${projectName}-${environment}-db`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: dbName,
      username: username,

      // ✅ CHANGED: use resolvedPassword
      password: resolvedPassword,

      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: false,
      publiclyAccessible: false,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier:
        props.finalSnapshotIdOverride ??
        `${projectName}-${environment}-final-snapshot`,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db`,
      },
    });

    new TerraformOutput(this, 'db_instance_id', { value: rds.id });
    new TerraformOutput(this, 'db_instance_endpoint', { value: rds.endpoint });
    new TerraformOutput(this, 'db_instance_port', { value: rds.port });
    new TerraformOutput(this, 'db_subnet_group_id', { value: subnetGroup.id });
  }
}
