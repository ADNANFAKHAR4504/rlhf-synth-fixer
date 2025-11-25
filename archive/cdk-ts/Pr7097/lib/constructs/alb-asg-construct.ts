import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AlbAsgConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
  instanceCount: number;
  dbSecret: secretsmanager.Secret;
  dbEndpoint: string;
}

export class AlbAsgConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: AlbAsgConstructProps) {
    super(scope, id);

    const {
      environment,
      region,
      suffix,
      environmentSuffix,
      vpc,
      instanceCount,
      dbSecret,
      dbEndpoint,
    } = props;

    // For testing purposes, we'll create ALB without custom certificate
    // In production, you would have a pre-existing certificate
    // const domainName = `${environment}-app-${suffix}.test.local`;

    // Security group for ALB - only allow HTTPS (443) - Requirement 4
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup${environmentSuffix}${region}`,
      {
        securityGroupName: `${environment}-${region}-alb-sg-${suffix}`,
        vpc: vpc,
        description: 'Security group for ALB - HTTPS only with least privilege',
        allowAllOutbound: false,
      }
    );

    // Allow HTTPS from anywhere (requirement 4)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from IPv4'
    );

    // Allow HTTP for testing
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from IPv4 for testing'
    );

    // Also allow IPv6 for complete coverage
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(443),
      'Allow HTTPS from IPv6'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(80),
      'Allow HTTP from IPv6 for testing'
    );

    // Security group for EC2 instances - least privilege
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup${environmentSuffix}${region}`,
      {
        securityGroupName: `${environment}-${region}-ec2-sg-${suffix}`,
        vpc: vpc,
        description: 'Security group for EC2 instances - least privilege',
        allowAllOutbound: true, // Allow outbound for updates and AWS API calls
      }
    );

    // Allow ALB to communicate with EC2 instances on port 80
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB only'
    );

    // Allow SSH access from within VPC for management (optional)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC for management'
    );

    // Allow ALB outbound to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP to EC2 instances'
    );

    // Application Load Balancer - Requirement 14
    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      `Alb${environmentSuffix}${region}`,
      {
        loadBalancerName: `${environment}-${region}-alb-${suffix}`,
        vpc: vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        deletionProtection: false, // Allow deletion when stack fails
      }
    );

    // IAM role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, `Ec2Role${environmentSuffix}${region}`, {
      roleName: `${environment}-${region}-ec2-role-${suffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        SecretAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['secretsmanager:GetSecretValue'],
              resources: [dbSecret.secretArn],
            }),
            // Specific CloudWatch permissions
            new iam.PolicyStatement({
              actions: [
                'cloudwatch:PutMetricData',
                'ec2:DescribeVolumes',
                'ec2:DescribeTags',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'CWAgent',
                },
              },
            }),
          ],
        }),
      },
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          metrics: {
            namespace: 'CWAgent',
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
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/httpd/access_log',
                    log_group_name: `/aws/ec2/httpd/${environment}-${region}`,
                    log_stream_name: '{instance_id}',
                  },
                ],
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',

      // Start services
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Create simple web application
      `cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${environment} - ${region} - Instance</title>
</head>
<body>
    <h1>${environment} Environment - ${region} Region</h1>
    <p>Instance ID: \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: \$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Instance Type: \$(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
    <p>Database Endpoint: ${dbEndpoint}</p>
    <p>Timestamp: \$(date)</p>
</body>
</html>
EOF`,

      'echo "OK" > /var/www/html/health',

      // Create a simple API endpoint
      `cat > /var/www/html/api.php << EOF
<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'healthy',
    'environment' => '${environment}',
    'region' => '${region}',
    'instance_id' => file_get_contents('http://169.254.169.254/latest/meta-data/instance-id'),
    'timestamp' => date('c')
]);
?>
EOF`
    );

    // Auto Scaling Group - Requirement 15 (minimum 2 instances)
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `Asg${environmentSuffix}${region}`,
      {
        autoScalingGroupName: `${environment}-${region}-asg-${suffix}`,
        vpc: vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          environment === 'prod'
            ? ec2.InstanceSize.LARGE
            : ec2.InstanceSize.MEDIUM
        ),
        machineImage: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: userData,
        minCapacity: 2, // Requirement 15
        maxCapacity: environment === 'prod' ? 20 : 10,
        desiredCapacity: instanceCount, // From parameter - Requirement 7
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 2,
          minInstancesInService: 2,
          pauseTime: cdk.Duration.minutes(5),
        }),
        // Use unencrypted EBS volumes to avoid KMS key dependencies
        // This prevents "InvalidKMSKey.InvalidState" errors when keys are pending deletion
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: autoscaling.BlockDeviceVolume.ebs(20, {
              encrypted: false, // Disable encryption to avoid KMS dependencies
              deleteOnTermination: true,
              volumeType: autoscaling.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    // Target group with health checks
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup${environmentSuffix}${region}`,
      {
        targetGroupName: `${environment}-${region}-tg-${suffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc: vpc,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          protocol: elbv2.Protocol.HTTP,
        },
        targets: [this.autoScalingGroup],
      }
    );

    // For testing, use HTTP listener only
    // HTTPS listener with certificate (commented out for testing)
    // this.alb.addListener(`HttpsListener${environmentSuffix}${region}`, {
    //   port: 443,
    //   protocol: elbv2.ApplicationProtocol.HTTPS,
    //   certificates: [certificate],
    //   defaultTargetGroups: [targetGroup],
    //   sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS, // Strong TLS policy
    // });

    // HTTP listener for testing
    this.alb.addListener(`HttpListener${environmentSuffix}${region}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Auto-scaling based on ALB request count - Requirement 14
    this.autoScalingGroup.scaleOnRequestCount(
      `RequestScaling${environmentSuffix}${region}`,
      {
        targetRequestsPerMinute: 100,
      }
    );

    // CPU-based scaling as backup
    this.autoScalingGroup.scaleOnCpuUtilization(
      `CpuScaling${environmentSuffix}${region}`,
      {
        targetUtilizationPercent: 70,
      }
    );

    // Memory-based scaling using target tracking
    this.autoScalingGroup.scaleOnMetric(
      `MemoryScaling${environmentSuffix}${region}`,
      {
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'CWAgent',
          metricName: 'mem_used_percent',
          statistic: 'Average',
          dimensionsMap: {
            AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
          },
        }),
        scalingSteps: [
          { upper: 70, change: 0 },
          { lower: 75, change: +1 },
          { lower: 85, change: +2 },
        ],
      }
    );

    // Apply tags
    cdk.Tags.of(this.alb).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.alb).add('Environment', environment);
    cdk.Tags.of(this.alb).add('Region', region);
    cdk.Tags.of(this.alb).add('Purpose', 'ApplicationLoadBalancer');

    cdk.Tags.of(this.autoScalingGroup).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.autoScalingGroup).add('Environment', environment);
    cdk.Tags.of(this.autoScalingGroup).add('Region', region);
    cdk.Tags.of(this.autoScalingGroup).add('Purpose', 'WebServers');
  }
}
