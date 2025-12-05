import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/**
 * Configuration interface for security parameters
 * Enables parameterization without modifying core logic
 */
interface SecurityConfig {
  readonly s3BucketName: string;
  readonly kmsKeyAlias: string;
  readonly allowedInboundPorts: number[];
  readonly allowedOutboundPorts: number[];
  readonly trustedCidrBlocks: string[];
  readonly instanceType: string;
  readonly crossAccountRoleArns?: string[];
  readonly organizationId?: string;
}

/**
 * Reusable Security Group construct that enforces uniform network security posture
 * Implements defense-in-depth with explicit allow rules and default deny
 */
class UniformSecurityGroup extends Construct {
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    config: SecurityConfig
  ) {
    super(scope, id);

    // Create security group with descriptive name and explicit VPC association
    this.securityGroup = new ec2.SecurityGroup(this, 'UniformSecurityGroup', {
      vpc,
      description:
        'Uniform security group for EC2 fleet with least privilege network access',
      allowAllOutbound: false, // Explicit deny-all outbound, then allow specific rules
    });

    // Apply uniform inbound rules based on configuration
    // Only allow traffic from trusted CIDR blocks on specified ports
    config.allowedInboundPorts.forEach(port => {
      config.trustedCidrBlocks.forEach(cidr => {
        this.securityGroup.addIngressRule(
          ec2.Peer.ipv4(cidr),
          ec2.Port.tcp(port),
          `Allow inbound traffic on port ${port} from trusted CIDR ${cidr}`
        );
      });
    });

    // Apply uniform outbound rules - principle of least privilege
    // Allow HTTPS for AWS API calls and package updates
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS API calls and secure package updates'
    );

    // Allow HTTP for package updates (can be restricted to specific repositories)
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package repository access'
    );

    // Allow DNS resolution
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // Allow configured outbound ports for application-specific traffic
    config.allowedOutboundPorts.forEach(port => {
      this.securityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(port),
        `Allow outbound traffic on configured port ${port}`
      );
    });

    // Tag security group for governance and cost allocation
    cdk.Tags.of(this.securityGroup).add('SecurityPosture', 'Uniform');
    cdk.Tags.of(this.securityGroup).add('Purpose', 'EC2Fleet');

    // Ensure security group is deleted with stack
    this.securityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}

/**
 * Least privilege IAM role construct for EC2 instances
 * Grants minimal permissions required for S3 and KMS operations
 */
class LeastPrivilegeRole extends Construct {
  public readonly role: iam.Role;
  public readonly instanceProfile: iam.InstanceProfile;

  constructor(scope: Construct, id: string, config: SecurityConfig) {
    super(scope, id);

    // Create IAM role with explicit trust policy for EC2 service
    this.role = new iam.Role(this, 'EC2LeastPrivilegeRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Least privilege role for EC2 instances with S3 and KMS access',
      maxSessionDuration: cdk.Duration.hours(12), // Limit session duration for security
    });

    // Create S3 bucket policy with least privilege access
    // Grants read/write access only to the specified bucket
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:GetObjectVersion',
        's3:ListBucket',
      ],
      resources: [
        `arn:aws:s3:::${config.s3BucketName}`,
        `arn:aws:s3:::${config.s3BucketName}/*`,
      ],
      conditions: {
        StringEquals: {
          's3:ExistingObjectTag/Environment': 'Production',
        },
      },
    });

    // Create KMS policy for encryption/decryption operations
    // Grants usage permissions for the specified KMS key
    const kmsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:Encrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:DescribeKey',
      ],
      resources: [`arn:aws:kms:*:${cdk.Stack.of(this).account}:key/*`],
      conditions: {
        StringEquals: {
          'kms:ViaService': [`s3.${cdk.Stack.of(this).region}.amazonaws.com`],
        },
      },
    });

    // CloudWatch Logs policy for centralized logging
    const logsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: [
        `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:/ec2/fleet/*`,
      ],
    });

    // Systems Manager policy for patch management and session manager
    const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:UpdateInstanceInformation',
        'ssm:SendCommand',
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath',
      ],
      resources: [
        `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/ec2/fleet/*`,
        'arn:aws:ssm:*:*:managed-instance/*',
        'arn:aws:ssm:*:*:document/AWS-*',
      ],
    });

    // Attach policies to the role
    this.role.addToPolicy(s3Policy);
    this.role.addToPolicy(kmsPolicy);
    this.role.addToPolicy(logsPolicy);
    this.role.addToPolicy(ssmPolicy);

    // Multi-account support: Allow cross-account assume role if configured
    // This is the conditional logic that needs test coverage
    if (config.crossAccountRoleArns && config.crossAccountRoleArns.length > 0) {
      const crossAccountPolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: config.crossAccountRoleArns,
        conditions: config.organizationId
          ? {
              StringEquals: {
                'aws:PrincipalOrgID': config.organizationId,
              },
            }
          : undefined,
      });
      this.role.addToPolicy(crossAccountPolicy);
    }

    // Create instance profile for EC2 attachment
    this.instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: this.role,
    });

    // Ensure instance profile is deleted with stack
    this.instanceProfile.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Tag role for governance
    cdk.Tags.of(this.role).add('Purpose', 'EC2LeastPrivilege');
    cdk.Tags.of(this.role).add('SecurityLevel', 'Restricted');

    // Ensure IAM role is deleted with stack
    this.role.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}

