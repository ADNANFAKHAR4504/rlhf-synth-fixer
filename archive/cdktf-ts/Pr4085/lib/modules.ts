import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// Common tags interface with index signature
export interface CommonTags {
  [key: string]: string;
  Environment: string;
  Security: string;
  Compliance: string;
}

// Base module class with common functionality
export abstract class BaseModule extends Construct {
  protected tags: CommonTags;

  constructor(scope: Construct, id: string, tags: CommonTags) {
    super(scope, id);
    this.tags = tags;
  }
}

// VPC Module
export class VpcModule extends BaseModule {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly igw: aws.internetGateway.InternetGateway;
  public readonly natGw: aws.natGateway.NatGateway;
  public readonly publicRouteTable: aws.routeTable.RouteTable;
  public readonly privateRouteTable: aws.routeTable.RouteTable;
  public readonly elasticIp: aws.eip.Eip;

  constructor(
    scope: Construct,
    id: string,
    cidrBlock: string,
    availabilityZones: string[],
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, `${id}-vpc`, {
      cidrBlock,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...this.tags, Name: `${id}-vpc` },
    });

    // Create Internet Gateway
    this.igw = new aws.internetGateway.InternetGateway(this, `${id}-igw`, {
      vpcId: this.vpc.id,
      tags: { ...this.tags, Name: `${id}-igw` },
    });

    // Create Elastic IP for NAT Gateway
    this.elasticIp = new aws.eip.Eip(this, `${id}-eip`, {
      domain: 'vpc',
      tags: { ...this.tags, Name: `${id}-eip` },
    });

    // Initialize subnet arrays
    this.publicSubnets = [];
    this.privateSubnets = [];

    // Create public and private subnets in each AZ
    for (let i = 0; i < availabilityZones.length; i++) {
      // Public subnet (for internet-facing resources)
      const publicSubnet = new aws.subnet.Subnet(
        this,
        `${id}-public-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: { ...this.tags, Name: `${id}-public-subnet-${i}` },
        }
      );
      this.publicSubnets.push(publicSubnet);

      // Private subnet (for internal resources)
      const privateSubnet = new aws.subnet.Subnet(
        this,
        `${id}-private-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 100}.0/24`,
          availabilityZone: availabilityZones[i],
          tags: { ...this.tags, Name: `${id}-private-subnet-${i}` },
        }
      );
      this.privateSubnets.push(privateSubnet);
    }

    // Create public route table
    this.publicRouteTable = new aws.routeTable.RouteTable(
      this,
      `${id}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `${id}-public-rt` },
      }
    );

    // Add route to Internet Gateway
    new aws.route.Route(this, `${id}-public-route`, {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `${id}-public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        }
      );
    });

    // Create NAT Gateway in the first public subnet
    this.natGw = new aws.natGateway.NatGateway(this, `${id}-nat-gw`, {
      allocationId: this.elasticIp.id,
      subnetId: this.publicSubnets[0].id,
      tags: { ...this.tags, Name: `${id}-nat-gw` },
    });

    // Create private route table
    this.privateRouteTable = new aws.routeTable.RouteTable(
      this,
      `${id}-private-rt`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `${id}-private-rt` },
      }
    );

    // Add route to NAT Gateway for internet access from private subnets
    new aws.route.Route(this, `${id}-private-route`, {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGw.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `${id}-private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTable.id,
        }
      );
    });

    // Enable VPC Flow Logs for security monitoring
    const flowLogsRole = new aws.iamRole.IamRole(this, `${id}-flow-logs-role`, {
      name: `${id}-flow-logs-role`,
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
      tags: this.tags,
    });

    new aws.iamRolePolicy.IamRolePolicy(this, `${id}-flow-logs-policy`, {
      name: `${id}-flow-logs-policy`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });

    const flowLogsGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${id}-flow-logs-group`,
      {
        name: `/aws/vpc-flow-logs/${id}`,
        retentionInDays: 30,
        tags: this.tags,
      }
    );

    new aws.flowLog.FlowLog(this, `${id}-flow-log`, {
      logDestination: flowLogsGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      iamRoleArn: flowLogsRole.arn,
      tags: this.tags,
    });
  }
}

// S3 Module with proper ALB permissions
export class S3Module extends BaseModule {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketVersioning: aws.s3BucketVersioning.S3BucketVersioningA;
  public readonly bucketEncryption: aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;
  public readonly bucketLogging: aws.s3BucketLogging.S3BucketLoggingA;
  public readonly bucketOwnershipControls: aws.s3BucketOwnershipControls.S3BucketOwnershipControls;
  public readonly bucketAcl: aws.s3BucketAcl.S3BucketAcl;

  constructor(
    scope: Construct,
    id: string,
    bucketName: string,
    kmsKeyId: string,
    logBucketId: string,
    tags: CommonTags,
    isLoggingBucket: boolean = false,
    accountId?: string,
    region?: string
  ) {
    super(scope, id, tags);

    // Create S3 bucket with unique name
    this.bucket = new aws.s3Bucket.S3Bucket(this, `${id}-bucket`, {
      bucket: bucketName,
      tags: this.tags,
    });

    // Configure bucket ownership controls BEFORE setting ACLs
    if (isLoggingBucket) {
      this.bucketOwnershipControls =
        new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
          this,
          `${id}-ownership`,
          {
            bucket: this.bucket.id,
            rule: {
              objectOwnership: 'BucketOwnerPreferred',
            },
          }
        );

      // Now set bucket ACL (after ownership controls)
      this.bucketAcl = new aws.s3BucketAcl.S3BucketAcl(this, `${id}-acl`, {
        bucket: this.bucket.id,
        acl: 'log-delivery-write',
        dependsOn: [this.bucketOwnershipControls],
      });
    }

    // Enable versioning
    this.bucketVersioning = new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      `${id}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable encryption
    if (!isLoggingBucket) {
      this.bucketEncryption =
        new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
          this,
          `${id}-encryption`,
          {
            bucket: this.bucket.id,
            rule: [
              {
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: 'aws:kms',
                  kmsMasterKeyId: kmsKeyId,
                },
                bucketKeyEnabled: true,
              },
            ],
          }
        );
    } else {
      // For logging bucket, use AES256 encryption
      this.bucketEncryption =
        new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
          this,
          `${id}-encryption`,
          {
            bucket: this.bucket.id,
            rule: [
              {
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: 'AES256',
                },
              },
            ],
          }
        );
    }

    // Block public access (allow ACLs for logging bucket)
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        `${id}-public-access-block`,
        {
          bucket: this.bucket.id,
          blockPublicAcls: false, // Must be false for logging bucket
          blockPublicPolicy: true,
          ignorePublicAcls: false, // Must be false for logging bucket
          restrictPublicBuckets: true,
        }
      );

    // Enable access logging (skip if this is the logging bucket itself)
    if (!isLoggingBucket && logBucketId) {
      this.bucketLogging = new aws.s3BucketLogging.S3BucketLoggingA(
        this,
        `${id}-logging`,
        {
          bucket: this.bucket.id,
          targetBucket: logBucketId,
          targetPrefix: `${bucketName}/`,
        }
      );
    }

    // Fixed bucket policy for ALB access logs
    if (isLoggingBucket && accountId && region) {
      const elbAccountId = this.getElbServiceAccountId(region);

      new aws.s3BucketPolicy.S3BucketPolicy(this, `${id}-bucket-policy`, {
        bucket: this.bucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSLogDeliveryAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'logging.s3.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: `arn:aws:s3:::${bucketName}`,
            },
            {
              Sid: 'AWSLogDeliveryWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'logging.s3.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `arn:aws:s3:::${bucketName}/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control', // Fixed: was 's3:x-acl'
                },
              },
            },
            {
              Sid: 'ELBAccessLogsPutObject',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${elbAccountId}:root`,
              },
              Action: 's3:PutObject',
              Resource: `arn:aws:s3:::${bucketName}/alb/*`,
            },
            {
              Sid: 'ELBAccessLogsGetBucketAcl',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${elbAccountId}:root`,
              },
              Action: 's3:GetBucketAcl',
              Resource: `arn:aws:s3:::${bucketName}`,
            },
          ],
        }),
      });
    }
  }

  private getElbServiceAccountId(region: string): string {
    // ELB service account IDs for different regions
    const elbServiceAccounts: { [key: string]: string } = {
      'us-east-1': '127311923021',
      'us-east-2': '033677994240',
      'us-west-1': '027434742980',
      'us-west-2': '797873946194',
      'eu-central-1': '054676820928',
      'eu-west-1': '156460612806',
      'eu-west-2': '652711504416',
      'eu-west-3': '009996457667',
      'eu-north-1': '897822967062',
      'ap-southeast-1': '114774131450',
      'ap-southeast-2': '783225319266',
      'ap-northeast-1': '582318560864',
      'ap-northeast-2': '600734575887',
      'ap-south-1': '718504428378',
    };

    return elbServiceAccounts[region] || '897822967062'; // Default to eu-north-1
  }
}

// EC2 Module
export class Ec2Module extends BaseModule {
  public readonly instance: aws.instance.Instance;
  public readonly role: aws.iamRole.IamRole;
  public readonly instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    instanceType: string,
    amiId: string,
    subnetId: string,
    vpcId: string,
    availabilityZone: string,
    kmsKeyId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create IAM role for Session Manager
    this.role = new aws.iamRole.IamRole(this, `${id}-role`, {
      name: `${id}-ssm-role`,
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
      tags: this.tags,
    });

    // Attach Session Manager policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-ssm-policy`,
      {
        role: this.role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    // Create instance profile
    this.instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      `${id}-profile`,
      {
        name: `${id}-profile`,
        role: this.role.name,
      }
    );

    // Create security group (no SSH)
    const securityGroup = new aws.securityGroup.SecurityGroup(
      this,
      `${id}-sg`,
      {
        name: `${id}-security-group`,
        description: 'Security group with no SSH access',
        vpcId: vpcId,

        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],

        tags: this.tags,
      }
    );

    // Create EC2 instance
    this.instance = new aws.instance.Instance(this, `${id}-instance`, {
      instanceType,
      ami: amiId,
      subnetId,
      availabilityZone,
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: this.instanceProfile.name,

      rootBlockDevice: {
        encrypted: true,
        kmsKeyId: kmsKeyId,
        volumeType: 'gp3',
        volumeSize: 30,
      },

      monitoring: true,

      userData: Buffer.from(
        `#!/bin/bash
        yum install -y amazon-ssm-agent
        systemctl enable amazon-ssm-agent
        systemctl start amazon-ssm-agent
      `
      ).toString('base64'),

      tags: { ...this.tags, Name: `${id}-instance` },
    });
  }
}

