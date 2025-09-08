import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// VPC Module - Creates isolated network environment with public/private subnets
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateway: aws.natGateway.NatGateway;
  public readonly publicRouteTable: aws.routeTable.RouteTable;
  public readonly privateRouteTable: aws.routeTable.RouteTable;

  constructor(scope: Construct, id: string, cidrBlock: string) {
    super(scope, id);

    // VPC with DNS support for internal name resolution
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'production-vpc',
        Environment: 'Production',
      },
    });

    // Internet Gateway for public subnet internet access
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'production-igw',
          Environment: 'Production',
        },
      }
    );

    // Public subnets across different AZs for high availability
    this.publicSubnets = [
      new aws.subnet.Subnet(this, 'public-subnet-1', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-west-2a',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: 'production-public-subnet-1',
          Environment: 'Production',
          Type: 'Public',
        },
      }),
      new aws.subnet.Subnet(this, 'public-subnet-2', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-west-2b',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: 'production-public-subnet-2',
          Environment: 'Production',
          Type: 'Public',
        },
      }),
    ];

    // Private subnets for secure resource deployment
    this.privateSubnets = [
      new aws.subnet.Subnet(this, 'private-subnet-1', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.10.0/24',
        availabilityZone: 'us-west-2a',
        tags: {
          Name: 'production-private-subnet-1',
          Environment: 'Production',
          Type: 'Private',
        },
      }),
      new aws.subnet.Subnet(this, 'private-subnet-2', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: 'us-west-2b',
        tags: {
          Name: 'production-private-subnet-2',
          Environment: 'Production',
          Type: 'Private',
        },
      }),
    ];

    // Elastic IP for NAT Gateway
    const eip = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: 'production-nat-eip',
        Environment: 'Production',
      },
    });

    // NAT Gateway for private subnet internet access
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat-gateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: 'production-nat-gateway',
        Environment: 'Production',
      },
    });

    // Route tables and routes
    this.publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'production-public-rt',
        Environment: 'Production',
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.privateRouteTable = new aws.routeTable.RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'production-private-rt',
        Environment: 'Production',
      },
    });

    new aws.route.Route(this, 'private-route', {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate subnets with route tables
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        }
      );
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTable.id,
        }
      );
    });
  }
}

// Security Groups Module - Implements least privilege network access
export class SecurityGroupsModule extends Construct {
  public readonly webSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly databaseSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly lambdaSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, vpcId: string) {
    super(scope, id);

    // Web security group - Only allows HTTP/HTTPS as required
    this.webSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'web-sg',
      {
        namePrefix: 'production-web-sg',
        description: 'Security group for web servers - HTTP/HTTPS only',
        vpcId: vpcId,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS access',
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
          Name: 'production-web-sg',
          Environment: 'Production',
        },
      }
    );

    // Database security group - Only allows access from web tier
    this.databaseSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'db-sg',
      {
        namePrefix: 'production-db-sg',
        description: 'Security group for database - restricted access',
        vpcId: vpcId,
        tags: {
          Name: 'production-db-sg',
          Environment: 'Production',
        },
      }
    );

    // Lambda security group for VPC execution
    this.lambdaSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'lambda-sg',
      {
        namePrefix: 'production-lambda-sg',
        description: 'Security group for Lambda functions in VPC',
        vpcId: vpcId,
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
          Name: 'production-lambda-sg',
          Environment: 'Production',
        },
      }
    );

    // Database security group rule - only allow access from web tier
    new aws.securityGroupRule.SecurityGroupRule(this, 'db-ingress-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.databaseSecurityGroup.id,
      description: 'MySQL access from web tier',
    });
  }
}

// EC2 Module - Secure instances with least privilege IAM roles
export class EC2Module extends Construct {
  public readonly instances: aws.instance.Instance[];
  public readonly iamRole: aws.iamRole.IamRole;
  public readonly instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    subnetIds: string[],
    securityGroupId: string,
    amiId: string
  ) {
    super(scope, id);

    // IAM role with least privilege principle
    this.iamRole = new aws.iamRole.IamRole(this, 'ec2-role', {
      namePrefix: 'production-ec2-role',
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
        Name: 'production-ec2-role',
        Environment: 'Production',
      },
    });

    // Minimal policy for CloudWatch monitoring
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-cloudwatch-policy',
      {
        role: this.iamRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    this.instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-profile',
      {
        namePrefix: 'production-ec2-profile',
        role: this.iamRole.name,
        tags: {
          Name: 'production-ec2-profile',
          Environment: 'Production',
        },
      }
    );

    // EC2 instances in private subnets for security
    this.instances = subnetIds.map(
      (subnetId, index) =>
        new aws.instance.Instance(this, `ec2-instance-${index}`, {
          ami: amiId,
          instanceType: 't3.medium',
          subnetId: subnetId,
          vpcSecurityGroupIds: [securityGroupId],
          iamInstanceProfile: this.instanceProfile.name,
          monitoring: true, // Detailed monitoring for CloudWatch
          tags: {
            Name: `production-web-server-${index + 1}`,
            Environment: 'Production',
          },
        })
    );
  }
}

