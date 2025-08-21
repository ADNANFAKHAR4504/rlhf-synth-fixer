import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly secureStorageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecurityStackProps = {}) {
    super(scope, id, props);

    const envSuffix = props.environmentSuffix || 'dev';

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'SecurityKmsKey', {
      alias: `security-key-${envSuffix}`,
      description: `KMS key for security infrastructure - ${envSuffix}`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For non-production environments
    });

    // Create VPC with proper security configuration
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      vpcName: `secure-vpc-${envSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        VpcFlowLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Create restrictive Network ACL for private subnets
    const privateNetworkAcl = new ec2.NetworkAcl(this, 'PrivateNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `private-nacl-${envSuffix}`,
    });

    // Allow inbound HTTPS from public subnets
    privateNetworkAcl.addEntry('AllowInboundHttpsFromPublic', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/23'), // Public subnet CIDR range
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow outbound HTTPS to internet
    privateNetworkAcl.addEntry('AllowOutboundHttps', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Associate NACL with private subnets
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(this, `PrivateNaclAssoc${index}`, {
        subnet: subnet,
        networkAcl: privateNetworkAcl,
      });
    });

    // Create security groups with least privilege
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `web-sg-${envSuffix}`,
      description: 'Security group for web tier',
      allowAllOutbound: false,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS to internet'
    );

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `app-sg-${envSuffix}`,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow access from web tier'
    );

    appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS to internet'
    );

    // Create secure S3 bucket
    this.secureStorageBucket = new s3.Bucket(this, 'SecureStorageBucket', {
      bucketName: `secure-storage-${envSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create IAM role for secure access
    const secureAccessRole = new iam.Role(this, 'SecureAccessRole', {
      roleName: `secure-access-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for secure access to resources',
    });

    // Add policy for S3 bucket access
    secureAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [this.secureStorageBucket.arnForObjects('*')],
      })
    );

    secureAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [this.secureStorageBucket.bucketArn],
      })
    );

    // Add policy for KMS access
    secureAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: [this.kmsKey.keyArn],
      })
    );

    // Enable GuardDuty - Commented out if already exists in account
    // Note: GuardDuty is a regional service with one detector per region per account
    // If GuardDuty is already enabled in this region, this will fail
    // Consider using a custom resource to check first or handle this outside CDK
    /*
    const guardDutyDetector = new guardduty.CfnDetector(
      this,
      'GuardDutyDetector',
      {
        enable: true,
        dataSources: {
          s3Logs: {
            enable: true,
          },
          kubernetes: {
            auditLogs: {
              enable: true,
            },
          },
          malwareProtection: {
            scanEc2InstanceWithFindings: {
              ebsVolumes: true,
            },
          },
        },
      }
    );
    */

    // Create CloudWatch log group for VPC Flow Logs
    new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${envSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'SecureStorageBucketName', {
      value: this.secureStorageBucket.bucketName,
      description: 'Secure storage bucket name',
    });

    // GuardDuty output commented out since detector creation is disabled
    /*
    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: guardDutyDetector.ref,
      description: 'GuardDuty detector ID',
    });
    */

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', envSuffix);
    cdk.Tags.of(this).add('SecurityCompliance', 'enabled');
    cdk.Tags.of(this).add('Project', 'security-infrastructure');
  }
}
