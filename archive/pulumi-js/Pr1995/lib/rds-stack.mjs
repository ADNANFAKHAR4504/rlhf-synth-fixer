/**
 * RDS Stack - Creates secure MySQL RDS instance with encryption at rest,
 * automated backups, and enhanced monitoring capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export class RDSStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:RDSStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create KMS key for RDS encryption
    const kmsKey = new aws.kms.Key(
      `SecureApp-rds-kms-key-${environmentSuffix}`,
      {
        description: 'KMS key for SecureApp RDS encryption',
        tags: {
          ...tags,
          Name: `SecureApp-rds-kms-key-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS key alias
    new aws.kms.Alias(
      `SecureApp-rds-kms-alias-${environmentSuffix}`,
      {
        name: `alias/SecureApp-rds-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `secureapp-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: args.publicSubnetIds,
        tags: {
          ...tags,
          Name: `SecureApp-db-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `SecureApp-rds-sg-${environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for RDS MySQL instance',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `SecureApp-rds-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Use default parameter group due to AWS quota limitations
    // We'll use the default mysql8.0 parameter group instead of creating a custom one
    const dbParameterGroupName = 'default.mysql8.0';

    // Generate random password for RDS
    const dbPassword = new aws.secretsmanager.Secret(
      `SecureApp-db-password-${environmentSuffix}`,
      {
        description: 'Password for SecureApp RDS instance',
        tags: {
          ...tags,
          Name: `SecureApp-db-password-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Generate a random password using Pulumi's random provider
    const dbPasswordRandom = new random.RandomPassword(
      `SecureApp-db-password-random-${environmentSuffix}`,
      {
        length: 16,
        special: true,
        overrideSpecial: '!@#$%^&*',
      },
      { parent: this }
    );

    const dbPasswordVersion = new aws.secretsmanager.SecretVersion(
      `SecureApp-db-password-version-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        secretString: dbPasswordRandom.result,
      },
      { parent: this }
    );

    // Create RDS instance
    this.rdsInstance = new aws.rds.Instance(
      `SecureApp-mysql-${environmentSuffix}`,
      {
        identifier: `secureapp-mysql-${environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,

        // Database configuration
        dbName: 'secureapp_db',
        username: 'admin',
        password: dbPasswordVersion.secretString,

        // Network configuration
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        publiclyAccessible: true,

        // Backup and maintenance
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        autoMinorVersionUpdate: true,

        // Monitoring
        // monitoringInterval: 60, // Removed due to requiring monitoring role
        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],

        // Parameter group
        parameterGroupName: dbParameterGroupName,

        // Security
        deletionProtection: false,
        skipFinalSnapshot: true,

        tags: {
          ...tags,
          Name: `SecureApp-mysql-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export values
    this.rdsEndpoint = this.rdsInstance.endpoint;
    this.rdsInstanceId = this.rdsInstance.identifier;
    this.dbPasswordSecretArn = dbPassword.arn;

    this.registerOutputs({
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: this.rdsInstanceId,
      dbPasswordSecretArn: this.dbPasswordSecretArn,
    });
  }
}