// IAM Lambda Module - Fixed CloudWatch Logs KMS issue
export class IamLambdaModule extends BaseModule {
  public readonly executionRole: aws.iamRole.IamRole;
  public readonly lambdaFunction: aws.lambdaFunction.LambdaFunction;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    functionName: string,
    handler: string,
    runtime: string,
    codeS3Bucket: string,
    codeS3Key: string,
    kmsKeyId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create CloudWatch Log Group without KMS (use AWS managed)
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${id}-logs`,
      {
        name: `/aws/lambda/${functionName}`,
        retentionInDays: 30,
        // Removed kmsKeyId to use AWS managed encryption
        tags: this.tags,
      }
    );

    // Create execution role with least privilege
    this.executionRole = new aws.iamRole.IamRole(this, `${id}-execution-role`, {
      name: `${functionName}-execution-role`,
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
      tags: this.tags,
    });

    // Attach basic execution policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-basic-execution`,
      {
        role: this.executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    // Create Lambda function
    this.lambdaFunction = new aws.lambdaFunction.LambdaFunction(
      this,
      `${id}-function`,
      {
        functionName,
        role: this.executionRole.arn,
        handler,
        runtime,
        s3Bucket: codeS3Bucket,
        s3Key: codeS3Key,
        timeout: 60,
        memorySize: 256,

        environment: {
          variables: {
            LOG_LEVEL: 'INFO',
          },
        },

        kmsKeyArn: kmsKeyId,

        tags: this.tags,

        dependsOn: [this.logGroup],
      }
    );
  }
}

