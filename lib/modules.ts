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

// S3 Module
export class S3Module extends BaseModule {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketVersioning: aws.s3BucketVersioning.S3BucketVersioningA;
  public readonly bucketEncryption: aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;
  public readonly bucketLogging: aws.s3BucketLogging.S3BucketLoggingA;

  constructor(
    scope: Construct,
    id: string,
    bucketName: string,
    kmsKeyId: string,
    logBucketId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create S3 bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, `${id}-bucket`, {
      bucket: bucketName,
      tags: this.tags,
    });

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

    // Enable encryption with KMS
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

    // Block public access
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        `${id}-public-access-block`,
        {
          bucket: this.bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

    // Enable access logging
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

    // Attach Inspector policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-inspector-policy`,
      {
        role: this.role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonInspector2ManagedCisPolicy',
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
        vpcId: 'vpc-abc123',

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

      // Encrypted root EBS volume
      rootBlockDevice: {
        encrypted: true,
        kmsKeyId: kmsKeyId,
        volumeType: 'gp3',
        volumeSize: 30,
      },

      // Enable detailed monitoring
      monitoring: true,

      // User data to install SSM agent and Inspector
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

// IAM Lambda Module
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

    // Create CloudWatch Log Group
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${id}-logs`,
      {
        name: `/aws/lambda/${functionName}`,
        retentionInDays: 30,
        kmsKeyId,
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

// RDS Module
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

    // Create RDS instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, `${id}-instance`, {
      identifier: `${id}-db`,
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,

      engine,
      instanceClass,
      availabilityZone,

      dbSubnetGroupName: this.subnetGroup.name,

      // Enable automated backups
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Skip final snapshot for development
      skipFinalSnapshot: true,

      username: 'admin',
      password: 'ChangeMePlease123!', // Should use Secrets Manager in production

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

      // Enable Point-in-Time Recovery
      pointInTimeRecovery: {
        enabled: true,
      },

      // Enable encryption
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: undefined, // Uses AWS managed key
      },

      tags: this.tags,
    });
  }
}

// Redshift Module
export class RedshiftModule extends BaseModule {
  public readonly cluster: aws.redshiftCluster.RedshiftCluster;
  public readonly loggingBucket: aws.s3Bucket.S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    clusterIdentifier: string,
    nodeType: string,
    numberOfNodes: number,
    availabilityZone: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create logging bucket
    this.loggingBucket = new aws.s3Bucket.S3Bucket(this, `${id}-logs-bucket`, {
      bucket: `${clusterIdentifier}-audit-logs`,
      tags: this.tags,
    });

    // Create Redshift cluster
    this.cluster = new aws.redshiftCluster.RedshiftCluster(
      this,
      `${id}-cluster`,
      {
        clusterIdentifier,
        nodeType,
        numberOfNodes,
        availabilityZone,

        masterUsername: 'admin',
        masterPassword: 'ChangeMePlease123!', // Should use Secrets Manager

        // // Enable audit logging
        // logging: {
        //   enable: true,
        //   bucketName: this.loggingBucket.bucket,
        // },

        tags: this.tags,
      }
    );
  }
}

// CloudTrail and Config Module
export class CloudTrailConfigModule extends BaseModule {
  public readonly trail: aws.cloudtrail.Cloudtrail;
  public readonly trailBucket: aws.s3Bucket.S3Bucket;
  public readonly configRecorder: aws.configConfigurationRecorder.ConfigConfigurationRecorder;
  public readonly configDeliveryChannel: aws.configDeliveryChannel.ConfigDeliveryChannel;

  constructor(
    scope: Construct,
    id: string,
    kmsKeyId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create bucket for CloudTrail logs
    this.trailBucket = new aws.s3Bucket.S3Bucket(this, `${id}-trail-bucket`, {
      bucket: `cloudtrail-logs-${id}`,
      tags: this.tags,
    });

    // Configure bucket policy for CloudTrail
    new aws.s3BucketPolicy.S3BucketPolicy(this, `${id}-trail-bucket-policy`, {
      bucket: this.trailBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
            Action: 's3:GetBucketAcl',
            Resource: this.trailBucket.arn,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
            Action: 's3:PutObject',
            Resource: `${this.trailBucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
    });

    // Create CloudTrail
    this.trail = new aws.cloudtrail.Cloudtrail(this, `${id}-trail`, {
      name: `${id}-trail`,
      s3BucketName: this.trailBucket.id,

      // Enable for all regions
      isMultiRegionTrail: true,

      // Enable log file validation
      enableLogFileValidation: true,

      // Encrypt with KMS
      kmsKeyId,

      // Include global service events
      includeGlobalServiceEvents: true,

      // Enable all event types
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,

          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3:::*/*'],
            },
          ],
        },
      ],

      tags: this.tags,
    });

    // Create IAM role for Config
    const configRole = new aws.iamRole.IamRole(this, `${id}-config-role`, {
      name: `${id}-config-role`,
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
      tags: this.tags,
    });

    // Attach Config policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-config-policy`,
      {
        role: configRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/ConfigRole',
      }
    );

    // Create Config recorder
    this.configRecorder =
      new aws.configConfigurationRecorder.ConfigConfigurationRecorder(
        this,
        `${id}-recorder`,
        {
          name: `${id}-recorder`,
          roleArn: configRole.arn,

          recordingGroup: {
            allSupported: true,
            includeGlobalResourceTypes: true,
          },
        }
      );

    // Create delivery channel
    this.configDeliveryChannel =
      new aws.configDeliveryChannel.ConfigDeliveryChannel(
        this,
        `${id}-delivery-channel`,
        {
          name: `${id}-delivery-channel`,
          s3BucketName: this.trailBucket.id,
          s3KeyPrefix: 'config',
        }
      );

    // Start Config recorder
    new aws.configConfigurationRecorderStatus.ConfigConfigurationRecorderStatus(
      this,
      `${id}-recorder-status`,
      {
        name: this.configRecorder.name,
        isEnabled: true,

        dependsOn: [this.configDeliveryChannel],
      }
    );

    // Add Config rules for compliance checking
    this.createConfigRules();
  }

  private createConfigRules() {
    // S3 bucket versioning enabled
    new aws.configConfigRule.ConfigConfigRule(
      this,
      's3-bucket-versioning-enabled',
      {
        name: 's3-bucket-versioning-enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
        },
      }
    );

    // Encrypted volumes
    new aws.configConfigRule.ConfigConfigRule(this, 'encrypted-volumes', {
      name: 'encrypted-volumes',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'ENCRYPTED_VOLUMES',
      },
    });

    // RDS encryption enabled
    new aws.configConfigRule.ConfigConfigRule(this, 'rds-storage-encrypted', {
      name: 'rds-storage-encrypted',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
      },
    });
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

    // Create ALB
    this.alb = new aws.alb.Alb(this, `${id}-alb`, {
      name: `${id}-alb`,
      internal: false,
      loadBalancerType: 'application',
      subnets: subnetIds,

      // Enable access logs
      accessLogs: {
        bucket: logBucketName,
        prefix: 'alb',
        enabled: true,
      },

      // Enable deletion protection in production
      enableDeletionProtection: false,

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

// API Gateway Module
export class ApiGatewayModule extends BaseModule {
  public readonly api: aws.apiGatewayRestApi.ApiGatewayRestApi;
  public readonly deployment: aws.apiGatewayDeployment.ApiGatewayDeployment;
  public readonly stage: aws.apiGatewayStage.ApiGatewayStage;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    apiName: string,
    kmsKeyId: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create CloudWatch Log Group
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${id}-api-logs`,
      {
        name: `/aws/apigateway/${apiName}`,
        retentionInDays: 30,
        kmsKeyId,
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

    // Create deployment
    this.deployment = new aws.apiGatewayDeployment.ApiGatewayDeployment(
      this,
      `${id}-deployment`,
      {
        restApiId: this.api.id,

        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // Create stage with logging
    this.stage = new aws.apiGatewayStage.ApiGatewayStage(this, `${id}-stage`, {
      deploymentId: this.deployment.id,
      restApiId: this.api.id,
      stageName: 'prod',

      // Enable CloudWatch logging
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

      // Enable X-Ray tracing
      xrayTracingEnabled: true,

      tags: this.tags,
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

      // Enable image scanning
      imageScanningConfiguration: {
        scanOnPush: true,
      },

      // Enable tag immutability
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

// SNS Module
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

    this.topic = new aws.snsTopic.SnsTopic(this, `${id}-topic`, {
      name: topicName,
      displayName: topicName,

      // Enable encryption
      kmsMasterKeyId: kmsKeyId,

      tags: this.tags,
    });

    // Add topic policy to prevent public access
    new aws.snsTopicPolicy.SnsTopicPolicy(this, `${id}-policy`, {
      arn: this.topic.arn,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PreventPublicAccess',
            Effect: 'Deny',
            Principal: '*',
            Action: ['SNS:Subscribe', 'SNS:Publish'],
            Resource: this.topic.arn,
            Condition: {
              StringEquals: {
                'aws:SourceAccount': { Ref: 'AWS::AccountId' },
              },
            },
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

// CloudFront with WAF Module
// CloudFront with WAF Module
export class CloudFrontWafModule extends BaseModule {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly waf: aws.wafv2WebAcl.Wafv2WebAcl;

  constructor(
    scope: Construct,
    id: string,
    originDomainName: string,
    logBucketDomain: string,
    tags: CommonTags
  ) {
    super(scope, id, tags);

    // Create WAF Web ACL
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
            // Changed from rateBasedStatement to rate_based_statement
            rate_based_statement: {
              limit: 2000,
              aggregate_key_type: 'IP', // Also changed to snake_case
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

    // Create CloudFront distribution
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      `${id}-distribution`,
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: 'CloudFront distribution with WAF',
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

        webAclId: this.waf.arn,

        tags: this.tags,
      }
    );
  }
}
