I'll help you create a scalable web application deployment on AWS using CDK TypeScript. Here's the complete infrastructure code that meets all your requirements:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as route53recovery from 'aws-cdk-lib/aws-route53recoverycontrol';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Database password parameter
    const dbPassword = new cdk.CfnParameter(this, 'DatabasePassword', {
      type: 'String',
      description: 'Password for RDS database',
      noEcho: true,
      minLength: 8,
      constraintDescription: 'Password must be at least 8 characters long'
    });

    // Domain name parameter (optional - can be hardcoded)
    const domainName = new cdk.CfnParameter(this, 'DomainName', {
      type: 'String',
      description: 'Custom domain name for the application',
      default: 'example.com'
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
        }
      ]
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true
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
      description: 'Security group for EC2 instances in Auto Scaling group'
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
      description: 'Security group for RDS database'
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // S3 bucket for static assets and ALB logs
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `webapp-static-assets-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiredObjectDeleteMarker: true,
          noncurrentVersionExpiration: cdk.Duration.days(30)
        }
      ]
    });

    // S3 bucket for ALB access logs
    const albLogsBucket = new s3.Bucket(this, 'ALBLogsBucket', {
      bucketName: `webapp-alb-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(30)
        }
      ]
    });

    // ACM Certificate for HTTPS
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName.valueAsString
    });

    const certificate = new acm.Certificate(this, 'WebAppCertificate', {
      domainName: `www.${domainName.valueAsString}`,
      subjectAlternativeNames: [domainName.valueAsString],
      validation: acm.CertificateValidation.fromDns(hostedZone)
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    // Enable ALB access logs
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
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
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebAppLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      userData: userData,
      role: ec2Role
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc: vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5)
      })
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WebAppTargetGroup', {
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
        interval: cdk.Duration.seconds(30)
      }
    });

    // HTTPS Listener
    const httpsListener = alb.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup]
    });

    // HTTP Listener (redirect to HTTPS)
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true
      })
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc: vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }
    });

    // RDS Database with Multi-AZ and storage autoscaling
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      engine: rds.DatabaseEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      databaseName: 'webapp',
      credentials: rds.Credentials.fromPassword('admin', cdk.SecretValue.cfnParameter(dbPassword)),
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling up to 100GB
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
      parameters: {
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}'
      }
    });

    // Route 53 DNS records
    const aRecord = new route53.ARecord(this, 'WebAppARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb))
    });

    const rootARecord = new route53.ARecord(this, 'WebAppRootARecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb))
    });

    // Route 53 Application Recovery Controller - Readiness Check
    const readinessCheck = new route53recovery.CfnReadinessCheck(this, 'WebAppReadinessCheck', {
      readinessCheckName: 'webapp-readiness-check',
      resourceSetName: 'webapp-resource-set'
    });

    // Route 53 Application Recovery Controller - Resource Set
    const resourceSet = new route53recovery.CfnResourceSet(this, 'WebAppResourceSet', {
      resourceSetName: 'webapp-resource-set',
      resourceSetType: 'AWS::ApplicationLoadBalancer::LoadBalancer',
      resources: [alb.loadBalancerArn]
    });

    // Add dependency
    readinessCheck.addDependency(resourceSet);

    // Scaling policies for Auto Scaling Group
    autoScalingGroup.scaleOnCpuUtilization('ScaleOnCPU', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2)
    });

    autoScalingGroup.scaleOnRequestCount('ScaleOnRequestCount', {
      requestsPerTarget: 1000,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2)
    });

    // Tag all resources
    const productionTags = {
      'Environment': 'Production',
      'Application': 'WebApp',
      'Owner': 'DevOps'
    };

    Object.entries(productionTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer'
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://www.${domainName.valueAsString}`,
      description: 'Website URL'
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint'
    });

    new cdk.CfnOutput(this, 'StaticAssetsBucket', {
      value: staticAssetsBucket.bucketName,
      description: 'S3 bucket for static assets'
    });
  }
}
```

This CDK TypeScript infrastructure provides:

1. **Application Load Balancer** with HTTPS listener using ACM certificate
2. **Auto Scaling Group** with EC2 instances across multiple AZs (minimum 2, maximum 10)
3. **RDS MySQL database** with Multi-AZ deployment and storage autoscaling (20GB-100GB)
4. **S3 buckets** for static assets and ALB access logs
5. **Route 53** DNS configuration with A records
6. **IAM roles** with least privilege access for EC2 instances
7. **Security Groups** with appropriate ingress/egress rules
8. **Route 53 Application Recovery Controller** readiness checks for resilience
9. **Auto Scaling policies** based on CPU utilization and request count
10. **CloudWatch monitoring** and performance insights for RDS
11. **All resources tagged** with Environment: Production
12. **Secure parameter** for database password
13. **HTTPS redirect** from HTTP traffic
14. **Storage encryption** for RDS and S3

The infrastructure is designed for production use with high availability, security, and cost optimization features.