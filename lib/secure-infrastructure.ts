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
      'ap-south-1-provider',
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
      'main-vpc',
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: 'main-vpc',
        },
      },
      { provider, parent: this }
    );

    /**
     * Internet Gateway
     * Required for public subnet internet access
     */
    const internetGateway = new aws.ec2.InternetGateway(
      'main-igw',
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: 'main-igw',
        },
      },
      { provider, parent: this }
    );

    /**
     * Public Subnets
     * Two public subnets in different AZs for high availability
     */
    const publicSubnet1 = new aws.ec2.Subnet(
      'public-subnet-1',
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: 'public-subnet-1',
          Type: 'public',
        },
      },
      { provider, parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      'public-subnet-2',
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: 'public-subnet-2',
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
      'private-subnet-1',
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.10.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...commonTags,
          Name: 'private-subnet-1',
          Type: 'private',
        },
      },
      { provider, parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      'private-subnet-2',
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...commonTags,
          Name: 'private-subnet-2',
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
      'nat-eip',
      {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: 'nat-eip',
          Purpose: 'NAT Gateway for private subnet outbound access',
        },
      },
      { provider, parent: this }
    );

    const natGateway = new aws.ec2.NatGateway(
      'nat-gateway',
      {
        allocationId: natEip.id,
        subnetId: publicSubnet1.id,
        tags: {
          ...commonTags,
          Name: 'nat-gateway',
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
      'public-route-table',
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
          Name: 'public-route-table',
        },
      },
      { provider, parent: this }
    );

    // Associate route table with public subnets
    void new aws.ec2.RouteTableAssociation(
      'public-subnet-1-association',
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { provider, parent: this }
    );

    void new aws.ec2.RouteTableAssociation(
      'public-subnet-2-association',
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
      'private-route-table',
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
          Name: 'private-route-table',
        },
      },
      { provider, parent: this }
    );

    // Associate route table with private subnets
    void new aws.ec2.RouteTableAssociation(
      'private-subnet-1-association',
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { provider, parent: this }
    );

    void new aws.ec2.RouteTableAssociation(
      'private-subnet-2-association',
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
      'web-security-group',
      {
        name: 'web-security-group',
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
          Name: 'web-security-group',
        },
      },
      { provider, parent: this }
    );

    /**
     * Database Security Group
     * Allows access only from web security group
     */
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      'db-security-group',
      {
        name: 'db-security-group',
        description:
          'Security group for database with restricted access from web tier only',
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
          Name: 'db-security-group',
        },
      },
      { provider, parent: this }
    );

    /**
     * KMS Key for Encryption
     * Used for encrypting S3 bucket and DynamoDB table
     */
    const kmsKey = new aws.kms.Key(
      'infrastructure-kms-key',
      {
        description: 'KMS key for infrastructure encryption',
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
          Name: 'infrastructure-kms-key',
        },
      },
      { provider, parent: this }
    );

    void new aws.kms.Alias(
      'infrastructure-kms-key-alias',
      {
        name: 'alias/infrastructure-key',
        targetKeyId: kmsKey.keyId,
      },
      { provider, parent: this }
    );

    /**
     * S3 Bucket for CloudTrail Logs
     * Encrypted bucket with versioning and lifecycle policies
     */
    const cloudtrailBucket = new aws.s3.Bucket(
      'cloudtrail-logs-bucket',
      {
        bucket: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(
            ([identity]) => `cloudtrail-logs-${identity.accountId}-ap-south-1`
          ),

        tags: {
          ...commonTags,
          Name: 'cloudtrail-logs-bucket',
          Purpose: 'CloudTrail logs storage',
        },
      },
      { provider, parent: this }
    );

    // Enable versioning on the S3 bucket
    void new aws.s3.BucketVersioning(
      'cloudtrail-bucket-versioning',
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
      'cloudtrail-bucket-encryption',
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
      'cloudtrail-bucket-pab',
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
      'cloudtrail-bucket-lifecycle',
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
      'cloudtrail-bucket-notification',
      {
        bucket: cloudtrailBucket.id,
        // CloudWatch Events will be configured separately for CloudTrail monitoring
      },
      { provider, parent: this }
    );

    // S3 bucket policy for CloudTrail
    const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(
      'cloudtrail-bucket-policy',
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
      'main-cloudtrail',
      {
        name: 'main-cloudtrail',
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
                values: ['arn:aws:s3:::*/*'],
              },
            ],
          },
        ],

        tags: {
          ...commonTags,
          Name: 'main-cloudtrail',
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
      'ec2-deployment-role',
      {
        name: 'ec2-deployment-role',
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
          Name: 'ec2-deployment-role',
        },
      },
      { provider, parent: this }
    );

    // IAM policy for EC2 deployment actions only
    const ec2DeploymentPolicy = new aws.iam.Policy(
      'ec2-deployment-policy',
      {
        name: 'ec2-deployment-policy',
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
          Name: 'ec2-deployment-policy',
        },
      },
      { provider, parent: this }
    );

    // Attach policy to role
    void new aws.iam.RolePolicyAttachment(
      'ec2-role-policy-attachment',
      {
        role: ec2Role.name,
        policyArn: ec2DeploymentPolicy.arn,
      },
      { provider, parent: this }
    );

    // Attach SSM managed instance core policy for Session Manager
    void new aws.iam.RolePolicyAttachment(
      'ec2-ssm-policy-attachment',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider, parent: this }
    );

    // Instance profile for EC2 instances
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      'ec2-instance-profile',
      {
        name: 'ec2-deployment-instance-profile',
        role: ec2Role.name,

        tags: {
          ...commonTags,
          Name: 'ec2-instance-profile',
        },
      },
      { provider, parent: this }
    );

    /**
     * DynamoDB Table with Provisioned Throughput
     * Encrypted at rest using KMS
     */
    const dynamoTable = new aws.dynamodb.Table(
      'application-table',
      {
        name: 'application-data-table',

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
          Name: 'application-data-table',
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
      'security-alerts-topic',
      {
        name: 'security-alerts-topic',
        displayName: 'Security Alerts and Monitoring',
        tags: {
          ...commonTags,
          Name: 'security-alerts-topic',
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
      'dynamodb-read-throttle-alarm',
      {
        name: 'dynamodb-read-throttle-alarm',
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
          Name: 'dynamodb-read-throttle-alarm',
        },
      },
      { provider, parent: this }
    );

    // DynamoDB Write Throttle Alarm
    void new aws.cloudwatch.MetricAlarm(
      'dynamodb-write-throttle-alarm',
      {
        name: 'dynamodb-write-throttle-alarm',
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
          Name: 'dynamodb-write-throttle-alarm',
        },
      },
      { provider, parent: this }
    );

    // S3 Bucket 4xx Error Alarm
    void new aws.cloudwatch.MetricAlarm(
      's3-4xx-error-alarm',
      {
        name: 's3-4xx-error-alarm',
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
          Name: 's3-4xx-error-alarm',
        },
      },
      { provider, parent: this }
    );

    /**
     * GuardDuty for Threat Detection
     * Enables threat detection and security monitoring
     */
    const guardDutyDetector = new aws.guardduty.Detector(
      'main-guardduty-detector',
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        tags: {
          ...commonTags,
          Name: 'main-guardduty-detector',
        },
      },
      { provider, parent: this }
    );

    // Enable S3 Data Events monitoring
    void new aws.guardduty.DetectorFeature(
      'guardduty-s3-data-events',
      {
        detectorId: guardDutyDetector.id,
        name: 'S3_DATA_EVENTS',
        status: 'ENABLED',
      },
      { provider, parent: this }
    );

    // Enable EKS Audit Logs monitoring
    void new aws.guardduty.DetectorFeature(
      'guardduty-eks-audit-logs',
      {
        detectorId: guardDutyDetector.id,
        name: 'EKS_AUDIT_LOGS',
        status: 'ENABLED',
      },
      { provider, parent: this }
    );

    // Enable Malware Protection
    void new aws.guardduty.DetectorFeature(
      'guardduty-malware-protection',
      {
        detectorId: guardDutyDetector.id,
        name: 'EBS_MALWARE_PROTECTION',
        status: 'ENABLED',
      },
      { provider, parent: this }
    );

    /**
     * AWS Config for Configuration Compliance
     * Tracks configuration changes and compliance
     */

    // S3 bucket for Config
    const configBucket = new aws.s3.Bucket(
      'aws-config-bucket',
      {
        bucket: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(([identity]) => `aws-config-${identity.accountId}-ap-south-1`),
        tags: {
          ...commonTags,
          Name: 'aws-config-bucket',
          Purpose: 'AWS Config storage',
        },
      },
      { provider, parent: this }
    );

    // Config bucket policy
    void new aws.s3.BucketPolicy(
      'config-bucket-policy',
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
      'aws-config-role',
      {
        name: 'aws-config-role',
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
          Name: 'aws-config-role',
        },
      },
      { provider, parent: this }
    );

    // Attach AWS managed policy for Config
    void new aws.iam.RolePolicyAttachment(
      'config-role-policy',
      {
        role: configRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/ConfigRole',
      },
      { provider, parent: this }
    );

    // Config delivery channel
    const configDeliveryChannel = new aws.cfg.DeliveryChannel(
      'main-config-delivery-channel',
      {
        name: 'main-config-delivery-channel',
        s3BucketName: configBucket.bucket,
        snapshotDeliveryProperties: {
          deliveryFrequency: 'TwentyFour_Hours',
        },
      },
      { provider, parent: this }
    );

    // Config configuration recorder
    void new aws.cfg.Recorder(
      'main-config-recorder',
      {
        name: 'main-config-recorder',
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      { provider, parent: this, dependsOn: [configDeliveryChannel] }
    );

    // Config rules for compliance
    void new aws.cfg.Rule(
      'encrypted-volumes-rule',
      {
        name: 'encrypted-volumes-rule',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
        tags: {
          ...commonTags,
          Name: 'encrypted-volumes-rule',
        },
      },
      { provider, parent: this, dependsOn: [configDeliveryChannel] }
    );

    void new aws.cfg.Rule(
      's3-bucket-public-read-prohibited',
      {
        name: 's3-bucket-public-read-prohibited',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
        },
        tags: {
          ...commonTags,
          Name: 's3-bucket-public-read-prohibited',
        },
      },
      { provider, parent: this, dependsOn: [configDeliveryChannel] }
    );

    /**
     * VPC Endpoints for SSM Session Manager
     * Enables secure access without SSH or public IPs
     */
    const ssmEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      'ssm-endpoint-sg',
      {
        name: 'ssm-endpoint-sg',
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
          Name: 'ssm-endpoint-sg',
        },
      },
      { provider, parent: this }
    );

    // SSM VPC Endpoint
    void new aws.ec2.VpcEndpoint(
      'ssm-endpoint',
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-south-1.ssm',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ssmEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...commonTags,
          Name: 'ssm-endpoint',
        },
      },
      { provider, parent: this }
    );

    // SSM Messages VPC Endpoint
    void new aws.ec2.VpcEndpoint(
      'ssm-messages-endpoint',
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-south-1.ssmmessages',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ssmEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...commonTags,
          Name: 'ssm-messages-endpoint',
        },
      },
      { provider, parent: this }
    );

    // EC2 Messages VPC Endpoint
    void new aws.ec2.VpcEndpoint(
      'ec2-messages-endpoint',
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-south-1.ec2messages',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ssmEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...commonTags,
          Name: 'ec2-messages-endpoint',
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
    this.availableAZs = pulumi.output(availabilityZones).apply(az => az.names);
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
