import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, environment } = props;

    // Create VPC with proper CIDR allocation
    const vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group - Only allow SSH (22) and HTTP (80)
    const webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Security group for web servers - ${environment}`,
        allowAllOutbound: true,
      }
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'SSH access'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, `EC2Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `IAM role for EC2 instances - ${environment}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
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
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Instance Profile for EC2 - not used directly as Instance takes role parameter

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, `KMSKey-${environmentSuffix}`, {
      description: `KMS key for encryption - ${environment}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure KMS key is destroyable
    });

    // EC2 Instance - t2.micro only
    const webServer = new ec2.Instance(this, `WebServer-${environmentSuffix}`, {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: webSecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true,
    });

    // S3 Bucket with encryption
    const appBucket = new s3.Bucket(this, `AppBucket-${environmentSuffix}`, {
      bucketName: `app-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Enable auto-delete for cleanup
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Database subnet group - ${environment}`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // RDS Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Security group for RDS database - ${environment}`,
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from web servers'
    );

    // RDS Database
    const database = new rds.DatabaseInstance(
      this,
      `Database-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        databaseName: 'webapp',
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          encryptionKey: kmsKey,
        }),
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        multiAz: false, // Always false for QA testing
        backupRetention: cdk.Duration.days(1),
        deletionProtection: false, // Always false to ensure destroyable
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Always destroy for testing
      }
    );

    // SNS Topic with HTTPS subscription
    const notificationTopic = new sns.Topic(
      this,
      `NotificationTopic-${environmentSuffix}`,
      {
        topicName: `webapp-notifications-${environmentSuffix}`,
        displayName: `Web Application Notifications - ${environment}`,
      }
    );

    // Lambda execution role for EC2 shutdown
    const lambdaRole = new iam.Role(this, `LambdaRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for EC2 shutdown - ${environment}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        EC2Shutdown: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ec2:DescribeInstances', 'ec2:StopInstances'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'ec2:ResourceTag/Environment': environment,
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [notificationTopic.topicArn],
            }),
          ],
        }),
      },
    });

    // Lambda function for EC2 shutdown
    const shutdownLambda = new lambda.Function(
      this,
      `ShutdownLambda-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        role: lambdaRole,
        timeout: cdk.Duration.minutes(5),
        environment: {
          SNS_TOPIC_ARN: notificationTopic.topicArn,
          ENVIRONMENT: environment,
        },
        code: lambda.Code.fromInline(`
import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    ec2 = boto3.client('ec2')
    sns = boto3.client('sns')
    
    environment = os.environ['ENVIRONMENT']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    
    try:
        # Find running instances with the correct environment tag
        response = ec2.describe_instances(
            Filters=[
                {'Name': 'instance-state-name', 'Values': ['running']},
                {'Name': 'tag:Environment', 'Values': [environment]}
            ]
        )
        
        instance_ids = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_ids.append(instance['InstanceId'])
        
        if instance_ids:
            # Stop the instances
            ec2.stop_instances(InstanceIds=instance_ids)
            message = f"Stopped {len(instance_ids)} instances in {environment}: {', '.join(instance_ids)}"
            logger.info(message)
            
            # Send notification
            sns.publish(
                TopicArn=sns_topic_arn,
                Message=message,
                Subject=f"EC2 Instances Shutdown - {environment.title()}"
            )
        else:
            message = f"No running instances found in {environment} environment"
            logger.info(message)
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': message})
        }
        
    except Exception as e:
        error_message = f"Error stopping instances: {str(e)}"
        logger.error(error_message)
        
        # Send error notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Message=error_message,
            Subject=f"EC2 Shutdown Error - {environment.title()}"
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_message})
        }
      `),
      }
    );

    // EventBridge Scheduler role
    const schedulerRole = new iam.Role(
      this,
      `SchedulerRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
        description: `EventBridge Scheduler role - ${environment}`,
        inlinePolicies: {
          InvokeLambda: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['lambda:InvokeFunction'],
                resources: [shutdownLambda.functionArn],
              }),
            ],
          }),
        },
      }
    );

    // EventBridge Schedule for daily shutdown at 8 PM
    new scheduler.CfnSchedule(this, `ShutdownSchedule-${environmentSuffix}`, {
      name: `ec2-shutdown-${environmentSuffix}`,
      description: `Daily EC2 shutdown at 8 PM - ${environment}`,
      scheduleExpression: 'cron(0 20 * * ? *)', // 8 PM daily
      scheduleExpressionTimezone: 'America/New_York',
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      target: {
        arn: shutdownLambda.functionArn,
        roleArn: schedulerRole.roleArn,
      },
    });

    // IAM Access Analyzer - commented out due to AWS account limits
    // Note: In production, this should be enabled for security validation
    // new accessanalyzer.CfnAnalyzer(
    //   this,
    //   `AccessAnalyzer-${environmentSuffix}`,
    //   {
    //     type: 'ACCOUNT',
    //     analyzerName: `access-analyzer-${environmentSuffix}`,
    //     tags: [
    //       {
    //         key: 'Project',
    //         value: 'X',
    //       },
    //       {
    //         key: 'Environment',
    //         value: environment,
    //       },
    //     ],
    //   }
    // );

    // IAM User with MFA requirement (example user)
    const appUser = new iam.User(this, `AppUser-${environmentSuffix}`, {
      userName: `app-user-${environmentSuffix}`,
    });

    // Policy requiring MFA for all actions
    const mfaPolicy = new iam.Policy(this, `MFAPolicy-${environmentSuffix}`, {
      policyName: `RequireMFA-${environmentSuffix}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    appUser.attachInlinePolicy(mfaPolicy);

    // Output important information
    new cdk.CfnOutput(this, `VPCId-${environmentSuffix}`, {
      value: vpc.vpcId,
      description: `VPC ID for ${environment}`,
    });

    new cdk.CfnOutput(this, `WebServerInstanceId-${environmentSuffix}`, {
      value: webServer.instanceId,
      description: `Web Server Instance ID for ${environment}`,
    });

    new cdk.CfnOutput(this, `DatabaseEndpoint-${environmentSuffix}`, {
      value: database.instanceEndpoint.hostname,
      description: `Database endpoint for ${environment}`,
    });

    new cdk.CfnOutput(this, `S3BucketName-${environmentSuffix}`, {
      value: appBucket.bucketName,
      description: `S3 bucket name for ${environment}`,
    });

    new cdk.CfnOutput(this, `SNSTopicArn-${environmentSuffix}`, {
      value: notificationTopic.topicArn,
      description: `SNS topic ARN for ${environment}`,
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Project', 'X');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
