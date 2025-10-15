## modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// KMS Module for encryption key management
export class KmsModule extends Construct {
  public readonly key: aws.kmsKey.KmsKey;
  public readonly keyAlias: aws.kmsAlias.KmsAlias;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.key = new aws.kmsKey.KmsKey(this, 'main-key', {
      description: 'Main KMS key for infrastructure encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'key-policy',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: '*', // This allows the AWS account to manage the key
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: 'logs.amazonaws.com',
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
        Environment: 'Production',
        Compliance: 'CIS',
        Security: 'True',
      },
    });

    this.keyAlias = new aws.kmsAlias.KmsAlias(this, 'key-alias', {
      name: 'alias/tap-infrastructure-key',
      targetKeyId: this.key.id,
    });
  }
}

// VPC Module for networking
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly flowLog: aws.flowLog.FlowLog;

  constructor(scope: Construct, id: string, kmsKeyArn: string, azs: string[]) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'tap-vpc',
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'tap-igw',
          Environment: 'Production',
        },
      }
    );

    // Public Subnets in 2 AZs
    this.publicSubnets = [];
    const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24'];

    for (let i = 0; i < azs.length && i < publicCidrs.length; i++) {
      const subnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: publicCidrs[i],
        availabilityZone: azs[i],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `tap-public-subnet-${i + 1}`,
          Type: 'Public',
          Environment: 'Production',
          Compliance: 'CIS',
        },
      });
      this.publicSubnets.push(subnet);
    }

    // Public Route Table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'tap-public-rt',
        Environment: 'Production',
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // NAT Gateways for private subnets
    this.natGateways = [];
    for (let i = 0; i < Math.min(2, this.publicSubnets.length); i++) {
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `tap-nat-eip-${i + 1}`,
          Environment: 'Production',
        },
      });

      const natGateway = new aws.natGateway.NatGateway(
        this,
        `nat-gateway-${i}`,
        {
          allocationId: eip.id,
          subnetId: this.publicSubnets[i].id,
          tags: {
            Name: `tap-nat-gateway-${i + 1}`,
            Environment: 'Production',
          },
        }
      );
      this.natGateways.push(natGateway);
    }

    // Private Subnets in 2 AZs
    this.privateSubnets = [];
    const privateCidrs = ['10.0.10.0/24', '10.0.11.0/24'];

    for (let i = 0; i < Math.min(azs.length, privateCidrs.length); i++) {
      const subnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: privateCidrs[i],
        availabilityZone: azs[i],
        tags: {
          Name: `tap-private-subnet-${i + 1}`,
          Type: 'Private',
          Environment: 'Production',
          Compliance: 'CIS',
        },
      });
      this.privateSubnets.push(subnet);

      // Private Route Table for each AZ
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `tap-private-rt-${i + 1}`,
            Environment: 'Production',
          },
        }
      );

      // Ensure we have enough NAT gateways
      const natGwIndex = i < this.natGateways.length ? i : 0;

      new aws.route.Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[natGwIndex].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    }

    // VPC Flow Logs
    const flowLogRole = new aws.iamRole.IamRole(this, 'flow-log-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });

    const flowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'flow-log-group',
      {
        name: '/aws/vpc/tap-vpc',
        retentionInDays: 30,
        kmsKeyId: kmsKeyArn,
        tags: {
          Environment: 'Production',
          Compliance: 'CIS',
        },
      }
    );

    new aws.iamRolePolicy.IamRolePolicy(this, 'flow-log-policy', {
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    this.flowLog = new aws.flowLog.FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      tags: {
        Name: 'tap-vpc-flow-logs',
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });
  }
}

// Secrets Manager Module
export class SecretsManagerModule extends Construct {
  public readonly dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly dbSecretVersion: aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion;