// RDS Module - Fixed master username
export class RdsModule extends BaseModule {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly subnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    instanceClass: string,
    engine: string,
    subnetIds: string[],
    availabilityZone: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create subnet group
    this.subnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      `${id}-subnet-group`,
      {
        name: `${id}-subnet-group`,
        subnetIds,
        tags: this.tags,
      }
    );

    // Create RDS instance with different username
    this.dbInstance = new aws.dbInstance.DbInstance(this, `${id}-instance`, {
      identifier: `${id}-db`,
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,

      engine,
      instanceClass,
      availabilityZone,

      dbSubnetGroupName: this.subnetGroup.name,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      skipFinalSnapshot: true,

      username: 'dbadmin', // Changed from 'admin' to 'dbadmin'
      password: 'ChangeMePlease123!',

      tags: this.tags,
    });
  }
}

// DynamoDB Module
export class DynamoDbModule extends BaseModule {
  public readonly table: aws.dynamodbTable.DynamodbTable;

  constructor(
    scope: Construct,
    id: string,
    tableName: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    this.table = new aws.dynamodbTable.DynamodbTable(this, `${id}-table`, {
      name: tableName,
      billingMode: 'PAY_PER_REQUEST',

      hashKey: 'id',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
      ],

      pointInTimeRecovery: {
        enabled: true,
      },

      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: undefined,
      },

      tags: this.tags,
    });
  }
}

