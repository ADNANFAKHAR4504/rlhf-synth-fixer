import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    // Generate random suffix for unique resource naming
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    const whitelistedIngressCidr = new cdk.CfnParameter(
      this,
      'WhitelistedIngressCidr',
      {
        type: 'String',
        default: '0.0.0.0/0',
        description:
          'CIDR block for whitelisted ingress traffic (restrict in production)',
        allowedPattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$',
        constraintDescription:
          'Must be a valid CIDR notation (e.g., 10.0.0.0/8)',
      }
    );

    // =============================================================================
    // COMMON TAGS
    // =============================================================================

    /**
     * Standard tags applied to all resources for governance and cost allocation
     * These tags enable proper resource management and compliance tracking
     */
    const commonTags = {
      Environment: 'Prod',
      Department: 'Marketing',
      Project: 'SecureWebApp',
      ManagedBy: 'CDK',
      SecurityReview: 'Required',
    };

    // =============================================================================
    // VPC AND NETWORKING
    // =============================================================================

    /**
     * VPC with public and private subnets across multiple AZs
     * - Public subnets for load balancers and NAT gateways
     * - Private subnets for application servers and databases
     * - Internet Gateway for public internet access
     * - NAT Gateways for secure outbound internet access from private subnets
     */
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2, // Multi-AZ for high availability
      natGateways: 2, // One NAT gateway per AZ for redundancy
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

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Name', 'SecureWebApp-VPC');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // =============================================================================
    // SECURITY GROUPS
    // =============================================================================

    /**
     * Security Group for Web Application EC2 instances
     * Implements principle of least privilege with explicit rules:
     * - Ingress: Only HTTP(80) and HTTPS(443) from whitelisted IPs
     * - Egress: Only HTTP(80) and HTTPS(443) to internet for updates/API calls
     *
     * Security Rationale:
     * - Restricts inbound access to web traffic only
     * - Limits outbound access to prevent data exfiltration
     * - Uses parameterized source CIDR for flexibility with security
     */
    const webAppSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebAppSecurityGroup',
      {
        vpc: vpc,
        description:
          'Security group for web application servers - least privilege access',
        allowAllOutbound: false, // Explicit egress rules only
      }
    );

    // Ingress Rules - Only allow HTTP and HTTPS from whitelisted IPs
    webAppSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(whitelistedIngressCidr.valueAsString),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from whitelisted IPs'
    );

    webAppSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(whitelistedIngressCidr.valueAsString),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from whitelisted IPs'
    );

    // Egress Rules - Only allow outbound HTTP and HTTPS to internet
    webAppSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP for package updates and API calls'
    );

    webAppSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS for secure API calls and updates'
    );

    // Apply tags to Security Group
    cdk.Tags.of(webAppSecurityGroup).add('Name', 'WebApp-SecurityGroup');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(webAppSecurityGroup).add(key, value);
    });

    // =============================================================================
    // S3 BUCKETS
    // =============================================================================

    /**
     * S3 bucket for storing access logs from the main application bucket
     * Security features:
     * - Separate bucket for log isolation
     * - Server-side encryption
     * - Lifecycle policy for log retention management
     */
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `secure-webapp-access-logs-${this.account}-${this.region}-${environmentSuffix}-${randomSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'AccessLogsRetention',
          enabled: true,
          expiration: cdk.Duration.days(90), // Retain access logs for 90 days
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Apply tags to access logs bucket
    cdk.Tags.of(accessLogsBucket).add('Name', 'SecureWebApp-AccessLogsBucket');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(accessLogsBucket).add(key, value);
    });

    /**
     * Main application S3 bucket for storing application data
     * Security features:
     * - Server-side encryption with S3 managed keys
     * - Versioning enabled for data protection
     * - Public access blocked by default
     * - Access logging enabled to separate bucket
     */
    const appDataBucket = new s3.Bucket(this, 'AppDataBucket', {
      bucketName: `secure-webapp-data-${this.account}-${this.region}-${environmentSuffix}-${randomSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect against accidental deletion
      enforceSSL: true, // Require HTTPS for all requests
      serverAccessLogsBucket: accessLogsBucket, // Enable access logging
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Apply tags to main bucket
    cdk.Tags.of(appDataBucket).add('Name', 'SecureWebApp-DataBucket');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(appDataBucket).add(key, value);
    });

    // =============================================================================
    // CLOUDWATCH LOGS
    // =============================================================================

    /**
     * CloudWatch Log Group for VPC Flow Logs
     * Captures all network traffic for security monitoring and compliance
     * Retention set to 30 days for cost optimization while maintaining security visibility
     */
    const vpcFlowLogsGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs${environmentSuffix}/${randomSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Apply tags to log group
    cdk.Tags.of(vpcFlowLogsGroup).add('Name', 'VPC-FlowLogs');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpcFlowLogsGroup).add(key, value);
    });

    /**
     * CloudWatch Log Group for application logs
     * Centralized logging for application events and errors
     */
    const appLogsGroup = new logs.LogGroup(this, 'AppLogsGroup', {
      logGroupName: `/aws/ec2/webapp/${environmentSuffix}/${randomSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Apply tags to application log group
    cdk.Tags.of(appLogsGroup).add('Name', 'WebApp-ApplicationLogs');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(appLogsGroup).add(key, value);
    });

    // =============================================================================
    // VPC FLOW LOGS
    // =============================================================================

    /**
     * IAM Role for VPC Flow Logs to write to CloudWatch Logs
     * Follows least privilege principle with only necessary permissions
     */
    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'Role for VPC Flow Logs to write to CloudWatch Logs',
      inlinePolicies: {
        FlowLogsDeliveryPolicy: new iam.PolicyDocument({
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
              resources: [
                vpcFlowLogsGroup.logGroupArn,
                `${vpcFlowLogsGroup.logGroupArn}:*`,
              ],
            }),
          ],
        }),
      },
    });

    // Apply tags to Flow Logs role
    cdk.Tags.of(flowLogsRole).add('Name', 'VPC-FlowLogsRole');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(flowLogsRole).add(key, value);
    });

    /**
     * VPC Flow Logs configuration
     * Captures ALL traffic (accepted, rejected, and all) for comprehensive monitoring
     * Logs are sent to CloudWatch Logs for analysis and alerting
     */
    new ec2.FlowLog(this, 'VpcFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogsGroup,
        flowLogsRole
      ),
    });

    // =============================================================================
    // IAM ROLE FOR EC2 INSTANCES
    // =============================================================================

    /**
     * IAM Role for EC2 instances running the web application
     * Implements least privilege access with specific permissions only
     *
     * Permissions granted:
     * - Read access to specific S3 bucket for application data
     * - Write access to CloudWatch Logs for application logging
     * - No wildcard permissions to maintain security
     */
    const webAppRole = new iam.Role(this, 'WebAppEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for web application EC2 instances with least privilege access',
      inlinePolicies: {
        WebAppPolicy: new iam.PolicyDocument({
          statements: [
            // S3 permissions - Read access to specific application data bucket only
            new iam.PolicyStatement({
              sid: 'S3ReadAccess',
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
              resources: [
                appDataBucket.bucketArn,
                `${appDataBucket.bucketArn}/*`,
              ],
            }),
            // CloudWatch Logs permissions - Write access to specific log group only
            new iam.PolicyStatement({
              sid: 'CloudWatchLogsAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [
                appLogsGroup.logGroupArn,
                `${appLogsGroup.logGroupArn}:*`,
              ],
            }),
            // CloudWatch metrics permissions - For application monitoring
            new iam.PolicyStatement({
              sid: 'CloudWatchMetricsAccess',
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:PutMetricData'],
              resources: ['*'], // CloudWatch metrics don't support resource-level permissions
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'WebApp/Custom',
                },
              },
            }),
          ],
        }),
      },
    });

    // Apply tags to EC2 role
    cdk.Tags.of(webAppRole).add('Name', 'WebApp-EC2Role');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(webAppRole).add(key, value);
    });

    /**
     * Instance Profile for the EC2 role
     * Required to attach IAM role to EC2 instances
     */
    new iam.InstanceProfile(this, 'WebAppInstanceProfile', {
      role: webAppRole,
    });

    // =============================================================================
    // CLOUDTRAIL LOGGING
    // =============================================================================

    /**
     * S3 bucket for CloudTrail logs
     * Stores API audit logs for compliance and security monitoring
     * Separate bucket for log isolation and access control
     */
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `secure-webapp-cloudtrail-${this.account}-${this.region}-${environmentSuffix}-${randomSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogsRetention',
          enabled: true,
          expiration: cdk.Duration.days(365), // Retain CloudTrail logs for 1 year
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
    });

    // Apply tags to CloudTrail bucket
    cdk.Tags.of(cloudTrailBucket).add('Name', 'SecureWebApp-CloudTrailBucket');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(cloudTrailBucket).add(key, value);
    });

    /**
     * CloudTrail for API audit logging
     * Captures all management events for security monitoring and compliance
     * Logs are encrypted and stored in dedicated S3 bucket
     */
    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true, // Enable log file integrity validation
      sendToCloudWatchLogs: false, // Store in S3 only to reduce costs
    });

    // Apply tags to CloudTrail
    cdk.Tags.of(trail).add('Name', 'SecureWebApp-CloudTrail');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(trail).add(key, value);
    });

    // =============================================================================
    // SAMPLE EC2 INSTANCE
    // =============================================================================

    /**
     * Sample EC2 instance for the web application
     * Configured with security best practices:
     * - Deployed in private subnet for security
     * - Uses security group with restrictive rules
     * - Attached to least privilege IAM role
     * - Latest Amazon Linux 2 AMI for security updates
     */
    const webAppInstance = new ec2.Instance(this, 'WebAppInstance', {
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Deploy in private subnet
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webAppSecurityGroup,
      role: webAppRole,
      userData: ec2.UserData.forLinux(),
      keyName: undefined, // No SSH key for enhanced security - use Systems Manager Session Manager instead
    });

    // Apply tags to EC2 instance
    cdk.Tags.of(webAppInstance).add('Name', 'SecureWebApp-Instance');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(webAppInstance).add(key, value);
    });

    // =============================================================================
    // OUTPUTS
    // =============================================================================

    /**
     * Stack outputs for reference and integration
     * Provides key resource identifiers for other stacks or external systems
     */
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'AppDataBucketName', {
      value: appDataBucket.bucketName,
      description: 'S3 bucket name for application data',
      exportName: `${this.stackName}-AppDataBucket`,
    });

    new cdk.CfnOutput(this, 'WebAppSecurityGroupId', {
      value: webAppSecurityGroup.securityGroupId,
      description: 'Security Group ID for web application instances',
      exportName: `${this.stackName}-WebAppSecurityGroup`,
    });

    new cdk.CfnOutput(this, 'WebAppRoleArn', {
      value: webAppRole.roleArn,
      description: 'IAM Role ARN for web application EC2 instances',
      exportName: `${this.stackName}-WebAppRole`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN for audit logging',
      exportName: `${this.stackName}-CloudTrail`,
    });
  }
}
