import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Database password parameter
    const dbPassword = new cdk.CfnParameter(this, 'DatabasePassword', {
      type: 'String',
      default: 'ChangeMe1234',
      description: 'Password for RDS database',
      noEcho: true,
      minLength: 8,
      constraintDescription: 'Password must be at least 8 characters long',
    });

    // VPC for the application
    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      maxAzs: 3,
      natGateways: 2,
      cidr: '10.0.0.0/16',
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
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: vpc,
      description: 'Security group for EC2 instances in Auto Scaling group',
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow app traffic from ALB'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: vpc,
      description: 'Security group for RDS database',
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // S3 bucket for static assets and ALB logs
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `tap-${environmentSuffix}-assets-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiredObjectDeleteMarker: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // S3 bucket for ALB access logs
    const albLogsBucket = new s3.Bucket(this, 'ALBLogsBucket', {
      bucketName: `tap-${environmentSuffix}-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // Allow ALB log delivery to write to the bucket
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowALBLogDelivery',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(
            'logdelivery.elasticloadbalancing.amazonaws.com'
          ),
        ],
        actions: ['s3:PutObject'],
        resources: [`${albLogsBucket.bucketArn}/*`],
      })
    );

    // Allow ALB log delivery to check ACL
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowALBLogDeliveryAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(
            'logdelivery.elasticloadbalancing.amazonaws.com'
          ),
        ],
        actions: ['s3:GetBucketAcl'],
        resources: [albLogsBucket.bucketArn],
      })
    );

    // For testing, we'll skip the certificate creation since we don't have a real domain
    // In production, this would use DNS validation with a real hosted zone

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      loadBalancerName: `tap-${environmentSuffix}-alb`,
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Enable ALB access logs
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant access to S3 bucket for static assets
    staticAssetsBucket.grantRead(ec2Role);

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Auto Scaling
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        userData: userData,
        role: ec2Role,
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc: vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc: vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(5),
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    // HTTP Listener (for now, directly to target group since we don't have a certificate)
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // HTTPS would be added in production with a real certificate
    // Commented out for testing without a valid domain
    /*
    if (!skipCertificate) {
      alb.addListener('HTTPSListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
      });
    }
    */

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc: vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database with Multi-AZ and storage autoscaling
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      instanceIdentifier: `tap-${environmentSuffix}-db`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_37,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Always false for QA testing
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure destroyable
      databaseName: 'webapp',
      credentials: rds.Credentials.fromPassword(
        'admin',
        cdk.SecretValue.cfnParameter(dbPassword)
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling up to 100GB
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['error', 'general'],
      parameters: {
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
      },
    });

    // Skip Route 53 DNS records since we don't have a real hosted zone
    // These would be created in production with a real domain

    // Skip Route 53 Application Recovery Controller for now as it requires additional setup
    // These would be added in production with proper recovery control configuration

    // Scaling policies for Auto Scaling Group
    autoScalingGroup.scaleOnCpuUtilization('ScaleOnCPU', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    new autoscaling.TargetTrackingScalingPolicy(this, 'ScaleOnRequestCount', {
      autoScalingGroup: autoScalingGroup,
      targetValue: 1000,
      predefinedMetric:
        autoscaling.PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET,
      resourceLabel: `${alb.loadBalancerFullName}/${targetGroup.targetGroupFullName}`,
    });

    // Tag all resources
    const productionTags = {
      Environment: 'Production',
      Application: 'WebApp',
      Owner: 'DevOps',
    };

    Object.entries(productionTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Website URL (using ALB DNS - HTTP only for testing)',
    });

    new cdk.CfnOutput(this, 'ALBLogsBucketName', {
      value: albLogsBucket.bucketName,
      description: 'S3 bucket for ALB logs',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'StaticAssetsBucketName', {
      value: staticAssetsBucket.bucketName,
      description: 'S3 bucket for static assets',
    });
  }
}