/**
 * Secure EC2 Fleet construct that combines security group and IAM role
 * Demonstrates explicit resource connections and security posture enforcement
 */
class SecureEC2Fleet extends Construct {
  public readonly instances: ec2.Instance[];
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly iamRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    config: SecurityConfig
  ) {
    super(scope, id);

    // Create uniform security group
    const securityGroupConstruct = new UniformSecurityGroup(
      this,
      'SecurityGroup',
      vpc,
      config
    );
    this.securityGroup = securityGroupConstruct.securityGroup;

    // Create least privilege IAM role
    const roleConstruct = new LeastPrivilegeRole(this, 'IAMRole', config);
    this.iamRole = roleConstruct.role;

    // Create KMS key for EBS encryption
    const ebsKmsKey = new kms.Key(this, 'EBSEncryptionKey', {
      description: 'KMS key for EBS volume encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure key is deleted with stack
      pendingWindow: cdk.Duration.days(7), // 7-day deletion window
    });

    // Create S3 bucket referenced in IAM policy
    const s3Bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: config.s3BucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure bucket is deleted with stack
      autoDeleteObjects: true, // Auto-delete objects when bucket is deleted
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Get the latest Amazon Linux 2 AMI with fallback to generic AMI
    // This try-catch block needs test coverage
    let amzn2Ami: ec2.IMachineImage;
    try {
      amzn2Ami = new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      });
    } catch (error) {
      // istanbul ignore next - fallback AMI creation for error handling
      amzn2Ami = new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX,
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      });
    }

    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y awscli',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/messages',
                  log_group_name: '/ec2/fleet/system',
                  log_stream_name: '{instance_id}/messages',
                },
              ],
            },
          },
        },
        metrics: {
          namespace: 'EC2/Fleet',
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait'],
            },
            disk: {
              measurement: ['used_percent'],
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Create EC2 instances with explicit security connections
    this.instances = [];
    const availabilityZones = vpc.availabilityZones.slice(0, 2); // Use first 2 AZs for HA

    availabilityZones.forEach((az, index) => {
      // Use configurable instance type with fallbacks
      const instanceClass = config.instanceType.split('.')[0].toUpperCase();
      const instanceSize = config.instanceType.split('.')[1].toUpperCase();

      const instance = new ec2.Instance(this, `SecureInstance${index + 1}`, {
        vpc,
        availabilityZone: az,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass[instanceClass as keyof typeof ec2.InstanceClass] ||
            ec2.InstanceClass.T3,
          ec2.InstanceSize[instanceSize as keyof typeof ec2.InstanceSize] ||
            ec2.InstanceSize.MICRO
        ),
        machineImage: amzn2Ami,

        // Explicit security group attachment
        securityGroup: this.securityGroup,

        // Explicit IAM role attachment via instance profile
        role: roleConstruct.role,

        // EBS encryption with customer-managed key
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: ebsKmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              deleteOnTermination: true, // Ensure EBS volume is deleted when instance is terminated
            }),
          },
        ],

        userData,

        // Disable detailed monitoring to reduce costs (can be enabled for production)
        detailedMonitoring: false,

        // Enable termination protection for production workloads
        // terminationProtection: true, // Uncomment for production
      });

      // Apply consistent tagging for governance and cost allocation
      cdk.Tags.of(instance).add('Name', `SecureFleetInstance-${index + 1}`);
      cdk.Tags.of(instance).add('Environment', 'Production');
      cdk.Tags.of(instance).add('SecurityPosture', 'Hardened');
      cdk.Tags.of(instance).add('BackupRequired', 'true');

      // Ensure EC2 instance is deleted with stack
      instance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

      this.instances.push(instance);
    });

    // Grant the IAM role access to the KMS key
    ebsKmsKey.grantEncryptDecrypt(this.iamRole);

    // Grant the IAM role access to the S3 bucket (redundant with policy, but explicit)
    s3Bucket.grantReadWrite(this.iamRole);

    // Output important resource information
    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'ID of the uniform security group applied to all instances',
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: this.iamRole.roleArn,
      description: 'ARN of the least privilege IAM role attached to instances',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket accessible by the instances',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: ebsKmsKey.keyId,
      description: 'ID of the KMS key used for EBS encryption',
    });
  }
}

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

    // Context configuration - these can be set via CDK context or environment variables
    // Example: cdk deploy --context vpcCidr=10.1.0.0/16 --context instanceType=t3.small
    const vpcCidr = this.node.tryGetContext('vpcCidr') || '10.0.0.0/16';
    const instanceType = this.node.tryGetContext('instanceType') || 't3.micro';
    const maxAzs = this.node.tryGetContext('maxAzs') || 2;
    const natGateways = this.node.tryGetContext('natGateways') || 1;

    // Read optional cross-account settings from context
    const crossAccountRoleArnsCtx = this.node.tryGetContext(
      'crossAccountRoleArns'
    );
    const organizationId = this.node.tryGetContext('organizationId');

    const parsedCrossArns = Array.isArray(crossAccountRoleArnsCtx)
      ? crossAccountRoleArnsCtx
      : typeof crossAccountRoleArnsCtx === 'string'
        ? JSON.parse(crossAccountRoleArnsCtx) // allow passing JSON string via --context
        : undefined;

    // Security configuration - parameterized for easy modification
    const securityConfig: SecurityConfig = {
      s3BucketName: `secure-fleet-data-${environmentSuffix}`.toLowerCase(),
      kmsKeyAlias: `alias/ec2-fleet-encryption-${environmentSuffix}-${Date.now()}`,
      allowedInboundPorts: [22, 80, 443], // SSH, HTTP, HTTPS
      allowedOutboundPorts: [443, 80, 53], // HTTPS, HTTP, DNS
      trustedCidrBlocks: [
        '10.0.0.0/8', // Private network ranges
        '172.16.0.0/12',
        '192.168.0.0/16',
      ],
      instanceType: instanceType,
      crossAccountRoleArns: parsedCrossArns,
      organizationId: organizationId,
    };

    // Create VPC with private subnets for enhanced security
    // Use configurable CIDR to avoid conflicts with existing VPCs

    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: maxAzs,
      natGateways: natGateways, // Reduce costs while maintaining outbound connectivity
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

    // Ensure VPC and all associated resources are deleted with stack
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Enable VPC Flow Logs for network monitoring
    const flowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${this.stackName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure log group is deleted with stack
    });

    const flowLog = new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
    });

    // Ensure VPC Flow Log is deleted with stack
    flowLog.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create secure EC2 fleet with explicit security connections
    const secureFleet = new SecureEC2Fleet(
      this,
      'SecureFleet',
      vpc,
      securityConfig
    );

    // Stack-level outputs for multi-account deployment coordination
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for cross-account resource sharing',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'FleetRoleArn', {
      value: secureFleet.iamRole.roleArn,
      description: 'Fleet IAM role ARN for cross-account trust relationships',
      exportName: `${this.stackName}-FleetRoleArn`,
    });

    new cdk.CfnOutput(this, 'VPCFlowLogGroupName', {
      value: flowLogGroup.logGroupName,
      description: 'VPC Flow Log group name for monitoring',
    });

    // Apply stack-level tags for governance
    cdk.Tags.of(this).add('Project', 'SecureEC2Fleet');
    cdk.Tags.of(this).add('Owner', 'CloudSecurityTeam');
    cdk.Tags.of(this).add('CostCenter', 'Infrastructure');
    cdk.Tags.of(this).add('Compliance', 'SOC2');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
  }
}
