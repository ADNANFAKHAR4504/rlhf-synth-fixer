```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
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
        `arn:aws:ssm:*:*:managed-instance/*`,
        `arn:aws:ssm:*:*:document/AWS-*`,
      ],
    });

    // Attach policies to the role
    this.role.addToPolicy(s3Policy);
    this.role.addToPolicy(kmsPolicy);
    this.role.addToPolicy(logsPolicy);
    this.role.addToPolicy(ssmPolicy);

    // Multi-account support: Allow cross-account assume role if configured
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

    // Tag role for governance
    cdk.Tags.of(this.role).add('Purpose', 'EC2LeastPrivilege');
    cdk.Tags.of(this.role).add('SecurityLevel', 'Restricted');
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
    });

    // Create S3 bucket referenced in IAM policy
    const s3Bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: config.s3BucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Get the latest Amazon Linux 2 AMI
    const amzn2Ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

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
      const instance = new ec2.Instance(this, `SecureInstance${index + 1}`, {
        vpc,
        availabilityZone: az,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
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
  }
}

/**
 * Main CDK Stack implementing secure, multi-account EC2 fleet
 * Demonstrates comprehensive security posture with explicit resource connections
 */
class SecureEC2FleetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Security configuration - parameterized for easy modification
    const securityConfig: SecurityConfig = {
      s3BucketName: `secure-fleet-data-${this.account}-${this.region}`,
      kmsKeyAlias: 'alias/ec2-fleet-encryption',
      allowedInboundPorts: [22, 80, 443], // SSH, HTTP, HTTPS
      allowedOutboundPorts: [443, 80, 53], // HTTPS, HTTP, DNS
      trustedCidrBlocks: [
        '10.0.0.0/8', // Private network ranges
        '172.16.0.0/12',
        '192.168.0.0/16',
      ],
      // Multi-account configuration (uncomment and configure for cross-account access)
      // crossAccountRoleArns: [
      //   'arn:aws:iam::ACCOUNT-ID:role/CrossAccountAccessRole',
      // ],
      // organizationId: 'o-xxxxxxxxxx', // Your AWS Organization ID
    };

    // Create VPC with private subnets for enhanced security
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      maxAzs: 2,
      natGateways: 1, // Reduce costs while maintaining outbound connectivity
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

    // Enable VPC Flow Logs for network monitoring
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

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

    // Apply stack-level tags for governance
    cdk.Tags.of(this).add('Project', 'SecureEC2Fleet');
    cdk.Tags.of(this).add('Owner', 'CloudSecurityTeam');
    cdk.Tags.of(this).add('CostCenter', 'Infrastructure');
    cdk.Tags.of(this).add('Compliance', 'SOC2');
  }
}

/**
 * CDK Application entry point
 * Configures deployment for multiple accounts and regions
 */
const app = new cdk.App();

// Deploy to multiple accounts/regions for multi-account strategy
const environments = [
  {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // Add additional environments for multi-account deployment
  // { account: 'PROD-ACCOUNT-ID', region: 'us-east-1' },
  // { account: 'DEV-ACCOUNT-ID', region: 'us-west-2' },
];

environments.forEach((env, index) => {
  if (env.account && env.region) {
    new SecureEC2FleetStack(app, `SecureEC2Fleet-${env.region}-${index}`, {
      env,
      description:
        'Secure EC2 fleet with uniform security posture and least privilege access',
      terminationProtection: true, // Enable for production deployments
    });
  }
});

app.synth();
```

This comprehensive CDK application provides:

## **Key Security Features:**

1. **Uniform Security Groups**: The `UniformSecurityGroup` construct applies identical, restrictive network rules across all EC2 instances with explicit deny-all outbound and selective allow rules.

2. **Least Privilege IAM**: The `LeastPrivilegeRole` construct grants minimal permissions for S3 and KMS operations with conditions and resource-specific access.

3. **Multi-Account Support**: Configured for deployment across multiple AWS accounts with cross-account role assumptions and organization-based conditions.

4. **Explicit Resource Connections**: EC2 instances are explicitly connected to security groups and IAM roles, demonstrating clear security relationships.

5. **Comprehensive Parameterization**: The `SecurityConfig` interface allows easy modification of security rules, bucket names, and access patterns without changing core logic.

## **Production-Ready Features:**

- **Encryption**: EBS volumes encrypted with customer-managed KMS keys
- **Monitoring**: CloudWatch agent configuration and VPC Flow Logs
- **Governance**: Comprehensive tagging strategy for cost allocation and compliance
- **Network Security**: Private subnets with NAT Gateway for outbound connectivity
- **Logging**: Centralized CloudWatch Logs configuration
- **Backup**: Instance tagging for automated backup policies

## **Deployment Instructions:**

1. Install dependencies: `npm install aws-cdk-lib constructs`
2. Configure AWS credentials for target accounts
3. Modify the `securityConfig` object for your specific requirements
4. Deploy: `cdk deploy --all`

The solution enforces a uniform security posture while maintaining flexibility for multi-account deployments and can be easily extended for additional security requirements.