import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
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
  public readonly databaseInstanceIdentifier?: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const isPrimary = props?.isPrimary ?? true;
    const region = this.region;

    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: `TAP Multi-Region KMS Key - ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow EC2 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('ec2.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow AutoScaling Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('autoscaling.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow RDS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow SNS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow Lambda Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    const bucket = new s3.Bucket(this, 'TapBucket', {
      bucketName: `tap-bucket-${region.replace(/-/g, '')}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.primaryBucketArn = bucket.bucketArn;

    if (isPrimary) {
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      });

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [`${bucket.bucketArn}/*`],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [bucket.bucketArn],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags',
          ],
          resources: [`arn:aws:s3:::tap-bucket-useast2-${environmentSuffix}/*`],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
          resources: [kmsKey.keyArn],
        })
      );

      new cdk.CfnOutput(this, 'ReplicationRoleArn', {
        value: replicationRole.roleArn,
        description: 'IAM Role ARN for S3 Cross-Region Replication',
      });
    }

    let distribution: cloudfront.Distribution | undefined;
    if (isPrimary) {
      distribution = new cloudfront.Distribution(this, 'TapDistribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        comment: `TAP CloudFront Distribution - ${environmentSuffix}`,
      });
    }

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      vpc,
      description: 'Subnet group for TAP RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'TapDbSecurityGroup', {
      vpc,
      description: 'Security group for TAP RDS instance',
      allowAllOutbound: false,
    });

    if (isPrimary) {
      const dbInstance = new rds.DatabaseInstance(this, 'TapDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_9,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        multiAz: true,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        databaseName: 'tapdb',
        credentials: rds.Credentials.fromGeneratedSecret('tapuser'),
      });

      const cfnDbInstance = dbInstance.node.defaultChild as rds.CfnDBInstance;
      cfnDbInstance.backupRetentionPeriod = 7;
      
      // Store the database identifier for cross-stack reference
      this.databaseInstanceIdentifier = dbInstance.instanceIdentifier;
    } else {
      if (!props?.primaryDatabaseIdentifier) {
        throw new Error('primaryDatabaseIdentifier is required for secondary stack');
      }
      
      new rds.DatabaseInstanceReadReplica(this, 'TapDatabaseReplica', {
        sourceDatabaseInstance:
          rds.DatabaseInstance.fromDatabaseInstanceAttributes(
            this,
            'SourceDb',
            {
              instanceIdentifier: props.primaryDatabaseIdentifier,
              instanceEndpointAddress: 'placeholder',
              port: 5432,
              securityGroups: [],
            }
          ),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      'TapEc2SecurityGroup',
      {
        vpc,
        description: 'Security group for TAP EC2 instances',
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow EC2 to connect to RDS'
    );

    const ec2Role = new iam.Role(this, 'TapEc2Role', {
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
              resources: [`${bucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    new autoscaling.AutoScalingGroup(this, 'TapAutoScalingGroup', {
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

    const snsTopic = new sns.Topic(this, 'TapReplicationTopic', {
      topicName: `tap-replication-alerts-${region.replace(/-/g, '')}-${environmentSuffix}`,
      displayName: `TAP Replication Alerts - ${region}`,
      masterKey: kmsKey,
    });

    const replicationLambda = new lambda.Function(
      this,
      'TapReplicationMonitor',
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    sns = boto3.client('sns')
    topic_arn = os.environ['SNS_TOPIC_ARN']
    
    # Process S3 replication events
    for record in event.get('Records', []):
        if record.get('eventSource') == 'aws:s3':
            message = {
                'eventName': record.get('eventName'),
                'bucket': record['s3']['bucket']['name'],
                'key': record['s3']['object']['key'],
                'region': record.get('awsRegion'),
                'timestamp': record.get('eventTime')
            }
            
            sns.publish(
                TopicArn=topic_arn,
                Message=json.dumps(message),
                Subject=f"S3 Replication Event: {record.get('eventName')}"
            )
    
    return {'statusCode': 200, 'body': json.dumps('Success')}
      `),
        environment: {
          SNS_TOPIC_ARN: snsTopic.topicArn,
        },
        timeout: cdk.Duration.minutes(5),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant Lambda permission to publish to SNS
    snsTopic.grantPublish(replicationLambda);

    // Grant Lambda permission to use KMS key
    kmsKey.grantEncryptDecrypt(replicationLambda);

    // CloudWatch Log Group for Lambda
    new logs.LogGroup(this, 'TapLambdaLogGroup', {
      logGroupName: `/aws/lambda/${replicationLambda.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
    });

    if (distribution) {
      new cdk.CfnOutput(this, 'CloudFrontDomainName', {
        value: distribution.distributionDomainName,
        description: 'CloudFront Distribution Domain Name',
      });
    }

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: snsTopic.topicArn,
      description: 'SNS Topic ARN for replication alerts',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
    
    // Output database identifier for primary stack
    if (isPrimary && this.databaseInstanceIdentifier) {
      new cdk.CfnOutput(this, 'DatabaseInstanceIdentifier', {
        value: this.databaseInstanceIdentifier,
        description: 'RDS Database Instance Identifier',
      });
    }
  }
}