// Redshift Module - Fixed node type for eu-north-1
export class RedshiftModule extends BaseModule {
  public readonly cluster: aws.redshiftCluster.RedshiftCluster;
  public readonly subnetGroup: aws.redshiftSubnetGroup.RedshiftSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    clusterIdentifier: string,
    nodeType: string,
    numberOfNodes: number,
    subnetIds: string[], // Add subnet IDs parameter
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create Redshift subnet group
    this.subnetGroup = new aws.redshiftSubnetGroup.RedshiftSubnetGroup(
      this,
      `${id}-subnet-group`,
      {
        name: `${clusterIdentifier}-subnet-group`,
        subnetIds: subnetIds,
        tags: this.tags,
      }
    );

    // Create Redshift cluster with subnet group
    this.cluster = new aws.redshiftCluster.RedshiftCluster(
      this,
      `${id}-cluster`,
      {
        clusterIdentifier,
        nodeType: 'ra3.xlplus',
        numberOfNodes,

        clusterSubnetGroupName: this.subnetGroup.name, // Use subnet group

        masterUsername: 'dbadmin',
        masterPassword: 'ChangeMePlease123!',

        skipFinalSnapshot: true,

        tags: this.tags,
      }
    );
  }
}

// ELB Module
export class ElbModule extends BaseModule {
  public readonly alb: aws.alb.Alb;
  public readonly targetGroup: aws.albTargetGroup.AlbTargetGroup;
  public readonly httpListener: aws.albListener.AlbListener;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    subnetIds: string[],
    logBucketName: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create ALB with access logs configured directly
    this.alb = new aws.alb.Alb(this, `${id}-alb`, {
      name: `${id}-alb`,
      internal: false,
      loadBalancerType: 'application',
      subnets: subnetIds,

      enableDeletionProtection: false,

      // Configure access logs directly on the ALB
      accessLogs: {
        enabled: true,
        bucket: logBucketName,
        prefix: 'alb',
      },

      tags: this.tags,
    });

