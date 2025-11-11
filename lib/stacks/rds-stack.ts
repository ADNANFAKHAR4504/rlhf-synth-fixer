import { Construct } from 'constructs';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

interface RdsStackProps {
  environmentSuffix: string;
  environment: string;
  vpcId: string;
  privateSubnetIds: string[];
  instanceClass: string;
  backupRetention: number;
}

export class RdsStack extends Construct {
  public readonly endpoint: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      environment,
      vpcId,
      privateSubnetIds,
      instanceClass,
      backupRetention,
    } = props;

    // Reference existing secret for database credentials
    const dbSecret = new DataAwsSecretsmanagerSecret(this, 'db-secret', {
      name: `payment-db-credentials-${environment}`,
    });

    const dbSecretVersion = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: dbSecret.id,
      }
    );

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `payment-db-subnet-group-${environment}-${environmentSuffix}`,
      subnetIds: privateSubnetIds,
      tags: {
        Name: `payment-db-subnet-group-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Create DB parameter group
    const dbParameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      name: `payment-db-params-${environment}-${environmentSuffix}`,
      family: 'postgres16',
      description: `Payment processing DB parameter group for ${environment}`,
      parameter: [
        {
          name: 'log_connections',
          value: '1',
        },
        {
          name: 'log_disconnections',
          value: '1',
        },
        {
          name: 'log_duration',
          value: '1',
        },
      ],
      tags: {
        Name: `payment-db-params-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Create security group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `payment-rds-sg-${environment}-${environmentSuffix}`,
      description: 'Security group for payment processing RDS instance',
      vpcId: vpcId,
      tags: {
        Name: `payment-rds-sg-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Allow PostgreSQL traffic from VPC
    new SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'], // Allow from all payment VPCs
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow PostgreSQL from VPC',
    });

    // Create RDS instance
    const dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `payment-db-${environment}-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '16.6',
      instanceClass: instanceClass,
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'paymentdb',
      username: `\${jsondecode(${dbSecretVersion.secretString}).username}`,
      password: `\${jsondecode(${dbSecretVersion.secretString}).password}`,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      parameterGroupName: dbParameterGroup.name,
      backupRetentionPeriod: backupRetention,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'mon:04:00-mon:05:00',
      multiAz: environment === 'prod',
      skipFinalSnapshot: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
      tags: {
        Name: `payment-db-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    this.endpoint = dbInstance.endpoint;
    this.securityGroupId = rdsSecurityGroup.id;
  }
}
