import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimary?: boolean;
  primaryRegion?: string;
  primaryBucketArn?: string;
  primaryDatabaseIdentifier?: string;
}

export class TapStack extends cdk.Stack {
  public readonly primaryBucketArn: string;
  public readonly databaseInstanceIdentifier: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const commonTags = {
      Environment: props?.environmentSuffix || 'dev',
      Project: 'tap',
      Owner: 'devops-team',
    };

    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP stack encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Enable complete cleanup
    });

    cdk.Tags.of(kmsKey).add('Environment', commonTags.Environment);
    cdk.Tags.of(kmsKey).add('Project', commonTags.Project);
    cdk.Tags.of(kmsKey).add('Owner', commonTags.Owner);

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'), // Use a different CIDR to avoid conflicts
      maxAzs: 2,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 26, // Smaller subnets (64 IPs each) to fit more subnets
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 26,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 26,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    cdk.Tags.of(vpc).add('Environment', commonTags.Environment);
    cdk.Tags.of(vpc).add('Project', commonTags.Project);
    cdk.Tags.of(vpc).add('Owner', commonTags.Owner);

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound'
    );

    cdk.Tags.of(ec2SecurityGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(ec2SecurityGroup).add('Project', commonTags.Project);
    cdk.Tags.of(ec2SecurityGroup).add('Owner', commonTags.Owner);

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    cdk.Tags.of(rdsSecurityGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(rdsSecurityGroup).add('Project', commonTags.Project);
    cdk.Tags.of(rdsSecurityGroup).add('Owner', commonTags.Owner);

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    cdk.Tags.of(lambdaSecurityGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(lambdaSecurityGroup).add('Project', commonTags.Project);
    cdk.Tags.of(lambdaSecurityGroup).add('Owner', commonTags.Owner);

    // S3 Bucket - declared early to be referenced by IAM roles
    const bucket = new s3.Bucket(this, 'TapBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Explicitly set versioning status on the underlying CFN resource
    const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.versioningConfiguration = {
      status: 'Enabled',
    };

    cdk.Tags.of(bucket).add('Environment', commonTags.Environment);
    cdk.Tags.of(bucket).add('Project', commonTags.Project);
    cdk.Tags.of(bucket).add('Owner', commonTags.Owner);

    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [bucket.arnForObjects('*')],
            }),
          ],
        }),
      },
    });

    cdk.Tags.of(ec2Role).add('Environment', commonTags.Environment);
    cdk.Tags.of(ec2Role).add('Project', commonTags.Project);
    cdk.Tags.of(ec2Role).add('Owner', commonTags.Owner);

    // Auto Scaling Group for application layer
    const asg = new autoscaling.AutoScalingGroup(this, 'TapAutoScalingGroup', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(8, {
            encrypted: true,
            volumeType: autoscaling.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    cdk.Tags.of(asg).add('Environment', commonTags.Environment);
    cdk.Tags.of(asg).add('Project', commonTags.Project);
    cdk.Tags.of(asg).add('Owner', commonTags.Owner);

    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    cdk.Tags.of(dbSubnetGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(dbSubnetGroup).add('Project', commonTags.Project);
    cdk.Tags.of(dbSubnetGroup).add('Owner', commonTags.Owner);

    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      instanceIdentifier: `tap-database-${props?.environmentSuffix || 'default'}`,
    });

    cdk.Tags.of(database).add('Environment', commonTags.Environment);
    cdk.Tags.of(database).add('Project', commonTags.Project);
    cdk.Tags.of(database).add('Owner', commonTags.Owner);

    // RDS Read Replica (Secondary region only)
    if (!props?.isPrimary && props?.primaryDatabaseIdentifier) {
      const readReplica = new rds.DatabaseInstanceReadReplica(
        this,
        'TapDatabaseReadReplica',
        {
          sourceDatabaseInstance:
            rds.DatabaseInstance.fromDatabaseInstanceAttributes(
              this,
              'SourceDatabase',
              {
                instanceIdentifier: props.primaryDatabaseIdentifier,
                instanceEndpointAddress: 'placeholder.region.rds.amazonaws.com',
                port: 3306,
                securityGroups: [],
              }
            ),
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          vpc,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          storageEncrypted: true,
          storageEncryptionKey: kmsKey,
          backupRetention: cdk.Duration.days(7),
          deletionProtection: false,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
      );

      cdk.Tags.of(readReplica).add('Environment', commonTags.Environment);
      cdk.Tags.of(readReplica).add('Project', commonTags.Project);
      cdk.Tags.of(readReplica).add('Owner', commonTags.Owner);
    }

    // S3 Replica Bucket (Secondary region only)
    if (!props?.isPrimary) {
      const replicaBucket = new s3.Bucket(this, 'TapReplicaBucket', {
        bucketName: `tap-replica-bucket-${props?.environmentSuffix || 'dev'}-uswest1`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      cdk.Tags.of(replicaBucket).add('Environment', commonTags.Environment);
      cdk.Tags.of(replicaBucket).add('Project', commonTags.Project);
      cdk.Tags.of(replicaBucket).add('Owner', commonTags.Owner);
    }

    // S3 Cross-Region Replication (Primary region only)
    if (props?.isPrimary) {
      // Create replication role without bucket reference to avoid circular dependency
      const replicationRole = new iam.Role(this, 'TapS3ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        inlinePolicies: {
          ReplicationPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                resources: [
                  `arn:aws:s3:::tap-replica-bucket-${props?.environmentSuffix || 'dev'}-uswest1/*`,
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'kms:Decrypt',
                  'kms:Encrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                resources: [
                  kmsKey.keyArn,
                  `arn:aws:kms:us-west-1:${this.account}:alias/aws/s3`, // For cross-region replication
                ],
              }),
            ],
          }),
        },
      });

      cdk.Tags.of(replicationRole).add('Environment', commonTags.Environment);
      cdk.Tags.of(replicationRole).add('Project', commonTags.Project);
      cdk.Tags.of(replicationRole).add('Owner', commonTags.Owner);

      // Grant the replication role permissions on the source bucket via bucket policy
      bucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowReplicationRoleListAndGetReplicationConfig',
          principals: [new iam.ArnPrincipal(replicationRole.roleArn)],
          actions: ['s3:ListBucket', 's3:GetReplicationConfiguration'],
          resources: [bucket.bucketArn],
        })
      );

      bucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowReplicationRoleReadSourceObjects',
          principals: [new iam.ArnPrincipal(replicationRole.roleArn)],
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [bucket.arnForObjects('*')],
        })
      );

      // Configure replication on the primary bucket using CFN
      const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateToSecondaryRegion',
            status: 'Enabled',
            priority: 1,
            filter: {
              prefix: '',
            },
            sourceSelectionCriteria: {
              sseKmsEncryptedObjects: {
                status: 'Enabled',
              },
            },
            destination: {
              bucket: `arn:aws:s3:::tap-replica-bucket-${props?.environmentSuffix || 'dev'}-uswest1`,
              storageClass: 'STANDARD_IA',
              encryptionConfiguration: {
                replicaKmsKeyId: `arn:aws:kms:us-west-1:${this.account}:alias/aws/s3`,
              },
            },
            deleteMarkerReplication: {
              status: 'Enabled',
            },
          },
        ],
      };
    }

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/TapReplicationMonitor*`,
              ],
            }),
          ],
        }),
      },
    });

    cdk.Tags.of(lambdaRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(lambdaRole).add('Project', commonTags.Project);
    cdk.Tags.of(lambdaRole).add('Owner', commonTags.Owner);

    // SNS Topic for replication alerts
    const snsTopic = new sns.Topic(this, 'TapReplicationTopic', {
      topicName: `tap-replication-alerts-${this.region.replace(/-/g, '')}-${props?.environmentSuffix || 'dev'}`,
      displayName: `TAP Replication Alerts - ${this.region}`,
      masterKey: kmsKey,
    });

    cdk.Tags.of(snsTopic).add('Environment', commonTags.Environment);
    cdk.Tags.of(snsTopic).add('Project', commonTags.Project);
    cdk.Tags.of(snsTopic).add('Owner', commonTags.Owner);

    // Lambda function for S3 replication monitoring
    const lambdaFunction = new lambda.Function(this, 'TapReplicationMonitor', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')

def handler(event, context):
    logger.info(f"Received S3 replication event: {json.dumps(event)}")
    
    try:
        # Process S3 replication events
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for {object_key} in {bucket_name}")
                
                # Send SNS notification for replication events
                if 'Replication' in event_name or 'ObjectCreated' in event_name:
                    message = {
                        'bucket': bucket_name,
                        'key': object_key,
                        'event': event_name,
                        'region': os.environ.get('AWS_REGION'),
                        'timestamp': record.get('eventTime')
                    }
                    
                    sns.publish(
                        TopicArn=os.environ.get('SNS_TOPIC_ARN'),
                        Message=json.dumps(message),
                        Subject=f'S3 Replication Event: {event_name}'
                    )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Replication monitoring completed successfully'})
        }
        
    except Exception as e:
        logger.error(f"Error processing replication event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
      `),
      environment: {
        SNS_TOPIC_ARN: snsTopic.topicArn,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    cdk.Tags.of(lambdaFunction).add('Environment', commonTags.Environment);
    cdk.Tags.of(lambdaFunction).add('Project', commonTags.Project);
    cdk.Tags.of(lambdaFunction).add('Owner', commonTags.Owner);

    // Grant Lambda permission to publish to SNS
    snsTopic.grantPublish(lambdaFunction);

    // CloudFront Distribution (Primary region only)
    if (props?.isPrimary) {
      // Dedicated logs bucket for CloudFront (ACL-compatible)
      const cfLogsBucket = new s3.Bucket(this, 'TapCfLogsBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED, // CloudFront access logs do not use KMS
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER, // allow ACLs for log delivery
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      cdk.Tags.of(cfLogsBucket).add('Environment', commonTags.Environment);
      cdk.Tags.of(cfLogsBucket).add('Project', commonTags.Project);
      cdk.Tags.of(cfLogsBucket).add('Owner', commonTags.Owner);

      const distribution = new cloudfront.Distribution(
        this,
        'TapCloudFrontDistribution',
        {
          defaultBehavior: {
            origin: new origins.S3Origin(bucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            compress: true,
          },
          priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
          enableLogging: true,
          logBucket: cfLogsBucket,
          logFilePrefix: 'cloudfront-logs/',
          comment: `TAP CloudFront Distribution - ${props?.environmentSuffix || 'dev'}`,
        }
      );

      // CloudFront standard access logs rely on bucket ACLs; no explicit
      // bucket policy for the CloudFront log delivery principal is required.

      cdk.Tags.of(distribution).add('Environment', commonTags.Environment);
      cdk.Tags.of(distribution).add('Project', commonTags.Project);
      cdk.Tags.of(distribution).add('Owner', commonTags.Owner);

      new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
        value: distribution.distributionDomainName,
        description: 'CloudFront Distribution Domain Name',
      });
    }

    // Set public properties for cross-stack references
    this.primaryBucketArn = bucket.bucketArn;
    this.databaseInstanceIdentifier = database.instanceIdentifier;
  }
}
