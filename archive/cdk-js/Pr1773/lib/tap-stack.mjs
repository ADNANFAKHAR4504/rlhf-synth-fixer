import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get environment suffix from props
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Tags for all resources
    const commonTags = {
      Environment: 'production',
      Project: 'SecurityInfra',
      Owner: 'SecurityTeam',
      Compliance: 'SOC2'
    };

    // Apply tags to stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // KMS Key for encryption (simplified)
    const encryptionKey = new kms.Key(this, 'SecurityInfraKey', {
      description: 'KMS key for Security Infrastructure encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS Key Alias
    new kms.Alias(this, 'SecurityInfraKeyAlias', {
      aliasName: `alias/security-infra-key-${environmentSuffix}`,
      targetKey: encryptionKey,
    });

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'SecurityVpc', {
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
    });

    // S3 Bucket for application data with encryption
    const dataBucket = new s3.Bucket(this, 'SecureDataBucket', {
      bucketName: `secure-data-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket for Session Manager logs
    const sessionLogsBucket = new s3.Bucket(this, 'SessionLogsBucket', {
      bucketName: `session-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudWatch Log Group for Session Manager
    const sessionLogGroup = new logs.LogGroup(this, 'SessionManagerLogGroup', {
      logGroupName: `/aws/sessionmanager/sessions-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      // Note: KMS encryption removed due to CloudWatch Logs limitations with Session Manager
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for EC2 instances with enhanced permissions
    const ec2Role = new iam.Role(this, 'EC2SecurityRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
              ],
              resources: [
                dataBucket.bucketArn,
                `${dataBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        SessionManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetEncryptionConfiguration',
              ],
              resources: [
                `${sessionLogsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [
                sessionLogGroup.logGroupArn,
                `${sessionLogGroup.logGroupArn}:*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Security Group for EC2
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );

    // EC2 Instance with encrypted volume
    const ec2Instance = new ec2.Instance(this, 'SecureInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Security Hub configuration - removed as it conflicts with existing account setup
    // Security Hub is managed at the organization level
    // Instead, we'll create a custom insight that works with existing Security Hub
    
    // Security Hub Custom Insight for EC2 security findings  
    // Note: This requires Security Hub to be already enabled in the account
    const ec2SecurityInsight = new securityhub.CfnInsight(this, 'EC2SecurityInsight', {
      filters: {
        resourceType: [
          {
            comparison: 'EQUALS',
            value: 'AwsEc2Instance',
          },
        ],
        severityLabel: [
          {
            comparison: 'EQUALS',
            value: 'HIGH',
          },
        ],
      },
      groupByAttribute: 'ResourceId',
      name: `EC2 High Severity Findings - ${environmentSuffix}`,
    });

    // Session Manager preferences document
    const sessionManagerPreferences = new ssm.CfnDocument(this, 'SessionManagerPreferences', {
      documentType: 'Session',
      name: `SSM-SessionManagerRunShell-${environmentSuffix}`,
      content: {
        schemaVersion: '1.0',
        description: 'Document to hold regional settings for Session Manager',
        sessionType: 'Standard_Stream',
        inputs: {
          s3BucketName: sessionLogsBucket.bucketName,
          s3KeyPrefix: 'session-logs/',
          s3EncryptionEnabled: true,
          cloudWatchLogGroupName: sessionLogGroup.logGroupName,
          cloudWatchEncryptionEnabled: false,
          kmsKeyId: encryptionKey.keyId,
          runAsEnabled: false,
          runAsDefaultUser: '',
          idleSessionTimeout: '20',
          maxSessionDuration: '60',
          shellProfile: {
            windows: '',
            linux: 'cd $HOME; pwd',
          },
        },
      },
      tags: [
        {
          key: 'Environment',
          value: commonTags.Environment,
        },
        {
          key: 'Project',
          value: commonTags.Project,
        },
      ],
    });

    // Session Manager configuration
    const sessionManagerConfig = new ssm.CfnDocument(this, 'SessionManagerConfig', {
      documentType: 'Session',
      name: `SSM-SessionManagerRunShell-Config-${environmentSuffix}`,
      content: {
        schemaVersion: '1.0',
        description: 'Session Manager configuration document',
        sessionType: 'Standard_Stream',
        inputs: {
          s3BucketName: sessionLogsBucket.bucketName,
          s3KeyPrefix: 'session-logs/',
          s3EncryptionEnabled: true,
          cloudWatchLogGroupName: sessionLogGroup.logGroupName,
          cloudWatchEncryptionEnabled: false,
          kmsKeyId: encryptionKey.keyId,
        },
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${this.stackName}-KMSKeyId`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 Data Bucket Name',
      exportName: `${this.stackName}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `${this.stackName}-EC2InstanceId`,
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
      exportName: `${this.stackName}-EC2RoleArn`,
    });

    new cdk.CfnOutput(this, 'SessionLogsBucketName', {
      value: sessionLogsBucket.bucketName,
      description: 'S3 Session Logs Bucket Name',
      exportName: `${this.stackName}-SessionLogsBucketName`,
    });

    new cdk.CfnOutput(this, 'SecurityInsightName', {
      value: ec2SecurityInsight.name,
      description: 'Security Hub Custom Insight Name',
      exportName: `${this.stackName}-SecurityInsightName`,
    });

    new cdk.CfnOutput(this, 'SessionLogGroupName', {
      value: sessionLogGroup.logGroupName,
      description: 'Session Manager CloudWatch Log Group Name',
      exportName: `${this.stackName}-SessionLogGroupName`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });
  }
}