import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
// import * as config from 'aws-cdk-lib/aws-config';  // Temporarily disabled
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly ec2InstanceRole: iam.Role;
  public readonly applicationBucket: s3.Bucket;
  // public readonly deliveryChannel: config.CfnDeliveryChannel;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'SecurityConfiguration',
    };

    // Create KMS key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'Customer-managed KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      alias: `s3-encryption-key-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create KMS key for CloudWatch Logs with proper permissions
    const logGroupKmsKey = new kms.Key(this, 'LogGroupKmsKey', {
      description: 'KMS key for CloudWatch Logs encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant CloudWatch Logs permission to use the key
    logGroupKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/vpc/flowlogs-${environmentSuffix}`,
          },
        },
      })
    );

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryptionKey: logGroupKmsKey,
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    // Production VPC Configuration
    const productionVpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: `ProductionVPC-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'ProductionPublic',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'ProductionPrivate',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Staging VPC Configuration
    const stagingVpc = new ec2.Vpc(this, 'StagingVPC', {
      vpcName: `StagingVPC-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'StagingPublic',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'StagingPrivate',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for Production VPC
    new ec2.FlowLog(this, 'ProductionVPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(productionVpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Flow Logs for Staging VPC
    new ec2.FlowLog(this, 'StagingVPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(stagingVpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security Group for Production Environment
    const productionSecurityGroup = new ec2.SecurityGroup(
      this,
      'ProductionSecurityGroup',
      {
        vpc: productionVpc,
        description:
          'Security group for production environment with restricted access',
        allowAllOutbound: false,
      }
    );

    // Add specific IP range access (example: corporate IP range)
    productionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your authorized IP range
      ec2.Port.tcp(443),
      'HTTPS access from authorized corporate network'
    );

    productionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your authorized IP range
      ec2.Port.tcp(80),
      'HTTP access from authorized corporate network'
    );

    // Security Group for Staging Environment
    const stagingSecurityGroup = new ec2.SecurityGroup(
      this,
      'StagingSecurityGroup',
      {
        vpc: stagingVpc,
        description:
          'Security group for staging environment with restricted access',
        allowAllOutbound: false,
      }
    );

    // Add specific IP range access for staging
    stagingSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your authorized IP range
      ec2.Port.tcp(443),
      'HTTPS access from authorized network'
    );

    // Network ACLs to block outbound internet traffic for private subnets
    const productionPrivateNetworkAcl = new ec2.NetworkAcl(
      this,
      'ProductionPrivateNetworkAcl',
      {
        vpc: productionVpc,
        subnetSelection: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Deny all outbound traffic to internet (0.0.0.0/0) for private subnets
    productionPrivateNetworkAcl.addEntry('DenyAllOutbound', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.DENY,
    });

    // Allow inbound traffic from VPC CIDR
    productionPrivateNetworkAcl.addEntry('AllowInboundVPC', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    const stagingPrivateNetworkAcl = new ec2.NetworkAcl(
      this,
      'StagingPrivateNetworkAcl',
      {
        vpc: stagingVpc,
        subnetSelection: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Deny all outbound traffic to internet for staging private subnets
    stagingPrivateNetworkAcl.addEntry('DenyAllOutbound', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.DENY,
    });

    // Allow inbound traffic from VPC CIDR
    stagingPrivateNetworkAcl.addEntry('AllowInboundVPC', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4('10.1.0.0/16'),
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // IAM Role for EC2 instances with minimal permissions
    this.ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // AWS Config components temporarily disabled for simpler deployment
    // Will be enabled after core infrastructure is deployed
    /*
    // IAM Role for Config Service
    const configRole = new iam.Role(this, 'ConfigServiceRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
    });

    // Add permissions for Config Service
    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'config:Put*',
          'config:Get*',
          'config:List*',
          'config:Describe*',
          's3:GetBucketAcl',
          's3:ListBucket',
          's3:GetObject',
          's3:PutObject',
          's3:PutObjectAcl',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for reading AWS resources
    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:Describe*',
          'iam:GetRole',
          'iam:GetRolePolicy',
          'iam:ListRolePolicies',
          'iam:ListAttachedRolePolicies',
          'kms:Describe*',
          'kms:Get*',
          'kms:List*',
          'logs:Describe*',
          's3:GetBucketVersioning',
          's3:GetBucketLocation',
          's3:GetBucketPolicy',
          's3:GetBucketPolicyStatus',
          's3:GetBucketTagging',
          's3:GetBucketLogging',
          's3:GetAccelerateConfiguration',
          's3:GetBucketCORS',
          's3:GetEncryptionConfiguration',
          's3:GetBucketRequestPayment',
          's3:GetBucketWebsite',
          's3:GetLifecycleConfiguration',
          's3:GetReplicationConfiguration',
          's3:GetBucketPublicAccessBlock',
          's3:GetBucketObjectLockConfiguration',
        ],
        resources: ['*'],
      })
    );

    // S3 Bucket for Config delivery with encryption
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `aws-config-bucket-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      enforceSSL: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ConfigDeliveryRule',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Grant Config service permissions to write to the bucket
    configBucket.grantReadWrite(configRole);
    s3KmsKey.grantEncryptDecrypt(configRole);
    */

    // Additional S3 bucket for application data with encryption
    this.applicationBucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `application-data-bucket-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      enforceSSL: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // AWS Config components temporarily disabled for simpler deployment
    /*
    // Configuration Recorder
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Delivery Channel
    this.deliveryChannel = new config.CfnDeliveryChannel(
      this,
      'DeliveryChannel',
      {
        s3BucketName: configBucket.bucketName,
      }
    );
    this.deliveryChannel.addDependency(configRecorder);

    // Config Rules for compliance monitoring

    // Rule to ensure S3 buckets have SSL requests only
    const s3SslRequestsOnlyRule = new config.CfnConfigRule(
      this,
      'S3SslRequestsOnlyRule',
      {
        configRuleName: 's3-bucket-ssl-requests-only',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
        },
      }
    );
    s3SslRequestsOnlyRule.addDependency(configRecorder);

    // Rule to ensure S3 buckets have encryption enabled
    const s3EncryptionRule = new config.CfnConfigRule(
      this,
      'S3BucketServerSideEncryptionEnabledRule',
      {
        configRuleName: 's3-bucket-server-side-encryption-enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      }
    );
    s3EncryptionRule.addDependency(configRecorder);

    // Rule to ensure security groups don't allow unrestricted access
    const securityGroupRestrictedRule = new config.CfnConfigRule(
      this,
      'SecurityGroupSshRestrictedRule',
      {
        configRuleName: 'incoming-ssh-disabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'INCOMING_SSH_DISABLED',
        },
      }
    );
    securityGroupRestrictedRule.addDependency(configRecorder);

    // Rule to check VPC flow logs are enabled
    const vpcFlowLogsEnabledRule = new config.CfnConfigRule(
      this,
      'VpcFlowLogsEnabledRule',
      {
        configRuleName: 'vpc-flow-logs-enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
        },
      }
    );
    vpcFlowLogsEnabledRule.addDependency(configRecorder);
    */

    // Apply common tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs for reference
    new cdk.CfnOutput(this, 'ProductionVpcId', {
      value: productionVpc.vpcId,
      description: 'Production VPC ID',
    });

    new cdk.CfnOutput(this, 'StagingVpcId', {
      value: stagingVpc.vpcId,
      description: 'Staging VPC ID',
    });

    new cdk.CfnOutput(this, 'S3KmsKeyId', {
      value: s3KmsKey.keyId,
      description: 'S3 Encryption KMS Key ID',
    });

    // Config bucket output disabled temporarily
    // new cdk.CfnOutput(this, 'ConfigBucketName', {
    //   value: configBucket.bucketName,
    //   description: 'AWS Config Delivery S3 Bucket Name',
    // });

    new cdk.CfnOutput(this, 'ApplicationBucketName', {
      value: this.applicationBucket.bucketName,
      description: 'Application Data S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceRoleArn', {
      value: this.ec2InstanceRole.roleArn,
      description: 'EC2 Instance IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'ProductionSecurityGroupId', {
      value: productionSecurityGroup.securityGroupId,
      description: 'Production Security Group ID',
    });

    new cdk.CfnOutput(this, 'StagingSecurityGroupId', {
      value: stagingSecurityGroup.securityGroupId,
      description: 'Staging Security Group ID',
    });

    new cdk.CfnOutput(this, 'VPCFlowLogGroupName', {
      value: vpcFlowLogGroup.logGroupName,
      description: 'VPC Flow Logs CloudWatch Log Group Name',
    });

    // Config role output disabled temporarily
    // new cdk.CfnOutput(this, 'ConfigRoleArn', {
    //   value: configRole.roleArn,
    //   description: 'AWS Config Service Role ARN',
    // });
  }
}
