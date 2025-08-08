# AWS CDK TypeScript Infrastructure Solution

Based on your requirements, here's a complete CDK solution with modular constructs for a secure AWS infrastructure:

## lib/constructs/secure-networking.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
import { Construct } from 'constructs';

export interface SecureNetworkingProps {
  readonly cidr?: string;
  readonly maxAzs?: number;
}

export class SecureNetworking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly webServerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecureNetworkingProps = {}) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      maxAzs: props.maxAzs || 2,
      cidr: props.cidr || '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-with-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security group for web server
    this.webServerSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web server',
      allowAllOutbound: true,
    });

    // Allow SSH access from specific IP (replace with your IP)
    this.webServerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your IP address
      ec2.Port.tcp(22),
      'SSH access from authorized IP'
    );

    // Allow HTTP traffic
    this.webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Allow HTTPS traffic
    this.webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );

    // Network Firewall for enhanced security
    const firewallPolicy = new networkfirewall.CfnFirewallPolicy(this, 'FirewallPolicy', {
      firewallPolicyName: 'production-firewall-policy',
      firewallPolicy: {
        statelessDefaultActions: ['aws:pass'],
        statelessFragmentDefaultActions: ['aws:pass'],
        statefulRuleGroupReferences: []
      }
    });

    new networkfirewall.CfnFirewall(this, 'NetworkFirewall', {
      firewallName: 'production-network-firewall',
      firewallPolicyArn: firewallPolicy.attrFirewallPolicyArn,
      vpcId: this.vpc.vpcId,
      subnetMappings: this.vpc.publicSubnets.map(subnet => ({
        subnetId: subnet.subnetId
      }))
    });

    // Apply tags
    cdk.Tags.of(this.vpc).add('Environment', 'Production');
    cdk.Tags.of(this.webServerSecurityGroup).add('Environment', 'Production');
  }
}
```

## lib/constructs/secure-storage.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecureStorageProps {
  readonly bucketName?: string;
  readonly enableVersioning?: boolean;
}

export class SecureStorage extends Construct {
  public readonly logBucket: s3.Bucket;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecureStorageProps = {}) {
    super(scope, id);

    // Create KMS key for S3 encryption
    this.encryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
    });

    // Create S3 bucket for logging with encryption
    this.logBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: props.bucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      versioned: props.enableVersioning ?? true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        }
      ],
    });

    // Apply tags
    cdk.Tags.of(this.logBucket).add('Environment', 'Production');
    cdk.Tags.of(this.encryptionKey).add('Environment', 'Production');
  }
}
```

## lib/constructs/web-server.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface WebServerProps {
  readonly vpc: ec2.Vpc;
  readonly securityGroup: ec2.SecurityGroup;
  readonly logBucket: s3.Bucket;
  readonly instanceType?: ec2.InstanceType;
  readonly keyName?: string;
}

export class WebServer extends Construct {
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: WebServerProps) {
    super(scope, id);

    // Create IAM role for EC2 instance
    const instanceRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Grant write access to log bucket
    props.logBucket.grantWrite(instanceRole);

    // User data script to install web server and CloudWatch agent
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Production Web Server</h1>" > /var/www/html/index.html',
      
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      
      // Configure log forwarding to S3
      `aws logs create-log-group --log-group-name /aws/ec2/webserver --region us-west-2`,
      `aws s3 sync /var/log/httpd/ s3://${props.logBucket.bucketName}/httpd-logs/`
    );

    // Create EC2 instance
    this.instance = new ec2.Instance(this, 'WebServerInstance', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: props.securityGroup,
      instanceType: props.instanceType || ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData: userData,
      role: instanceRole,
      keyName: props.keyName,
    });

    // Apply tags
    cdk.Tags.of(this.instance).add('Environment', 'Production');
    cdk.Tags.of(instanceRole).add('Environment', 'Production');
  }
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureNetworking } from './constructs/secure-networking';
import { SecureStorage } from './constructs/secure-storage';
import { WebServer } from './constructs/web-server';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create secure networking infrastructure
    const networking = new SecureNetworking(this, 'SecureNetworking', {
      maxAzs: 2,
    });

    // Create secure storage
    const storage = new SecureStorage(this, 'SecureStorage', {
      bucketName: `production-logs-${environmentSuffix}-${this.account}`,
      enableVersioning: true,
    });

    // Create web server
    new WebServer(this, 'WebServer', {
      vpc: networking.vpc,
      securityGroup: networking.webServerSecurityGroup,
      logBucket: storage.logBucket,
    });

    // Apply stack-level tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebInfrastructure');

    // Output important information
    new cdk.CfnOutput(this, 'VPCId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: storage.logBucket.bucketName,
      description: 'S3 Log Bucket Name',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: storage.encryptionKey.keyId,
      description: 'KMS Key ID for S3 encryption',
    });
  }
}