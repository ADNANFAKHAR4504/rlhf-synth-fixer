# Secure AWS Infrastructure with Pulumi TypeScript

```typescript
/**
 * secure-infrastructure.ts
 *
 * This module defines the SecureInfrastructure class, a Pulumi ComponentResource
 * that creates a comprehensive, production-ready AWS infrastructure setup
 * following security best practices for the ap-south-1 region.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * SecureInfrastructureArgs defines the input arguments for the SecureInfrastructure component.
 */
export interface SecureInfrastructureArgs {
  /**
   * Environment identifier (e.g., 'dev', 'prod').
   */
  environment: string;

  /**
   * Optional additional tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * SecureInfrastructure component that creates a complete AWS infrastructure
 * with VPC, security groups, IAM roles, CloudTrail, and DynamoDB.
 */
export class SecureInfrastructure extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly iamRoleArn: pulumi.Output<string>;
  public readonly instanceProfileName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly cloudtrailArn: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly availableAZs: pulumi.Output<string[]>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly guardDutyDetectorId: pulumi.Output<string>;
  public readonly configDeliveryChannelName: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecureInfrastructureArgs,
    opts?: ResourceOptions
  ) {
    super('tap:infrastructure:SecureInfrastructure', name, args, opts);

    // Configure the AWS provider for ap-south-1 region
    const provider = new aws.Provider(
      `ap-south-1-provider-${args.environment}`,
      {
        region: 'ap-south-1',
      },
      { parent: this }
    );

    // Common tags for all resources
    const commonTags = {
      Environment: args.environment,
      Project: 'secure-infrastructure',
      ManagedBy: 'pulumi',
      Region: 'ap-south-1',
      ...args.tags,
    };

    // Get available availability zones in ap-south-1
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider }
    );

    /**
     * VPC Configuration
     * Creates a VPC with DNS support enabled for production workloads
     */
    const vpc = new aws.ec2.Vpc(
      `main-vpc-${args.environment}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `main-vpc-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    /**
     * Internet Gateway
     * Required for public subnet internet access
     */
    const internetGateway = new aws.ec2.InternetGateway(
      `main-igw-${args.environment}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `main-igw-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    /**
     * Public Subnets
     * Two public subnets in different AZs for high availability
     */
    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${args.environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `public-subnet-1-${args.environment}`,
          Type: 'public',
        },
      },
      { provider, parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${args.environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `public-subnet-2-${args.environment}`,
          Type: 'public',
        },
      },
      { provider, parent: this }
    );

    /**
     * Private Subnets
     * Two private subnets in different AZs for database and application tiers
     */
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.10.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...commonTags,
          Name: `private-subnet-1-${args.environment}`,
          Type: 'private',
        },
      },
      { provider, parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...commonTags,
          Name: `private-subnet-2-${args.environment}`,
          Type: 'private',
        },
      },
      { provider, parent: this }
    );

    /**
     * NAT Gateway for Private Subnet Internet Access (Optional)
     * Provides secure outbound internet access for private subnets
     */
    const natEip = new aws.ec2.Eip(
      `nat-eip-${args.environment}`,
      {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: `nat-eip-${args.environment}`,
          Purpose: 'NAT Gateway for private subnet outbound access',
        },
      },
      { provider, parent: this }
    );

    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${args.environment}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnet1.id,
        tags: {
          ...commonTags,
          Name: `nat-gateway-${args.environment}`,
          Purpose: 'Secure outbound internet access for private subnets',
        },
      },
      { provider, parent: this, dependsOn: [natEip] }
    );

    /**
     * Route Table for Public Subnets
     * Routes traffic to the internet gateway
     */
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-route-table-${args.environment}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          ...commonTags,
          Name: `public-route-table-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // Associate route table with public subnets
    void new aws.ec2.RouteTableAssociation(
      `public-subnet-1-association-${args.environment}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { provider, parent: this }
    );

    void new aws.ec2.RouteTableAssociation(
      `public-subnet-2-association-${args.environment}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { provider, parent: this }
    );

    /**
     * Route Table for Private Subnets
     * Routes traffic through NAT Gateway for secure internet access
     */
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-route-table-${args.environment}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          ...commonTags,
          Name: `private-route-table-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // Associate route table with private subnets
    void new aws.ec2.RouteTableAssociation(
      `private-subnet-1-association-${args.environment}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { provider, parent: this }
    );

    void new aws.ec2.RouteTableAssociation(
      `private-subnet-2-association-${args.environment}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { provider, parent: this }
    );

    /**
     * Security Groups
     * Restrictive security groups following least privilege principle
     */
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `web-security-group-${args.environment}`,
      {
        name: `web-security-group-${args.environment}`,
        description:
          'Security group for web servers with restricted access - NO SSH',
        vpcId: vpc.id,

        // Inbound rules - NO SSH, only HTTP/HTTPS
        ingress: [
          {
            description: 'HTTP access from internet',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTPS access from internet',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],

        // Outbound rules (explicit for security) - Restricted outbound access
        egress: [
          {
            description: 'HTTPS outbound for package updates',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTP outbound for package updates',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'DNS outbound',
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'NTP outbound',
            fromPort: 123,
            toPort: 123,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],

        tags: {
          ...commonTags,
          Name: `web-security-group-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    /**
     * Database Security Group
     * Allows access only from web security group
     */
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `database-security-group-${args.environment}`,
      {
        name: `database-security-group-${args.environment}`,
        description:
          'Security group for database tier - only accessible from web tier',
        vpcId: vpc.id,

        // Inbound rules - Only from web security group
        ingress: [
          {
            description: 'MySQL/Aurora access from web tier',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
          },
          {
            description: 'PostgreSQL access from web tier',
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
          },
        ],

        // No outbound rules needed for database
        egress: [],

        tags: {
          ...commonTags,
          Name: `database-security-group-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    /**
     * KMS Key for Encryption
     * Used for encrypting S3 bucket and DynamoDB table
     */
    const kmsKey = new aws.kms.Key(
      `infrastructure-kms-key-${args.environment}`,
      {
        description: `KMS key for infrastructure encryption - ${args.environment}`,
        keyUsage: 'ENCRYPT_DECRYPT',

        policy: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(([identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'Enable IAM User Permissions',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${identity.accountId}:root`,
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
                  Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
                  Resource: '*',
                },
              ],
            })
          ),

        tags: {
          ...commonTags,
          Name: `infrastructure-kms-key-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    void new aws.kms.Alias(
      `infrastructure-kms-key-alias-${args.environment}`,
      {
        name: `alias/infrastructure-key-${args.environment}`,
        targetKeyId: kmsKey.keyId,
      },
      { provider, parent: this }
    );

    /**
     * S3 Bucket for CloudTrail Logs
     * Encrypted bucket with versioning and lifecycle policies
     */
    const cloudtrailBucket = new aws.s3.Bucket(
      `cloudtrail-logs-bucket-${args.environment}`,
      {
        bucket: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(
            ([identity]) =>
              `cloudtrail-logs-${identity.accountId}-ap-south-1-${args.environment}`
          ),

        tags: {
          ...commonTags,
          Name: `cloudtrail-logs-bucket-${args.environment}`,
          Purpose: 'CloudTrail logs storage',
        },
      },
      { provider, parent: this }
    );

    // Enable versioning on the S3 bucket
    void new aws.s3.BucketVersioning(
      `cloudtrail-bucket-versioning-${args.environment}`,
      {
        bucket: cloudtrailBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider, parent: this }
    );

    // Configure server-side encryption
    void new aws.s3.BucketServerSideEncryptionConfiguration(
      `cloudtrail-bucket-encryption-${args.environment}`,
      {
        bucket: cloudtrailBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: kmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider, parent: this }
    );

    // Block public access to the bucket
    void new aws.s3.BucketPublicAccessBlock(
      `cloudtrail-bucket-pab-${args.environment}`,
      {
        bucket: cloudtrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider, parent: this }
    );

    // S3 bucket lifecycle configuration for cost optimization
    void new aws.s3.BucketLifecycleConfiguration(
      `cloudtrail-bucket-lifecycle-${args.environment}`,
      {
        bucket: cloudtrailBucket.id,
        rules: [
          {
            id: 'cloudtrail-logs-lifecycle',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
              {
                days: 365,
                storageClass: 'DEEP_ARCHIVE',
              },
            ],
            expiration: {
              days: 2555, // 7 years retention for compliance
            },
          },
        ],
      },
      { provider, parent: this }
    );

    // S3 bucket notification configuration for security monitoring
    void new aws.s3.BucketNotification(
      `cloudtrail-bucket-notification-${args.environment}`,
      {
        bucket: cloudtrailBucket.id,
        // CloudWatch Events will be configured separately for CloudTrail monitoring
      },
      { provider, parent: this }
    );

    // S3 bucket policy for CloudTrail
    const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(
      `cloudtrail-bucket-policy-${args.environment}`,
      {
        bucket: cloudtrailBucket.id,
        policy: pulumi
          .all([cloudtrailBucket.arn, aws.getCallerIdentity({}, { provider })])
          .apply(([bucketArn, _identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider, parent: this }
    );

    /**
     * CloudTrail Configuration
     * Logs all API calls for security monitoring
     */
    const cloudTrail = new aws.cloudtrail.Trail(
      `main-cloudtrail-${args.environment}`,
      {
        name: `main-cloudtrail-${args.environment}`,
        s3BucketName: cloudtrailBucket.bucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogFileValidation: true,
        kmsKeyId: kmsKey.arn,

        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: cloudtrailBucket.arn.apply(arn => [`${arn}/`]),
              },
            ],
          },
        ],

        tags: {
          ...commonTags,
          Name: `main-cloudtrail-${args.environment}`,
        },
      },
      {
        provider,
        parent: this,
        dependsOn: [cloudtrailBucketPolicy],
      }
    );

    /**
     * IAM Role for EC2 Application Deployment
     * Follows principle of least privilege
     */
    const ec2Role = new aws.iam.Role(
      `ec2-deployment-role-${args.environment}`,
      {
        name: `ec2-deployment-role-${args.environment}`,
        description:
          'IAM role for EC2 instances with minimal required permissions',

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
          ...commonTags,
          Name: `ec2-deployment-role-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // IAM policy for EC2 deployment actions only
    const ec2DeploymentPolicy = new aws.iam.Policy(
      `ec2-deployment-policy-${args.environment}`,
      {
        name: `ec2-deployment-policy-${args.environment}`,
        description:
          'Policy allowing only necessary EC2 actions for application deployment',

        policy: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(([identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ec2:DescribeInstances',
                    'ec2:DescribeInstanceStatus',
                    'ec2:DescribeInstanceAttribute',
                    'ec2:DescribeTags',
                  ],
                  Resource: '*',
                  Condition: {
                    StringEquals: {
                      'ec2:Region': 'ap-south-1',
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: ['ec2:CreateTags'],
                  Resource: [
                    'arn:aws:ec2:ap-south-1:*:instance/*',
                    'arn:aws:ec2:ap-south-1:*:volume/*',
                  ],
                  Condition: {
                    StringEquals: {
                      'ec2:CreateAction': ['RunInstances', 'CreateVolume'],
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: `arn:aws:logs:ap-south-1:${identity.accountId}:log-group:/aws/ec2/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ],
                  Resource: `arn:aws:dynamodb:ap-south-1:${identity.accountId}:table/application-data-table`,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:Query', 'dynamodb:Scan'],
                  Resource: `arn:aws:dynamodb:ap-south-1:${identity.accountId}:table/application-data-table/index/*`,
                },
              ],
            })
          ),

        tags: {
          ...commonTags,
          Name: `ec2-deployment-policy-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // Attach policy to role
    void new aws.iam.RolePolicyAttachment(
      `ec2-role-policy-attachment-${args.environment}`,
      {
        role: ec2Role.name,
        policyArn: ec2DeploymentPolicy.arn,
      },
      { provider, parent: this }
    );

    // Attach SSM managed instance core policy for Session Manager
    void new aws.iam.RolePolicyAttachment(
      `ec2-ssm-policy-attachment-${args.environment}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider, parent: this }
    );

    // Instance profile for EC2 instances
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `ec2-instance-profile-${args.environment}`,
      {
        name: `ec2-deployment-instance-profile-${args.environment}`,
        role: ec2Role.name,

        tags: {
          ...commonTags,
          Name: `ec2-instance-profile-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    /**
     * DynamoDB Table with Provisioned Throughput
     * Encrypted at rest using KMS
     */
    const dynamoTable = new aws.dynamodb.Table(
      `application-table-${args.environment}`,
      {
        name: `application-data-table-${args.environment}`,

        // Provisioned billing mode for predictable workloads
        billingMode: 'PROVISIONED',
        readCapacity: 10, // Read capacity units for warm throughput
        writeCapacity: 5, // Write capacity units for warm throughput

        // Hash key (partition key)
        hashKey: 'id',

        attributes: [
          {
            name: 'id',
            type: 'S', // String type
          },
          {
            name: 'timestamp',
            type: 'N', // Number type for GSI
          },
        ],

        // Global Secondary Index for query flexibility
        globalSecondaryIndexes: [
          {
            name: 'timestamp-index',
            hashKey: 'timestamp',
            readCapacity: 5,
            writeCapacity: 2,
            projectionType: 'ALL',
          },
        ],

        // Enable encryption at rest
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },

        // Enable point-in-time recovery for production
        pointInTimeRecovery: {
          enabled: true,
        },

        // Enable deletion protection
        deletionProtectionEnabled: true,

        tags: {
          ...commonTags,
          Name: `application-data-table-${args.environment}`,
          BackupRequired: 'true',
        },
      },
      { provider, parent: this }
    );

    /**
     * SNS Topic for Security Alerts and Monitoring
     * Used for CloudWatch Alarms and security notifications
     */
    const securityAlertsTopic = new aws.sns.Topic(
      `security-alerts-topic-${args.environment}`,
      {
        name: `security-alerts-topic-${args.environment}`,
        displayName: 'Security Alerts and Monitoring',
        tags: {
          ...commonTags,
          Name: `security-alerts-topic-${args.environment}`,
          Purpose: 'Security monitoring and alerting',
        },
      },
      { provider, parent: this }
    );

    /**
     * CloudWatch Alarms for Infrastructure Monitoring
     */

    // DynamoDB Read Throttle Alarm
    void new aws.cloudwatch.MetricAlarm(
      `dynamodb-read-throttle-alarm-${args.environment}`,
      {
        name: `dynamodb-read-throttle-alarm-${args.environment}`,
        metricName: 'ReadThrottledEvents',
        namespace: 'AWS/DynamoDB',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        dimensions: {
          TableName: dynamoTable.name,
        },
        alarmActions: [securityAlertsTopic.arn],
        tags: {
          ...commonTags,
          Name: `dynamodb-read-throttle-alarm-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // DynamoDB Write Throttle Alarm
    void new aws.cloudwatch.MetricAlarm(
      `dynamodb-write-throttle-alarm-${args.environment}`,
      {
        name: `dynamodb-write-throttle-alarm-${args.environment}`,
        metricName: 'WriteThrottledEvents',
        namespace: 'AWS/DynamoDB',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        dimensions: {
          TableName: dynamoTable.name,
        },
        alarmActions: [securityAlertsTopic.arn],
        tags: {
          ...commonTags,
          Name: `dynamodb-write-throttle-alarm-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // S3 Bucket 4xx Error Alarm
    void new aws.cloudwatch.MetricAlarm(
      `s3-4xx-error-alarm-${args.environment}`,
      {
        name: `s3-4xx-error-alarm-${args.environment}`,
        metricName: '4xxErrors',
        namespace: 'AWS/S3',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          BucketName: cloudtrailBucket.bucket,
        },
        alarmActions: [securityAlertsTopic.arn],
        tags: {
          ...commonTags,
          Name: `s3-4xx-error-alarm-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    /**
     * GuardDuty for Threat Detection
     * Enables threat detection and security monitoring
     * Note: GuardDuty allows only one detector per AWS account
     * Check us-east-1 first, use it if exists, otherwise create in ap-south-1
     */

    // Create provider for us-east-1 to check for existing GuardDuty detector
    const usEast1Provider = new aws.Provider(
      `us-east-1-provider-${args.environment}`,
      { region: 'us-east-1' },
      { parent: this }
    );

    // Check for existing GuardDuty detector in us-east-1
    const existingDetectorInUsEast1 = aws.guardduty
      .getDetector({}, { provider: usEast1Provider })
      .then(res => res.id)
      .catch(() => undefined);

    const guardDutyDetector = pulumi
      .output(existingDetectorInUsEast1)
      .apply(usEast1DetectorId => {
        if (usEast1DetectorId) {
          // Use existing detector in us-east-1
          return aws.guardduty.Detector.get(
            `imported-guardduty-detector-us-east-1-${args.environment}`,
            usEast1DetectorId,
            {},
            { provider: usEast1Provider, parent: this }
          );
        } else {
          // Create new detector in ap-south-1 if none exists in us-east-1
          return new aws.guardduty.Detector(
            `main-guardduty-detector-${args.environment}`,
            {
              enable: true,
              findingPublishingFrequency: 'FIFTEEN_MINUTES',
              tags: {
                ...commonTags,
                Name: `main-guardduty-detector-${args.environment}`,
              },
            },
            { provider, parent: this }
          );
        }
      });

    // Create GuardDuty features based on where the detector is located
    pulumi.output(existingDetectorInUsEast1).apply(usEast1DetectorId => {
      const featureProvider = usEast1DetectorId ? usEast1Provider : provider;

      // Enable S3 Data Events monitoring
      void new aws.guardduty.DetectorFeature(
        `guardduty-s3-data-events-${args.environment}`,
        {
          detectorId: guardDutyDetector.id,
          name: 'S3_DATA_EVENTS',
          status: 'ENABLED',
        },
        { provider: featureProvider, parent: this }
      );

      // Enable EKS Audit Logs monitoring
      void new aws.guardduty.DetectorFeature(
        `guardduty-eks-audit-logs-${args.environment}`,
        {
          detectorId: guardDutyDetector.id,
          name: 'EKS_AUDIT_LOGS',
          status: 'ENABLED',
        },
        { provider: featureProvider, parent: this }
      );

      // Enable Malware Protection
      void new aws.guardduty.DetectorFeature(
        `guardduty-malware-protection-${args.environment}`,
        {
          detectorId: guardDutyDetector.id,
          name: 'EBS_MALWARE_PROTECTION',
          status: 'ENABLED',
        },
        { provider: featureProvider, parent: this }
      );
    });

    // S3 bucket for Config
    const configBucket = new aws.s3.Bucket(
      `aws-config-bucket-${args.environment}`,
      {
        bucket: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(
            ([identity]) =>
              `aws-config-${identity.accountId}-ap-south-1-${args.environment}`
          ),
        tags: {
          ...commonTags,
          Name: `aws-config-bucket-${args.environment}`,
          Purpose: 'AWS Config storage',
        },
      },
      { provider, parent: this }
    );

    // Config bucket policy
    void new aws.s3.BucketPolicy(
      `config-bucket-policy-${args.environment}`,
      {
        bucket: configBucket.id,
        policy: pulumi
          .all([configBucket.arn, aws.getCallerIdentity({}, { provider })])
          .apply(([bucketArn, _identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSConfigBucketPermissionsCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                  Condition: {
                    StringEquals: {
                      'AWS:SourceAccount': _identity.accountId,
                    },
                  },
                },
                {
                  Sid: 'AWSConfigBucketExistenceCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:ListBucket',
                  Resource: bucketArn,
                  Condition: {
                    StringEquals: {
                      'AWS:SourceAccount': _identity.accountId,
                    },
                  },
                },
                {
                  Sid: 'AWSConfigBucketDelivery',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                      'AWS:SourceAccount': _identity.accountId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider, parent: this }
    );

    // Config service role
    const configRole = new aws.iam.Role(
      `aws-config-role-${args.environment}`,
      {
        name: `aws-config-role-${args.environment}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `aws-config-role-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // Attach AWS managed policy for Config
    void new aws.iam.RolePolicyAttachment(
      `config-role-policy-${args.environment}`,
      {
        role: configRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      },
      { provider, parent: this }
    );

    // AWS Config recorder and delivery channel handling
    // AWS Config allows only one recorder per region per account

    // Check if we should create Config resources or use existing ones
    // Set PULUMI_CREATE_CONFIG_RESOURCES=true to create new Config resources
    const shouldCreateConfigResources =
      process.env.PULUMI_CREATE_CONFIG_RESOURCES === 'true';

    let configRecorder: aws.cfg.Recorder;
    let configDeliveryChannel: aws.cfg.DeliveryChannel;

    if (shouldCreateConfigResources) {
      // Create new Config recorder and delivery channel
      configRecorder = new aws.cfg.Recorder(
        `config-recorder-${args.environment}`,
        {
          name: `config-recorder-${args.environment}`,
          roleArn: configRole.arn,
          recordingGroup: {
            allSupported: true,
            includeGlobalResourceTypes: true,
          },
        },
        { provider, parent: this }
      );

      configDeliveryChannel = new aws.cfg.DeliveryChannel(
        `config-delivery-channel-${args.environment}`,
        {
          name: `config-delivery-channel-${args.environment}`,
          s3BucketName: configBucket.bucket,
          snapshotDeliveryProperties: {
            deliveryFrequency: 'TwentyFour_Hours',
          },
        },
        { provider, parent: this, dependsOn: [configRecorder] }
      );
    } else {
      // Use existing Config resources (default behavior)
      // Create placeholder objects for outputs
      configRecorder = {} as aws.cfg.Recorder;
      configDeliveryChannel = {
        name: pulumi.output('existing-config-delivery-channel'),
      } as aws.cfg.DeliveryChannel;
    }

    // Config rules for compliance (works with both existing and new recorders)
    void new aws.cfg.Rule(
      `encrypted-volumes-rule-${args.environment}`,
      {
        name: `encrypted-volumes-rule-${args.environment}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
        tags: {
          ...commonTags,
          Name: `encrypted-volumes-rule-${args.environment}`,
        },
      },
      {
        provider,
        parent: this,
        // Only depend on configRecorder if we created it
        ...(shouldCreateConfigResources ? { dependsOn: [configRecorder] } : {}),
      }
    );

    void new aws.cfg.Rule(
      `s3-bucket-public-read-prohibited-${args.environment}`,
      {
        name: `s3-bucket-public-read-prohibited-${args.environment}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
        },
        tags: {
          ...commonTags,
          Name: `s3-bucket-public-read-prohibited-${args.environment}`,
        },
      },
      {
        provider,
        parent: this,
        // Only depend on configRecorder if we created it
        ...(shouldCreateConfigResources ? { dependsOn: [configRecorder] } : {}),
      }
    );

    /**
     * VPC Endpoints for SSM Session Manager
     * Enables secure access without SSH or public IPs
     */
    const ssmEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      `ssm-endpoint-sg-${args.environment}`,
      {
        name: `ssm-endpoint-sg-${args.environment}`,
        description: 'Security group for SSM VPC endpoints',
        vpcId: vpc.id,
        ingress: [
          {
            description: 'HTTPS from VPC',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [vpc.cidrBlock],
          },
        ],
        egress: [
          {
            description: 'All outbound',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...commonTags,
          Name: `ssm-endpoint-sg-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // SSM VPC Endpoint
    void new aws.ec2.VpcEndpoint(
      `ssm-endpoint-${args.environment}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-south-1.ssm',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ssmEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...commonTags,
          Name: `ssm-endpoint-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // SSM Messages VPC Endpoint
    void new aws.ec2.VpcEndpoint(
      `ssm-messages-endpoint-${args.environment}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-south-1.ssmmessages',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ssmEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...commonTags,
          Name: `ssm-messages-endpoint-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // EC2 Messages VPC Endpoint
    void new aws.ec2.VpcEndpoint(
      `ec2-messages-endpoint-${args.environment}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-south-1.ec2messages',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ssmEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...commonTags,
          Name: `ec2-messages-endpoint-${args.environment}`,
        },
      },
      { provider, parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
    this.webSecurityGroupId = webSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;
    this.iamRoleArn = ec2Role.arn;
    this.instanceProfileName = ec2InstanceProfile.name;
    this.dynamoTableName = dynamoTable.name;
    this.kmsKeyId = kmsKey.keyId;
    this.kmsKeyArn = kmsKey.arn;
    this.cloudtrailArn = cloudTrail.arn;
    this.s3BucketName = cloudtrailBucket.bucket;
    this.availableAZs = pulumi.output(availabilityZones.then(az => az.names));
    this.snsTopicArn = securityAlertsTopic.arn;
    this.guardDutyDetectorId = guardDutyDetector.id;
    this.configDeliveryChannelName = configDeliveryChannel.name;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      webSecurityGroupId: this.webSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
      iamRoleArn: this.iamRoleArn,
      instanceProfileName: this.instanceProfileName,
      dynamoTableName: this.dynamoTableName,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      cloudtrailArn: this.cloudtrailArn,
      s3BucketName: this.s3BucketName,
      availableAZs: this.availableAZs,
      snsTopicArn: this.snsTopicArn,
      guardDutyDetectorId: this.guardDutyDetectorId,
      configDeliveryChannelName: this.configDeliveryChannelName,
    });
  }
}
```
