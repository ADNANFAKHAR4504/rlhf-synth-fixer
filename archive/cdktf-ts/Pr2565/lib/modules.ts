import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Password } from '@cdktf/provider-random/lib/password';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface SecureAppModulesConfig {
  environment: string;
  allowedCidrBlocks: string[];
  dbUsername: string;
  dbPassword: string;
  instanceType: string;
}

export class SecureAppModules extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnetA: Subnet;
  public readonly publicSubnetB: Subnet;
  public readonly privateSubnetA: Subnet;
  public readonly privateSubnetB: Subnet;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;
  public readonly kmsKey: KmsKey;
  public readonly s3Bucket: S3Bucket;
  public readonly rdsInstance: DbInstance;
  public readonly generatedPassword: Password;
  public readonly ec2Instance: Instance;
  public readonly cloudwatchLogGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: SecureAppModulesConfig) {
    super(scope, id);

    const currentAccount = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    // Generate a random password that meets AWS requirements
    this.generatedPassword = new Password(this, 'db-password', {
      length: 16,
      special: true,
      // Exclude forbidden characters: /, @, ", and space
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      minLower: 1,
      minUpper: 1,
      minNumeric: 1,
      minSpecial: 1,
    });

    // KMS Key for encryption
    this.kmsKey = new KmsKey(this, 'SecureApp-KmsKey', {
      description: `SecureApp KMS key for ${config.environment} environment`,
      deletionWindowInDays: config.environment === 'production' ? 30 : 7,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${currentAccount.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${currentRegion.name}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnEquals: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${currentRegion.name}:${currentAccount.accountId}:log-group:/aws/secureapp/${config.environment}`,
              },
            },
          },
          {
            Sid: 'Allow RDS Service',
            Effect: 'Allow',
            Principal: {
              Service: 'rds.amazonaws.com',
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
          {
            Sid: 'Allow S3 Service',
            Effect: 'Allow',
            Principal: {
              Service: 's3.amazonaws.com',
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `SecureApp-KmsKey-${config.environment}`,
        Environment: config.environment,
      },
    });

    // KMS Alias for easier reference
    new KmsAlias(this, 'SecureApp-KmsAlias', {
      name: `alias/secureapp-${config.environment}`,
      targetKeyId: this.kmsKey.keyId,
    });

    // VPC with CIDR 10.0.0.0/16
    this.vpc = new Vpc(this, 'SecureApp-Vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `SecureApp-Vpc-${config.environment}`,
        Environment: config.environment,
      },
    });

    // Internet Gateway
    const internetGateway = new InternetGateway(this, 'SecureApp-Igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `SecureApp-Igw-${config.environment}`,
        Environment: config.environment,
      },
    });

    // Public Subnets
    this.publicSubnetA = new Subnet(this, 'SecureApp-PublicSubnetA', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-west-2a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `SecureApp-PublicSubnetA-${config.environment}`,
        Environment: config.environment,
        Type: 'Public',
      },
    });

    this.publicSubnetB = new Subnet(this, 'SecureApp-PublicSubnetB', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-west-2b',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `SecureApp-PublicSubnetB-${config.environment}`,
        Environment: config.environment,
        Type: 'Public',
      },
    });

    // Private Subnets
    this.privateSubnetA = new Subnet(this, 'SecureApp-PrivateSubnetA', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: 'us-west-2a',
      tags: {
        Name: `SecureApp-PrivateSubnetA-${config.environment}`,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    this.privateSubnetB = new Subnet(this, 'SecureApp-PrivateSubnetB', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: 'us-west-2b',
      tags: {
        Name: `SecureApp-PrivateSubnetB-${config.environment}`,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(
      this,
      'SecureApp-PublicRouteTable',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `SecureApp-PublicRouteTable-${config.environment}`,
          Environment: config.environment,
        },
      }
    );

    // Route to Internet Gateway
    new Route(this, 'SecureApp-PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with route table
    new RouteTableAssociation(this, 'SecureApp-PublicSubnetAAssociation', {
      subnetId: this.publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'SecureApp-PublicSubnetBAssociation', {
      subnetId: this.publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for Web Servers
    this.webSecurityGroup = new SecurityGroup(
      this,
      'SecureApp-WebSecurityGroup',
      {
        name: `SecureApp-WebSG-${config.environment}`,
        description: 'Security group for web servers',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: config.allowedCidrBlocks,
            description: 'HTTP access from allowed CIDR blocks',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: config.allowedCidrBlocks,
            description: 'HTTPS access from allowed CIDR blocks',
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: config.allowedCidrBlocks,
            description: 'SSH access from allowed CIDR blocks',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: `SecureApp-WebSG-${config.environment}`,
          Environment: config.environment,
        },
      }
    );

    // Security Group for Database
    this.dbSecurityGroup = new SecurityGroup(
      this,
      'SecureApp-DbSecurityGroup',
      {
        name: `SecureApp-DbSG-${config.environment}`,
        description: 'Security group for RDS database',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [this.webSecurityGroup.id],
            description: 'MySQL access from web security group',
          },
        ],
        tags: {
          Name: `SecureApp-DbSG-${config.environment}`,
          Environment: config.environment,
        },
      }
    );

    // S3 Bucket for application data
    this.s3Bucket = new S3Bucket(this, 'SecureApp-S3Bucket', {
      bucket: `secureapp-${config.environment}-${Math.random().toString(36).substring(2, 15)}`,
      tags: {
        Name: `SecureApp-S3Bucket-${config.environment}`,
        Environment: config.environment,
      },
    });

    // S3 Bucket Encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'SecureApp-S3Encryption',
      {
        bucket: this.s3Bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket Versioning
    new S3BucketVersioningA(this, 'SecureApp-S3Versioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, 'SecureApp-S3PublicAccessBlock', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // CloudWatch Log Group
    this.cloudwatchLogGroup = new CloudwatchLogGroup(
      this,
      'SecureApp-LogGroup',
      {
        name: `/aws/secureapp/${config.environment}`,
        retentionInDays: config.environment === 'production' ? 365 : 30,
        kmsKeyId: this.kmsKey.arn,
        tags: {
          Name: `SecureApp-LogGroup-${config.environment}`,
          Environment: config.environment,
        },
      }
    );

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'SecureApp-Ec2Role', {
      name: `SecureApp-Ec2Role-${config.environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `SecureApp-Ec2Role-${config.environment}`,
        Environment: config.environment,
      },
    });

    // IAM Policy for EC2 instances
    const ec2Policy = new IamPolicy(this, 'SecureApp-Ec2Policy', {
      name: `SecureApp-Ec2Policy-${config.environment}`,
      description: 'Policy for SecureApp EC2 instances',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: [`${this.s3Bucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: [this.s3Bucket.arn],
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: [this.cloudwatchLogGroup.arn],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: [this.kmsKey.arn],
          },
        ],
      }),
      tags: {
        Name: `SecureApp-Ec2Policy-${config.environment}`,
        Environment: config.environment,
      },
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'SecureApp-Ec2PolicyAttachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // IAM Instance Profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'SecureApp-InstanceProfile',
      {
        name: `SecureApp-InstanceProfile-${config.environment}`,
        role: ec2Role.name,
        tags: {
          Name: `SecureApp-InstanceProfile-${config.environment}`,
          Environment: config.environment,
        },
      }
    );

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'SecureApp-DbSubnetGroup', {
      name: `secureapp-db-subnet-group-${config.environment}`,
      subnetIds: [this.privateSubnetA.id, this.privateSubnetB.id],
      description: 'Subnet group for SecureApp RDS instance',
      tags: {
        Name: `SecureApp-DbSubnetGroup-${config.environment}`,
        Environment: config.environment,
      },
    });

    // RDS Instance
    this.rdsInstance = new DbInstance(this, 'SecureApp-RdsInstance', {
      identifier: `secureapp-db-${config.environment}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass:
        config.environment === 'production' ? 'db.t3.medium' : 'db.t3.micro',
      allocatedStorage: config.environment === 'production' ? 100 : 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,
      dbName: 'secureappdb',
      username: 'admin',
      password: this.generatedPassword.result,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: config.environment === 'production' ? 30 : 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: config.environment === 'production',
      monitoringInterval: 0,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      deletionProtection: config.environment === 'production',
      skipFinalSnapshot: config.environment !== 'production',
      finalSnapshotIdentifier:
        config.environment === 'production'
          ? `secureapp-final-snapshot-${config.environment}`
          : undefined,
      tags: {
        Name: `SecureApp-RdsInstance-${config.environment}`,
        Environment: config.environment,
      },
    });

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, 'SecureApp-AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // EC2 Instance
    this.ec2Instance = new Instance(this, 'SecureApp-Ec2Instance', {
      ami: amazonLinuxAmi.id,
      instanceType: config.instanceType,
      keyName: 'compute-key1',
      vpcSecurityGroupIds: [this.webSecurityGroup.id],
      subnetId: this.publicSubnetA.id,
      iamInstanceProfile: instanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>SecureApp ${config.environment} Environment</h1>" > /var/www/html/index.html
# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/secureapp/${config.environment}",
            "log_stream_name": "{instance_id}/httpd/access_log"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/secureapp/${config.environment}",
            "log_stream_name": "{instance_id}/httpd/error_log"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "SecureApp/${config.environment}",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 300
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 300,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 300
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`,
      tags: {
        Name: `SecureApp-Ec2Instance-${config.environment}`,
        Environment: config.environment,
      },
    });

    // CloudWatch Alarms for EC2
    new CloudwatchMetricAlarm(this, 'SecureApp-Ec2CpuAlarm', {
      alarmName: `SecureApp-Ec2CpuAlarm-${config.environment}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: config.environment === 'production' ? 80 : 90,
      alarmDescription: 'This metric monitors EC2 CPU utilization',
      dimensions: {
        InstanceId: this.ec2Instance.id,
      },
      tags: {
        Name: `SecureApp-Ec2CpuAlarm-${config.environment}`,
        Environment: config.environment,
      },
    });

    // CloudWatch Alarms for RDS
    new CloudwatchMetricAlarm(this, 'SecureApp-RdsCpuAlarm', {
      alarmName: `SecureApp-RdsCpuAlarm-${config.environment}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: config.environment === 'production' ? 80 : 90,
      alarmDescription: 'This metric monitors RDS CPU utilization',
      dimensions: {
        DBInstanceIdentifier: this.rdsInstance.id,
      },
      tags: {
        Name: `SecureApp-RdsCpuAlarm-${config.environment}`,
        Environment: config.environment,
      },
    });

    new CloudwatchMetricAlarm(this, 'SecureApp-RdsConnectionsAlarm', {
      alarmName: `SecureApp-RdsConnectionsAlarm-${config.environment}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: config.environment === 'production' ? 50 : 20,
      alarmDescription: 'This metric monitors RDS database connections',
      dimensions: {
        DBInstanceIdentifier: this.rdsInstance.id,
      },
      tags: {
        Name: `SecureApp-RdsConnectionsAlarm-${config.environment}`,
        Environment: config.environment,
      },
    });
  }
}
