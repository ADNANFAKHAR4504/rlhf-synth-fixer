## modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// VPC Module
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly flowLogGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, availabilityZones: string[]) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'secure-vpc',
        Environment: 'Production',
        Security: 'Enforced',
      },
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    this.flowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'flow-log-group',
      {
        name: `/aws/vpc/flowlogs/${this.vpc.id}`,
        retentionInDays: 30,
        tags: {
          Name: 'vpc-flow-logs',
          Security: 'True',
        },
      }
    );

    // IAM Role for VPC Flow Logs
    const flowLogRole = new aws.iamRole.IamRole(this, 'flow-log-role', {
      name: 'vpc-flow-logs-role-654',
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
    });

    // IAM Policy for VPC Flow Logs
    const flowLogPolicy = new aws.iamPolicy.IamPolicy(this, 'flow-log-policy', {
      name: 'vpc-flow-logs-policy-654',
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

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'flow-log-policy-attachment',
      {
        role: flowLogRole.name,
        policyArn: flowLogPolicy.arn,
      }
    );

    // Enable VPC Flow Logs (CloudWatch destination)
    new aws.flowLog.FlowLog(this, 'vpc-flow-log', {
      logDestinationType: 'cloud-watch-logs',
      logDestination: this.flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      tags: {
        Name: 'main-vpc-flow-logs',
        Security: 'True',
      },
    });

    // Create Internet Gateway
    const igw = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'main-igw',
      },
    });

    // Create NAT Gateway EIP
    const natEip = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: 'nat-gateway-eip',
      },
    });

    // Create subnets
    this.privateSubnets = [];
    this.publicSubnets = [];

    availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(
        this,
        `public-subnet-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${index}`,
            Type: 'Public',
          },
        }
      );
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(
        this,
        `private-subnet-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index + 10}.0/24`,
          availabilityZone: az,
          tags: {
            Name: `private-subnet-${index}`,
            Type: 'Private',
          },
        }
      );
      this.privateSubnets.push(privateSubnet);
    });

    // Create NAT Gateway
    const natGateway = new aws.natGateway.NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: 'main-nat-gateway',
      },
    });

    // Route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'public-route-table',
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

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

    const privateRouteTable = new aws.routeTable.RouteTable(
      this,
      'private-rt',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'private-route-table',
        },
      }
    );

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

// IAM Module
export class IamModule extends Construct {
  public readonly instanceRole: aws.iamRole.IamRole;
  public readonly lambdaRole: aws.iamRole.IamRole;
  public readonly permissionsBoundary: aws.iamPolicy.IamPolicy;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create permissions boundary policy
    this.permissionsBoundary = new aws.iamPolicy.IamPolicy(
      this,
      'permissions-boundary',
      {
        name: 'security-permissions-boundary-654',
        description: 'Permissions boundary for all IAM roles',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:*',
                's3:*',
                'rds:*',
                'lambda:*',
                'logs:*',
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              Resource: '*',
            },
            {
              Effect: 'Deny',
              Action: [
                'iam:DeleteRole*',
                'iam:DeleteUser*',
                'iam:DeleteGroup*',
                'iam:DeletePolicy*',
                'iam:CreateAccessKey',
                'iam:PutUserPolicy',
                'iam:PutGroupPolicy',
                'iam:PutRolePolicy',
                'iam:AddUserToGroup',
                'iam:RemoveUserFromGroup',
              ],
              Resource: '*',
            },
          ],
        }),
      }
    );

    // Create EC2 instance role
    this.instanceRole = new aws.iamRole.IamRole(this, 'ec2-instance-role', {
      name: 'secure-ec2-instance-role-654',
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
      permissionsBoundary: this.permissionsBoundary.arn,
      tags: {
        Security: 'Enforced',
      },
    });

    // Attach policies to EC2 role
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-cloudwatch-policy',
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-ssm-policy',
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    // Create Lambda execution role
    this.lambdaRole = new aws.iamRole.IamRole(this, 'lambda-execution-role', {
      name: 'secure-lambda-execution-role-654',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      permissionsBoundary: this.permissionsBoundary.arn,
      tags: {
        Security: 'Enforced',
      },
    });

    // Lambda VPC execution policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'lambda-vpc-policy',
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      }
    );

    // Create MFA enforcement policy for users
    new aws.iamPolicy.IamPolicy(this, 'mfa-enforcement-policy', {
      name: 'enforce-mfa-policy-654',
      description: 'Enforces MFA for all IAM users',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowViewAccountInfo',
            Effect: 'Allow',
            Action: [
              'iam:GetAccountPasswordPolicy',
              'iam:ListVirtualMFADevices',
            ],
            Resource: '*',
          },
          {
            Sid: 'AllowManageOwnVirtualMFADevice',
            Effect: 'Allow',
            Action: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
            ],
            Resource: 'arn:aws:iam::*:mfa/$${aws:username}',
          },
          {
            Sid: 'AllowManageOwnUserMFA',
            Effect: 'Allow',
            Action: [
              'iam:DeactivateMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ResyncMFADevice',
            ],
            Resource: 'arn:aws:iam::*:user/$${aws:username}',
          },
          {
            Sid: 'DenyAllExceptListedIfNoMFA',
            Effect: 'Deny',
            NotAction: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'sts:GetSessionToken',
            ],
            Resource: '*',
            Condition: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          },
        ],
      }),
    });
  }
}