// S3 Module - Secure buckets with encryption, versioning, and logging
export class S3Module extends Construct {
  public readonly contentBucket: aws.s3Bucket.S3Bucket;
  public readonly logsBucket: aws.s3Bucket.S3Bucket;
  public readonly kmsKey: aws.kmsKey.KmsKey;

  constructor(scope: Construct, id: string, bucketPrefix: string) {
    super(scope, id);

    // KMS key for S3 encryption
    this.kmsKey = new aws.kmsKey.KmsKey(this, 's3-kms-key', {
      description: 'KMS key for S3 bucket encryption',
      tags: {
        Name: 'production-s3-kms-key',
        Environment: 'Production',
      },
    });

    new aws.kmsAlias.KmsAlias(this, 's3-kms-alias', {
      name: 'alias/production-s3-key',
      targetKeyId: this.kmsKey.keyId,
    });

    // Logs bucket for access logging
    this.logsBucket = new aws.s3Bucket.S3Bucket(this, 'logs-bucket', {
      bucket: `${bucketPrefix}-access-logs`,
      tags: {
        Name: `${bucketPrefix}-access-logs`,
        Environment: 'Production',
      },
    });

    // Block public access for logs bucket
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'logs-bucket-pab',
      {
        bucket: this.logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Main content bucket with all security features
    this.contentBucket = new aws.s3Bucket.S3Bucket(this, 'content-bucket', {
      bucket: `${bucketPrefix}-content`,
      tags: {
        Name: `${bucketPrefix}-content`,
        Environment: 'Production',
      },
    });

    // Server-side encryption with KMS
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'content-bucket-encryption',
      {
        bucket: this.contentBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Enable versioning for data protection
    new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      'content-bucket-versioning',
      {
        bucket: this.contentBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Access logging for audit compliance
    new aws.s3BucketLogging.S3BucketLoggingA(this, 'content-bucket-logging', {
      bucket: this.contentBucket.id,
      targetBucket: this.logsBucket.id,
      targetPrefix: 'access-logs/',
    });

    // Block public access for content bucket
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'content-bucket-pab',
      {
        bucket: this.contentBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );
  }
}

// RDS Module - Multi-AZ database with automatic backups
export class RDSModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly kmsKey: aws.kmsKey.KmsKey;

  constructor(
    scope: Construct,
    id: string,
    subnetIds: string[],
    securityGroupId: string
  ) {
    super(scope, id);

    // KMS key for RDS encryption
    this.kmsKey = new aws.kmsKey.KmsKey(this, 'rds-kms-key', {
      description: 'KMS key for RDS encryption',
      tags: {
        Name: 'production-rds-kms-key',
        Environment: 'Production',
      },
    });

    new aws.kmsAlias.KmsAlias(this, 'rds-kms-alias', {
      name: 'alias/production-rds-key',
      targetKeyId: this.kmsKey.keyId,
    });

    // DB subnet group for Multi-AZ deployment
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        namePrefix: 'production-db-subnet-group',
        subnetIds: subnetIds,
        description: 'Subnet group for RDS Multi-AZ deployment',
        tags: {
          Name: 'production-db-subnet-group',
          Environment: 'Production',
        },
      }
    );

    // RDS instance with Multi-AZ and encryption
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db-instance', {
      identifier: 'production-database',
      engine: 'mysql',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 50,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,
      dbName: 'productiondb',
      username: 'admin',
      manageMasterUserPassword: true, // Should be replaced with AWS Secrets Manager
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [securityGroupId],
      multiAz: true, // High availability across AZs
      backupRetentionPeriod: 7, // 7 days backup retention
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: 'production-db-final-snapshot',
      tags: {
        Name: 'production-database',
        Environment: 'Production',
      },
    });
  }
}

