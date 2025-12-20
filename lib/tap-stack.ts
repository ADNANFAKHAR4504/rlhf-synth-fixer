import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566') ||
      this.account === '000000000000';

    // Apply consistent tags to all resources
    const defaultTags = {
      Environment: 'Production',
      Owner: 'DevOps',
      Project: 'SecureApp',
      ManagedBy: 'CDK',
    };

    // Create VPC with public and private subnets (simplified for LocalStack)
    const vpc = new ec2.Vpc(this, 'SecureAppVpc', {
      maxAzs: 2, // Reduced for LocalStack
      natGateways: 1, // Reduced for LocalStack compatibility
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
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: false, // Disabled for LocalStack (avoids custom resource)
    });

    // Apply tags to VPC
    Object.entries(defaultTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // Note: VPC Flow Logs and VPC Endpoints removed for LocalStack Community compatibility

    // Security Group for Application Load Balancer (internet-facing)
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS traffic from internet
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Allow outbound to application security group only
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for application instances',
      allowAllOutbound: false,
    });

    albSecurityGroup.addEgressRule(
      appSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic to application instances'
    );

    // Security Group for Application Instances
    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // Allow outbound HTTPS for package updates and AWS services
    appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS services'
    );

    // Security Group for RDS Database
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application'
    );

    // Create database credentials in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(
      this,
      'DatabaseCredentials',
      {
        description: 'RDS database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'appuser' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          passwordLength: 32,
        },
      }
    );

    // Create RDS database (simplified for LocalStack)
    const database = new rds.DatabaseInstance(this, 'AppDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_8,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      allocatedStorage: 20,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(1), // Reduced for LocalStack
      deletionProtection: false, // Disabled for LocalStack
      multiAz: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For LocalStack cleanup
    });

    // Create S3 bucket for application assets (simplified for LocalStack)
    const appBucket = new s3.Bucket(this, 'AppAssetsBucket', {
      bucketName: `secure-app-assets-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(7), // Simplified for LocalStack
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // No autoDeleteObjects to avoid custom resource
    });

    // IAM role for EC2 instances following least privilege principle
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant specific permissions to S3 bucket and Secrets Manager
    appBucket.grantRead(ec2Role);
    dbCredentials.grantRead(ec2Role);

    // Allow CloudWatch agent to publish metrics and logs
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'amazon-linux-extras install docker -y',
      'service docker start',
      'usermod -a -G docker ec2-user',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'SecureApp/EC2',
          metrics_collected: {
            cpu: { measurement: ['cpu_usage_idle'] },
            disk: { measurement: ['used_percent'], resources: ['*'] },
            mem: { measurement: ['mem_used_percent'] },
          },
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/messages',
                  log_group_name: '/aws/ec2/messages',
                  log_stream_name: '{instance_id}',
                },
              ],
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Auto Scaling Group with instances in private subnets
    // For LocalStack: Use MixedInstancesPolicy with LaunchTemplate version=$Latest
    // to work around LocalStack's LatestVersionNumber issue
    let autoScalingGroup: autoscaling.AutoScalingGroup;

    if (isLocalStack) {
      // LocalStack: Use LaunchTemplate with explicit version reference
      const launchTemplate = new ec2.LaunchTemplate(this, 'AppLaunchTemplate', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: appSecurityGroup,
        role: ec2Role,
        userData,
        // Skip IMDSv2 for LocalStack compatibility
      });

      // Use CfnAutoScalingGroup with explicit LaunchTemplate version reference
      const cfnAsg = new autoscaling.CfnAutoScalingGroup(
        this,
        'AppAutoScalingGroup',
        {
          minSize: '1',
          maxSize: '3',
          desiredCapacity: '2',
          vpcZoneIdentifier: vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          }).subnetIds,
          launchTemplate: {
            launchTemplateId: launchTemplate.launchTemplateId,
            version: '$Latest', // Use $Latest instead of LatestVersionNumber
          },
          healthCheckType: 'ELB',
          healthCheckGracePeriod: 300,
        }
      );

      // Create a minimal wrapper for compatibility with target group
      autoScalingGroup = autoscaling.AutoScalingGroup.fromAutoScalingGroupName(
        this,
        'AppAutoScalingGroupRef',
        cfnAsg.ref
      ) as autoscaling.AutoScalingGroup;
    } else {
      // AWS: Use LaunchTemplate with IMDSv2 for enhanced security
      const launchTemplate = new ec2.LaunchTemplate(this, 'AppLaunchTemplate', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: appSecurityGroup,
        role: ec2Role,
        userData,
        requireImdsv2: true, // Require IMDSv2 for enhanced security
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      });

      autoScalingGroup = new autoscaling.AutoScalingGroup(
        this,
        'AppAutoScalingGroup',
        {
          vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          launchTemplate,
          minCapacity: 1,
          maxCapacity: 3,
          desiredCapacity: 2,
          healthCheck: autoscaling.HealthCheck.elb({
            grace: cdk.Duration.seconds(300),
          }),
        }
      );
    }

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Target Group for Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'AppTargetGroup',
      {
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: isLocalStack ? [] : [autoScalingGroup],
        healthCheck: {
          path: '/health',
        },
      }
    );

    // ALB Listener
    alb.addListener('AppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // CloudTrail for comprehensive logging and monitoring
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: '/aws/cloudtrail/secure-app',
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `secure-app-cloudtrail-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // No autoDeleteObjects to avoid custom resource
    });

    const trail = new cloudtrail.Trail(this, 'SecureAppTrail', {
      bucket: cloudTrailBucket,
      cloudWatchLogGroup: cloudTrailLogGroup,
      includeGlobalServiceEvents: false, // Simplified for LocalStack
      isMultiRegionTrail: false, // Simplified for LocalStack
      enableFileValidation: false, // Disabled for LocalStack
      encryptionKey: undefined, // Uses default S3 encryption
    });

    // Enable data events for S3 bucket
    trail.addS3EventSelector(
      [
        {
          bucket: appBucket,
          objectPrefix: '',
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
        includeManagementEvents: true,
      }
    );

    // Note: IAM Access Analyzer removed (requires LocalStack Pro)

    // Apply tags to all resources in the stack
    Object.entries(defaultTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: appBucket.bucketName,
      description: 'S3 bucket for application assets',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
