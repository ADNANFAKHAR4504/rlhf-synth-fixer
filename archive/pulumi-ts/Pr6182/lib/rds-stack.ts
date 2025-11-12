import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { EnvironmentConfig, RdsOutputs, VpcOutputs } from './types';

export interface RdsStackArgs {
  config: EnvironmentConfig;
  vpcOutputs: VpcOutputs;
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly outputs: RdsOutputs;

  constructor(
    name: string,
    args: RdsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:rds:RdsStack', name, {}, opts);

    const { config, vpcOutputs } = args;

    // Create secret in AWS Secrets Manager (for CI/CD testing)
    // In production, this would be pre-created and fetched using getSecret
    // Use versioned name to avoid conflicts with deleted secrets
    const secretName = `${config.environment}/payment-db-password-${config.environmentSuffix}-v3`;

    // Set recovery window to 0 for dev/test environments to allow immediate deletion
    // This enables rapid destroy/deploy cycles in CI/CD
    const recoveryWindowInDays = config.environment === 'prod' ? 7 : 0;

    const dbSecret = new aws.secretsmanager.Secret(
      `${config.environment}-db-secret-${config.environmentSuffix}`,
      {
        name: secretName, // ✅ Versioned name avoids conflict with deleted secrets
        description: `Database password for ${config.environment} environment`,
        recoveryWindowInDays: recoveryWindowInDays, // ✅ Allow immediate deletion for non-prod
        tags: {
          ...config.tags,
          Name: `${config.environment}-db-secret-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const secretPassword = pulumi
      .all([config.environment, config.environmentSuffix])
      .apply(
        ([env, suffix]) =>
          `${env}Password${suffix}${Math.random().toString(36).substring(2, 10)}`
      );

    new aws.secretsmanager.SecretVersion(
      `${config.environment}-db-secret-version-${config.environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: secretPassword,
      },
      { parent: this }
    );

    const secret = dbSecret;

    // Create RDS security group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${config.environment}-rds-sg-${config.environmentSuffix}`,
      {
        vpcId: vpcOutputs.vpcId,
        description: `Security group for ${config.environment} RDS`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [
              pulumi.output(vpcOutputs.vpcId).apply(async vpcId => {
                const vpc = await aws.ec2.getVpc({ id: vpcId });
                return vpc.cidrBlock;
              }),
            ],
            description: 'Allow PostgreSQL traffic from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...config.tags,
          Name: `${config.environment}-rds-sg-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${config.environment}-db-subnet-group-${config.environmentSuffix}`,
      {
        subnetIds: vpcOutputs.privateSubnetIds,
        tags: {
          ...config.tags,
          Name: `${config.environment}-db-subnet-group-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create RDS instance
    const dbInstance = new aws.rds.Instance(
      `${config.environment}-db-${config.environmentSuffix}`,
      {
        identifier: `${config.environment}-payment-db-${config.environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15.7',
        instanceClass: config.rdsInstanceClass,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,
        dbName: 'paymentdb',
        username: 'dbadmin',
        password: secretPassword,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        multiAz: config.rdsMultiAz,
        publiclyAccessible: false,
        skipFinalSnapshot: true,
        backupRetentionPeriod: config.environment === 'prod' ? 7 : 1,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'mon:04:00-mon:05:00',
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
        tags: {
          ...config.tags,
          Name: `${config.environment}-payment-db-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.outputs = {
      instanceId: dbInstance.id,
      endpoint: dbInstance.endpoint,
      port: dbInstance.port,
      securityGroupId: rdsSecurityGroup.id,
      secretArn: secret.arn,
    };

    this.registerOutputs({
      instanceId: this.outputs.instanceId,
      endpoint: this.outputs.endpoint,
      port: this.outputs.port,
      securityGroupId: this.outputs.securityGroupId,
      secretArn: this.outputs.secretArn,
    });
  }
}