    // Create target group
    this.targetGroup = new aws.albTargetGroup.AlbTargetGroup(this, `${id}-tg`, {
      name: `${id}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId,

      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
      },

      tags: this.tags,
    });

    // Create HTTP listener
    this.httpListener = new aws.albListener.AlbListener(
      this,
      `${id}-http-listener`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',

        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],

        tags: this.tags,
      }
    );
  }
}

// API Gateway Module - Fixed to include a method
export class ApiGatewayModule extends BaseModule {
  public readonly api: aws.apiGatewayRestApi.ApiGatewayRestApi;
  public readonly deployment: aws.apiGatewayDeployment.ApiGatewayDeployment;
  public readonly stage: aws.apiGatewayStage.ApiGatewayStage;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly apiGatewayAccount: aws.apiGatewayAccount.ApiGatewayAccount;

  constructor(
    scope: Construct,
    id: string,
    apiName: string,
    kmsKeyId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create IAM role for API Gateway CloudWatch logging
    const cloudwatchRole = new aws.iamRole.IamRole(
      this,
      `${id}-cloudwatch-role`,
      {
        name: 'api-gateway-cloudwatch-global',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        }),
        tags: this.tags,
      }
    );

    // Attach CloudWatch Logs policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-cloudwatch-policy`,
      {
        role: cloudwatchRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
      }
    );

    // Configure API Gateway account-level settings
    this.apiGatewayAccount = new aws.apiGatewayAccount.ApiGatewayAccount(
      this,
      `${id}-account`,
      {
        cloudwatchRoleArn: cloudwatchRole.arn,
      }
    );

    // Create CloudWatch Log Group without KMS
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${id}-api-logs`,
      {
        name: `/aws/apigateway/${apiName}`,
        retentionInDays: 30,
        // Removed kmsKeyId
        tags: this.tags,
      }
    );

    // Create API Gateway
    this.api = new aws.apiGatewayRestApi.ApiGatewayRestApi(this, `${id}-api`, {
      name: apiName,
      description: 'API Gateway with logging enabled',

      endpointConfiguration: {
        types: ['REGIONAL'],
      },

      tags: this.tags,
    });

    // Add a resource and method so deployment can work
    const resource = new aws.apiGatewayResource.ApiGatewayResource(
      this,
      `${id}-resource`,
      {
        restApiId: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'health',
      }
    );

    const method = new aws.apiGatewayMethod.ApiGatewayMethod(
      this,
      `${id}-method`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      }
    );

    // Add mock integration
    new aws.apiGatewayIntegration.ApiGatewayIntegration(
      this,
      `${id}-integration`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }
    );

    // Create deployment (depends on method and integration)
    this.deployment = new aws.apiGatewayDeployment.ApiGatewayDeployment(
      this,
      `${id}-deployment`,
      {
        restApiId: this.api.id,

        lifecycle: {
          createBeforeDestroy: true,
        },

        dependsOn: [method],
      }
    );

    // Create stage with logging
    this.stage = new aws.apiGatewayStage.ApiGatewayStage(this, `${id}-stage`, {
      deploymentId: this.deployment.id,
      restApiId: this.api.id,
      stageName: 'prod',

      accessLogSettings: {
        destinationArn: this.logGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },

      xrayTracingEnabled: true,

      tags: this.tags,
      dependsOn: [this.apiGatewayAccount],
    });

    // Configure method settings for logging
    new aws.apiGatewayMethodSettings.ApiGatewayMethodSettings(
      this,
      `${id}-method-settings`,
      {
        restApiId: this.api.id,
        stageName: this.stage.stageName,
        methodPath: '*/*',

        settings: {
          loggingLevel: 'INFO',
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      }
    );
  }
}

// ECR Module
export class EcrModule extends BaseModule {
  public readonly repository: aws.ecrRepository.EcrRepository;

  constructor(
    scope: Construct,
    id: string,
    repositoryName: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    this.repository = new aws.ecrRepository.EcrRepository(this, `${id}-repo`, {
      name: repositoryName,

      imageScanningConfiguration: {
        scanOnPush: true,
      },

      imageTagMutability: 'MUTABLE',

      tags: this.tags,
    });

    // Add lifecycle policy
    new aws.ecrLifecyclePolicy.EcrLifecyclePolicy(this, `${id}-lifecycle`, {
      repository: this.repository.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: 'Keep last 10 images',
            selection: {
              tagStatus: 'any',
              countType: 'imageCountMoreThan',
              countNumber: 10,
            },
            action: {
              type: 'expire',
            },
          },
        ],
      }),
    });
  }
}

// SNS Module - Fixed policy
export class SnsModule extends BaseModule {
  public readonly topic: aws.snsTopic.SnsTopic;

  constructor(
    scope: Construct,
    id: string,
    topicName: string,
    kmsKeyId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Get current AWS account ID
    const current = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current'
    );

    this.topic = new aws.snsTopic.SnsTopic(this, `${id}-topic`, {
      name: topicName,
      displayName: topicName,
      kmsMasterKeyId: kmsKeyId,
      tags: this.tags,
    });

    // Fixed SNS topic policy
    new aws.snsTopicPolicy.SnsTopicPolicy(this, `${id}-policy`, {
      arn: this.topic.arn,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowAccountAccess',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`,
            },
            Action: [
              'SNS:Subscribe',
              'SNS:Publish',
              'SNS:GetTopicAttributes',
              'SNS:SetTopicAttributes',
              'SNS:AddPermission',
              'SNS:RemovePermission',
              'SNS:DeleteTopic',
              'SNS:ListSubscriptionsByTopic',
            ],
            Resource: this.topic.arn,
          },
        ],
      }),
    });
  }
}

// CloudWatch Monitoring Module
export class MonitoringModule extends BaseModule {
  constructor(
    scope: Construct,
    id: string,
    snsTopicArn: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Failed login attempts alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'failed-login-alarm',
      {
        alarmName: 'failed-console-login-attempts',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FailedLoginAttempts',
        namespace: 'AWS/CloudTrail',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert on multiple failed login attempts',

        alarmActions: [snsTopicArn],

        tags: this.tags,
      }
    );

    // IAM policy changes alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'iam-policy-changes-alarm',
      {
        alarmName: 'iam-policy-changes',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'IAMPolicyEventCount',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 1,
        alarmDescription: 'Alert on IAM policy changes',

        alarmActions: [snsTopicArn],

        tags: this.tags,
      }
    );
  }
}

