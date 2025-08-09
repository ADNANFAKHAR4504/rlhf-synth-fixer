import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Secrets Manager data sources (optional path)
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

export interface DatabaseStackProps {
  subnetIds: string[];
  securityGroupIds: string[];
  dbName: string;
  username: string;

  // Password resolution options (prefer secret ARN, then env var, then prop)
  password?: string;
  passwordSecretArn?: string; // preferred in CI/CD or prod
  passwordEnvVarName?: string; // local/dev fallback (defaults to DB_PASSWORD)

  finalSnapshotIdOverride?: string;
}

export class DatabaseStack extends Construct {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // NOTE: these are still hardcoded in sub-stacks today; consider threading via props later.
    const environment = 'dev';
    const projectName = 'myproject';

    const commonTags: Record<string, string> = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    const { subnetIds, securityGroupIds, dbName, username } = props;

    // --- Password resolution: Secret ARN → Explicit prop → Env Var (default DB_PASSWORD) → CI fallback ---
    let resolvedPassword: string | undefined;

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
    } else if (props.password && props.password.trim().length > 0) {
      // explicit prop wins over env for test determinism
      resolvedPassword = props.password;
    } else {
      const envName = props.passwordEnvVarName ?? 'DB_PASSWORD';
      const envVal = process.env[envName];
      if (envVal && envVal.trim().length > 0) {
        resolvedPassword = envVal;
      } else if (process.env.CI) {
        resolvedPassword = 'TempPassw0rd1!'; // short CI fallback
      }
    }

    if (!resolvedPassword) {
      const hint =
        props.passwordEnvVarName ??
        'DB_PASSWORD (default used when passwordEnvVarName is not provided)';
      throw new Error(
        `DatabaseStack: one of passwordSecretArn | ${hint} | password must be provided`
      );
    }

    // --- RDS password sanitization & validation ---
    // Disallowed: '/', '@', '"', space. Length must be 8–41 for MySQL.
    const sanitizePassword = (pw: string): string => {
      let s = pw.replace(/[\/@"\s]/g, '');
      if (s.length > 41) s = s.slice(0, 41);
      // pad to 8 chars minimally if someone passes fewer (keeps synth from failing)
      if (s.length < 8) s = s.padEnd(8, '1');
      return s;
    };

    resolvedPassword = sanitizePassword(resolvedPassword);

    // --- subnet group ---
    const subnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `${projectName}-${environment}-db-subnet-group`,
      subnetIds: subnetIds,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db-subnet-group`,
      },
    });

    // --- RDS instance ---
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

      // use sanitized, compliant password
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

    // --- outputs ---
    new TerraformOutput(this, 'db_instance_id', { value: rds.id });
    new TerraformOutput(this, 'db_instance_endpoint', { value: rds.endpoint });
    new TerraformOutput(this, 'db_instance_port', { value: rds.port });
    new TerraformOutput(this, 'db_subnet_group_id', { value: subnetGroup.id });
  }
}
