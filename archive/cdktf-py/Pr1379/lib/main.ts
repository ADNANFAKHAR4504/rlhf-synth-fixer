import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { Cloudtrail } from "@cdktf/provider-aws/lib/cloudtrail";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { Construct } from "constructs";

interface EnvironmentConfig {
  region: string;
  vpcCidr: string;
  environment: string;
}

export class MultiRegionStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig) {
    super(scope, id);

    new AwsProvider(this, 'aws', {
      region: config.region,
    });

    // KMS Key for encryption
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `${config.environment} encryption key`,
      enableKeyRotation: true,
      tags: {
        Name: `${config.environment}-kms-key`,
        Environment: config.environment,
      },
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.environment}-vpc`,
        Environment: config.environment,
        Region: config.region,
      },
    });

    // Private Subnets for RDS
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: config.vpcCidr.replace('/16', '/24'),
      availabilityZone: `${config.region}a`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: `${config.environment}-private-subnet-1`,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: config.vpcCidr
        .replace('/16', '/25')
        .replace('.0.0/', '.0.128/'),
      availabilityZone: `${config.region}b`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: `${config.environment}-private-subnet-2`,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    // Security Group for RDS (minimal permissions)
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.environment}-rds-sg`,
      description: 'RDS security group - minimal access within VPC only',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          cidrBlocks: [config.vpcCidr],
          description: 'MySQL within VPC only - no cross-region',
        },
      ],
      tags: {
        Name: `${config.environment}-rds-sg`,
        Environment: config.environment,
        Security: 'MinimalAccess-VPCOnly',
      },
    });

    // Security Group (no SSH access)
    new SecurityGroup(this, 'app-sg', {
      name: `${config.environment}-app-sg`,
      description: 'Secure application SG - no SSH, no cross-region traffic',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: [config.vpcCidr],
          description: 'HTTPS within VPC only',
        },
      ],
      egress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: [config.vpcCidr],
          description: 'HTTPS outbound within VPC only',
        },
      ],
      tags: {
        Name: `${config.environment}-app-sg`,
        Environment: config.environment,
        Security: 'NoSSH-NoXRegion',
      },
    });

    // Secrets Manager for RDS password
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `${config.environment}-rds-password`,
      description: 'RDS database password',
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `${config.environment}-rds-secret`,
        Environment: config.environment,
        Purpose: 'RDS-Password',
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
    });

    // IAM Role for RDS Enhanced Monitoring (minimal permissions)
    const rdsMonitoringRole = new IamRole(this, 'rds-monitoring-role', {
      name: `${config.environment}-rds-monitoring-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'monitoring.rds.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Name: `${config.environment}-rds-monitoring-role`,
        Environment: config.environment,
        Purpose: 'RDSMonitoring',
      },
    });

    new IamRolePolicyAttachment(this, 'rds-monitoring-policy', {
      role: rdsMonitoringRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    });

    // CloudWatch Log Group for monitoring
    new CloudwatchLogGroup(this, 'app-logs', {
      name: `/aws/application/${config.environment}`,
      retentionInDays: 7,
      tags: {
        Name: `${config.environment}-app-logs`,
        Environment: config.environment,
      },
    });

    // CloudTrail S3 Bucket
    const cloudtrailBucket = new S3Bucket(this, 'cloudtrail-bucket', {
      bucketPrefix: `${config.environment}-cloudtrail-`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: {
        Name: `${config.environment}-cloudtrail-bucket`,
        Environment: config.environment,
        Purpose: 'CloudTrail',
        Encrypted: 'true',
      },
    });

    // CloudTrail for logging
    new Cloudtrail(this, 'cloudtrail', {
      name: `${config.environment}-cloudtrail`,
      s3BucketName: cloudtrailBucket.id,
      includeGlobalServiceEvents: false,
      isMultiRegionTrail: false,
      enableLogging: true,
      tags: {
        Name: `${config.environment}-cloudtrail`,
        Environment: config.environment,
      },
    });

    // DB Subnet Group for RDS
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.environment}-db-subnet-group`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `${config.environment}-db-subnet-group`,
        Environment: config.environment,
      },
    });

    // Encrypted RDS Instance with backups
    new DbInstance(this, 'rds-instance', {
      identifier: `${config.environment}-mysql-db`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      dbName: 'appdb',
      username: 'admin',
      managePassword: false,
      passwordSecretArn: dbSecret.arn,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      monitoringInterval: 60,
      monitoringRoleArn: rdsMonitoringRole.arn,
      skipFinalSnapshot: true,
      tags: {
        Name: `${config.environment}-mysql-db`,
        Environment: config.environment,
        Encrypted: 'true',
        BackupEnabled: 'true',
        MonitoringEnabled: 'true',
      },
    });

    // Encrypted S3 Bucket
    new S3Bucket(this, 'encrypted-bucket', {
      bucketPrefix: `${config.environment}-secure-`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: {
        Name: `${config.environment}-encrypted-bucket`,
        Environment: config.environment,
        Encrypted: 'AES256',
        Region: config.region,
      },
    });
  }
}

const app = new App();

// Multi-environment setup with complete security requirements
// US East 1 Environment
new MultiRegionStack(app, 'us-east-1-stack', {
  region: 'us-east-1',
  vpcCidr: '10.0.0.0/16',
  environment: 'us-east-1-prod',
});

// EU Central 1 Environment - identical configuration
new MultiRegionStack(app, 'eu-central-1-stack', {
  region: 'eu-central-1',
  vpcCidr: '10.1.0.0/16',
  environment: 'eu-central-1-prod',
});

app.synth();
