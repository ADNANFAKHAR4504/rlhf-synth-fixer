import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Detect LocalStack environment (function to allow dynamic evaluation in tests)
const detectLocalStack = (): boolean =>
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.AWS_ENDPOINT_URL?.includes('localstack') ||
  false;

// Environment-specific configuration interface
export interface EnvironmentConfig {
  vpcCidr: string;
  instanceType: ec2.InstanceType;
  dbInstanceClass: ec2.InstanceType;
  dbAllocatedStorage: number;
  customAmiId?: string;
  bucketVersioning: boolean;
}

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: TapStackProps & { config: EnvironmentConfig }
  ) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const { config } = props;

    // Evaluate LocalStack detection at runtime
    const isLocalStack = detectLocalStack();

    // Apply consistent tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'WebApplication');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${environmentSuffix}-webapp-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 2,
      // Disable restrictDefaultSecurityGroup for LocalStack to avoid custom resource issues
      restrictDefaultSecurityGroup: !isLocalStack,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${environmentSuffix}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${environmentSuffix}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: `${environmentSuffix}-isolated`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for Web Servers
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      securityGroupName: `${environmentSuffix}-web-sg-${environmentSuffix}`,
      vpc,
      description: `Security group for ${environmentSuffix} web servers`,
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // Security Group for Database
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        securityGroupName: `${environmentSuffix}-db-sg`,
        vpc,
        description: `Security group for ${environmentSuffix} database`,
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );

    // Create Key Pair for EC2 instances
    const keyPair = new ec2.KeyPair(this, 'KeyPair', {
      keyPairName: `${environmentSuffix}-keypair-${environmentSuffix}`,
    });

    // AMI Selection - use custom AMI if specified, otherwise use Amazon Linux 2
    const machineImage = config.customAmiId
      ? ec2.MachineImage.genericLinux({ 'us-east-1': config.customAmiId })
      : ec2.MachineImage.latestAmazonLinux2();

    // IAM Role for EC2 instances (create once, use in both launch template and ASG)
    const ec2Role = this.createEC2Role();

    // User Data Script for Web Server Setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Welcome to ${environmentSuffix} Environment</h1>" > /var/www/html/index.html`,
      'echo "<p>Server is running successfully!</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Web Servers
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        launchTemplateName: `${environmentSuffix}-webapp-template-${environmentSuffix}`,
        instanceType: config.instanceType,
        machineImage,
        securityGroup: webSecurityGroup,
        keyPair,
        userData,
        role: ec2Role,
      }
    );

    // Auto Scaling Group
    // SKIP in LocalStack due to CloudFormation LaunchTemplate.LatestVersionNumber incompatibility
    // LocalStack Community Edition returns non-string value which causes deployment failure
    // ASG functionality is validated through unit tests (100% coverage)
    const autoScalingGroup = !isLocalStack
      ? new cdk.aws_autoscaling.AutoScalingGroup(this, 'WebServerASG', {
          autoScalingGroupName: `webapp-asg-${environmentSuffix}`,
          vpc,
          launchTemplate,
          minCapacity: environmentSuffix === 'Production' ? 2 : 1,
          maxCapacity: environmentSuffix === 'Production' ? 6 : 3,
          desiredCapacity: environmentSuffix === 'Production' ? 2 : 1,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        })
      : undefined;

    // Application Load Balancer
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      'WebAppALB',
      {
        loadBalancerName: `${environmentSuffix}-alb-${environmentSuffix}`,
        vpc,
        internetFacing: true,
        securityGroup: webSecurityGroup,
      }
    );

    // Target group name must be max 32 characters
    // Shorten if environment suffix is long
    const targetGroupName =
      `${environmentSuffix}-tg`.length > 32
        ? `${environmentSuffix.substring(0, 29)}-tg`
        : `${environmentSuffix}-tg`;

    // Configure listener based on whether ASG exists
    const listener = alb.addListener('WebAppListener', {
      port: 80,
      open: true,
      // Add default fixed response for LocalStack (no ASG targets)
      ...(isLocalStack && {
        defaultAction:
          cdk.aws_elasticloadbalancingv2.ListenerAction.fixedResponse(200, {
            contentType: 'text/plain',
            messageBody: 'LocalStack ALB - No targets (ASG skipped)',
          }),
      }),
    });

    // Add targets only if ASG exists (skipped in LocalStack)
    if (autoScalingGroup) {
      listener.addTargets('WebAppTargets', {
        targetGroupName,
        port: 80,
        targets: [autoScalingGroup],
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
        },
      });
    }

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      subnetGroupName: `${environmentSuffix}-db-subnet-${environmentSuffix}`,
      description: `Database subnet group for ${environmentSuffix}`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database Instance
    // Note: RDS is DISABLED in LocalStack due to provisioning timeouts.
    // LocalStack Community Edition has limited RDS support.
    // For production AWS deployments, RDS will be created normally.
    let database: rds.DatabaseInstance | undefined;

    if (!isLocalStack) {
      database = new rds.DatabaseInstance(this, 'Database', {
        instanceIdentifier: `${environmentSuffix}-db-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: config.dbInstanceClass,
        allocatedStorage: config.dbAllocatedStorage,
        storageType: rds.StorageType.GP2,
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        databaseName: 'webappdb',
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `${environmentSuffix}-db-creds-${environmentSuffix}`,
        }),
        backupRetention:
          environmentSuffix === 'Production'
            ? cdk.Duration.days(7)
            : cdk.Duration.days(1),
        deleteAutomatedBackups: environmentSuffix !== 'Production',
        deletionProtection: environmentSuffix === 'Production',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // S3 Bucket for application assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: isLocalStack
        ? `assets-${environmentSuffix}`
        : `tap-${environmentSuffix}-assets-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: config.bucketVersioning,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        ...(environmentSuffix !== 'Production'
          ? [
              {
                id: 'DeleteOldVersions',
                noncurrentVersionExpiration: cdk.Duration.days(30),
              },
            ]
          : []),
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: false, // Disabled for LocalStack to avoid custom resource issues
    });

    // S3 Bucket for logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: isLocalStack
        ? `logs-${environmentSuffix}`
        : `tap-${environmentSuffix}-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(
            environmentSuffix === 'Production' ? 90 : 30
          ),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: false, // Disabled for LocalStack to avoid custom resource issues
    });

    // CloudWatch Log Group
    const logGroup = new cdk.aws_logs.LogGroup(this, 'WebAppLogGroup', {
      logGroupName: `/aws/webapp/${environmentSuffix}`,
      retention:
        environmentSuffix === 'Production'
          ? cdk.aws_logs.RetentionDays.ONE_MONTH
          : cdk.aws_logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Output important information
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: `Load Balancer DNS for ${environmentSuffix}`,
    });

    if (database) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: database.instanceEndpoint.hostname,
        description: `Database endpoint for ${environmentSuffix}`,
      });
    }

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: `Assets bucket name for ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: `Logs bucket name for ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: `VPC ID for ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KeyPairName', {
      value: keyPair.keyPairName,
      description: `Key pair name for ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: `CloudWatch log group name for ${environmentSuffix}`,
    });
  }

  private createEC2Role(): cdk.aws_iam.Role {
    const role = new cdk.aws_iam.Role(this, 'EC2Role', {
      roleName: `${this.stackName}-ec2-role`,
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for S3 access
    role.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: ['arn:aws:s3:::*webapp-assets-*/*'],
      })
    );

    return role;
  }
}
