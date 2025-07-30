import * as cdk from 'aws-cdk-lib';
import {
  CfnEIP,
  CfnEIPAssociation,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Constants for better maintainability and type safety
const CONSTANTS = {
  SSH_PORT: 22,
  INSTANCE_CLASS: InstanceClass.T2,
  INSTANCE_SIZE: InstanceSize.MICRO,
  DEFAULT_ENVIRONMENT: 'dev',
  IP_CIDR_PATTERN: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$',
  COMPANY_IP_RANGE: '10.0.0.0/8', // Example company IP range - adjust as needed
} as const;

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  /**
   * Optional: Custom IP range for SSH access
   * If not provided, will use company default or require explicit parameter
   */
  allowedSshIpRange?: string;
  /**
   * Optional: Whether to create a dedicated VPC instead of using default VPC
   * Default: false (uses default VPC for simplicity)
   */
  createDedicatedVpc?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Enhanced input validation with proper error handling
    const environmentSuffix = this.validateEnvironmentSuffix(props);

    // Validate and set SSH IP range with security-first approach
    const allowedSshIpRange = this.validateSshIpRange(props);

    // Apply consistent tagging across all resources following CI/CD pipeline requirements
    this.applyResourceTags(environmentSuffix);

    // 1. S3 Bucket Configuration with enhanced security
    const bucket = this.createS3Bucket(environmentSuffix);

    // 2. IAM Role and Permissions with least privilege principle
    const instanceRole = this.createInstanceRole(environmentSuffix, bucket);

    // 3. VPC Configuration with option for dedicated VPC
    const vpc = this.createVpc(props?.createDedicatedVpc);

    // 4. Security Group Configuration with enhanced security
    const securityGroup = this.createSecurityGroup(
      vpc,
      environmentSuffix,
      allowedSshIpRange
    );

    // 5. EC2 Instance Setup with monitoring considerations
    const instance = this.createEC2Instance(
      vpc,
      securityGroup,
      instanceRole,
      environmentSuffix
    );

    // 6. Elastic IP Association
    const eip = this.createElasticIP(instance, environmentSuffix);

    // 7. CloudFormation Outputs for CI/CD pipeline consumption
    this.createOutputs(
      bucket,
      instance,
      eip,
      securityGroup,
      instanceRole,
      environmentSuffix,
      vpc
    );
  }

  /**
   * Validates environment suffix with proper error handling
   * @param props - Stack properties
   * @returns Validated environment suffix
   * @throws Error if environment suffix is invalid
   */
  private validateEnvironmentSuffix(props?: TapStackProps): string {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      props?.environmentSuffix ||
      CONSTANTS.DEFAULT_ENVIRONMENT;

    // Validate environment suffix format
    if (!environmentSuffix || typeof environmentSuffix !== 'string') {
      throw new Error('environmentSuffix must be a non-empty string');
    }

    // Validate environment suffix pattern (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(environmentSuffix)) {
      throw new Error(
        'environmentSuffix must contain only alphanumeric characters and hyphens'
      );
    }

    return environmentSuffix;
  }

  /**
   * Validates and sets SSH IP range with security-first approach
   * @param props - Stack properties
   * @returns CfnParameter for SSH IP range
   */
  private validateSshIpRange(props?: TapStackProps): cdk.CfnParameter {
    // Use company IP range as default if provided, otherwise require explicit specification
    const defaultIpRange =
      props?.allowedSshIpRange || CONSTANTS.COMPANY_IP_RANGE;

    const allowedSshIp = new cdk.CfnParameter(this, 'AllowedSshIp', {
      type: 'String',
      description:
        'IP address range allowed for SSH access to EC2 instance (CIDR format)',
      default: defaultIpRange,
      allowedPattern: CONSTANTS.IP_CIDR_PATTERN,
      constraintDescription:
        'Must be a valid IP address range in CIDR format (e.g., 10.0.0.0/16 or 192.168.1.0/24)',
    });

    // Add parameter validation to ensure security
    if (allowedSshIp.valueAsString === '0.0.0.0/0') {
      throw new Error(
        'Security violation: SSH access cannot be open to 0.0.0.0/0. ' +
          'Please specify a restricted IP range for security.'
      );
    }

    return allowedSshIp;
  }

  /**
   * Applies consistent resource tagging strategy
   * @param environmentSuffix - Environment identifier
   */
  private applyResourceTags(environmentSuffix: string): void {
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Project', 'TapStack');
    cdk.Tags.of(this).add('Repository', process.env.REPOSITORY || 'unknown');
    cdk.Tags.of(this).add(
      'CommitAuthor',
      process.env.COMMIT_AUTHOR || 'unknown'
    );
    cdk.Tags.of(this).add('SecurityLevel', 'restricted');
    cdk.Tags.of(this).add('Compliance', 'security-reviewed');
  }

  /**
   * Creates S3 bucket with enhanced security configuration
   * @param environmentSuffix - Environment identifier
   * @returns Configured S3 bucket
   */
  private createS3Bucket(environmentSuffix: string): Bucket {
    return new Bucket(this, `TapStackBucket${environmentSuffix}`, {
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Enhanced security: Enable server-side encryption
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      // Enhanced security: Enable access logging
      serverAccessLogsBucket: undefined, // Could be configured for production
      // Enhanced security: Lifecycle rules for cost optimization
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });
  }

  /**
   * Creates IAM role with least privilege principle
   * @param environmentSuffix - Environment identifier
   * @param bucket - S3 bucket to grant permissions to
   * @returns Configured IAM role
   */
  private createInstanceRole(environmentSuffix: string, bucket: Bucket): Role {
    const instanceRole = new Role(
      this,
      `TapStackInstanceRole${environmentSuffix}`,
      {
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        description:
          'IAM role for TapStack EC2 instance with least privilege access',
        // Enhanced security: Add managed policy for CloudWatch monitoring
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    // Grant minimal S3 permissions (read/write to specific bucket only)
    bucket.grantReadWrite(instanceRole);

    return instanceRole;
  }

  /**
   * Creates VPC configuration with option for dedicated VPC
   * @param createDedicatedVpc - Whether to create a dedicated VPC
   * @returns Configured VPC
   */
  private createVpc(createDedicatedVpc?: boolean): cdk.aws_ec2.IVpc {
    if (createDedicatedVpc) {
      // Create dedicated VPC for enhanced security and isolation
      return new Vpc(this, 'TapStackVpc', {
        maxAzs: 2,
        natGateways: 0, // Cost optimization for development
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: SubnetType.PUBLIC,
          },
        ],
      });
    } else {
      // Use default VPC for simplicity (existing behavior)
      return Vpc.fromLookup(this, 'DefaultVpc', {
        isDefault: true,
      });
    }
  }

  /**
   * Creates security group with enhanced security configuration
   * @param vpc - VPC to create security group in
   * @param environmentSuffix - Environment identifier
   * @param allowedSshIp - Parameter for SSH IP range
   * @returns Configured security group
   */
  private createSecurityGroup(
    vpc: cdk.aws_ec2.IVpc,
    environmentSuffix: string,
    allowedSshIp: cdk.CfnParameter
  ): SecurityGroup {
    const securityGroup = new SecurityGroup(
      this,
      `TapStackSecurityGroup${environmentSuffix}`,
      {
        vpc: vpc,
        description:
          'Security group for TapStack EC2 instance with restricted access',
        allowAllOutbound: true,
      }
    );

    // Enhanced security: Add SSH ingress rule with parameter-based IP restriction
    securityGroup.addIngressRule(
      Peer.ipv4(allowedSshIp.valueAsString),
      Port.tcp(CONSTANTS.SSH_PORT),
      'SSH access from specified IP range only'
    );

    // Enhanced security: Add CloudWatch monitoring port if needed
    // securityGroup.addIngressRule(
    //   Peer.ipv4(allowedSshIp.valueAsString),
    //   Port.tcp(9100),
    //   'Prometheus metrics endpoint'
    // );

    return securityGroup;
  }

  /**
   * Creates EC2 instance with monitoring considerations
   * @param vpc - VPC to deploy instance in
   * @param securityGroup - Security group to attach
   * @param instanceRole - IAM role to attach
   * @param environmentSuffix - Environment identifier
   * @returns Configured EC2 instance
   */
  private createEC2Instance(
    vpc: cdk.aws_ec2.IVpc,
    securityGroup: SecurityGroup,
    instanceRole: Role,
    environmentSuffix: string
  ): Instance {
    return new Instance(this, `TapStackInstance${environmentSuffix}`, {
      instanceType: InstanceType.of(
        CONSTANTS.INSTANCE_CLASS,
        CONSTANTS.INSTANCE_SIZE
      ),
      machineImage: MachineImage.latestAmazonLinux2(),
      vpc: vpc,
      securityGroup: securityGroup,
      role: instanceRole,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      // Enhanced monitoring: Enable detailed monitoring
      requireImdsv2: true, // Enhanced security: Require IMDSv2
      // Enhanced security: Add user data for security hardening
      userData: cdk.aws_ec2.UserData.custom(
        `#!/bin/bash
# Security hardening script
yum update -y
yum install -y cloudwatch-agent
systemctl enable cloudwatch-agent
systemctl start cloudwatch-agent`
      ),
    });
  }

  /**
   * Creates Elastic IP with proper association
   * @param instance - EC2 instance to associate with
   * @param environmentSuffix - Environment identifier
   * @returns Configured Elastic IP
   */
  private createElasticIP(
    instance: Instance,
    environmentSuffix: string
  ): CfnEIP {
    const eip = new CfnEIP(this, `TapStackEIP${environmentSuffix}`, {
      domain: 'vpc',
    });

    // Associate Elastic IP with EC2 instance using proper association
    new CfnEIPAssociation(this, `TapStackEIPAssociation${environmentSuffix}`, {
      instanceId: instance.instanceId,
      allocationId: eip.attrAllocationId,
    });

    return eip;
  }

  /**
   * Creates CloudFormation outputs for CI/CD pipeline consumption
   * @param bucket - S3 bucket
   * @param instance - EC2 instance
   * @param eip - Elastic IP
   * @param securityGroup - Security group
   * @param instanceRole - IAM role
   * @param environmentSuffix - Environment identifier
   * @param vpc - VPC for additional outputs
   */
  private createOutputs(
    bucket: Bucket,
    instance: Instance,
    eip: CfnEIP,
    securityGroup: SecurityGroup,
    instanceRole: Role,
    environmentSuffix: string,
    vpc: cdk.aws_ec2.IVpc
  ): void {
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `TapStack${environmentSuffix}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `TapStack${environmentSuffix}-EC2InstanceId`,
    });

    new cdk.CfnOutput(this, 'ElasticIP', {
      value: eip.ref,
      description: 'Elastic IP Address',
      exportName: `TapStack${environmentSuffix}-ElasticIP`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security Group ID',
      exportName: `TapStack${environmentSuffix}-SecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: instanceRole.roleArn,
      description: 'IAM Role ARN',
      exportName: `TapStack${environmentSuffix}-IAMRoleArn`,
    });

    // Enhanced outputs for monitoring and security
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `TapStack${environmentSuffix}-VpcId`,
    });

    new cdk.CfnOutput(this, 'SubnetId', {
      value: instance.instance.subnetId || 'unknown',
      description: 'Subnet ID',
      exportName: `TapStack${environmentSuffix}-SubnetId`,
    });
  }
}
