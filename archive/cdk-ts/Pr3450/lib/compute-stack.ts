import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  fileSystem: efs.FileSystem;
  dbInstance: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;
  securityGroups: {
    albSg: ec2.SecurityGroup;
    ec2Sg: ec2.SecurityGroup;
    efsSg: ec2.SecurityGroup;
    dbSg: ec2.SecurityGroup;
  };
}

export class ComputeStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create a security group for the ALB
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS traffic from anywhere to the ALB
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the internet'
    );
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from the internet'
    );

    // Create a security group for the EC2 instances
    const ec2Sg = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for the EC2 instances',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from the ALB to the EC2 instances
    ec2Sg.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the ALB'
    );

    // Get environment suffix
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // Create the ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'AppLoadBalancer',
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: albSg,
        loadBalancerName: `alb-${this.region}-${environmentSuffix}`,
      }
    );

    // Create a target group for the ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'AppTargetGroup',
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyHttpCodes: '200',
        },
      }
    );

    // Add listener to the ALB
    const listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    listener.addTargetGroups('DefaultTargetGroup', {
      targetGroups: [targetGroup],
    });

    // Create a role for the EC2 instances
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Create a user data script to mount EFS and configure the application
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -e',
      'exec > >(tee /var/log/user-data.log) 2>&1',
      'echo "Starting user data script at $(date)"',
      '# Instance template updated: 2025-10-07T09:30:00Z - EFS mount fixed',
      '',
      '# Update system and install packages',
      'yum update -y',
      'yum install -y amazon-efs-utils httpd postgresql15',
      '',
      '# Mount EFS',
      'mkdir -p /mnt/efs',
      `mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport ${props.fileSystem.fileSystemId}.efs.${this.region}.amazonaws.com:/ /mnt/efs`,
      'echo "EFS mounted successfully"',
      '',
      '# Create index page',
      'cat > /var/www/html/index.html << "INDEXEOF"',
      '<!DOCTYPE html>',
      '<html>',
      '<head><title>Multi-Region Web App</title></head>',
      '<body>',
      `<h1>Hello from ${this.region}</h1>`,
      '<p>This is a multi-region resilient application</p>',
      `<p>Region: ${this.region}</p>`,
      '<p>EFS Mounted: /mnt/efs</p>',
      '<p>Timestamp: ' + new Date().toISOString() + '</p>',
      '</body>',
      '</html>',
      'INDEXEOF',
      '',
      '# Create health check endpoint',
      'cat > /var/www/html/health << "HEALTHEOF"',
      '{"status":"healthy","region":"' +
        this.region +
        '","timestamp":"' +
        new Date().toISOString() +
        '"}',
      'HEALTHEOF',
      '',
      '# Set proper permissions',
      'chmod 644 /var/www/html/index.html',
      'chmod 644 /var/www/html/health',
      'chown apache:apache /var/www/html/index.html',
      'chown apache:apache /var/www/html/health',
      '',
      '# Start and enable Apache',
      'systemctl start httpd',
      'systemctl enable httpd',
      'systemctl status httpd',
      '',
      '# Verify httpd is running',
      'sleep 5',
      'curl -f http://localhost/health || echo "Health check failed"',
      '',
      '# Write test data to EFS',
      'echo "Test data from ' + this.region + '" > /mnt/efs/test.txt',
      'date >> /mnt/efs/test.txt',
      '',
      'echo "User data script completed successfully at $(date)"'
    );

    // Create the Auto Scaling group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AppAutoScalingGroup',
      {
        vpc: props.vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2Sg,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        role: instanceRole,
        userData,
        healthCheck: autoscaling.HealthCheck.ec2(),
        cooldown: cdk.Duration.seconds(300),
      }
    );

    // Add the ASG to the target group
    this.autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Add scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Add step scaling for more granular control
    const highCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    // Scale out policy
    this.autoScalingGroup.scaleOnMetric('ScaleOutPolicy', {
      metric: highCpuMetric,
      scalingSteps: [
        { upper: 50, change: 0 },
        { lower: 50, upper: 70, change: +1 },
        { lower: 70, upper: 85, change: +2 },
        { lower: 85, change: +3 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.seconds(300),
    });

    // Scale in policy
    this.autoScalingGroup.scaleOnMetric('ScaleInPolicy', {
      metric: highCpuMetric,
      scalingSteps: [
        { upper: 40, change: -1 },
        { lower: 40, change: 0 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.seconds(300),
    });

    // Output the load balancer DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
    });
  }
}
