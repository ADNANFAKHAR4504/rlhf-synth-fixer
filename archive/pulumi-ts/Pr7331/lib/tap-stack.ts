/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of infrastructure resources and manages
 * environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of infrastructure resources
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  // Outputs
  public readonly productionVpcId: pulumi.Output<string>;
  public readonly stagingVpcId: pulumi.Output<string>;
  public readonly vpcPeeringConnectionId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly auroraClusterEndpoint: pulumi.Output<string>;
  public readonly auroraClusterReadEndpoint: pulumi.Output<string>;
  public readonly databaseName: pulumi.Output<string | undefined>;
  public readonly dbConnectionSecretArn: pulumi.Output<string>;
  public readonly certificateArn: pulumi.Output<string>;
  public readonly blueTargetGroupArn: pulumi.Output<string>;
  public readonly greenTargetGroupArn: pulumi.Output<string>;
  public readonly blueAsgName: pulumi.Output<string>;
  public readonly greenAsgName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Get configuration
    const config = new pulumi.Config();
    // Get environmentSuffix from args, config, or environment variable
    // The deploy script sets ENVIRONMENT_SUFFIX as an environment variable
    const environmentSuffix =
      args.environmentSuffix ||
      config.get('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev'; // Default fallback
    const environment = config.get('environment') || 'production';
    const appName = 'payment-app';

    // Tags for all resources
    const defaultTags = args.tags || {
      Environment: environment,
      Application: appName,
      CostCenter: 'fintech-payments',
      ManagedBy: 'pulumi',
    };

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `${appName}-kms-${environmentSuffix}`,
      {
        description: `KMS key for ${appName} encryption`,
        enableKeyRotation: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${appName}-kms-alias-${environmentSuffix}`,
      {
        name: `alias/${appName}-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create VPCs for production and staging
    const productionVpc = new awsx.ec2.Vpc(
      `${appName}-production-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 2,
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Private,
            cidrMask: 24,
          },
          {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 24,
          },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.None, // Cost optimization
        },
        tags: { ...defaultTags, VpcType: 'production' },
      },
      { parent: this }
    );

    const stagingVpc = new awsx.ec2.Vpc(
      `${appName}-staging-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        numberOfAvailabilityZones: 2,
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Private,
            cidrMask: 24,
          },
          {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 24,
          },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.None, // Cost optimization
        },
        tags: { ...defaultTags, VpcType: 'staging' },
      },
      { parent: this }
    );

    // VPC Peering connection
    const vpcPeering = new aws.ec2.VpcPeeringConnection(
      `${appName}-vpc-peering-${environmentSuffix}`,
      {
        vpcId: productionVpc.vpcId,
        peerVpcId: stagingVpc.vpcId,
        autoAccept: true,
        tags: {
          ...defaultTags,
          Name: `${appName}-vpc-peering-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Note: VPC peering routes are automatically managed by awsx.ec2.Vpc
    // Manual route creation is not needed as awsx handles routing internally

    // S3 bucket for ALB logs
    const albLogsBucket = new aws.s3.Bucket(
      `${appName}-alb-logs-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 90,
            },
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // ALB logs bucket policy
    new aws.s3.BucketPolicy(
      `${appName}-alb-logs-policy-${environmentSuffix}`,
      {
        bucket: albLogsBucket.id,
        policy: pulumi
          .all([albLogsBucket.arn, albLogsBucket.bucket])
          .apply(([arn, _bucket]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: 'arn:aws:iam::127311923021:root', // ELB service account for us-east-1
                  },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Security groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${appName}-alb-sg-${environmentSuffix}`,
      {
        vpcId: productionVpc.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `${appName}-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${appName}-ec2-sg-${environmentSuffix}`,
      {
        vpcId: productionVpc.vpcId,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Application port from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `${appName}-ec2-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `${appName}-db-sg-${environmentSuffix}`,
      {
        vpcId: productionVpc.vpcId,
        description: 'Security group for Aurora database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [ec2SecurityGroup.id],
            description: 'PostgreSQL from EC2',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...defaultTags, Name: `${appName}-db-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${appName}-db-subnet-${environmentSuffix}`,
      {
        subnetIds: productionVpc.privateSubnetIds,
        tags: {
          ...defaultTags,
          Name: `${appName}-db-subnet-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Generate random password for database
    const dbPassword = new aws.secretsmanager.Secret(
      `${appName}-db-password-${environmentSuffix}`,
      {
        description: 'Database master password',
        kmsKeyId: kmsKey.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Generate a strong random password using pulumi/random
    const dbPasswordRandom = aws.secretsmanager.getRandomPasswordOutput({
      passwordLength: 32,
      excludePunctuation: true,
    });

    const dbPasswordVersion = new aws.secretsmanager.SecretVersion(
      `${appName}-db-password-version-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        secretString: pulumi.secret(
          pulumi.interpolate`{"username":"dbadmin","password":"${dbPasswordRandom.randomPassword}"}`
        ),
      },
      { parent: this }
    );

    // Secrets Manager rotation configuration
    const rotationLambdaRole = new aws.iam.Role(
      `${appName}-rotation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${appName}-rotation-lambda-policy-${environmentSuffix}`,
      {
        role: rotationLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Aurora Serverless v2 cluster
    // Note: ignoreChanges on masterPassword prevents password updates from triggering
    // cluster modifications when secret versions change. The password is managed via
    // Secrets Manager and should only be changed through AWS console/CLI when needed.
    const auroraCluster = new aws.rds.Cluster(
      `${appName}-aurora-cluster-${environmentSuffix}`,
      {
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '16.6',
        databaseName: 'paymentdb',
        masterUsername: 'dbadmin',
        masterPassword: dbPasswordVersion.secretString.apply(s => {
          const parsed = JSON.parse(s || '{}');
          return (parsed.password || 'changeme') as string;
        }),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true, // For destroyability
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 2,
        },
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: {
          ...defaultTags,
          Name: `${appName}-aurora-cluster-${environmentSuffix}`,
        },
      },
      {
        parent: this,
        ignoreChanges: ['masterPassword'], // Prevent password updates from triggering cluster modifications
      }
    );

    new aws.rds.ClusterInstance(
      `${appName}-aurora-instance-${environmentSuffix}`,
      {
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '16.6',
        publiclyAccessible: false,
        tags: {
          ...defaultTags,
          Name: `${appName}-aurora-instance-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Update secret with connection info
    const dbConnectionSecret = new aws.secretsmanager.Secret(
      `${appName}-db-connection-${environmentSuffix}`,
      {
        description: 'Database connection information',
        kmsKeyId: kmsKey.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `${appName}-db-connection-version-${environmentSuffix}`,
      {
        secretId: dbConnectionSecret.id,
        secretString: pulumi
          .all([
            auroraCluster.endpoint,
            auroraCluster.port,
            dbPasswordVersion.secretString,
          ])
          .apply(([endpoint, port, password]) => {
            const parsed = JSON.parse(password || '{}');
            return JSON.stringify({
              host: endpoint,
              port,
              username: 'dbadmin',
              password: (parsed.password || 'changeme') as string,
              database: 'paymentdb',
              ssl: true,
            });
          }),
      },
      { parent: this }
    );

    // IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `${appName}-ec2-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach policies for CloudWatch, Secrets Manager, and X-Ray
    new aws.iam.RolePolicyAttachment(
      `${appName}-ec2-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${appName}-ec2-xray-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${appName}-ec2-secrets-policy-${environmentSuffix}`,
      {
        role: ec2Role.id,
        policy: pulumi
          .all([dbConnectionSecret.arn, kmsKey.arn])
          .apply(([secretArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${appName}-ec2-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ACM Certificate (optional - only if domain is provided)
    // For testing without a domain, we'll skip HTTPS and use HTTP only
    const domainName = config.get('domainName');
    const certificate = domainName
      ? new aws.acm.Certificate(
          `${appName}-cert-${environmentSuffix}`,
          {
            domainName: domainName,
            validationMethod: 'DNS',
            tags: {
              ...defaultTags,
              Name: `${appName}-cert-${environmentSuffix}`,
            },
          },
          { parent: this }
        )
      : undefined;

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `${appName}-alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: productionVpc.publicSubnetIds,
        enableDeletionProtection: false, // For destroyability
        accessLogs: {
          bucket: albLogsBucket.bucket,
          enabled: true,
        },
        tags: { ...defaultTags, Name: `${appName}-alb-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Target groups for blue-green deployment
    // AWS Target Groups have a 32-character name limit
    // Using shorter names to ensure we stay under the limit
    const generateTgName = (prefix: string, suffix: string): string => {
      let name = `${prefix}-${suffix}`;
      if (name.length > 32) {
        name = name.substring(0, 32);
        // Remove trailing hyphens (AWS doesn't allow names ending with hyphen)
        while (name.endsWith('-')) {
          name = name.substring(0, name.length - 1);
        }
      }
      return name;
    };
    const blueTgName = generateTgName('pay-btg', environmentSuffix);
    const greenTgName = generateTgName('pay-gtg', environmentSuffix);

    const blueTargetGroup = new aws.lb.TargetGroup(
      `${appName}-blue-tg-${environmentSuffix}`,
      {
        name: blueTgName,
        port: 8080,
        protocol: 'HTTP',
        vpcId: productionVpc.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/health',
          port: '8080',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          ...defaultTags,
          Name: `${appName}-blue-tg-${environmentSuffix}`,
          DeploymentColor: 'blue',
        },
      },
      { parent: this }
    );

    const greenTargetGroup = new aws.lb.TargetGroup(
      `${appName}-green-tg-${environmentSuffix}`,
      {
        name: greenTgName,
        port: 8080,
        protocol: 'HTTP',
        vpcId: productionVpc.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/health',
          port: '8080',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          ...defaultTags,
          Name: `${appName}-green-tg-${environmentSuffix}`,
          DeploymentColor: 'green',
        },
      },
      { parent: this }
    );

    // HTTPS Listener (only if certificate is available)
    if (certificate) {
      new aws.lb.Listener(
        `${appName}-https-listener-${environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
          certificateArn: certificate.arn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: blueTargetGroup.arn,
            },
          ],
          tags: defaultTags,
        },
        { parent: this }
      );

      // HTTP to HTTPS redirect listener
      new aws.lb.Listener(
        `${appName}-http-listener-${environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
          port: 80,
          protocol: 'HTTP',
          defaultActions: [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ],
          tags: defaultTags,
        },
        { parent: this }
      );
    } else {
      // HTTP listener (forward directly without HTTPS)
      new aws.lb.Listener(
        `${appName}-http-listener-${environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
          port: 80,
          protocol: 'HTTP',
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: blueTargetGroup.arn,
            },
          ],
          tags: defaultTags,
        },
        { parent: this }
      );
    }

    // Latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'state', values: ['available'] },
      ],
    });

    // User data script for EC2 instances
    const userData = pulumi
      .all([dbConnectionSecret.arn, auroraCluster.endpoint])
      .apply(
        ([_secretArn, _dbEndpoint]) => `#!/bin/bash
set -e

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install X-Ray daemon
curl https://s3.us-east-1.amazonaws.com/aws-xray-assets.us-east-1/xray-daemon/aws-xray-daemon-3.x.rpm -o /tmp/xray.rpm
yum install -y /tmp/xray.rpm

# Install application dependencies
yum install -y docker postgresql
service docker start
usermod -a -G docker ec2-user

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "metrics": {
    "namespace": "PaymentApp",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MemoryUtilization", "unit": "Percent"}
        ]
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DiskUtilization", "unit": "Percent"}
        ]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/application.log",
            "log_group_name": "${appName}-logs-${environmentSuffix}",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Start X-Ray daemon
systemctl enable xray
systemctl start xray

# Start application (placeholder - would pull from ECR in production)
echo "Application would start here"
`
      );

    // Launch template for blue deployment
    const blueLaunchTemplate = new aws.ec2.LaunchTemplate(
      `${appName}-blue-lt-${environmentSuffix}`,
      {
        namePrefix: `${appName}-blue-${environmentSuffix}-`,
        imageId: ami.then(a => a.id),
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: ec2InstanceProfile.arn,
        },
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        userData: userData.apply(ud => Buffer.from(ud).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...defaultTags,
              Name: `${appName}-blue-${environmentSuffix}`,
              DeploymentColor: 'blue',
            },
          },
        ],
        monitoring: {
          enabled: true,
        },
        tags: { ...defaultTags, DeploymentColor: 'blue' },
      },
      { parent: this }
    );

    // Auto Scaling Group for blue deployment
    const blueAsg = new aws.autoscaling.Group(
      `${appName}-blue-asg-${environmentSuffix}`,
      {
        vpcZoneIdentifiers: productionVpc.privateSubnetIds,
        targetGroupArns: [blueTargetGroup.arn],
        desiredCapacity: 2,
        minSize: 2,
        maxSize: 4,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: blueLaunchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${appName}-blue-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          { key: 'Environment', value: environment, propagateAtLaunch: true },
          { key: 'Application', value: appName, propagateAtLaunch: true },
          {
            key: 'CostCenter',
            value: 'fintech-payments',
            propagateAtLaunch: true,
          },
          { key: 'DeploymentColor', value: 'blue', propagateAtLaunch: true },
        ],
      },
      { parent: this }
    );

    // Launch template for green deployment
    const greenLaunchTemplate = new aws.ec2.LaunchTemplate(
      `${appName}-green-lt-${environmentSuffix}`,
      {
        namePrefix: `${appName}-green-${environmentSuffix}-`,
        imageId: ami.then(a => a.id),
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: ec2InstanceProfile.arn,
        },
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        userData: userData.apply(ud => Buffer.from(ud).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...defaultTags,
              Name: `${appName}-green-${environmentSuffix}`,
              DeploymentColor: 'green',
            },
          },
        ],
        monitoring: {
          enabled: true,
        },
        tags: { ...defaultTags, DeploymentColor: 'green' },
      },
      { parent: this }
    );

    // Auto Scaling Group for green deployment (initially 0 instances)
    const greenAsg = new aws.autoscaling.Group(
      `${appName}-green-asg-${environmentSuffix}`,
      {
        vpcZoneIdentifiers: productionVpc.privateSubnetIds,
        targetGroupArns: [greenTargetGroup.arn],
        desiredCapacity: 0,
        minSize: 0,
        maxSize: 4,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: greenLaunchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${appName}-green-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          { key: 'Environment', value: environment, propagateAtLaunch: true },
          { key: 'Application', value: appName, propagateAtLaunch: true },
          {
            key: 'CostCenter',
            value: 'fintech-payments',
            propagateAtLaunch: true,
          },
          { key: 'DeploymentColor', value: 'green', propagateAtLaunch: true },
        ],
      },
      { parent: this }
    );

    // CloudWatch Log Group (without KMS - CloudWatch uses its own key)
    const logGroup = new aws.cloudwatch.LogGroup(
      `${appName}-logs-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard - Simplified (complex metrics can be added post-deployment)
    const dashboard = new aws.cloudwatch.Dashboard(
      `${appName}-dashboard-${environmentSuffix}`,
      {
        dashboardName: `${appName}-dashboard-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([alb.arnSuffix, auroraCluster.id])
          .apply(([albArnSuffix, clusterId]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'RequestCount',
                        'LoadBalancer',
                        albArnSuffix,
                      ],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: 'us-east-1',
                    title: 'ALB Request Count',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/RDS',
                        'DatabaseConnections',
                        'DBClusterIdentifier',
                        clusterId,
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'Aurora Database Connections',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `${appName}-alb-5xx-alarm-${environmentSuffix}`,
      {
        name: `${appName}-alb-5xx-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when ALB 5XX errors exceed threshold',
        dimensions: {
          LoadBalancer: alb.arnSuffix,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `${appName}-db-connection-alarm-${environmentSuffix}`,
      {
        name: `${appName}-db-connection-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when database connections exceed threshold',
        dimensions: {
          DBClusterIdentifier: auroraCluster.id,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `${appName}-asg-health-alarm-${environmentSuffix}`,
      {
        name: `${appName}-asg-health-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'GroupInServiceInstances',
        namespace: 'AWS/AutoScaling',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'Alert when ASG has less than 1 healthy instance',
        dimensions: {
          AutoScalingGroupName: blueAsg.name,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Set outputs
    this.productionVpcId = productionVpc.vpcId;
    this.stagingVpcId = stagingVpc.vpcId;
    this.vpcPeeringConnectionId = vpcPeering.id;
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.auroraClusterEndpoint = auroraCluster.endpoint;
    this.auroraClusterReadEndpoint = auroraCluster.readerEndpoint;
    this.databaseName = auroraCluster.databaseName;
    this.dbConnectionSecretArn = dbConnectionSecret.arn;
    this.certificateArn =
      certificate?.arn || pulumi.output('N/A - HTTP-only mode');
    this.blueTargetGroupArn = blueTargetGroup.arn;
    this.greenTargetGroupArn = greenTargetGroup.arn;
    this.blueAsgName = blueAsg.name;
    this.greenAsgName = greenAsg.name;
    this.logGroupName = logGroup.name;
    this.dashboardName = dashboard.dashboardName;
    this.kmsKeyId = kmsKey.keyId;
    this.kmsKeyArn = kmsKey.arn;

    // Register outputs
    this.registerOutputs({
      productionVpcId: this.productionVpcId,
      stagingVpcId: this.stagingVpcId,
      vpcPeeringConnectionId: this.vpcPeeringConnectionId,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      auroraClusterEndpoint: this.auroraClusterEndpoint,
      auroraClusterReadEndpoint: this.auroraClusterReadEndpoint,
      databaseName: this.databaseName,
      dbConnectionSecretArn: this.dbConnectionSecretArn,
      certificateArn: this.certificateArn,
      blueTargetGroupArn: this.blueTargetGroupArn,
      greenTargetGroupArn: this.greenTargetGroupArn,
      blueAsgName: this.blueAsgName,
      greenAsgName: this.greenAsgName,
      logGroupName: this.logGroupName,
      dashboardName: this.dashboardName,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
    });
  }
}

// Pulumi application entry point
// Get configuration
const config = new pulumi.Config();
// Get environmentSuffix from config or environment variable
// The deploy script sets ENVIRONMENT_SUFFIX as an environment variable
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev'; // Default fallback
const environment = config.get('environment') || 'production';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environment,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  Application: 'payment-app',
  CostCenter: 'fintech-payments',
  ManagedBy: 'pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for easy access
export const productionVpcId = stack.productionVpcId;
export const stagingVpcId = stack.stagingVpcId;
export const vpcPeeringConnectionId = stack.vpcPeeringConnectionId;
export const albDnsName = stack.albDnsName;
export const albArn = stack.albArn;
export const auroraClusterEndpoint = stack.auroraClusterEndpoint;
export const auroraClusterReadEndpoint = stack.auroraClusterReadEndpoint;
export const databaseName = stack.databaseName;
export const dbConnectionSecretArn = stack.dbConnectionSecretArn;
export const certificateArn = stack.certificateArn;
export const blueTargetGroupArn = stack.blueTargetGroupArn;
export const greenTargetGroupArn = stack.greenTargetGroupArn;
export const blueAsgName = stack.blueAsgName;
export const greenAsgName = stack.greenAsgName;
export const logGroupName = stack.logGroupName;
export const dashboardName = stack.dashboardName;
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyArn = stack.kmsKeyArn;
