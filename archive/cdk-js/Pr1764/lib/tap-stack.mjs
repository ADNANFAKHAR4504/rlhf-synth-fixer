import { Stack, Duration, Tags, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'TapVPC', {
      vpcName: `TapVPC-${environmentSuffix}`,
      ipProtocol: ec2.IpProtocol.DUAL_STACK,
      maxAzs: 2,
      natGateways: 1,
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      roleName: `FlowLogRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Enable VPC Flow Logs for network monitoring
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security Group for Public EC2 instances (HTTP/HTTPS access)
    const publicSecurityGroup = new ec2.SecurityGroup(this, 'PublicSecurityGroup', {
      vpc,
      securityGroupName: `PublicSecurityGroup-${environmentSuffix}`,
      description: 'Security group for public EC2 instances',
      allowAllOutbound: true,
    });

    publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH for management'
    );

    // Security Group for Private EC2 instances
    const privateSecurityGroup = new ec2.SecurityGroup(this, 'PrivateSecurityGroup', {
      vpc,
      securityGroupName: `PrivateSecurityGroup-${environmentSuffix}`,
      description: 'Security group for private EC2 instances',
      allowAllOutbound: true,
    });

    privateSecurityGroup.addIngressRule(
      publicSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from public instances'
    );

    privateSecurityGroup.addIngressRule(
      publicSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from public instances'
    );

    privateSecurityGroup.addIngressRule(
      publicSecurityGroup,
      ec2.Port.tcp(22),
      'Allow SSH from public instances'
    );

    // Network ACL for Private Subnet with additional security layer
    const privateNetworkAcl = new ec2.NetworkAcl(this, 'PrivateNetworkAcl', {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Allow inbound HTTP traffic from public subnet
    privateNetworkAcl.addEntry('AllowInboundHTTP', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/24'), // Public subnet CIDR
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow inbound HTTPS traffic from public subnet
    privateNetworkAcl.addEntry('AllowInboundHTTPS', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/24'), // Public subnet CIDR
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow inbound SSH from public subnet
    privateNetworkAcl.addEntry('AllowInboundSSH', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/24'),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow outbound HTTP/HTTPS for updates
    privateNetworkAcl.addEntry('AllowOutboundHTTP', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    privateNetworkAcl.addEntry('AllowOutboundHTTPS', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports for return traffic
    privateNetworkAcl.addEntry('AllowEphemeralPorts', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 200,
      traffic: ec2.AclTraffic.tcpPortRange(32768, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // IAM role for EC2 instances with CloudWatch permissions
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `EC2Role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      instanceProfileName: `EC2InstanceProfile-${environmentSuffix}`,
      role: ec2Role,
    });

    // User Data script for CloudWatch agent installation
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent',
      'systemctl start amazon-ssm-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
      
      // CloudWatch agent configuration
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      `    "namespace": "TapStack-${environmentSuffix}/EC2",`,
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],',
      '        "metrics_collection_interval": 60,',
      '        "totalcpu": false',
      '      },',
      '      "disk": {',
      '        "measurement": ["used_percent"],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["*"]',
      '      },',
      '      "diskio": {',
      '        "measurement": ["io_time"],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["*"]',
      '      },',
      '      "mem": {',
      '        "measurement": ["mem_used_percent"],',
      '        "metrics_collection_interval": 60',
      '      },',
      '      "netstat": {',
      '        "measurement": ["tcp_established", "tcp_time_wait"],',
      '        "metrics_collection_interval": 60',
      '      },',
      '      "swap": {',
      '        "measurement": ["swap_used_percent"],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  },',
      '  "logs": {',
      '    "logs_collected": {',
      '      "files": {',
      '        "collect_list": [',
      '          {',
      '            "file_path": "/var/log/messages",',
      `            "log_group_name": "/aws/ec2/system-logs-${environmentSuffix}",`,
      '            "log_stream_name": "{instance_id}/messages"',
      '          },',
      '          {',
      '            "file_path": "/var/log/httpd/access_log",',
      `            "log_group_name": "/aws/ec2/httpd-access-${environmentSuffix}",`,
      '            "log_stream_name": "{instance_id}/access"',
      '          }',
      '        ]',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json'
    );

    // Launch Template for Public instances
    const publicLaunchTemplate = new ec2.LaunchTemplate(this, 'PublicLaunchTemplate', {
      launchTemplateName: `PublicLaunchTemplate-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: publicSecurityGroup,
      userData: userData,
      role: ec2Role,
      detailedMonitoring: true,
      associatePublicIpAddress: true,
    });

    // Launch Template for Private instances
    const privateLaunchTemplate = new ec2.LaunchTemplate(this, 'PrivateLaunchTemplate', {
      launchTemplateName: `PrivateLaunchTemplate-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: privateSecurityGroup,
      userData: userData,
      role: ec2Role,
      detailedMonitoring: true,
      associatePublicIpAddress: false,
    });

    // Auto Scaling Group for Public instances with highly responsive scaling
    const publicAutoScalingGroup = new autoscaling.AutoScalingGroup(this, 'PublicAutoScalingGroup', {
      vpc,
      launchTemplate: publicLaunchTemplate,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      autoScalingGroupName: `PublicAutoScalingGroup-${environmentSuffix}`,
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
      healthCheckGracePeriod: Duration.minutes(5),
      healthCheck: autoscaling.HealthCheck.ec2(),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
    });

    // Auto Scaling Group for Private instances with highly responsive scaling
    const privateAutoScalingGroup = new autoscaling.AutoScalingGroup(this, 'PrivateAutoScalingGroup', {
      vpc,
      launchTemplate: privateLaunchTemplate,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      autoScalingGroupName: `PrivateAutoScalingGroup-${environmentSuffix}`,
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
      healthCheckGracePeriod: Duration.minutes(5),
      healthCheck: autoscaling.HealthCheck.ec2(),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
    });

    // Highly responsive target tracking scaling policy for public ASG (2024 feature)
    publicAutoScalingGroup.scaleOnCpuUtilization('PublicCPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.minutes(5),
      scaleOutCooldown: Duration.minutes(3),
      estimatedInstanceWarmup: Duration.minutes(5),
    });

    // Highly responsive target tracking scaling policy for private ASG (2024 feature)  
    privateAutoScalingGroup.scaleOnCpuUtilization('PrivateCPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.minutes(5),
      scaleOutCooldown: Duration.minutes(3),
      estimatedInstanceWarmup: Duration.minutes(5),
    });

    // CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'TapStackDashboard', {
      dashboardName: `TapStack-Infrastructure-Monitoring-${environmentSuffix}`,
    });

    // Add widgets to dashboard for comprehensive monitoring
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Public ASG CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupTotalInstances',
            dimensionsMap: {
              AutoScalingGroupName: publicAutoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Private ASG CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupTotalInstances',
            dimensionsMap: {
              AutoScalingGroupName: privateAutoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // CloudWatch Alarms for monitoring
    new cloudwatch.Alarm(this, 'PublicHighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: publicAutoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'PrivateHighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: privateAutoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Apply tags to all resources
    Tags.of(this).add('Project', 'TapStack');
    Tags.of(this).add('Environment', 'Production');
    Tags.of(this).add('CreatedBy', 'CDK');
    Tags.of(this).add('Purpose', 'ComplexCloudEnvironment');

    // Outputs
    new CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `TapStack-${environmentSuffix}-VPC-ID`,
    });

    new CfnOutput(this, 'PublicAutoScalingGroupName', {
      value: publicAutoScalingGroup.autoScalingGroupName,
      description: 'Public Auto Scaling Group Name',
      exportName: `TapStack-${environmentSuffix}-Public-ASG-Name`,
    });

    new CfnOutput(this, 'PrivateAutoScalingGroupName', {
      value: privateAutoScalingGroup.autoScalingGroupName,
      description: 'Private Auto Scaling Group Name',
      exportName: `TapStack-${environmentSuffix}-Private-ASG-Name`,
    });

    new CfnOutput(this, 'DashboardURL', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=TapStack-Infrastructure-Monitoring`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}