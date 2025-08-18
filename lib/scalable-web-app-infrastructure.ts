import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

export interface ScalableWebAppInfrastructureArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ScalableWebAppInfrastructure extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ScalableWebAppInfrastructureArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:infrastructure:ScalableWebAppInfrastructure', name, args, opts);

    const environmentSuffix = args.environmentSuffix;

    // Configuration
    const config = new pulumi.Config();
    const minCapacity = config.getNumber('minCapacity') || 2;
    const maxCapacity = config.getNumber('maxCapacity') || 10;
    const desiredCapacity = config.getNumber('desiredCapacity') || 3;
    const dbUsername = config.get('dbUsername') || 'admin';
    const allowedSshCidrs = config.getObject<string[]>('allowedSshCidrs') || [
      '10.0.1.0/24',
    ];
    const allowedAlbCidrs = config.getObject<string[]>('allowedAlbCidrs') || [
      '0.0.0.0/0',
    ];

    // Generate secure password
    const dbPassword = new random.RandomPassword(
      `${environmentSuffix}-db-password`,
      {
        length: 32,
        special: true,
        upper: true,
        lower: true,
        numeric: true,
      },
      { parent: this }
    );

    // AWS Provider with explicit region
    const provider = new aws.Provider(
      `aws-provider-${environmentSuffix}`,
      {
        region: 'ap-south-1',
      },
      { parent: this }
    );

    // KMS Key for Secrets Manager
    const secretsKmsKey = new aws.kms.Key(
      `secrets-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for Secrets Manager - ${environmentSuffix}`,
        deletionWindowInDays: 7,
        tags: {
          Name: `secrets-kms-key-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // Store in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `${environmentSuffix}-db-secret`,
      {
        description: `DB credentials for ${environmentSuffix}`,
        kmsKeyId: secretsKmsKey.arn,
        tags: {
          Name: `${environmentSuffix}-db-secret`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `${environmentSuffix}-db-secret-version`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.interpolate`{"username":"${dbUsername}","password":"${dbPassword.result}"}`,
      },
      { provider, parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider }
    );

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'virtualization-type', values: ['hvm'] },
        ],
      },
      { provider }
    );

    // VPC and Networking
    const vpc = new aws.ec2.Vpc(
      `main-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `main-vpc-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // VPC Flow Logs IAM Role
    const vpcFlowLogsRole = new aws.iam.Role(
      `vpc-flow-logs-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ],
        }),
      },
      { provider, parent: this }
    );

    // VPC Flow Logs Policy
    new aws.iam.RolePolicy(
      `vpc-flow-logs-policy-${environmentSuffix}`,
      {
        role: vpcFlowLogsRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider, parent: this }
    );

    // CloudWatch Log Groups (create before VPC Flow Logs)
    const vpcFlowLogsGroup = new aws.cloudwatch.LogGroup(
      `vpc-flow-logs-group-${environmentSuffix}`,
      {
        name: `/aws/vpc/flowlogs-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // VPC Flow Logs
    new aws.ec2.FlowLog(
      `vpc-flow-logs-${environmentSuffix}`,
      {
        iamRoleArn: vpcFlowLogsRole.arn,
        logDestination: vpcFlowLogsGroup.arn,
        logDestinationType: 'cloud-watch-logs',
        vpcId: vpc.id,
        trafficType: 'ALL',
        tags: {
          Name: `vpc-flow-logs-${environmentSuffix}`,
        },
      },
      { provider, parent: this, dependsOn: [vpcFlowLogsGroup] }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `main-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `main-igw-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // Public Subnets for ALB and EC2
    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-1-${environmentSuffix}`,
          Type: 'public',
        },
      },
      { provider, parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-2-${environmentSuffix}`,
          Type: 'public',
        },
      },
      { provider, parent: this }
    );

    const publicSubnets = [publicSubnet1, publicSubnet2];

    // Private Subnets for RDS
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.10.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          Name: `private-subnet-1-${environmentSuffix}`,
          Type: 'private',
        },
      },
      { provider, parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          Name: `private-subnet-2-${environmentSuffix}`,
          Type: 'private',
        },
      },
      { provider, parent: this }
    );

    const privateSubnets = [privateSubnet1, privateSubnet2];

    // NAT Gateway for private subnet internet access
    const natEip = new aws.ec2.Eip(
      `nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${environmentSuffix}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          Name: `nat-gateway-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: {
          Name: `public-rt-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          Name: `private-rt-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // Route Table Associations
    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { provider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { provider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { provider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { provider, parent: this }
    );

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        name: `alb-security-group-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            description: 'HTTP',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: allowedAlbCidrs,
          },
          {
            description: 'HTTPS',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: allowedAlbCidrs,
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `alb-sg-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `ec2-sg-${environmentSuffix}`,
      {
        name: `ec2-security-group-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            description: 'HTTP from ALB',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
          },
          {
            description: 'SSH from allowed CIDRs',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: allowedSshCidrs,
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `ec2-sg-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        name: `rds-security-group-${environmentSuffix}`,
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingress: [
          {
            description: 'MySQL/Aurora from EC2',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [ec2SecurityGroup.id],
          },
        ],
        tags: {
          Name: `rds-sg-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `ec2-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Condition: {
                StringEquals: {
                  'aws:RequestedRegion': 'ap-south-1',
                },
              },
            },
          ],
        }),
        tags: {
          Name: `ec2-role-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // IAM Policy for CloudWatch Logs
    const cloudWatchLogsPolicy = new aws.iam.Policy(
      `cloudwatch-logs-policy-${environmentSuffix}`,
      {
        description: 'Policy for EC2 instances to write to CloudWatch Logs',
        policy: pulumi
          .all([aws.getCallerIdentity().then(i => i.accountId)])
          .apply(([accountId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: `arn:aws:logs:ap-south-1:${accountId}:log-group:/aws/ec2/application-${environmentSuffix}*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudwatch:PutMetricData'],
                  Resource: '*',
                  Condition: {
                    StringEquals: {
                      'cloudwatch:namespace': 'CustomApp/EC2',
                      'aws:RequestedRegion': 'ap-south-1',
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider, parent: this }
    );

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `ec2-role-policy-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: cloudWatchLogsPolicy.arn,
      },
      { provider, parent: this }
    );

    // Instance Profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `ec2-instance-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
      },
      { provider, parent: this }
    );

    // CloudWatch Log Groups
    new aws.cloudwatch.LogGroup(
      `ec2-log-group-${environmentSuffix}`,
      {
        name: `/aws/ec2/application-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `alb-log-group-${environmentSuffix}`,
      {
        name: `/aws/alb/access-logs-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // User Data Script for EC2 instances
    const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent
systemctl start httpd
systemctl enable httpd

# Simple web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Production Web App</title>
</head>
<body>
    <h1>Welcome to Production Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/application-${environmentSuffix}",
                        "log_stream_name": "{instance_id}/httpd/access.log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/application-${environmentSuffix}",
                        "log_stream_name": "{instance_id}/httpd/error.log"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "CustomApp/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`;

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `app-launch-template-${environmentSuffix}`,
      {
        name: `app-launch-template-${environmentSuffix}`,
        imageId: amazonLinuxAmi.then(ami => ami.id),
        instanceType: 't3.micro',
        keyName: config.get('keyPairName') || undefined, // Use config for key pair name
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: pulumi
          .output(userData)
          .apply(ud => Buffer.from(ud).toString('base64')),
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true',
              deleteOnTermination: 'true',
            },
          },
        ],
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `app-server-${environmentSuffix}`,
              Environment: 'production',
            },
          },
        ],
      },
      { provider, parent: this }
    );

    // Application Load Balancer logs bucket
    const albLogsBucket = new aws.s3.Bucket(
      `${environmentSuffix}-alb-logs-bucket`,
      {
        forceDestroy: false,
        tags: {
          Name: `${environmentSuffix}-alb-logs-bucket`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // S3 Bucket ACL
    new aws.s3.BucketAcl(
      `${environmentSuffix}-alb-logs-bucket-acl`,
      {
        bucket: albLogsBucket.id,
        acl: 'private',
      },
      { provider, parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `app-alb-${environmentSuffix}`,
      {
        name: `app-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id],
        enableDeletionProtection: false,
        accessLogs: {
          bucket: albLogsBucket.bucket,
          enabled: true,
          prefix: 'alb-logs',
        },
        tags: {
          Name: `app-alb-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `app-target-group-${environmentSuffix}`,
      {
        name: `app-target-group-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
          port: 'traffic-port',
          protocol: 'HTTP',
        },
        tags: {
          Name: `app-target-group-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // HTTPS Listener
    new aws.lb.Listener(
      `app-alb-https-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { provider, parent: this }
    );

    // HTTP Listener
    new aws.lb.Listener(
      `app-alb-http-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { provider, parent: this }
    );

    // Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `app-asg-${environmentSuffix}`,
      {
        name: `app-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: pulumi.all(publicSubnets.map(s => s.id)),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        minSize: minCapacity,
        maxSize: maxCapacity,
        desiredCapacity: desiredCapacity,
        tags: [
          {
            key: 'Name',
            value: `app-asg-instance-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'production',
            propagateAtLaunch: true,
          },
        ],
      },
      { provider, parent: this }
    );

    // Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `scale-up-policy-${environmentSuffix}`,
      {
        name: `scale-up-policy-${environmentSuffix}`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { provider, parent: this }
    );

    const scaleDownPolicy = new aws.autoscaling.Policy(
      `scale-down-policy-${environmentSuffix}`,
      {
        name: `scale-down-policy-${environmentSuffix}`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { provider, parent: this }
    );

    // CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `cpu-high-alarm-${environmentSuffix}`,
      {
        name: `cpu-high-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        alarmActions: [scaleUpPolicy.arn],
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `cpu-low-alarm-${environmentSuffix}`,
      {
        name: `cpu-low-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 10,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        alarmActions: [scaleDownPolicy.arn],
      },
      { provider, parent: this }
    );

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${environmentSuffix}`,
      {
        name: `rds-subnet-group-${environmentSuffix}`,
        subnetIds: pulumi.all(privateSubnets.map(s => s.id)),
        tags: {
          Name: `rds-subnet-group-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // KMS Key for RDS encryption
    const rdsKmsKey = new aws.kms.Key(
      `rds-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption - ${environmentSuffix}`,
        deletionWindowInDays: 7,
        tags: {
          Name: `rds-kms-key-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // IAM Role for RDS Enhanced Monitoring
    const rdsMonitoringRole = new aws.iam.Role(
      `rds-monitoring-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        }),
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `rds-monitoring-policy-${environmentSuffix}`,
      {
        role: rdsMonitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { provider, parent: this }
    );

    // RDS Instance
    const rdsInstance = new aws.rds.Instance(
      `app-database-${environmentSuffix}`,
      {
        identifier: `app-database-${environmentSuffix}`,
        allocatedStorage: 30,
        maxAllocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: rdsKmsKey.arn,
        engine: 'mysql',
        engineVersion: '8.0.39',
        instanceClass: 'db.t3.micro',
        dbName: 'appdb',
        username: dbUsername,
        manageMasterUserPassword: true,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: rdsSubnetGroup.name,
        backupRetentionPeriod: 30,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        multiAz: true,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `app-database-final-snapshot-${environmentSuffix}`,
        deletionProtection: true,
        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,
        monitoringInterval: 60,
        monitoringRoleArn: rdsMonitoringRole.arn,
        autoMinorVersionUpgrade: true,
        tags: {
          Name: `app-database-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { provider, parent: this }
    );

    // RDS CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `rds-connections-alarm-${environmentSuffix}`,
      {
        name: `rds-connections-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 15,
        alarmDescription: 'This metric monitors RDS connections',
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `rds-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors RDS CPU utilization',
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
      },
      { provider, parent: this }
    );

    // ALB Health Check Alarm
    new aws.cloudwatch.MetricAlarm(
      `alb-healthy-hosts-alarm-${environmentSuffix}`,
      {
        name: `alb-healthy-hosts-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'This metric monitors ALB healthy hosts',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
      },
      { provider, parent: this }
    );

    // Create a WAF WebACL with comprehensive security rules
    const webAcl = new aws.wafv2.WebAcl(
      `web-acl-${environmentSuffix}`,
      {
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'AWS-AWSManagedRulesCommonRuleSet',
            priority: 0,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              metricName: 'CommonRuleSetMetric',
              cloudwatchMetricsEnabled: true,
            },
          },
          {
            name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
            priority: 1,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              metricName: 'KnownBadInputsMetric',
              cloudwatchMetricsEnabled: true,
            },
          },
          {
            name: 'AWS-AWSManagedRulesSQLiRuleSet',
            priority: 2,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              metricName: 'SQLiRuleSetMetric',
              cloudwatchMetricsEnabled: true,
            },
          },
          {
            name: 'RateLimitRule',
            priority: 3,
            action: { block: {} },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              metricName: 'RateLimitMetric',
              cloudwatchMetricsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: 'webAclMetric',
          sampledRequestsEnabled: true,
        },
      },
      { provider, parent: this }
    );

    // Associate WAF WebACL with ALB
    new aws.wafv2.WebAclAssociation(
      `web-acl-association-${environmentSuffix}`,
      {
        resourceArn: alb.arn,
        webAclArn: webAcl.arn,
      },
      { provider, parent: this }
    );

    // Set outputs
    this.albDnsName = alb.dnsName;
    this.vpcId = vpc.id;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.autoScalingGroupName = autoScalingGroup.name;

    // Register outputs
    this.registerOutputs({
      albDnsName: this.albDnsName,
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      autoScalingGroupName: this.autoScalingGroupName,
    });
  }
}
