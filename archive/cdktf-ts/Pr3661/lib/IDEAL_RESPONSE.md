### modules.ts

```typescript
import { Construct } from 'constructs';
import {
  vpc,
  subnet,
  internetGateway,
  natGateway,
  routeTable,
  route,
  routeTableAssociation,
  flowLog,
  securityGroup,
  securityGroupRule,
  s3Bucket,
  s3BucketLogging,
  s3BucketPolicy,
  s3BucketServerSideEncryptionConfiguration,
  s3BucketPublicAccessBlock,
  iamRole,
  iamPolicy,
  iamPolicyAttachment,
  iamInstanceProfile,
  launchTemplate,
  autoscalingGroup,
  dbInstance,
  dbSubnetGroup,
  cloudwatchLogGroup,
  cloudtrail,
  kmsKey,
  kmsAlias,
  eip,
  dataAwsCallerIdentity,
  s3BucketOwnershipControls,
  dataAwsAmi,
} from '@cdktf/provider-aws';

// Module configuration interfaces
export interface VpcModuleConfig {
  vpcCidrBlock: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  flowLogBucketPolicyId?: string;
  flowLogBucketArn?: string;
  tags?: { [key: string]: string };
}

export interface IamModuleConfig {
  vpcId: string;
  tags?: { [key: string]: string };
}

export interface S3ModuleConfig {
  bucketName: string;
  logBucketName: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface Ec2ModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceType: string;
  iamInstanceProfileName: string;
  sshCidr: string;
  minCapacity: number;
  maxCapacity: number;
  keyName?: string;
  tags?: { [key: string]: string };
}

export interface RdsModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceClass: string;
  engine: string;
  engineVersion?: string;
  dbName: string;
  username: string;
  password: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface CloudTrailModuleConfig {
  s3BucketName: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface ConfigModuleConfig {
  s3BucketName: string;
  iamRoleArn: string;
  tags?: { [key: string]: string };
}

export interface KmsModuleConfig {
  description: string;
  tags?: { [key: string]: string };
}

// VPC Module
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];
  public readonly flowLogId: string;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC
    const mainVpc = new vpc.Vpc(this, 'main', {
      cidrBlock: config.vpcCidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'main-vpc',
        ...config.tags,
      },
    });
    this.vpcId = mainVpc.id;

    // Create Internet Gateway
    const igw = new internetGateway.InternetGateway(this, 'igw', {
      vpcId: mainVpc.id,
      tags: {
        Name: 'main-igw',
        ...config.tags,
      },
    });
    this.internetGatewayId = igw.id;

    // Create public and private subnets
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];
    this.natGatewayIds = [];

    // Public route table
    const publicRouteTable = new routeTable.RouteTable(
      this,
      'public-route-table',
      {
        vpcId: mainVpc.id,
        tags: {
          Name: 'public-route-table',
          ...config.tags,
        },
      }
    );

    // Add route to Internet Gateway
    new route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Create subnets and NAT gateways across AZs
    for (let i = 0; i < config.availabilityZones.length; i++) {
      // Create public subnet
      if (i < config.publicSubnetCidrs.length) {
        const publicSubnet = new subnet.Subnet(this, `public-subnet-${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: config.publicSubnetCidrs[i],
          availabilityZone: config.availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}`,
            ...config.tags,
          },
        });
        this.publicSubnetIds.push(publicSubnet.id);

        // Associate public subnet with public route table
        new routeTableAssociation.RouteTableAssociation(
          this,
          `public-route-assoc-${i}`,
          {
            subnetId: publicSubnet.id,
            routeTableId: publicRouteTable.id,
          }
        );

        // Create NAT Gateway with Elastic IP in public subnet
        const eipForNat = new eip.Eip(this, `nat-eip-${i}`, {
          domain: 'vpc',
          tags: {
            Name: `nat-eip-${i}`,
            ...config.tags,
          },
        });

        const natGw = new natGateway.NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eipForNat.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `nat-gateway-${i}`,
            ...config.tags,
          },
        });
        this.natGatewayIds.push(natGw.id);

        // Create private subnet
        if (i < config.privateSubnetCidrs.length) {
          const privateSubnet = new subnet.Subnet(this, `private-subnet-${i}`, {
            vpcId: mainVpc.id,
            cidrBlock: config.privateSubnetCidrs[i],
            availabilityZone: config.availabilityZones[i],
            tags: {
              Name: `private-subnet-${i}`,
              ...config.tags,
            },
          });
          this.privateSubnetIds.push(privateSubnet.id);

          // Private route table
          const privateRouteTable = new routeTable.RouteTable(
            this,
            `private-route-table-${i}`,
            {
              vpcId: mainVpc.id,
              tags: {
                Name: `private-route-table-${i}`,
                ...config.tags,
              },
            }
          );

          // Add route to NAT Gateway
          new route.Route(this, `private-route-${i}`, {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGw.id,
          });

          // Associate private subnet with private route table
          new routeTableAssociation.RouteTableAssociation(
            this,
            `private-route-assoc-${i}`,
            {
              subnetId: privateSubnet.id,
              routeTableId: privateRouteTable.id,
            }
          );
        }
      }
    }

    const currentAccount = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current-account',
      {}
    );
    // First, add IAM role for Flow Logs
    const flowLogRole = new iamRole.IamRole(this, 'flow-log-role', {
      name: 'vpc-flow-log-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      inlinePolicy: [
        {
          name: 'flow-log-cloudwatch-policy',
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
                Resource: [
                  `arn:aws:logs:*:${currentAccount.accountId}:log-group:/aws/vpc/flowlogs:*`,
                  `arn:aws:logs:*:${currentAccount.accountId}:log-group:/aws/vpc/flowlogs`,
                ],
              },
            ],
          }),
        },
      ],
      tags: config.tags,
    });

    // Create CloudWatch Log Group
    const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'flow-log-group',
      {
        name: '/aws/vpc/flowlogs',
        retentionInDays: 7, // Adjust as needed
        tags: config.tags,
      }
    );

    // Then replace the flowLog creation with:
    const vpcFlowLog = new flowLog.FlowLog(this, 'flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestination: logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      trafficType: 'ALL',
      vpcId: mainVpc.id,
      tags: {
        Name: 'vpc-flow-logs',
        ...config.tags,
      },
    });
    this.flowLogId = vpcFlowLog.id;
  }
}

// IAM Module
export class IamModule extends Construct {
  public readonly ec2Role: iamRole.IamRole;
  public readonly ec2InstanceProfile: iamInstanceProfile.IamInstanceProfile;
  public readonly configRole: iamRole.IamRole;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // Generate unique role names to avoid conflicts
    // const timestamp = new Date().getTime().toString();

    // EC2 Role with least privilege
    this.ec2Role = new iamRole.IamRole(this, 'ec2-role', {
      name: 'ec2-instance-role-ts',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Effect: 'Allow',
            Sid: '',
          },
        ],
      }),
      tags: config.tags,
    });

    // EC2 Policy for minimal permissions
    const ec2Policy = new iamPolicy.IamPolicy(this, 'ec2-policy', {
      name: 'ec2-minimal-policy-ts',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'logs:PutLogEvents',
              'logs:CreateLogStream',
              'logs:CreateLogGroup',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach policy to role
    new iamPolicyAttachment.IamPolicyAttachment(this, 'ec2-policy-attachment', {
      name: 'ec2-policy-attachment-ts',
      roles: [this.ec2Role.name],
      policyArn: ec2Policy.arn,
    });

    // Create instance profile
    this.ec2InstanceProfile = new iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'ec2-instance-profile-ts',
        role: this.ec2Role.name,
      }
    );

    // AWS Config Role
    this.configRole = new iamRole.IamRole(this, 'config-role', {
      name: 'aws-config-role-ts',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Effect: 'Allow',
            Sid: '',
          },
        ],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      ],
      tags: config.tags,
    });
  }
}

// S3 Module
export class S3Module extends Construct {
  public readonly mainBucket: s3Bucket.S3Bucket;
  public readonly logBucket: s3Bucket.S3Bucket;
  public readonly mainBucketArn: string;
  public readonly logBucketArn: string;
  public readonly logBucketPolicy: s3BucketPolicy.S3BucketPolicy;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Get current account info
    // const _currentAccount = new dataAwsCallerIdentity.DataAwsCallerIdentity(
    //   this,
    //   'current-account',
    //   {}
    // );

    // Create log bucket first
    this.logBucket = new s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: config.logBucketName,
      tags: {
        Name: config.logBucketName,
        ...config.tags,
      },
    });
    this.logBucketArn = this.logBucket.arn;

    // Set ownership controls for the log bucket
    new s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'log-bucket-ownership',
      {
        bucket: this.logBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      }
    );

    // MODIFIED: Set blockPublicPolicy to false to allow the policy with Principal: '*'
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'log-bucket-public-access-block',
      {
        bucket: this.logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: false, // Changed to false
        ignorePublicAcls: true,
        restrictPublicBuckets: false, // Changed to false
      }
    );

    // Enable encryption for log bucket
    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'log-bucket-encryption',
      {
        bucket: this.logBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: config.kmsKeyId,
            },
          },
        ],
      }
    );

    // SIMPLIFIED bucket policy for VPC Flow Logs
    this.logBucketPolicy = new s3BucketPolicy.S3BucketPolicy(
      this,
      'log-bucket-policy',
      {
        bucket: this.logBucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            // Allow VPC Flow Logs to check bucket ACL
            {
              Sid: 'AWSLogDeliveryAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: this.logBucket.arn,
            },
            // Allow VPC Flow Logs to write
            {
              Sid: 'AWSLogDeliveryWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${this.logBucket.arn}/*`,
            },
            // CloudTrail permissions
            {
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: this.logBucket.arn,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${this.logBucket.arn}/*`,
            },
          ],
        }),
      }
    );

    // Create main bucket
    this.mainBucket = new s3Bucket.S3Bucket(this, 'main-bucket', {
      bucket: config.bucketName,
      tags: {
        Name: config.bucketName,
        ...config.tags,
      },
    });
    this.mainBucketArn = this.mainBucket.arn;

    // Set ownership controls for the main bucket
    new s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'main-bucket-ownership',
      {
        bucket: this.mainBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      }
    );

    // Configure logging for main bucket
    new s3BucketLogging.S3BucketLoggingA(this, 'main-bucket-logging', {
      bucket: this.mainBucket.id,
      targetBucket: this.logBucket.id,
      targetPrefix: 'main-bucket-logs/',
    });

    // Block public access to main bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'main-bucket-public-access-block',
      {
        bucket: this.mainBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Enable encryption for main bucket
    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'main-bucket-encryption',
      {
        bucket: this.mainBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: config.kmsKeyId,
            },
          },
        ],
      }
    );

    // Create bucket policy to deny non-SSL access
    new s3BucketPolicy.S3BucketPolicy(this, 'main-bucket-policy', {
      bucket: this.mainBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyNonSSLRequests',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [this.mainBucket.arn, `${this.mainBucket.arn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
        ],
      }),
    });
  }
}

// EC2 Module
export class Ec2Module extends Construct {
  public readonly launchTemplate: launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: autoscalingGroup.AutoscalingGroup;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Create security group for EC2 instances
    const ec2SecurityGroup = new securityGroup.SecurityGroup(
      this,
      'ec2-security-group',
      {
        name: 'ec2-security-group',
        vpcId: config.vpcId,
        description: 'Security group for EC2 instances',
        tags: {
          Name: 'ec2-security-group',
          ...config.tags,
        },
      }
    );

    // Allow SSH from specified CIDR only
    new securityGroupRule.SecurityGroupRule(this, 'ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.sshCidr],
      securityGroupId: ec2SecurityGroup.id,
    });

    // Allow only necessary outbound traffic
    new securityGroupRule.SecurityGroupRule(this, 'https-egress', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ec2SecurityGroup.id,
    });

    // After (dynamic lookup)
    const ami = new dataAwsAmi.DataAwsAmi(this, 'amazon-linux-2', {
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

    // Create launch template
    this.launchTemplate = new launchTemplate.LaunchTemplate(
      this,
      'ec2-launch-template',
      {
        name: 'ec2-launch-template',
        imageId: ami.id,
        instanceType: config.instanceType,
        keyName: config.keyName,
        vpcSecurityGroupIds: [ec2SecurityGroup.id, ...config.securityGroupIds],
        iamInstanceProfile: {
          name: config.iamInstanceProfileName,
        },
        monitoring: {
          enabled: true,
        },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true',
            },
          },
        ],
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: 'ec2-instance',
              ...config.tags,
            },
          },
        ],
      }
    );

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscalingGroup.AutoscalingGroup(
      this,
      'ec2-asg',
      {
        name: 'ec2-auto-scaling-group',
        maxSize: config.maxCapacity,
        minSize: config.minCapacity,
        desiredCapacity: config.minCapacity,
        vpcZoneIdentifier: config.subnetIds,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
      }
    );
  }
}

// RDS Module
export class RdsModule extends Construct {
  public readonly dbInstance: dbInstance.DbInstance;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Create security group for RDS
    const rdsSecurityGroup = new securityGroup.SecurityGroup(
      this,
      'rds-security-group',
      {
        name: 'rds-security-group',
        vpcId: config.vpcId,
        description: 'Security group for RDS instance',
        tags: {
          Name: 'rds-security-group',
          ...config.tags,
        },
      }
    );

    // Allow incoming traffic to RDS from EC2 security groups
    config.securityGroupIds.forEach((sgId, index) => {
      new securityGroupRule.SecurityGroupRule(this, `rds-ingress-${index}`, {
        type: 'ingress',
        fromPort: 3306, // MySQL/Aurora default port
        toPort: 3306,
        protocol: 'tcp',
        sourceSecurityGroupId: sgId,
        securityGroupId: rdsSecurityGroup.id,
      });
    });

    // Create DB subnet group
    const dbSubnetGrp = new dbSubnetGroup.DbSubnetGroup(
      this,
      'rds-subnet-group',
      {
        name: 'rds-subnet-group',
        subnetIds: config.subnetIds,
        description: 'Subnet group for RDS instance',
        tags: {
          Name: 'rds-subnet-group',
          ...config.tags,
        },
      }
    );

    // Create RDS instance
    this.dbInstance = new dbInstance.DbInstance(this, 'rds-instance', {
      identifier: 'production-db',
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      dbSubnetGroupName: dbSubnetGrp.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      multiAz: true,
      storageEncrypted: true,
      // Fixed the KMS key ID reference - ensuring it's a proper ARN
      kmsKeyId: config.kmsKeyId, // Make sure this is a full ARN in the config
      backupRetentionPeriod: 7,
      copyTagsToSnapshot: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.dbName}-final-snapshot`,
      publiclyAccessible: false,
      tags: {
        Name: 'production-db',
        ...config.tags,
      },
    });
  }
}

// CloudTrail Module
export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;

  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Create CloudTrail
    this.trail = new cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: 'organization-trail',
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: 'cloudtrail',
      enableLogging: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      isOrganizationTrail: false,
      enableLogFileValidation: true,
      kmsKeyId: config.kmsKeyId,
      tags: {
        Name: 'organization-trail',
        ...config.tags,
      },
    });
  }
}

// Modified Config Module - without AWS Config Rules
export class ConfigModule extends Construct {
  constructor(scope: Construct, id: string, _config: ConfigModuleConfig) {
    super(scope, id);
    // Removed all Config recorder, delivery channel, and rules
    // as per user request to not use Config recorder
  }
}

// KMS Module
export class KmsModule extends Construct {
  public readonly key: kmsKey.KmsKey;

  constructor(scope: Construct, id: string, config: KmsModuleConfig) {
    super(scope, id);

    // Create the data source for current AWS account
    const currentAccount = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current',
      {}
    );

    // Create KMS key
    this.key = new kmsKey.KmsKey(this, 'kms-key', {
      description: config.description,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
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
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*'],
            Resource: '*',
            Condition: {
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:*:${currentAccount.accountId}:trail/*`,
              },
            },
          },
        ],
      }),
      tags: config.tags,
    });

    // Create KMS alias
    new kmsAlias.KmsAlias(this, 'kms-alias', {
      name: `alias/${id}`,
      targetKeyId: this.key.id,
    });
  }
}
```

### tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
  ConfigModule,
  KmsModule,
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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Global environment tags
    const tags = {
      Environment: 'Production',
      Project: 'TAP',
      ManagedBy: 'CDKTF',
    };

    // Create KMS keys
    const mainKms = new KmsModule(this, 'main-kms', {
      description: 'Main KMS key for encryption',
      tags,
    });

    const rdsKms = new KmsModule(this, 'rds-kms', {
      description: 'KMS key for RDS encryption',
      tags,
    });

    // Create S3 buckets
    const s3 = new S3Module(this, 's3', {
      bucketName: 'tap-production-data-bucket',
      logBucketName: 'tap-production-logs-bucket',
      kmsKeyId: mainKms.key.id,
      tags,
    });

    // Create VPC infrastructure
    const vpc = new VpcModule(this, 'vpc', {
      vpcCidrBlock: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.3.0/24', '10.0.4.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      flowLogBucketArn: s3.logBucket.arn,
      tags,
    });

    // Create IAM roles and policies
    const iam = new IamModule(this, 'iam', {
      vpcId: vpc.vpcId,
      tags,
    });

    // Create EC2 instances with Auto Scaling
    new Ec2Module(this, 'ec2', {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      securityGroupIds: [],
      instanceType: 't3.micro',
      iamInstanceProfileName: iam.ec2InstanceProfile.name,
      sshCidr: '10.0.0.0/24', // Replace with actual admin IP range
      minCapacity: 2,
      maxCapacity: 5,
      tags,
    });

    // Create RDS database
    const rds = new RdsModule(this, 'rds', {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      securityGroupIds: [],
      instanceClass: 'db.t3.small',
      engine: 'mysql',
      dbName: 'productiondb',
      username: process.env.RDS_USERNAME || 'admin',
      password: process.env.RDS_PASSWORD || 'ChangeMe123!', // Use a secure password in production
      kmsKeyId: rdsKms.key.arn,
      tags,
    });

    // Enable CloudTrail for logging
    new CloudTrailModule(this, 'cloudtrail', {
      s3BucketName: s3.logBucket.bucket,
      kmsKeyId: mainKms.key.arn,
      tags,
    });

    // Enable AWS Config for compliance monitoring
    new ConfigModule(this, 'config', {
      s3BucketName: s3.logBucket.bucket,
      iamRoleArn: iam.configRole.arn,
      tags,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnetIds,
      description: 'The IDs of the public subnets',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnetIds,
      description: 'The IDs of the private subnets',
    });

    new TerraformOutput(this, 'main_bucket_name', {
      value: s3.mainBucket.bucket,
      description: 'The name of the main S3 bucket',
    });

    new TerraformOutput(this, 'log_bucket_name', {
      value: s3.logBucket.bucket,
      description: 'The name of the log S3 bucket',
    });

    new TerraformOutput(this, 'rds_instance_endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'The connection endpoint for the RDS instance',
    });

    new TerraformOutput(this, 'main_kms_key_arn', {
      value: mainKms.key.arn,
      description: 'The ARN of the main KMS key',
    });

    new TerraformOutput(this, 'rds_kms_key_arn', {
      value: rdsKms.key.arn,
      description: 'The ARN of the RDS KMS key',
    });

    // Additional VPC outputs
    new TerraformOutput(this, 'nat_gateway_ids', {
      value: vpc.natGatewayIds,
      description: 'The IDs of the NAT gateways',
    });

    new TerraformOutput(this, 'internet_gateway_id', {
      value: vpc.internetGatewayId,
      description: 'The ID of the Internet Gateway',
    });

    new TerraformOutput(this, 'vpc_flow_log_id', {
      value: vpc.flowLogId,
      description: 'The ID of the VPC Flow Log',
    });

    // IAM outputs
    new TerraformOutput(this, 'ec2_role_arn', {
      value: iam.ec2Role.arn,
      description: 'The ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'ec2_instance_profile_arn', {
      value: iam.ec2InstanceProfile.arn,
      description: 'The ARN of the EC2 instance profile',
    });

    new TerraformOutput(this, 'config_role_arn', {
      value: iam.configRole.arn,
      description: 'The ARN of the Config IAM role',
    });

    // RDS outputs
    new TerraformOutput(this, 'rds_security_group_id', {
      value: rds.dbInstance.vpcSecurityGroupIds,
      description: 'The security groups associated with the RDS instance',
    });

    new TerraformOutput(this, 'rds_subnet_group_name', {
      value: rds.dbInstance.dbSubnetGroupName,
      description: 'The DB subnet group name used by the RDS instance',
    });

    // Security information
    new TerraformOutput(this, 'vpc_cidr_block', {
      value: vpc.vpcId,
      description: 'The CIDR block of the VPC',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```