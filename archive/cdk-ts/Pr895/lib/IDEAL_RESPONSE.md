I'll create a scalable web application deployment on AWS using CDK TypeScript with high availability features and production-ready configurations.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as route53recovery from 'aws-cdk-lib/aws-route53recoveryreadiness';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  domainName?: string;
  certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix for resource naming
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Database password parameter
    const dbPassword = new cdk.CfnParameter(this, 'DatabasePassword', {
      type: 'String',
      description: 'Password for RDS database',
      noEcho: true,
      minLength: 8,
      constraintDescription: 'Password must be at least 8 characters long',
    });

    // VPC Configuration with multiple AZs for high availability
    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      maxAzs: 3,
      natGateways: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
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

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances in Auto Scaling group',
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // S3 Buckets for static assets and ALB logs
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

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      loadBalancerName: `tap-${environmentSuffix}-alb`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Enable ALB access logs
    alb.logAccessLogs(albLogsBucket);

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    staticAssetsBucket.grantRead(ec2Role);

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Environment: ' + environmentSuffix + '</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Auto Scaling
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebAppLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      userData,
      role: ec2Role,
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WebAppTargetGroup', {
      vpc,
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
    });

    // Certificate handling - use provided ARN or create if domain provided
    let certificate: acm.ICertificate | undefined;
    
    if (props?.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(
        this,
        'ImportedCertificate',
        props.certificateArn
      );
    } else if (props?.domainName) {
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: props.domainName,
      });
      
      certificate = new acm.Certificate(this, 'WebAppCertificate', {
        domainName: `www.${props.domainName}`,
        subjectAlternativeNames: [props.domainName],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    }

    // Listeners
    if (certificate) {
      // HTTPS Listener
      alb.addListener('HTTPSListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
      });

      // HTTP Listener (redirect to HTTPS)
      alb.addListener('HTTPListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
    } else {
      // HTTP only if no certificate
      alb.addListener('HTTPListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });
    }

    // RDS Database Configuration
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      instanceIdentifier: `tap-${environmentSuffix}-db`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      databaseName: 'webapp',
      credentials: rds.Credentials.fromPassword('admin', cdk.SecretValue.cfnParameter(dbPassword)),
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Storage autoscaling
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
    });

    // Route 53 DNS Configuration (if domain provided)
    if (props?.domainName) {
      const hostedZone = route53.HostedZone.fromLookup(this, 'DNSHostedZone', {
        domainName: props.domainName,
      });

      new route53.ARecord(this, 'WebAppARecord', {
        zone: hostedZone,
        recordName: 'www',
        target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb)),
      });

      new route53.ARecord(this, 'WebAppRootARecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb)),
      });
    }

    // Route 53 Application Recovery Controller
    const resourceSet = new route53recovery.CfnResourceSet(this, 'WebAppResourceSet', {
      resourceSetName: `tap-${environmentSuffix}-resource-set`,
      resourceSetType: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      resources: [{
        resourceArn: alb.loadBalancerArn,
      }],
    });

    const readinessCheck = new route53recovery.CfnReadinessCheck(this, 'WebAppReadinessCheck', {
      readinessCheckName: `tap-${environmentSuffix}-readiness-check`,
      resourceSetName: resourceSet.resourceSetName!,
    });

    readinessCheck.addDependency(resourceSet);

    // Auto Scaling Policies
    autoScalingGroup.scaleOnCpuUtilization('ScaleOnCPU', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    new autoscaling.TargetTrackingScalingPolicy(this, 'ScaleOnRequestCount', {
      autoScalingGroup,
      targetValue: 1000,
      predefinedMetric: autoscaling.PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET,
      resourceLabel: `${alb.loadBalancerFullName}/${targetGroup.targetGroupFullName}`,
    });

    // Tagging
    const productionTags = {
      Environment: 'Production',
      Application: 'WebApp',
      Owner: 'DevOps',
      EnvironmentSuffix: environmentSuffix,
    };

    Object.entries(productionTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `${this.stackName}-LoadBalancerDNS`,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: certificate 
        ? `https://${props?.domainName ? `www.${props.domainName}` : alb.loadBalancerDnsName}`
        : `http://${alb.loadBalancerDnsName}`,
      description: 'Website URL',
      exportName: `${this.stackName}-WebsiteURL`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'StaticAssetsBucketName', {
      value: staticAssetsBucket.bucketName,
      description: 'S3 bucket for static assets',
      exportName: `${this.stackName}-StaticAssetsBucket`,
    });

    new cdk.CfnOutput(this, 'ALBLogsBucketName', {
      value: albLogsBucket.bucketName,
      description: 'S3 bucket for ALB logs',
      exportName: `${this.stackName}-ALBLogsBucket`,
    });
  }
}
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variables
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Optional: Get domain name and certificate ARN from context
const domainName = app.node.tryGetContext('domainName');
const certificateArn = app.node.tryGetContext('certificateArn');

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  domainName,
  certificateArn,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
});
```

This production-ready CDK TypeScript infrastructure provides:

### Key Features Implemented:

1. **High Availability**
   - Multi-AZ VPC with 3 availability zones
   - RDS Multi-AZ deployment
   - Auto Scaling Group with minimum 2 instances across multiple AZs
   - 2 NAT gateways for redundancy

2. **Security**
   - Proper security group configuration with least privilege
   - Database in isolated subnets
   - EC2 instances in private subnets with NAT gateway access
   - Encrypted RDS storage
   - S3 bucket encryption
   - IAM roles with minimal required permissions

3. **Scalability**
   - Auto Scaling based on CPU utilization and request count
   - RDS storage autoscaling (20GB to 100GB)
   - Application Load Balancer for traffic distribution

4. **Monitoring & Logging**
   - ALB access logs to S3
   - RDS CloudWatch log exports
   - Performance Insights enabled on RDS
   - CloudWatch monitoring for all resources

5. **Cost Optimization**
   - S3 lifecycle policies for log rotation
   - RDS storage autoscaling to prevent over-provisioning
   - T3 instance types for cost efficiency

6. **Production Features**
   - HTTPS support with ACM certificate (when domain provided)
   - Route 53 DNS configuration (optional)
   - Route 53 Application Recovery Controller for resilience
   - Comprehensive tagging for resource management
   - Stack outputs for integration

7. **Deployment Flexibility**
   - Environment suffix for multiple deployments
   - Optional domain name and certificate configuration
   - Parameterized database password
   - Configurable through CDK context

### Deployment Commands:

```bash
# Install dependencies
npm install

# Deploy with default settings
npm run cdk:deploy -- --parameters DatabasePassword=SecurePassword123!

# Deploy with custom domain
npm run cdk:deploy -- \
  --context domainName=example.com \
  --parameters DatabasePassword=SecurePassword123!

# Deploy with existing certificate
npm run cdk:deploy -- \
  --context certificateArn=arn:aws:acm:region:account:certificate/id \
  --parameters DatabasePassword=SecurePassword123!

# Destroy infrastructure
npm run cdk:destroy
```

This solution meets all requirements while providing a robust, scalable, and maintainable infrastructure for web application deployment on AWS.