// CloudTrail Module
export class CloudTrailModule extends BaseModule {
  public readonly trail: aws.cloudtrail.Cloudtrail;
  public readonly trailBucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly cloudTrailRole: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    kmsKeyArn: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Get current AWS account details
    const current = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current'
    );

    // const currentRegion = new aws.dataAwsRegion.DataAwsRegion(
    //   this,
    //   'current-region'
    // );

    // Create S3 bucket for CloudTrail logs
    this.trailBucket = new aws.s3Bucket.S3Bucket(this, `${id}-bucket`, {
      bucket: `cloudtrail-logs-${current.accountId}-${id}`,
      tags: this.tags,
    });

    // Enable versioning on CloudTrail bucket
    new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      `${id}-bucket-versioning`,
      {
        bucket: this.trailBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable encryption on CloudTrail bucket
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      `${id}-bucket-encryption`,
      {
        bucket: this.trailBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      `${id}-bucket-pab`,
      {
        bucket: this.trailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Create bucket policy for CloudTrail
    this.bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(
      this,
      `${id}-bucket-policy`,
      {
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
              Resource: `arn:aws:s3:::${this.trailBucket.bucket}`,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `arn:aws:s3:::${this.trailBucket.bucket}/AWSLogs/${current.accountId}/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
          ],
        }),
      }
    );

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${id}-log-group`,
      {
        name: `/aws/cloudtrail/${id}`,
        retentionInDays: 90,
        tags: this.tags,
      }
    );

    // Create IAM role for CloudTrail to write to CloudWatch Logs
    this.cloudTrailRole = new aws.iamRole.IamRole(this, `${id}-role`, {
      name: `${id}-cloudtrail-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
          },
        ],
      }),
      tags: this.tags,
    });

    // Attach policy to allow CloudTrail to write to CloudWatch Logs
    new aws.iamRolePolicy.IamRolePolicy(this, `${id}-role-policy`, {
      name: `${id}-cloudtrail-policy`,
      role: this.cloudTrailRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${this.logGroup.arn}:*`,
          },
        ],
      }),
    });

    // Create CloudTrail
    this.trail = new aws.cloudtrail.Cloudtrail(this, `${id}-trail`, {
      name: `${id}-trail`,
      s3BucketName: this.trailBucket.id,
      includeGlobalServiceEvents: true,
      // isMultiRegionTrail: true,
      enableLogFileValidation: true,

      cloudWatchLogsGroupArn: `${this.logGroup.arn}:*`,
      cloudWatchLogsRoleArn: this.cloudTrailRole.arn,

      kmsKeyId: kmsKeyArn,

      tags: this.tags,

      dependsOn: [this.bucketPolicy],
    });

    // Add additional event selectors for other services
    new aws.cloudtrail.Cloudtrail(this, `${id}-insight`, {
      name: `${id}-insight-trail`,
      s3BucketName: this.trailBucket.id,

      insightSelector: [
        {
          insightType: 'ApiCallRateInsight',
        },
      ],

      dependsOn: [this.trail],
    });
  }
}

// CloudFront with WAF Module - WAF needs to be in us-east-1
export class CloudFrontWafModule extends BaseModule {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly waf: aws.wafv2WebAcl.Wafv2WebAcl | null = null;

  constructor(
    scope: Construct,
    id: string,
    originDomainName: string,
    logBucketDomain: string,
    tags: CommonTags,
    createWaf: boolean = false // Make WAF optional
  ) {
    super(scope, id, tags);

    // Note: WAF for CloudFront must be created in us-east-1
    // So we'll skip it for now or create it separately
    if (createWaf) {
      this.waf = new aws.wafv2WebAcl.Wafv2WebAcl(this, `${id}-waf`, {
        name: `${id}-waf`,
        scope: 'CLOUDFRONT',

        defaultAction: {
          allow: {},
        },

        rule: [
          {
            name: 'RateLimitRule',
            priority: 1,

            action: {
              block: {},
            },

            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },

            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
              sampledRequestsEnabled: true,
            },
          },
        ],

        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${id}-waf`,
          sampledRequestsEnabled: true,
        },

        tags: this.tags,
      });
    }

    // Create CloudFront distribution
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      `${id}-distribution`,
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: 'CloudFront distribution',
        defaultRootObject: 'index.html',

        origin: [
          {
            domainName: originDomainName,
            originId: 'primary',

            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'https-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],

        defaultCacheBehavior: {
          targetOriginId: 'primary',
          viewerProtocolPolicy: 'redirect-to-https',

          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],

          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },

          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        loggingConfig: {
          bucket: logBucketDomain,
          prefix: 'cloudfront/',
        },

        webAclId: this.waf ? this.waf.arn : undefined,

        tags: this.tags,
      }
    );
  }
}