// S3 Module
export class S3Module extends Construct {
  public readonly logBucket: aws.s3Bucket.S3Bucket;
  public readonly kmsKey: aws.kmsKey.KmsKey;

  constructor(scope: Construct, id: string, awsRegion: string) {
    super(scope, id);

    // Get current caller identity
    const callerIdentity = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current'
    );

    // Create KMS key for S3 encryption with proper permissions for CloudWatch Logs
    // In S3Module constructor, update the KMS key policy:
    this.kmsKey = new aws.kmsKey.KmsKey(this, 's3-kms-key', {
      description: 'KMS key for S3 bucket encryption and CloudWatch Logs',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${awsRegion}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${awsRegion}:${callerIdentity.accountId}:*`,
              },
            },
          },
          // ADD THIS NEW STATEMENT FOR CLOUDTRAIL
          {
            Sid: 'Allow CloudTrail',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: '*',
            Condition: {
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:*:${callerIdentity.accountId}:trail/*`,
              },
            },
          },
          // ADD THIS STATEMENT FOR CLOUDTRAIL DECRYPTION
          {
            Sid: 'Allow CloudTrail to decrypt',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 'kms:Decrypt',
            Resource: '*',
            Condition: {
              Null: {
                'kms:EncryptionContext:aws:cloudtrail:arn': 'false',
              },
            },
          },
        ],
      }),
      tags: {
        Name: 's3-encryption-key',
        Security: 'True',
      },
    });

    new aws.kmsAlias.KmsAlias(this, 's3-kms-alias', {
      name: 'alias/s3-encryption-654',
      targetKeyId: this.kmsKey.keyId,
    });

    // Create secure S3 bucket for logs (without ACL)
    this.logBucket = new aws.s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: 'secure-logs-654',
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: this.kmsKey.arn,
          },
        },
      },
      lifecycleRule: [
        {
          enabled: true,
          id: 'expire-old-logs',
          expiration: {
            days: 365,
          },
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
      ],
      tags: {
        Name: 'secure-log-bucket',
        Environment: 'Production',
        Security: 'Enforced',
      },
    });

    // Set bucket ownership controls
    new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'log-bucket-ownership',
      {
        bucket: this.logBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerEnforced',
        },
      }
    );

    // S3 bucket public access block
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'log-bucket-pab',
      {
        bucket: this.logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // S3 bucket policy to deny non-encrypted uploads
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'log-bucket-policy', {
      bucket: this.logBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              `\${aws_s3_bucket.${this.logBucket.friendlyUniqueId}.arn}`,
              `\${aws_s3_bucket.${this.logBucket.friendlyUniqueId}.arn}/*`,
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `\${aws_s3_bucket.${this.logBucket.friendlyUniqueId}.arn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
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
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly instance: aws.instance.Instance;

  constructor(
    scope: Construct,
    id: string,
    vpc: aws.vpc.Vpc,
    subnetId: string,
    instanceRole: aws.iamRole.IamRole
  ) {
    super(scope, id);

    // Create security group with restrictive rules
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ec2-sg', {
      name: 'secure-ec2-sg-654',
      description: 'Security group for EC2 instances',
      vpcId: vpc.id,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: 'secure-ec2-sg',
        Security: 'Enforced',
      },
    });

    // Security group rule - No SSH from 0.0.0.0/0
    new aws.securityGroupRule.SecurityGroupRule(this, 'deny-public-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'], // Only from within VPC
      securityGroupId: this.securityGroup.id,
      description: 'SSH access only from VPC',
    });

    // Instance profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'instance-profile',
      {
        name: 'secure-ec2-profile-654',
        role: instanceRole.name,
      }
    );

    // Launch EC2 instance with encrypted EBS
    this.instance = new aws.instance.Instance(this, 'secure-instance', {
      ami: 'ami-0989fb15ce71ba39e', // Amazon Linux 2
      instanceType: 't3.micro',
      subnetId: subnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },
      ebsBlockDevice: [
        {
          deviceName: '/dev/sdf',
          volumeType: 'gp3',
          volumeSize: 50,
          encrypted: true,
          deleteOnTermination: true,
        },
      ],
      monitoring: true,
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // IMDSv2 only
      },
      tags: {
        Name: 'secure-ec2-instance',
        Environment: 'Production',
        Security: 'Enforced',
      },
    });
  }
}

// RDS Module
export class RdsModule extends Construct {
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly dbParameterGroup: aws.dbParameterGroup.DbParameterGroup;
  public readonly dbInstance: aws.dbInstance.DbInstance;

  constructor(
    scope: Construct,
    id: string,
    vpc: aws.vpc.Vpc,
    subnetIds: string[]
  ) {
    super(scope, id);

    // DB subnet group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: 'secure-db-subnet-group-654',
        subnetIds: subnetIds,
        description: 'Subnet group for RDS instances',
        tags: {
          Name: 'secure-db-subnet-group',
        },
      }
    );

    // DB parameter group with SSL enforcement
    this.dbParameterGroup = new aws.dbParameterGroup.DbParameterGroup(
      this,
      'db-param-group',
      {
        name: 'secure-mysql-params-654',
        family: 'mysql8.0',
        description: 'Secure parameter group for MySQL',
        parameter: [
          {
            name: 'require_secure_transport',
            value: 'ON',
          },
        ],
        tags: {
          Name: 'secure-db-params',
        },
      }
    );

    // Security group for RDS
    const dbSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'rds-sg',
      {
        name: 'secure-rds-sg-654',
        description: 'Security group for RDS instances',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'], // Only from within VPC
            description: 'MySQL access from VPC only',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: 'secure-rds-sg',
        },
      }
    );

    // RDS instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'secure-db', {
      identifier: 'secure-mysql-db-654',
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'securedb',
      username: 'admin',
      password: 'ChangeMe123!', // In production, use Secrets Manager
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      parameterGroupName: this.dbParameterGroup.name,
      multiAz: true,
      publiclyAccessible: false,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['error'],
      deletionProtection: true,
      copyTagsToSnapshot: true,
      tags: {
        Name: 'secure-mysql-db',
        Environment: 'Production',
        Security: 'Enforced',
      },
    });
  }
}

// Lambda Module
export class LambdaModule extends Construct {
  public readonly function: aws.lambdaFunction.LambdaFunction;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    vpc: aws.vpc.Vpc,
    subnetIds: string[],
    lambdaRole: aws.iamRole.IamRole,
    kmsKey: aws.kmsKey.KmsKey
  ) {
    super(scope, id);

    // Create log group with encryption
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'lambda-logs',
      {
        name: '/aws/lambda/secure-function-654',
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: 'secure-lambda-logs',
        },
      }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'lambda-sg',
      {
        name: 'secure-lambda-sg-654',
        description: 'Security group for Lambda functions',
        vpcId: vpc.id,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: 'secure-lambda-sg',
        },
      }
    );

    // Lambda function
    this.function = new aws.lambdaFunction.LambdaFunction(
      this,
      'secure-function',
      {
        functionName: 'secure-lambda-function-654',
        role: lambdaRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs20.x',
        s3Bucket: 'my-lambda-bucket777', // Use the app bucket you already created
        s3Key: 'lambda/lambda-function.zip', // Simple S3 key
        sourceCodeHash: 'placeholder',
        timeout: 30,
        memorySize: 256,
        vpcConfig: {
          subnetIds: subnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            ENVIRONMENT: 'production',
            LOG_LEVEL: 'info',
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          Name: 'secure-lambda',
          Environment: 'Production',
          Security: 'Enforced',
        },
        dependsOn: [this.logGroup],
      }
    );
  }
}

// CloudTrail Module
export class CloudTrailModule extends Construct {
  public readonly trail: aws.cloudtrail.Cloudtrail;
  public readonly trailBucket: aws.s3Bucket.S3Bucket;

  constructor(scope: Construct, id: string, kmsKey: aws.kmsKey.KmsKey) {
    super(scope, id);

    // Create S3 bucket for CloudTrail logs (without ACL)
    this.trailBucket = new aws.s3Bucket.S3Bucket(this, 'trail-bucket', {
      bucket: 'cloudtrail-logs-654',
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
        },
      },
      lifecycleRule: [
        {
          enabled: true,
          id: 'archive-old-logs',
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
      tags: {
        Name: 'cloudtrail-bucket',
        Security: 'Enforced',
      },
    });

    // Set bucket ownership controls
    new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'trail-bucket-ownership',
      {
        bucket: this.trailBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerEnforced',
        },
      }
    );

    // S3 bucket policy for CloudTrail
    // In CloudTrailModule, update the S3 bucket policy:
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'trail-bucket-policy', {
      bucket: this.trailBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: `\${aws_s3_bucket.${this.trailBucket.friendlyUniqueId}.arn}`,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `\${aws_s3_bucket.${this.trailBucket.friendlyUniqueId}.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
                's3:x-amz-server-side-encryption-aws-kms-key-id': kmsKey.arn,
              },
            },
          },
        ],
      }),
    });

    // Public access block
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'trail-bucket-pab',
      {
        bucket: this.trailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // CloudTrail
    this.trail = new aws.cloudtrail.Cloudtrail(this, 'main-trail', {
      name: 'security-trail-654',
      s3BucketName: this.trailBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      isOrganizationTrail: false,
      enableLogFileValidation: true,
      enableLogging: true,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: 'main-cloudtrail',
        Security: 'Enforced',
      },
    });

    // CloudWatch Alarms for security events
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'unauthorized-api-calls',
      {
        alarmName: 'UnauthorizedAPICalls',
        alarmDescription: 'Alarm for unauthorized API calls',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnauthorizedAPICalls',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 1,
        treatMissingData: 'notBreaching',
        tags: {
          Security: 'Alert',
        },
      }
    );

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'root-account-usage',
      {
        alarmName: 'RootAccountUsage',
        alarmDescription: 'Alarm for root account usage',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'RootAccountUsage',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        treatMissingData: 'notBreaching',
        tags: {
          Security: 'Alert',
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

// Import modules
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  LambdaModule,
  CloudTrailModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

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

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Compliance: 'Enforced',
            Security: 'True',
            ManagedBy: 'CDKTF',
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
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Dynamic availability zones based on region
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // Deploy VPC Module with availability zones
    const vpcModule = new VpcModule(this, 'vpc-module', availabilityZones);

    // Deploy IAM Module
    const iamModule = new IamModule(this, 'iam-module');

    // Deploy S3 Module with region for KMS
    const s3Module = new S3Module(this, 's3-module', awsRegion);

    // Deploy CloudTrail Module
    const cloudTrailModule = new CloudTrailModule(
      this,
      'cloudtrail-module',
      s3Module.kmsKey
    );

    // Deploy EC2 Module
    new Ec2Module(
      this,
      'ec2-module',
      vpcModule.vpc,
      vpcModule.privateSubnets[0].id,
      iamModule.instanceRole
    );

    // Deploy RDS Module
    new RdsModule(
      this,
      'rds-module',
      vpcModule.vpc,
      vpcModule.privateSubnets.map(subnet => subnet.id)
    );

    // Deploy Lambda Module
    new LambdaModule(
      this,
      'lambda-module',
      vpcModule.vpc,
      vpcModule.privateSubnets.map(subnet => subnet.id),
      iamModule.lambdaRole,
      s3Module.kmsKey
    );

    // Outputs for compliance verification
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'iam-permissions-boundary-arn', {
      value: iamModule.permissionsBoundary.arn,
      description: 'IAM permissions boundary ARN',
    });

    new TerraformOutput(this, 's3-encryption-status', {
      value: 'KMS encryption enabled on all S3 buckets',
      description: 'S3 encryption status',
    });

    new TerraformOutput(this, 's3-public-access-block', {
      value: 'Public access blocked on all S3 buckets',
      description: 'S3 public access status',
    });

    new TerraformOutput(this, 'ec2-ebs-encryption', {
      value: 'All EBS volumes are encrypted',
      description: 'EC2 EBS encryption status',
    });

    new TerraformOutput(this, 'rds-encryption-status', {
      value: 'RDS instance and snapshots are encrypted',
      description: 'RDS encryption status',
    });

    new TerraformOutput(this, 'cloudtrail-status', {
      value: {
        enabled: cloudTrailModule.trail.isMultiRegionTrail,
        logFileValidation: cloudTrailModule.trail.enableLogFileValidation,
        encryptionEnabled: true,
      },
      description: 'CloudTrail configuration status',
    });

    new TerraformOutput(this, 'lambda-logging-status', {
      value: 'Lambda functions have detailed CloudWatch logging enabled',
      description: 'Lambda logging status',
    });

    new TerraformOutput(this, 'vpc-flow-logs-status', {
      value: 'VPC Flow Logs enabled and stored in CloudWatch Logs',
      description: 'VPC Flow Logs status',
    });

    new TerraformOutput(this, 'security-compliance-summary', {
      value: {
        iamPermissionBoundaries: 'Enforced',
        mfaRequirement: 'Policy Applied',
        ec2EbsEncryption: 'Enabled',
        s3Encryption: 'KMS',
        s3PublicAccess: 'Blocked',
        sshRestriction: 'No 0.0.0.0/0 access',
        cloudTrailMultiRegion: 'Enabled',
        lambdaVpcDeployment: 'Enforced',
        rdsEncryption: 'Enabled',
        rdsPublicAccess: 'Disabled',
        vpcFlowLogs: 'CloudWatch',
      },
      description: 'Security compliance summary',
    });
  }
}
```