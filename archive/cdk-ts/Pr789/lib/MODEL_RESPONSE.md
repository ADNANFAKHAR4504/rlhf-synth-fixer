# Secure VPC Infrastructure with AWS CDK TypeScript

I'll create a secure VPC infrastructure with modern security best practices using AWS CDK TypeScript. Here's the complete solution organized into separate files:

## lib/vpc-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with 3 AZs, public and private subnets
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
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
        }
      ],
      natGateways: 1, // One NAT Gateway for cost optimization
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Block Public Access for enhanced security
    const blockPublicAccess = new ec2.CfnVPCBlockPublicAccessOptions(this, 'VpcBlockPublicAccess', {
      internetGatewayBlockMode: 'bidirectional',
      restrictPublicBuckets: true,
    });

    // Add Network ACLs for additional security
    const publicNetworkAcl = new ec2.NetworkAcl(this, 'PublicNetworkAcl', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Allow HTTP inbound traffic
    publicNetworkAcl.addEntry('AllowHttpInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow SSH inbound traffic
    publicNetworkAcl.addEntry('AllowSshInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow HTTPS inbound traffic
    publicNetworkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow ephemeral ports for return traffic
    publicNetworkAcl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow all outbound traffic
    publicNetworkAcl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Private Network ACL
    const privateNetworkAcl = new ec2.NetworkAcl(this, 'PrivateNetworkAcl', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Allow inbound traffic from VPC CIDR
    privateNetworkAcl.addEntry('AllowVpcInbound', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow ephemeral ports for return traffic
    privateNetworkAcl.addEntry('AllowEphemeralInboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow all outbound traffic
    privateNetworkAcl.addEntry('AllowAllOutboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
```

## lib/security-group-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityGroupStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class SecurityGroupStack extends cdk.Stack {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly sshSecurityGroup: ec2.SecurityGroup;
  
  constructor(scope: Construct, id: string, props: SecurityGroupStackProps) {
    super(scope, id, props);

    // Security Group for Web servers (HTTP traffic)
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers allowing HTTP traffic',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for SSH access
    this.sshSecurityGroup = new ec2.SecurityGroup(this, 'SshSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for SSH access',
      allowAllOutbound: true,
    });

    // Allow SSH traffic from anywhere (in production, restrict to specific IPs)
    this.sshSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH traffic'
    );

    // Security Group for internal communication
    const internalSecurityGroup = new ec2.SecurityGroup(this, 'InternalSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for internal VPC communication',
      allowAllOutbound: true,
    });

    // Allow all traffic from VPC CIDR
    internalSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.allTraffic(),
      'Allow internal VPC traffic'
    );

    // Security Group VPC Association for centralized management
    const securityGroupVpcAssociation = new ec2.CfnSecurityGroupVPCAssociation(
      this,
      'SecurityGroupVpcAssociation',
      {
        groupId: this.webSecurityGroup.securityGroupId,
        vpcId: props.vpc.vpcId,
      }
    );

    // Output Security Group IDs
    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: this.webSecurityGroup.securityGroupId,
      description: 'Web Security Group ID',
    });

    new cdk.CfnOutput(this, 'SshSecurityGroupId', {
      value: this.sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
    });
  }
}
```

## lib/s3-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create KMS key for S3 encryption
    const s3Key = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
    });

    // Create S3 bucket with encryption and security best practices
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `secure-vpc-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3Key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add bucket notification configurations for security monitoring
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      // You can add SNS topic or Lambda function here for monitoring
    );

    // Output bucket information
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'S3 Bucket ARN',
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: s3Key.keyId,
      description: 'KMS Key ID used for S3 encryption',
    });
  }
}
```

## lib/tap-stack.ts (Updated main stack)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityGroupStack } from './security-group-stack';
import { S3Stack } from './s3-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC Stack
    const vpcStack = new VpcStack(this, `VpcStack-${environmentSuffix}`, {
      env: props?.env,
    });

    // Create Security Group Stack
    const securityGroupStack = new SecurityGroupStack(this, `SecurityGroupStack-${environmentSuffix}`, {
      vpc: vpcStack.vpc,
      env: props?.env,
    });

    // Create S3 Stack
    const s3Stack = new S3Stack(this, `S3Stack-${environmentSuffix}`, {
      env: props?.env,
    });

    // Add dependencies
    securityGroupStack.addDependency(vpcStack);
    s3Stack.addDependency(vpcStack);

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'SecureVpcInfrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

This solution provides:

1. **VPC with proper segmentation**: 3 public and 3 private subnets across 3 AZs
2. **Modern security features**: VPC Block Public Access and Security Group VPC Associations
3. **Network security**: Comprehensive NACLs and Security Groups
4. **Encrypted storage**: S3 bucket with KMS encryption and security best practices
5. **Cost optimization**: Single NAT Gateway with proper routing
6. **Monitoring and compliance**: Proper tagging and lifecycle policies
7. **Security best practices**: Block public access, enforce SSL, enable key rotation

The infrastructure follows AWS security best practices and includes the latest features for enhanced security and centralized management.