import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * Application Tier Construct that creates an Auto Scaling Group of EC2 instances
 * behind an Application Load Balancer for high availability and scalability
 */
export class ApplicationTierConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;
  public readonly loadBalancerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.Vpc, config: StackConfig) {
    super(scope, id);

    // Create security group for Application Load Balancer
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSecurityGroup',
      {
        vpc,
        description:
          'Security group for Application Load Balancer - allows HTTP/HTTPS from internet',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP and HTTPS traffic from the internet to ALB
    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );
    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Create security group for EC2 instances
    this.applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description:
          'Security group for application EC2 instances - allows traffic from ALB',
        allowAllOutbound: true, // Allow outbound for package updates and external API calls
      }
    );

    // Allow traffic from ALB to EC2 instances on port 80
    this.applicationSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from Application Load Balancer'
    );

    // Allow SSH access for maintenance (restrict to specific IP ranges in production)
    if (config.security.allowSSHAccess) {
      config.security.sshAllowedCidrs.forEach(cidr => {
        this.applicationSecurityGroup.addIngressRule(
          ec2.Peer.ipv4(cidr),
          ec2.Port.tcp(22),
          'Allow SSH access for maintenance'
        );
      });
    }

    // Create IAM role for EC2 instances with necessary permissions
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances in the application tier',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Create instance profile for EC2 role
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [ec2Role.roleName],
      instanceProfileName: `MultiRegionApp-EC2-Profile-${config.region}`,
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd mysql',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Create a simple web page
      'echo "<html><body><h1>Multi-Region Application</h1>" > /var/www/html/index.html',
      `echo "<p>Region: ${config.region}</p>" >> /var/www/html/index.html`,
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',
      'echo "</body></html>" >> /var/www/html/index.html',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'MultiRegionApp/EC2',
          metrics_collected: {
            cpu: {
              measurement: [
                'cpu_usage_idle',
                'cpu_usage_iowait',
                'cpu_usage_user',
                'cpu_usage_system',
              ],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
        // Removed logs configuration to avoid conflicts with CloudFormation-managed log groups
        // Log groups are created by the MonitoringConstruct instead
      }),
      'EOF',

      // Start CloudWatch agent with retry mechanism
      'sleep 10',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Create launch template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: new ec2.InstanceType(config.autoScaling.instanceType),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.applicationSecurityGroup,
      userData,
      role: ec2Role,

      // Enable detailed monitoring
      detailedMonitoring: config.security.enableDetailedMonitoring,

      // Instance metadata service configuration
      requireImdsv2: true,
      httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      httpPutResponseHopLimit: 2,
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: config.autoScaling.minCapacity,
        maxCapacity: config.autoScaling.maxCapacity,
        desiredCapacity: config.autoScaling.desiredCapacity,

        // Deploy instances in private subnets for security
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },

        // Health check configuration
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(
            config.autoScaling.healthCheckGracePeriod
          ),
        }),

        // Instance replacement policy
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: config.autoScaling.minCapacity,
          pauseTime: cdk.Duration.seconds(config.autoScaling.scaleUpCooldown),
        }),
      }
    );

    // Configure Auto Scaling policies based on CPU utilization
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: config.autoScaling.scaleUpThreshold,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: this.loadBalancerSecurityGroup,

        // Deploy ALB in public subnets
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Create target group for Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],

      // Health check configuration
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(config.loadBalancer.healthCheckInterval),
        path: config.loadBalancer.healthCheckPath,
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(config.loadBalancer.healthCheckTimeout),
        unhealthyThresholdCount: config.loadBalancer.unhealthyThresholdCount,
        healthyThresholdCount: config.loadBalancer.healthyThresholdCount,
      },

      // Deregistration delay
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Create listener for ALB
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Apply comprehensive tagging
    const resources = [
      this.loadBalancer,
      this.autoScalingGroup,
      this.applicationSecurityGroup,
      this.loadBalancerSecurityGroup,
      launchTemplate,
      targetGroup,
    ];

    resources.forEach(resource => {
      Object.entries(config.tags).forEach(([key, value]) => {
        cdk.Tags.of(resource).add(key, value);
      });
    });

    // Add specific name tags
    cdk.Tags.of(this.loadBalancer).add(
      'Name',
      `MultiRegionApp-ALB-${config.region}`
    );
    cdk.Tags.of(this.autoScalingGroup).add(
      'Name',
      `MultiRegionApp-ASG-${config.region}`
    );
    cdk.Tags.of(this.applicationSecurityGroup).add(
      'Name',
      `MultiRegionApp-App-SG-${config.region}`
    );
    cdk.Tags.of(this.loadBalancerSecurityGroup).add(
      'Name',
      `MultiRegionApp-ALB-SG-${config.region}`
    );
  }
}