// CloudFront Module - Secure CDN with S3 origin
export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly originAccessIdentity: aws.cloudfrontOriginAccessIdentity.CloudfrontOriginAccessIdentity;

  constructor(
    scope: Construct,
    id: string,
    s3BucketDomainName: string,
    s3BucketId: string
  ) {
    super(scope, id);

    // Origin Access Identity for secure S3 access
    this.originAccessIdentity =
      new aws.cloudfrontOriginAccessIdentity.CloudfrontOriginAccessIdentity(
        this,
        'oai',
        {
          comment: 'OAI for production S3 bucket',
        }
      );

    // CloudFront distribution with security headers
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      'distribution',
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: 'Production CloudFront distribution',
        defaultRootObject: 'index.html',
        origin: [
          {
            domainName: s3BucketDomainName,
            originId: 'S3-production-content',
            s3OriginConfig: {
              originAccessIdentity:
                this.originAccessIdentity.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: 'S3-production-content',
          viewerProtocolPolicy: 'redirect-to-https',
          compress: true,
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
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
        tags: {
          Name: 'production-cloudfront',
          Environment: 'Production',
        },
      }
    );

    // S3 bucket policy to allow CloudFront access
    new aws.s3BucketPolicy.S3BucketPolicy(this, 's3-bucket-policy', {
      bucket: s3BucketId,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontAccess',
            Effect: 'Allow',
            Principal: {
              AWS: this.originAccessIdentity.iamArn,
            },
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${s3BucketId}/*`,
          },
        ],
      }),
    });
  }
}

// Lambda Module - Functions deployed in VPC for security
export class LambdaModule extends Construct {
  public readonly functions: aws.lambdaFunction.LambdaFunction[];
  public readonly iamRole: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    subnetIds: string[],
    securityGroupId: string
  ) {
    super(scope, id);

    // IAM role for Lambda with VPC execution
    this.iamRole = new aws.iamRole.IamRole(this, 'lambda-role', {
      namePrefix: 'production-lambda-role',
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
      tags: {
        Name: 'production-lambda-role',
        Environment: 'Production',
      },
    });

    // Attach VPC execution policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'lambda-vpc-policy',
      {
        role: this.iamRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      }
    );

    // Lambda functions in VPC for secure execution
    this.functions = [
      new aws.lambdaFunction.LambdaFunction(this, 'processing-function', {
        functionName: 'production-data-processor',
        role: this.iamRole.arn,
        handler: 'lambda_function.handler',
        s3Bucket: 'lambda-ts-12345-us-west-2',
        s3Key: 'lambda.zip',
        runtime: 'python3.9',
        timeout: 30,
        memorySize: 256,
        vpcConfig: {
          subnetIds: subnetIds,
          securityGroupIds: [securityGroupId],
        },
        tags: {
          Name: 'production-data-processor',
          Environment: 'Production',
        },
      }),
    ];
  }
}

// CloudWatch Module - Monitoring and alerting
export class CloudWatchModule extends Construct {
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, instanceIds: string[]) {
    super(scope, id);

    // CPU utilization alarms for each EC2 instance
    this.alarms = instanceIds.map(
      (instanceId, index) =>
        new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          `cpu-alarm-${index}`,
          {
            alarmName: `production-high-cpu-${index + 1}`,
            alarmDescription: `High CPU utilization alarm for instance ${instanceId}`,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            statistic: 'Average',
            period: 300,
            evaluationPeriods: 2,
            threshold: 80,
            comparisonOperator: 'GreaterThanThreshold',
            dimensions: {
              InstanceId: instanceId,
            },
            tags: {
              Name: `production-high-cpu-alarm-${index + 1}`,
              Environment: 'Production',
            },
          }
        )
    );
  }
}

// DynamoDB Module - NoSQL database with auto-scaling
export class DynamoDBModule extends Construct {
  public readonly table: aws.dynamodbTable.DynamodbTable;
  public readonly readTarget: aws.appautoscalingTarget.AppautoscalingTarget;
  public readonly writeTarget: aws.appautoscalingTarget.AppautoscalingTarget;

  constructor(scope: Construct, id: string, tableName: string) {
    super(scope, id);

    // DynamoDB table with encryption at rest
    this.table = new aws.dynamodbTable.DynamodbTable(this, 'table', {
      name: tableName,
      billingMode: 'PROVISIONED',
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: 'id',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
      ],
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: tableName,
        Environment: 'Production',
      },
    });

    // Auto-scaling for read capacity
    this.readTarget = new aws.appautoscalingTarget.AppautoscalingTarget(
      this,
      'read-target',
      {
        maxCapacity: 100,
        minCapacity: 5,
        resourceId: `table/${this.table.name}`,
        scalableDimension: 'dynamodb:table:ReadCapacityUnits',
        serviceNamespace: 'dynamodb',
      }
    );

    new aws.appautoscalingPolicy.AppautoscalingPolicy(this, 'read-policy', {
      name: 'DynamoDBReadCapacityUtilization',
      policyType: 'TargetTrackingScaling',
      resourceId: this.readTarget.resourceId,
      scalableDimension: this.readTarget.scalableDimension,
      serviceNamespace: this.readTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'DynamoDBReadCapacityUtilization',
        },
      },
    });

    // Auto-scaling for write capacity
    this.writeTarget = new aws.appautoscalingTarget.AppautoscalingTarget(
      this,
      'write-target',
      {
        maxCapacity: 100,
        minCapacity: 5,
        resourceId: `table/${this.table.name}`,
        scalableDimension: 'dynamodb:table:WriteCapacityUnits',
        serviceNamespace: 'dynamodb',
      }
    );

    new aws.appautoscalingPolicy.AppautoscalingPolicy(this, 'write-policy', {
      name: 'DynamoDBWriteCapacityUtilization',
      policyType: 'TargetTrackingScaling',
      resourceId: this.writeTarget.resourceId,
      scalableDimension: this.writeTarget.scalableDimension,
      serviceNamespace: this.writeTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'DynamoDBWriteCapacityUtilization',
        },
      },
    });
  }
}