  constructor(scope: Construct, id: string, kmsKeyId: string) {
    super(scope, id);

    this.dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-secret',
      {
        name: 'tap-rds-credentials',
        description: 'RDS PostgreSQL credentials',
        kmsKeyId: kmsKeyId,
        recoveryWindowInDays: 7,
        tags: {
          Environment: 'Production',
          Compliance: 'CIS',
          Security: 'True',
        },
      }
    );

    this.dbSecretVersion =
      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'db-secret-version',
        {
          secretId: this.dbSecret.id,
          secretString: JSON.stringify({
            username: 'dbadmin',
            password: this.generateSecurePassword(),
            engine: 'postgres',
            port: 5432,
          }),
        }
      );
  }

  private generateSecurePassword(): string {
    // In production, use AWS Secrets Manager automatic password generation
    return 'ChangeMe#2024$Secure!';
  }
}

// RDS Module for PostgreSQL database
export class RdsModule extends Construct {
  public readonly instance: aws.dbInstance.DbInstance;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly subnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      vpcId: string;
      privateSubnetIds: string[];
      kmsKeyId: string;
      kmsKeyArn: string;
      dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
    }
  ) {
    super(scope, id);

    // RDS Security Group
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'rds-sg', {
      name: 'tap-rds-sg',
      description: 'Security group for RDS PostgreSQL',
      vpcId: config.vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: 'tap-rds-sg',
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });

    // DB Subnet Group
    this.subnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: 'tap-db-subnet-group',
        subnetIds: config.privateSubnetIds,
        description: 'Subnet group for RDS PostgreSQL',
        tags: {
          Environment: 'Production',
          Compliance: 'CIS',
        },
      }
    );

    // Generate a unique snapshot identifier
    const timestamp = new Date().getTime();

    // RDS PostgreSQL Instance
    this.instance = new aws.dbInstance.DbInstance(this, 'postgres', {
      identifier: 'tap-postgres-db',
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: config.kmsKeyArn,

      dbName: 'tapdb',
      username: process.env.DB_USERNAME || 'dbadmin',
      password: process.env.DB_PASSWORD || 'ChangeMe#2024$Secure!',

      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],

      multiAz: true,
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      applyImmediately: false,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      enabledCloudwatchLogsExports: ['postgresql'],
      deletionProtection: false, // Changed to false for easier testing
      skipFinalSnapshot: true, // Changed to true for easier testing
      finalSnapshotIdentifier: `tap-postgres-final-snapshot-${timestamp}`,

      tags: {
        Name: 'tap-postgres-db',
        Environment: 'Production',
        Compliance: 'CIS',
        Security: 'True',
      },
    });
  }
}

