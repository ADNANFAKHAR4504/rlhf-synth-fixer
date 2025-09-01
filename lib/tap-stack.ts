import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment-specific configurations
    const environment = this.node.tryGetContext('environment') || 'development';
    const isProd = environment === 'production';
    const isStaging = environment === 'staging';

    // Adjust instance sizes based on environment
    const instanceType = isProd
      ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL)
      : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO);

    // Adjust capacity based on environment
    const minCapacity = isProd ? 3 : 2;
    const maxCapacity = isProd ? 20 : 10;
    const desiredCapacity = isProd ? 3 : 2;

    // Adjust log retention based on environment
    const logRetentionDays = isProd ? 365 : isStaging ? 180 : 90;

    // 1. Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use exactly 2 AZs as required
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
      natGateways: 2, // One NAT Gateway per AZ for high availability
    });

    // 2. Create S3 bucket for ALB access logs
    const albLogsBucket = new s3.Bucket(this, 'ALBLogsBucket', {
      bucketName: `webapp-alb-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(logRetentionDays), // Environment-specific retention
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // Grant ALB service permission to write logs to S3
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSLogDeliveryWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${albLogsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Grant ELB service account permission for ALB logs
    // ELB service account IDs by region - AWS managed accounts for ALB access logs
    const elbServiceAccountIds: { [region: string]: string } = {
      'us-east-1': '127311923021',
      'us-east-2': '033677994240',
      'us-west-1': '027434742980',
      'us-west-2': '797873946194',
      'eu-west-1': '156460612806',
      'eu-west-2': '652711504416',
      'eu-west-3': '009996457667',
      'eu-central-1': '054676820928',
      'ap-northeast-1': '582318560864',
      'ap-northeast-2': '600734575887',
      'ap-southeast-1': '114774131450',
      'ap-southeast-2': '783225319266',
      'ap-south-1': '718504428378',
      'sa-east-1': '507241528517',
      'ca-central-1': '985666609251',
      // Add more regions as needed
    };

    const elbServiceAccountId = elbServiceAccountIds[this.region];
    if (!elbServiceAccountId) {
      throw new Error(
        `ELB service account ID not found for region: ${this.region}. Please add the service account ID for this region.`
      );
    }

    const elbServiceAccount = new iam.AccountPrincipal(elbServiceAccountId);
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSLogDeliveryAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [elbServiceAccount],
        actions: ['s3:GetBucketAcl'],
        resources: [albLogsBucket.bucketArn],
      })
    );

    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSLogDeliveryWrite',
        effect: iam.Effect.ALLOW,
        principals: [elbServiceAccount],
        actions: ['s3:PutObject'],
        resources: [`${albLogsBucket.bucketArn}/*`],
      })
    );

    // 3. Create Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // Allow HTTP inbound traffic (for demo - in production, add HTTPS)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Add HTTPS support for production environments
    if (isProd) {
      albSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'Allow HTTPS traffic'
      );
    }

    // Allow outbound to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP to EC2 instances'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true, // Allow outbound for updates and internet access via NAT
    });

    // Allow inbound traffic only from ALB
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // 4. Create IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager
      ],
    });

    // Add custom policy for CloudWatch metrics and logs
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: ['*'],
      })
    );

    // 5. Create Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: instanceType,
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(8, {
              encrypted: false, // Explicitly disable encryption to avoid KMS key issues
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
        userData: ec2.UserData.custom(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        
        # Create a simple web page
        cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Scalable Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background-color: #232f3e; color: white; padding: 20px; border-radius: 5px; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
        .instance-info { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #007dbc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Scalable Web Application</h1>
            <p>Deployed with AWS CDK - High Availability & Auto Scaling</p>
        </div>
        <div class="content">
            <h2>Infrastructure Features:</h2>
            <ul>
                <li>✅ Multi-AZ VPC with public/private subnets</li>
                <li>✅ Application Load Balancer with HTTP (HTTPS ready)</li>
                <li>✅ Auto Scaling Group for high availability</li>
                <li>✅ NAT Gateways for secure outbound connectivity</li>
                <li>✅ S3 bucket for ALB access logs</li>
                <li>✅ IAM roles with least privilege access</li>
            </ul>
            <div class="instance-info">
                <h3>Instance Information:</h3>
                <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
                <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
                <p><strong>Region:</strong> us-west-2</p>
            </div>
        </div>
    </div>
    
    <script>
        // Fetch instance metadata
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(err => document.getElementById('instance-id').textContent = 'Unable to fetch');
            
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(response => response.text())
            .then(data => document.getElementById('az').textContent = data)
            .catch(err => document.getElementById('az').textContent = 'Unable to fetch');
    </script>
</body>
</html>
EOF

        # Install CloudWatch agent
        yum install -y amazon-cloudwatch-agent
        
        # Create health check endpoint
        cat > /var/www/html/health << 'EOF'
OK
EOF
      `),
        requireImdsv2: true, // Enforce IMDSv2 for security
      }
    );

    // 6. Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc,
        launchTemplate,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Deploy in private subnets only
        },
        minCapacity: minCapacity, // Minimum instances for high availability
        maxCapacity: maxCapacity, // Maximum instances for scalability
        desiredCapacity: desiredCapacity, // Initial desired capacity
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Add scaling policies
    autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // 7. Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Deploy ALB in public subnets
      },
      securityGroup: albSecurityGroup,
    });

    // Enable access logging
    alb.logAccessLogs(albLogsBucket, 'access-logs');

    // 8. Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targetType: elbv2.TargetType.INSTANCE,
      }
    );

    // 9. Add HTTP Listener (for demo - in production, add HTTPS with valid certificate)
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // 12. Output important information
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: albLogsBucket.bucketName,
      description: 'S3 Bucket for ALB Access Logs',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Project', 'ScalableWebApp');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Add cost center tag for production
    if (isProd) {
      cdk.Tags.of(this).add('CostCenter', 'Production');
    }
  }
}
