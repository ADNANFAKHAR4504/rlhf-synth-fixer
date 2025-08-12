import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Password } from '@cdktf/provider-random/lib/password';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { name } from './utils/naming';

export interface DatabaseProps {
  provider: AwsProvider;
  environment: string;
  region: string;
  privateSubnets: string[];
  rdsSgId: string;
  instanceClass?: string; // default: db.t3.micro
  allocatedStorage?: number; // default: 20
  multiAz?: boolean; // default: true in prod, false otherwise
}

export class Database extends Construct {
  /** RDS endpoint DNS name */
  public readonly endpoint: string;
  /** Secrets Manager secret ARN containing the DB password */
  public readonly secretArn: string;
  /** DB instance identifier (useful for CW alarm dimensions) */
  public readonly dbIdentifier: string;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const env = props.environment;
    const region = props.region;

    // Generate a strong password
    const dbPassword = new Password(this, 'dbPassword', {
      length: 16,
      special: true,
    });

    // Store password in Secrets Manager
    const secret = new SecretsmanagerSecret(this, 'dbSecret', {
      name: name(env, 'db-password', region),
      description: `Database password for ${env} in ${region}`,
      recoveryWindowInDays: 7,
      provider: props.provider,
    });

    new SecretsmanagerSecretVersion(this, 'dbSecretVersion', {
      secretId: secret.id,
      secretString: dbPassword.result,
      provider: props.provider,
    });

    // Subnet group (private subnets only)
    const subnetGroup = new DbSubnetGroup(this, 'dbSubnetGroup', {
      name: name(env, 'db-subnet-group', region),
      subnetIds: props.privateSubnets,
      provider: props.provider,
    });

    // Parameter group (Postgres14 tuning example)
    const paramGroup = new DbParameterGroup(this, 'dbParamGroup', {
      name: name(env, 'db-params', region),
      family: 'postgres14',
      parameter: [
        { name: 'log_statement', value: 'all' },
        { name: 'log_min_duration_statement', value: '500' },
      ],
      provider: props.provider,
    });

    // RDS Instance (Postgres)
    const db = new DbInstance(this, 'dbInstance', {
      identifier: name(env, 'db', region),
      engine: 'postgres',
      engineVersion: '15.7',
      instanceClass: props.instanceClass || 'db.t3.micro',
      allocatedStorage: props.allocatedStorage || 20,

      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [props.rdsSgId],

      username: 'TapStackpr824',
      password: dbPassword.result,

      multiAz: props.multiAz ?? env === 'prod',
      deletionProtection: env === 'prod',
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      storageEncrypted: true,
      parameterGroupName: paramGroup.name,

      provider: props.provider,
    });

    // Expose outputs/properties
    this.endpoint = db.address;
    this.secretArn = secret.arn;
    // CloudWatch dimensions usually use DBInstanceIdentifier; db.id maps to the Terraform resource ID (identifier)
    this.dbIdentifier = db.id;

    // Terraform Output for DB instance
    new TerraformOutput(this, 'db_endpoint', { value: this.endpoint });
    new TerraformOutput(this, 'db_secret_arn', { value: this.secretArn });
    new TerraformOutput(this, 'db_instance_id', { value: db.id }); // Add output for db instance ID
  }
}
