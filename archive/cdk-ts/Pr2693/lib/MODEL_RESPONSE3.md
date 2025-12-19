The PostgreSQL version format is incorrect. Let me fix that issue:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

/**
 * Production-ready multi-region AWS infrastructure with HA and security best practices
 *
 * Deployment Instructions:
 * 1. Bootstrap both regions:
 *    cdk bootstrap aws://ACCOUNT/us-east-1
 *    cdk bootstrap aws://ACCOUNT/us-west-2
 *
 * 2. Deploy to primary region (us-east-1):
 *    cdk deploy ProdInfrastructureStack-us-east-1 --context region=us-east-1
 *
 * 3. Deploy to secondary region (us-west-2):
 *    cdk deploy ProdInfrastructureStack-us-west-2 --context region=us-west-2
 *
 * 4. Or deploy all stacks:
 *    cdk deploy --all
 */

interface InfrastructureStackProps extends cdk.StackProps {
  readonly appName: string;
  readonly environment: string;
  readonly owner: string;
  readonly instanceType: string;
  readonly allowedCidrs: string[];
  readonly dbEngineVersion: rds.PostgresEngineVersion;
  readonly targetRegion: string;
}

class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const {
      appName,
      environment,
      owner,
      instanceType,
      allowedCidrs,
      dbEngineVersion,
      targetRegion,
    } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: environment,
      Application: appName,
      Region: targetRegion,
      Owner: owner,
      ManagedBy: 'CDK',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Application', appName);
    cdk.Tags.of(this).add('Region', targetRegion);
    cdk.Tags.of(this).add('Owner', owner);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // =============================================================================
    // VPC AND NETWORKING
    // =============================================================================

    // Create VPC with 10.0.0.0/16 CIDR
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${environment}-${appName}-${targetRegion}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use exactly 2 AZs for cost efficiency and HA

      // Define subnet configuration
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

      // Create NAT gateways in public subnets for private subnet internet access
      natGateways: 2, // One per AZ for HA, but cost-efficient

      // Enable DNS hostnames and resolution for proper VPC endpoint functionality
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // =============================================================================
    // VPC ENDPOINTS FOR COST OPTIMIZATION
    // =============================================================================

    // Create S3 Gateway VPC Endpoint to reduce NAT gateway costs
    // Gateway endpoints are free and route S3 traffic directly without internet
    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,

      // Associate with private subnet route tables only
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // Add policy to S3 endpoint using addToPolicy method
    s3Endpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
          's3:GetBucketLocation',
        ],
        resources: ['*'], // Can be restricted to specific buckets in production
        conditions: {
          StringEquals: {
            'aws:PrincipalServiceName': ['ec2.amazonaws.com'],
          },
        },
      })
    );

    // Name the S3 endpoint
    cdk.Tags.of(s3Endpoint).add(
      'Name',
      `${environment}-${appName}-${targetRegion}-s3-endpoint`
    );

    // =============================================================================
    // SECURITY GROUPS
    // =============================================================================

    // EC2 Security Group - restrictive inbound, necessary outbound
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: `${environment}-${appName}-${targetRegion}-ec2-sg`,
      description: 'Security group for EC2 instances in public subnets',
      allowAllOutbound: false, // Explicit outbound rules for security
    });

    // Allow inbound traffic on specified ports from trusted CIDRs
    allowedCidrs.forEach((cidr, index) => {
      // SSH access
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(22),
        `SSH access from trusted CIDR ${index + 1}`
      );

      // HTTP access
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(80),
        `HTTP access from trusted CIDR ${index + 1}`
      );

      // HTTPS access
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `HTTPS access from trusted CIDR ${index + 1}`
      );
    });

    // Explicit outbound rules for EC2
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound for package updates'
    );
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for package updates and AWS API calls'
    );
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      'PostgreSQL outbound to RDS'
    );

    // RDS Security Group - only allow access from EC2 security group
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      securityGroupName: `${environment}-${appName}-${targetRegion}-rds-sg`,
      description: 'Security group for RDS PostgreSQL - private access only',
      allowAllOutbound: false, // No outbound needed for RDS
    });

    // Allow PostgreSQL access only from EC2 security group
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from EC2 instances'
    );

    // =============================================================================
    // IAM ROLES AND POLICIES
    // =============================================================================

    // Least-privilege IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${environment}-${appName}-${targetRegion}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Least-privilege role for EC2 instances',

      // Minimal managed policies
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager
      ],

      // Custom inline policy for specific S3 and SSM access
      inlinePolicies: {
        EC2CustomPolicy: new iam.PolicyDocument({
          statements: [
            // Allow reading DB credentials from SSM Parameter Store
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${targetRegion}:${this.account}:parameter/${environment}/${appName}/db/*`,
              ],
            }),
            // Allow reading secrets from Secrets Manager
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [
                `arn:aws:secretsmanager:${targetRegion}:${this.account}:secret:${environment}/${appName}/${targetRegion}/db/credentials*`,
              ],
            }),
            // Allow CloudWatch logs for monitoring
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${targetRegion}:${this.account}:log-group:/aws/ec2/*`,
              ],
            }),
          ],
        }),
      },
    });

    // =============================================================================
    // DATABASE CREDENTIALS AND SECRETS
    // =============================================================================

    // Create database credentials in Secrets Manager for secure handling
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `${environment}/${appName}/${targetRegion}/db/credentials`,
      description: 'RDS PostgreSQL master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Store the Secrets Manager ARN in SSM Parameter Store for EC2 access
    new ssm.StringParameter(this, 'DBCredentialsSSMParam', {
      parameterName: `/${environment}/${appName}/db/credentials-secret-arn`,
      stringValue: dbCredentials.secretArn,
      description:
        'ARN of the Secrets Manager secret containing DB credentials',
      tier: ssm.ParameterTier.STANDARD,
    });

    // =============================================================================
    // RDS DATABASE
    // =============================================================================

    // Create DB subnet group for private subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: `${environment}-${appName}-${targetRegion}-db-subnet-group`,
      description: 'Subnet group for RDS PostgreSQL in private subnets',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // RDS PostgreSQL with Multi-AZ, encryption, backups, and deletion protection
    const database = new rds.DatabaseInstance(this, 'Database', {
      databaseName: `${environment}${appName}db`,
      instanceIdentifier: `${environment}-${appName}-${targetRegion}-db`,

      // Engine configuration - Fixed: Use proper PostgresEngineVersion
      engine: rds.DatabaseInstanceEngine.postgres({
        version: dbEngineVersion,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ), // Cost-efficient for demo

      // Credentials from Secrets Manager
      credentials: rds.Credentials.fromSecret(dbCredentials),

      // Network configuration
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],

      // High Availability
      multiAz: true, // Multi-AZ deployment for HA

      // Security
      storageEncrypted: true, // Encryption at rest
      deletionProtection: true, // Prevent accidental deletion

      // Backup configuration
      backupRetention: cdk.Duration.days(7), // 7 days backup retention
      deleteAutomatedBackups: false,

      // Monitoring
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,

      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,

      // Cost optimization
      allocatedStorage: 20, // Minimum for demo
      maxAllocatedStorage: 100, // Auto-scaling limit

      // Network
      port: 5432,

      // Deletion behavior
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // Take final snapshot on deletion
    });

    // =============================================================================
    // EC2 INSTANCES
    // =============================================================================

    // Get the latest Amazon Linux 2 AMI
    const amazonLinuxAmi = ec2.MachineImage.latestAmazonLinux2();

    // User data script for EC2 initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y postgresql',
      'yum install -y amazon-cloudwatch-agent',

      // Install AWS CLI v2
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
      'unzip awscliv2.zip',
      'sudo ./aws/install',

      // Create application directory
      'mkdir -p /opt/app',
      'chown ec2-user:ec2-user /opt/app',

      // Log initialization completion
      'echo "EC2 initialization completed at $(date)" >> /var/log/user-data.log'
    );

    // Deploy EC2 instances in public subnets (one per AZ for HA)
    const publicSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    });

    publicSubnets.subnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `EC2Instance${index + 1}`, {
        instanceName: `${environment}-${appName}-${targetRegion}-ec2-${index + 1}`,
        vpc,
        vpcSubnets: { subnets: [subnet] },

        // Instance configuration
        machineImage: amazonLinuxAmi,
        instanceType: new ec2.InstanceType(instanceType),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData,

        // Enable detailed monitoring
        detailedMonitoring: true,

        // Instance metadata service configuration (IMDSv2)
        requireImdsv2: true,

        // Associate public IP for internet access
        associatePublicIpAddress: true,

        // Availability zone
        availabilityZone: subnet.availabilityZone,

        // EBS configuration with encryption
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              deleteOnTermination: true,
            }),
          },
        ],

        // Key pair (should be created separately and referenced)
        // keyName: 'your-key-pair-name', // Uncomment and set your key pair
      });

      // Apply tags to instance
      cdk.Tags.of(instance).add(
        'Name',
        `${environment}-${appName}-${targetRegion}-ec2-${index + 1}`
      );
    });

    // =============================================================================
    // OUTPUTS
    // =============================================================================

    // VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environment}-${appName}-${targetRegion}-vpc-id`,
    });

    // Database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL endpoint',
      exportName: `${environment}-${appName}-${targetRegion}-db-endpoint`,
    });

    // Database credentials secret ARN
    new cdk.CfnOutput(this, 'DatabaseCredentialsSecretArn', {
      value: dbCredentials.secretArn,
      description:
        'ARN of the Secrets Manager secret containing database credentials',
      exportName: `${environment}-${appName}-${targetRegion}-db-credentials-arn`,
    });

    // S3 VPC Endpoint ID
    new cdk.CfnOutput(this, 'S3VpcEndpointId', {
      value: s3Endpoint.vpcEndpointId,
      description: 'S3 VPC Gateway Endpoint ID',
      exportName: `${environment}-${appName}-${targetRegion}-s3-endpoint-id`,
    });

    // Public subnet IDs
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: publicSubnets.subnetIds.join(','),
      description: 'Public subnet IDs',
      exportName: `${environment}-${appName}-${targetRegion}-public-subnets`,
    });

    // Private subnet IDs
    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    });
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: privateSubnets.subnetIds.join(','),
      description: 'Private subnet IDs',
      exportName: `${environment}-${appName}-${targetRegion}-private-subnets`,
    });
  }
}

// =============================================================================
// CDK APP AND STACK INSTANTIATION
// =============================================================================

const app = new cdk.App();

// Default configuration - can be overridden via context
const defaultConfig = {
  appName: 'myapp',
  environment: 'prod',
  owner: 'platform-team',
  instanceType: 't3.micro', // Cost-efficient for demo
  allowedCidrs: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'], // Private networks only - adjust as needed
  dbEngineVersion: rds.PostgresEngineVersion.VER_15_4, // Fixed: Use proper enum value
};

// Get configuration from context or use defaults
const appName = app.node.tryGetContext('appName') || defaultConfig.appName;
const environment =
  app.node.tryGetContext('environment') || defaultConfig.environment;
const owner = app.node.tryGetContext('owner') || defaultConfig.owner;
const instanceType =
  app.node.tryGetContext('instanceType') || defaultConfig.instanceType;
const allowedCidrs =
  app.node.tryGetContext('allowedCidrs') || defaultConfig.allowedCidrs;
const dbEngineVersion = defaultConfig.dbEngineVersion; // Use the enum directly

// Target regions for multi-region deployment
const regions = [
  { name: 'us-east-1', isPrimary: true },
  { name: 'us-west-2', isPrimary: false },
];

// Create stacks for both regions
regions.forEach(region => {
  const stackName = `${environment.charAt(0).toUpperCase() + environment.slice(1)}InfrastructureStack-${region.name}`;

  new InfrastructureStack(app, stackName, {
    stackName,
    description: `${environment} infrastructure stack for ${appName} in ${region.name} (${region.isPrimary ? 'Primary' : 'Secondary'})`,

    // Stack properties
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region.name,
    },

    // Termination protection for production
    terminationProtection: environment === 'prod',

    // Custom properties
    appName,
    environment,
    owner,
    instanceType,
    allowedCidrs,
    dbEngineVersion,
    targetRegion: region.name,

    // Stack tags
    tags: {
      Environment: environment,
      Application: appName,
      Region: region.name,
      Owner: owner,
      IsPrimary: region.isPrimary.toString(),
      ManagedBy: 'CDK',
    },
  });
});

// Synthesize the app
app.synth();
```

## Key Fix:

**PostgreSQL Version**: Changed from string `'15.4'` to the proper enum value `rds.PostgresEngineVersion.VER_15_4`. This uses the predefined PostgreSQL engine version that AWS RDS supports.

The PostgreSQL engine versions available in CDK include:

- `VER_15_4` (PostgreSQL 15.4)
- `VER_15_3` (PostgreSQL 15.3)
- `VER_14_9` (PostgreSQL 14.9)
- `VER_13_13` (PostgreSQL 13.13)
- And others...

If `VER_15_4` is not available in your region or CDK version, you can use other available versions like:

- `rds.PostgresEngineVersion.VER_15_3`
- `rds.PostgresEngineVersion.VER_14_9`
- `rds.PostgresEngineVersion.VER_13_13`

The code now uses the correct PostgreSQL engine version format and should deploy successfully without the version error.