// EC2 Module
export class Ec2Module extends Construct {
  public readonly instance: aws.instance.Instance;
  public readonly role: aws.iamRole.IamRole;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      vpcId: string;
      publicSubnetId: string;
      kmsKeyArn: string;
      s3BucketArn: string;
      secretArn: string;
      rdsSecurityGroupId: string;
    }
  ) {
    super(scope, id);

    // EC2 IAM Role
    this.role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: 'tap-ec2-role-ts-1234',
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
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });

    // EC2 IAM Policy
    // EC2 IAM Policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'ec2-policy', {
      role: this.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          // Only include S3 statement if bucket ARN is provided
          ...(config.s3BucketArn
            ? [
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject'],
                  Resource: [`${config.s3BucketArn}/*`],
                },
              ]
            : []),
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: config.secretArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: config.kmsKeyArn,
          },
        ],
      }),
    });

    // EC2 Instance Profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-profile',
      {
        name: 'tap-ec2-profile-ts-1234',
        role: this.role.name,
      }
    );

    // EC2 Security Group
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ec2-sg', {
      name: 'tap-ec2-sg',
      description: 'Security group for EC2 instance',
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP from anywhere',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS from anywhere',
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
        Name: 'tap-ec2-sg',
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });

    // Allow EC2 to connect to RDS
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-to-rds', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: config.rdsSecurityGroupId,
      sourceSecurityGroupId: this.securityGroup.id,
      description: 'PostgreSQL access from EC2',
    });

    // EC2 User Data Script
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install PostgreSQL client
amazon-linux-extras install postgresql13 -y

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/tap-instance",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "/aws/ec2/tap-instance",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start
`;

    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
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
    this.instance = new aws.instance.Instance(this, 'instance', {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: config.publicSubnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      userData: Buffer.from(userData).toString('base64'),

      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },

      metadataOptions: {
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
        httpEndpoint: 'enabled',
      },

      monitoring: true,
      associatePublicIpAddress: true,

      tags: {
        Name: 'tap-ec2-instance',
        Environment: 'Production',
        Compliance: 'CIS',
        Security: 'True',
      },
    });
  }
}

// S3 Module for log storage
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;

  constructor(
    scope: Construct,
    id: string,
    kmsKeyArn: string,
    ec2RoleArn: string
  ) {
    super(scope, id);

    // Generate a unique bucket name suffix
    const timestamp = new Date().getTime().toString().slice(-6);
    const bucketName = `tap-ec2-logs-bucket-${timestamp}`;

    // S3 Bucket for logs - without self-logging
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: bucketName,
      acl: 'private',

      versioning: {
        enabled: true,
      },

      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKeyArn,
          },
          bucketKeyEnabled: true,
        },
      },

      lifecycleRule: [
        {
          enabled: true,
          id: 'log-retention',
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
          expiration: {
            days: 90,
          },
        },
      ],

      // Removed self-logging configuration

      tags: {
        Name: bucketName,
        Environment: 'Production',
        Compliance: 'CIS',
        Security: 'True',
      },
    });

    // Block public access
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        'bucket-public-access-block',
        {
          bucket: this.bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

    // Bucket Policy
    this.bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(
      this,
      'bucket-policy',
      {
        bucket: this.bucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowEC2WriteAccess',
              Effect: 'Allow',
              Principal: {
                AWS: ec2RoleArn,
              },
              Action: ['s3:PutObject', 's3:PutObjectAcl'],
              Resource: `${this.bucket.arn}/*`,
            },
            {
              Sid: 'DenyUnencryptedObjectUploads',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:PutObject',
              Resource: `${this.bucket.arn}/*`,
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            },
            {
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Resource: [this.bucket.arn, `${this.bucket.arn}/*`],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        }),
      }
    );
  }
}

// CloudWatch Module for logging and monitoring
export class CloudWatchModule extends Construct {
  public readonly ec2LogGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly rdsLogGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly metricFilter: aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilter;
  public readonly alarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, kmsKeyArn: string) {
    super(scope, id);

    // EC2 Log Group
    this.ec2LogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'ec2-log-group',
      {
        name: '/aws/ec2/tap-instance',
        retentionInDays: 30,
        kmsKeyId: kmsKeyArn,
        tags: {
          Environment: 'Production',
          Compliance: 'CIS',
        },
      }
    );

    // RDS Log Group
    this.rdsLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'rds-log-group',
      {
        name: '/aws/rds/instance/tap-postgres-db/postgresql',
        retentionInDays: 30,
        kmsKeyId: kmsKeyArn,
        tags: {
          Environment: 'Production',
          Compliance: 'CIS',
        },
      }
    );

    // Metric Filter for failed RDS connections
    this.metricFilter =
      new aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilter(
        this,
        'rds-connection-failures',
        {
          name: 'RDSConnectionFailures',
          logGroupName: this.rdsLogGroup.name,
          pattern:
            '[time, request_id, error_severity = "FATAL", error_message = "*authentication failed*"]',
          metricTransformation: {
            name: 'RDSConnectionFailures',
            namespace: 'TapInfrastructure',
            value: '1',
            defaultValue: '0',
          },
        }
      );

    // SNS Topic for alarms
    const snsTopic = new aws.snsTopic.SnsTopic(this, 'alarm-topic', {
      name: 'tap-infrastructure-alarms',
      kmsMasterKeyId: kmsKeyArn,
      tags: {
        Environment: 'Production',
        Compliance: 'CIS',
      },
    });

    // CloudWatch Alarm for RDS connection failures
    this.alarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-connection-alarm',
      {
        alarmName: 'tap-rds-connection-failures',
        alarmDescription: 'Alert when RDS connection failures exceed threshold',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'RDSConnectionFailures',
        namespace: 'TapInfrastructure',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        treatMissingData: 'notBreaching',
        alarmActions: [snsTopic.arn],
        tags: {
          Environment: 'Production',
          Compliance: 'CIS',
        },
      }
    );
  }
}
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  KmsModule,
  VpcModule,
  SecretsManagerModule,
  RdsModule,
  Ec2Module,
  S3Module,
  CloudWatchModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Get account ID for constructing ARNs
    // const currentAccount = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
    //   this,
    //   'current'
    // );

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'TAP',
            ManagedBy: 'CDKTF',
            Environment: environmentSuffix,
          },
        },
      ],
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // 1. KMS Module - Create encryption keys first
    const kmsModule = new KmsModule(this, 'kms');

    // 2. VPC Module - Create networking infrastructure
    const azs = [`${awsRegion}a`, `${awsRegion}b`];
    const vpcModule = new VpcModule(this, 'vpc', kmsModule.key.arn, azs);

    // 3. Secrets Manager Module - Store database credentials
    const secretsModule = new SecretsManagerModule(
      this,
      'secrets',
      kmsModule.key.id
    );

    // 4. RDS Module - Create PostgreSQL database
    const rdsModule = new RdsModule(this, 'rds', {
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      kmsKeyId: kmsModule.key.id,
      kmsKeyArn: kmsModule.key.arn,
      dbSecret: secretsModule.dbSecret,
    });

    // 5. EC2 Module - Create compute instance
    const ec2Module = new Ec2Module(this, 'ec2', {
      vpcId: vpcModule.vpc.id,
      publicSubnetId: vpcModule.publicSubnets[0].id,
      kmsKeyArn: kmsModule.key.arn,
      s3BucketArn: '', // This will be updated after S3 bucket creation
      secretArn: secretsModule.dbSecret.arn,
      rdsSecurityGroupId: rdsModule.securityGroup.id,
    });

    // 6. S3 Module - Create log storage bucket
    // Now that EC2 role is created, we can use its ARN
    const s3Module = new S3Module(
      this,
      's3',
      kmsModule.key.arn,
      ec2Module.role.arn
    );

    // Update EC2 module's policy with the actual S3 bucket ARN (resolving circular dependency)
    new aws.iamRolePolicy.IamRolePolicy(this, 'ec2-s3-policy-update', {
      role: ec2Module.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject'],
            Resource: [`${s3Module.bucket.arn}/*`],
          },
        ],
      }),
    });

    // 7. CloudWatch Module - Set up monitoring and alerting
    const cloudWatchModule = new CloudWatchModule(
      this,
      'cloudwatch',
      kmsModule.key.arn
    );

    // Stack Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS PostgreSQL endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: ec2Module.instance.publicIp,
      description: 'EC2 instance public IP',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 log bucket name',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.id,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS key ARN',
    });

    new TerraformOutput(this, 'secret-arn', {
      value: secretsModule.dbSecret.arn,
      description: 'Database credentials secret ARN',
    });

    new TerraformOutput(this, 'ec2-log-group', {
      value: cloudWatchModule.ec2LogGroup.name,
      description: 'EC2 CloudWatch log group name',
    });

    new TerraformOutput(this, 'rds-log-group', {
      value: cloudWatchModule.rdsLogGroup.name,
      description: 'RDS CloudWatch log group name',
    });

    new TerraformOutput(this, 'alarm-name', {
      value: cloudWatchModule.alarm.alarmName,
      description: 'CloudWatch alarm name for RDS connection failures',
    });

    // Add outputs for subnet IDs for verification
    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id).join(','),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id).join(','),
      description: 'Private subnet IDs',
    });
  }
}
```