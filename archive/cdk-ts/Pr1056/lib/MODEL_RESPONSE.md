# Security Configuration Infrastructure - CDK TypeScript Implementation

Based on your requirements, I'll create a comprehensive security configuration infrastructure using AWS CDK TypeScript. This implementation includes two VPCs with proper networking, IAM roles, encrypted S3 buckets, security controls, and compliance monitoring.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
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
      Project: 'SecurityConfiguration'
    };

    // Create KMS key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'Customer-managed KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      alias: `s3-encryption-key-${environmentSuffix}`
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryption: logs.LogGroupEncryption.KMS,
      kmsKey: new kms.Key(this, 'LogGroupKmsKey', {
        description: 'KMS key for CloudWatch Logs encryption',
        enableKeyRotation: true
      })
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy')
      ]
    });

    // Production VPC Configuration
    const productionVpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: 'ProductionVPC',
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
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // Staging VPC Configuration
    const stagingVpc = new ec2.Vpc(this, 'StagingVPC', {
      vpcName: 'StagingVPC',
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
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // VPC Flow Logs for Production VPC
    new ec2.FlowLog(this, 'ProductionVPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(productionVpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL
    });

    // VPC Flow Logs for Staging VPC
    new ec2.FlowLog(this, 'StagingVPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(stagingVpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL
    });

    // Security Group for Production Environment
    const productionSecurityGroup = new ec2.SecurityGroup(this, 'ProductionSecurityGroup', {
      vpc: productionVpc,
      description: 'Security group for production environment with restricted access',
      allowAllOutbound: false
    });

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
    const stagingSecurityGroup = new ec2.SecurityGroup(this, 'StagingSecurityGroup', {
      vpc: stagingVpc,
      description: 'Security group for staging environment with restricted access',
      allowAllOutbound: false
    });

    // Add specific IP range access for staging
    stagingSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your authorized IP range
      ec2.Port.tcp(443),
      'HTTPS access from authorized network'
    );

    // Network ACLs to block outbound internet traffic for private subnets
    const productionPrivateNetworkAcl = new ec2.NetworkAcl(this, 'ProductionPrivateNetworkAcl', {
      vpc: productionVpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    // Deny all outbound traffic to internet (0.0.0.0/0) for private subnets
    productionPrivateNetworkAcl.addEntry('DenyAllOutbound', {
      ruleNumber: 100,
      protocol: ec2.AclProtocol.ALL,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.OUTBOUND,
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleAction: ec2.Action.DENY
    });

    // Allow inbound traffic from VPC CIDR
    productionPrivateNetworkAcl.addEntry('AllowInboundVPC', {
      ruleNumber: 100,
      protocol: ec2.AclProtocol.ALL,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INBOUND,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
      ruleAction: ec2.Action.ALLOW
    });

    const stagingPrivateNetworkAcl = new ec2.NetworkAcl(this, 'StagingPrivateNetworkAcl', {
      vpc: stagingVpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    // Deny all outbound traffic to internet for staging private subnets
    stagingPrivateNetworkAcl.addEntry('DenyAllOutbound', {
      ruleNumber: 100,
      protocol: ec2.AclProtocol.ALL,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.OUTBOUND,
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleAction: ec2.Action.DENY
    });

    // Allow inbound traffic from VPC CIDR
    stagingPrivateNetworkAcl.addEntry('AllowInboundVPC', {
      ruleNumber: 100,
      protocol: ec2.AclProtocol.ALL,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INBOUND,
      cidr: ec2.AclCidr.ipv4('10.1.0.0/16'),
      ruleAction: ec2.Action.ALLOW
    });

    // IAM Role for EC2 instances with minimal permissions
    const ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
      ]
    });

    // IAM Role for Config Service
    const configRole = new iam.Role(this, 'ConfigServiceRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole')
      ]
    });

    // S3 Bucket for Config delivery with encryption
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `aws-config-bucket-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      enforceSSL: true,
      versioned: true,
      publicReadAccess: false,
      publicWriteAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'ConfigDeliveryRule',
        enabled: true,
        expiration: cdk.Duration.days(90)
      }]
    });

    // Additional S3 bucket for application data with encryption
    const applicationBucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `application-data-bucket-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      enforceSSL: true,
      versioned: true,
      publicReadAccess: false,
      publicWriteAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // Configuration Recorder
    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true
      }
    });

    // Delivery Channel
    const deliveryChannel = new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      s3BucketName: configBucket.bucketName
    });

    // Config Rules for compliance monitoring

    // Rule to ensure S3 buckets have SSL requests only
    const s3SslRequestsOnlyRule = new config.CfnConfigRule(this, 'S3SslRequestsOnlyRule', {
      configRuleName: 's3-bucket-ssl-requests-only',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY'
      }
    });
    s3SslRequestsOnlyRule.addDependency(configRecorder);

    // Rule to ensure S3 buckets have encryption enabled
    const s3EncryptionRule = new config.CfnConfigRule(this, 'S3BucketServerSideEncryptionEnabledRule', {
      configRuleName: 's3-bucket-server-side-encryption-enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      }
    });
    s3EncryptionRule.addDependency(configRecorder);

    // Rule to ensure security groups don't allow unrestricted access
    const securityGroupRestrictedRule = new config.CfnConfigRule(this, 'SecurityGroupSshRestrictedRule', {
      configRuleName: 'incoming-ssh-disabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'INCOMING_SSH_DISABLED'
      }
    });
    securityGroupRestrictedRule.addDependency(configRecorder);

    // Rule to check VPC flow logs are enabled
    const vpcFlowLogsEnabledRule = new config.CfnConfigRule(this, 'VpcFlowLogsEnabledRule', {
      configRuleName: 'vpc-flow-logs-enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'VPC_FLOW_LOGS_ENABLED'
      }
    });
    vpcFlowLogsEnabledRule.addDependency(configRecorder);

    // Apply common tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs for reference
    new cdk.CfnOutput(this, 'ProductionVpcId', {
      value: productionVpc.vpcId,
      description: 'Production VPC ID'
    });

    new cdk.CfnOutput(this, 'StagingVpcId', {
      value: stagingVpc.vpcId,
      description: 'Staging VPC ID'
    });

    new cdk.CfnOutput(this, 'S3KmsKeyId', {
      value: s3KmsKey.keyId,
      description: 'S3 Encryption KMS Key ID'
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'AWS Config Delivery S3 Bucket Name'
    });
  }
}
```