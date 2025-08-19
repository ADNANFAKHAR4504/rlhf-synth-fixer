import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;

    // Apply required tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Owner', 'DevOps');

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'SecurityKmsKey', {
      description: 'KMS key for encrypting sensitive data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create VPC with private subnets
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      vpcName: `tap-${environmentSuffix}-vpc`,
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
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Enable VPC Flow Logs
    const vpcFlowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      retention: logs.RetentionDays.SIX_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create security groups with minimal permissions
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `tap-${environmentSuffix}-web-sg`,
      description: 'Security group for web servers',
      allowAllOutbound: false,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `tap-${environmentSuffix}-app-sg`,
      description: 'Security group for application servers',
      allowAllOutbound: false,
    });

    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web servers'
    );

    // Create database secret with automatic rotation
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Create S3 bucket for logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `tap-${environmentSuffix}-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Create Lambda function for security group monitoring
    const securityGroupMonitorRole = new iam.Role(
      this,
      'SecurityGroupMonitorRole',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          LoggingPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    const securityGroupMonitorFunction = new lambda.Function(
      this,
      'SecurityGroupMonitor',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        role: securityGroupMonitorRole,
        code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Security Group Change Event: {json.dumps(event)}")
    
    # Extract relevant information
    detail = event.get('detail', {})
    event_name = detail.get('eventName', 'Unknown')
    source_ip = detail.get('sourceIPAddress', 'Unknown')
    user_identity = detail.get('userIdentity', {})
    
    log_message = {
        'event_name': event_name,
        'source_ip': source_ip,
        'user_identity': user_identity,
        'timestamp': event.get('time', 'Unknown'),
        'region': event.get('awsRegion', 'Unknown')
    }
    
    logger.warning(f"SECURITY GROUP CHANGE DETECTED: {json.dumps(log_message)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Security group change logged')
    }
      `),
      }
    );

    // Create EventBridge rule for security group changes
    const securityGroupRule = new events.Rule(this, 'SecurityGroupChangeRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['ec2.amazonaws.com'],
          eventName: [
            'AuthorizeSecurityGroupIngress',
            'AuthorizeSecurityGroupEgress',
            'RevokeSecurityGroupIngress',
            'RevokeSecurityGroupEgress',
            'CreateSecurityGroup',
            'DeleteSecurityGroup',
          ],
        },
      },
    });

    securityGroupRule.addTarget(
      new targets.LambdaFunction(securityGroupMonitorFunction)
    );

    // Create IAM roles with least privilege for EC2 instances
    const webServerRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for web server instances with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        SecretManagerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [this.databaseSecret.secretArn],
            }),
          ],
        }),
      },
    });

    // Create instance profile for EC2 instances
    new iam.InstanceProfile(this, 'WebServerInstanceProfile', {
      role: webServerRole,
    });

    // Store some values in SSM Parameter Store for reference
    new ssm.StringParameter(this, 'VpcIdParameter', {
      parameterName: `/tap/${environmentSuffix}/vpc-id`,
      stringValue: this.vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
    });

    new ssm.StringParameter(this, 'SecretArnParameter', {
      parameterName: `/tap/${environmentSuffix}/secret-arn`,
      stringValue: this.databaseSecret.secretArn,
      description: 'Database secret ARN',
    });

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'ARN of the database secret',
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'ARN of the KMS encryption key',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Name of the S3 bucket for logs',
    });

    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: webSecurityGroup.securityGroupId,
      description: 'ID of the web security group',
    });
  }
}
