/**
 * tap-stack.ts
 *
 * Multi-AZ Failover Payment Processing API Infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  notificationEmail?: string;
  hostedZoneName?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryAlbDnsName: pulumi.Output<string>;
  public readonly secondaryAlbDnsName: pulumi.Output<string>;
  public readonly primaryRoute53Record: pulumi.Output<string>;
  public readonly secondaryRoute53Record: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const notificationEmail = args.notificationEmail || 'admin@example.com';
    const hostedZoneName = args.hostedZoneName || 'example.com';
    const tags = args.tags || {};

    // Create VPC for self-sufficient deployment
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `payment-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `payment-igw-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create public subnets in three AZs
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
    const publicSubnets = azs.map((az, index) => {
      return new aws.ec2.Subnet(
        `payment-public-subnet-${az}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `payment-public-subnet-${az}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `payment-public-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate route table with public subnets
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${azs[index]}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Subnet IDs for use throughout the stack
    const allSubnetIds = publicSubnets.map(s => s.id);

    // FIXED: Added environmentSuffix to Security Group names
    const albSg = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for payment ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: { ...tags, Name: `payment-alb-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIXED: Restrict health check traffic to AWS IP ranges
    // AWS health check IP ranges for us-east-1
    const awsHealthCheckCidrs = [
      '54.239.98.0/24',
      '54.239.99.0/24',
      '54.239.100.0/24',
      '54.239.101.0/24',
    ];

    const instanceSg = new aws.ec2.SecurityGroup(
      `payment-instance-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for payment instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSg.id],
            description: 'Allow HTTP from ALB',
          },
          // FIXED: Health check traffic restricted to AWS IP ranges
          ...awsHealthCheckCidrs.map(cidr => ({
            protocol: 'tcp' as const,
            fromPort: 80,
            toPort: 80,
            cidrBlocks: [cidr],
            description: 'Allow health checks from AWS',
          })),
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: { ...tags, Name: `payment-instance-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIXED: Added environmentSuffix to KMS key
    const kmsKey = new aws.kms.Key(
      `payment-ebs-key-${environmentSuffix}`,
      {
        description: `KMS key for EBS encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 30,
        tags: { ...tags, Name: `payment-ebs-key-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-ebs-key-alias-${environmentSuffix}`,
      {
        name: `alias/payment-ebs-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // FIXED: Added lifecycle policy to S3 bucket
    const logsBucket = new aws.s3.Bucket(
      `payment-alb-logs-${environmentSuffix}`,
      {
        bucket: `payment-alb-logs-${environmentSuffix}`,
        forceDestroy: true,
        lifecycleRules: [
          {
            enabled: true,
            id: 'delete-old-logs',
            expiration: {
              days: 90,
            },
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 60,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: { ...tags, Name: `payment-alb-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Bucket policy for ALB access logs
    const elbServiceAccount = aws.elb.getServiceAccount({});
    const bucketPolicy = new aws.s3.BucketPolicy(
      `payment-alb-logs-policy-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        policy: pulumi
          .all([logsBucket.arn, elbServiceAccount])
          .apply(([arn, account]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: account.arn },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // FIXED: Added environmentSuffix to ALB name
    const primaryAlb = new aws.lb.LoadBalancer(
      `payment-alb-primary-${environmentSuffix}`,
      {
        name: `alb-pri-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: allSubnetIds, // Use 3 subnets across AZs
        enableCrossZoneLoadBalancing: true,
        enableDeletionProtection: false,
        accessLogs: {
          bucket: logsBucket.bucket,
          enabled: true,
          prefix: 'primary-alb',
        },
        tags: {
          ...tags,
          Name: `payment-alb-primary-${environmentSuffix}`,
          FailoverPriority: 'primary',
        },
      },
      { parent: this, dependsOn: [bucketPolicy] }
    );

    // Secondary ALB for failover
    const secondaryAlb = new aws.lb.LoadBalancer(
      `payment-alb-secondary-${environmentSuffix}`,
      {
        name: `alb-sec-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: allSubnetIds,
        enableCrossZoneLoadBalancing: true,
        enableDeletionProtection: false,
        accessLogs: {
          bucket: logsBucket.bucket,
          enabled: true,
          prefix: 'secondary-alb',
        },
        tags: {
          ...tags,
          Name: `payment-alb-secondary-${environmentSuffix}`,
          FailoverPriority: 'secondary',
        },
      },
      { parent: this, dependsOn: [bucketPolicy] }
    );

    // FIXED: Set deregistrationDelay to 20 seconds
    const primaryTargetGroup = new aws.lb.TargetGroup(
      `payment-tg-primary-${environmentSuffix}`,
      {
        name: `tg-pri-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        deregistrationDelay: 20,
        healthCheck: {
          enabled: true,
          interval: 10,
          path: '/health',
          protocol: 'HTTP',
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        stickiness: {
          enabled: true,
          type: 'lb_cookie',
          cookieDuration: 86400,
        },
        tags: { ...tags, Name: `payment-tg-primary-${environmentSuffix}` },
      },
      { parent: this }
    );

    const secondaryTargetGroup = new aws.lb.TargetGroup(
      `payment-tg-secondary-${environmentSuffix}`,
      {
        name: `tg-sec-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        deregistrationDelay: 20,
        healthCheck: {
          enabled: true,
          interval: 10,
          path: '/health',
          protocol: 'HTTP',
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        stickiness: {
          enabled: true,
          type: 'lb_cookie',
          cookieDuration: 86400,
        },
        tags: { ...tags, Name: `payment-tg-secondary-${environmentSuffix}` },
      },
      { parent: this }
    );

    // For testing purposes, use HTTP instead of HTTPS to avoid certificate complexity
    // In production, use ACM to request or import certificates
    new aws.lb.Listener(
      `payment-listener-primary-${environmentSuffix}`,
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    new aws.lb.Listener(
      `payment-listener-secondary-${environmentSuffix}`,
      {
        loadBalancerArn: secondaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: secondaryTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = pulumi.output(
      aws.ec2.getAmi({
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
          {
            name: 'state',
            values: ['available'],
          },
        ],
      })
    );

    // FIXED: Use dynamic AMI, added user data, proper IAM role
    const instanceRole = new aws.iam.Role(
      `payment-instance-role-${environmentSuffix}`,
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
            },
          ],
        }),
        tags: { ...tags, Name: `payment-instance-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `payment-instance-profile-${environmentSuffix}`,
      {
        role: instanceRole.name,
      },
      { parent: this }
    );

    // Attach CloudWatch and SSM policies
    new aws.iam.RolePolicyAttachment(
      `payment-cloudwatch-policy-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ssm-policy-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    const userData = `#!/bin/bash
set -e
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat > /var/www/html/health <<EOF
OK
EOF

# CloudWatch agent for monitoring
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
`;

    const primaryLaunchTemplate = new aws.ec2.LaunchTemplate(
      `payment-lt-primary-${environmentSuffix}`,
      {
        imageId: ami.apply(a => a.id),
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true',
              kmsKeyId: kmsKey.arn,
              deleteOnTermination: 'true',
            },
          },
        ],
        networkInterfaces: [
          {
            associatePublicIpAddress: 'true',
            securityGroups: [instanceSg.id],
            deleteOnTermination: 'true',
          },
        ],
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `payment-instance-primary-${environmentSuffix}`,
              Environment: environmentSuffix,
              CostCenter: 'payments',
              FailoverPriority: 'primary',
            },
          },
        ],
      },
      { parent: this }
    );

    const secondaryLaunchTemplate = new aws.ec2.LaunchTemplate(
      `payment-lt-secondary-${environmentSuffix}`,
      {
        imageId: ami.apply(a => a.id),
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true',
              kmsKeyId: kmsKey.arn,
              deleteOnTermination: 'true',
            },
          },
        ],
        networkInterfaces: [
          {
            associatePublicIpAddress: 'true',
            securityGroups: [instanceSg.id],
            deleteOnTermination: 'true',
          },
        ],
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `payment-instance-secondary-${environmentSuffix}`,
              Environment: environmentSuffix,
              CostCenter: 'payments',
              FailoverPriority: 'secondary',
            },
          },
        ],
      },
      { parent: this }
    );

    // FIXED: Proper subnet selection per AZ
    azs.map((az, idx) => {
      return new aws.autoscaling.Group(
        `payment-asg-primary-${az}-${environmentSuffix}`,
        {
          vpcZoneIdentifiers: [publicSubnets[idx].id],
          desiredCapacity: 2,
          maxSize: 2,
          minSize: 2,
          launchTemplate: {
            id: primaryLaunchTemplate.id,
            version: '$Latest',
          },
          targetGroupArns: [primaryTargetGroup.arn],
          healthCheckType: 'ELB',
          healthCheckGracePeriod: 90,
          forceDelete: true,
          tags: [
            {
              key: 'Name',
              value: `payment-asg-primary-${az}-${environmentSuffix}`,
              propagateAtLaunch: true,
            },
            {
              key: 'Environment',
              value: environmentSuffix,
              propagateAtLaunch: true,
            },
            {
              key: 'CostCenter',
              value: 'payments',
              propagateAtLaunch: true,
            },
            {
              key: 'FailoverPriority',
              value: 'primary',
              propagateAtLaunch: true,
            },
          ],
        },
        { parent: this }
      );
    });

    azs.map((az, idx) => {
      return new aws.autoscaling.Group(
        `payment-asg-secondary-${az}-${environmentSuffix}`,
        {
          vpcZoneIdentifiers: [publicSubnets[idx].id],
          desiredCapacity: 2,
          maxSize: 2,
          minSize: 2,
          launchTemplate: {
            id: secondaryLaunchTemplate.id,
            version: '$Latest',
          },
          targetGroupArns: [secondaryTargetGroup.arn],
          healthCheckType: 'ELB',
          healthCheckGracePeriod: 90,
          forceDelete: true,
          tags: [
            {
              key: 'Name',
              value: `payment-asg-secondary-${az}-${environmentSuffix}`,
              propagateAtLaunch: true,
            },
            {
              key: 'Environment',
              value: environmentSuffix,
              propagateAtLaunch: true,
            },
            {
              key: 'CostCenter',
              value: 'payments',
              propagateAtLaunch: true,
            },
            {
              key: 'FailoverPriority',
              value: 'secondary',
              propagateAtLaunch: true,
            },
          ],
        },
        { parent: this }
      );
    });

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(
      `payment-failover-topic-${environmentSuffix}`,
      {
        displayName: 'Payment Failover Notifications',
        tags: { ...tags, Name: `payment-failover-topic-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.sns.TopicSubscription(
      `payment-sns-sub-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: notificationEmail,
      },
      { parent: this }
    );

    // FIXED: Calculate 50% threshold properly (3 out of 6 instances)
    new aws.cloudwatch.MetricAlarm(
      `payment-unhealthy-primary-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 30,
        statistic: 'Average',
        threshold: 3, // 50% of 6 instances
        alarmDescription: 'Alert when primary unhealthy targets exceed 50%',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'notBreaching',
        dimensions: {
          LoadBalancer: primaryAlb.arnSuffix,
          TargetGroup: primaryTargetGroup.arnSuffix,
        },
        tags: {
          ...tags,
          Name: `payment-unhealthy-primary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `payment-unhealthy-secondary-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 30,
        statistic: 'Average',
        threshold: 3,
        alarmDescription: 'Alert when secondary unhealthy targets exceed 50%',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'notBreaching',
        dimensions: {
          LoadBalancer: secondaryAlb.arnSuffix,
          TargetGroup: secondaryTargetGroup.arnSuffix,
        },
        tags: {
          ...tags,
          Name: `payment-unhealthy-secondary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Additional CloudWatch alarms for comprehensive monitoring
    new aws.cloudwatch.MetricAlarm(
      `payment-latency-primary-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription:
          'Alert when primary target response time exceeds 1 second',
        alarmActions: [snsTopic.arn],
        dimensions: {
          LoadBalancer: primaryAlb.arnSuffix,
          TargetGroup: primaryTargetGroup.arnSuffix,
        },
        tags: { ...tags, Name: `payment-latency-primary-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIXED: Added both HTTP and TCP health checks
    const primaryHealthCheck = new aws.route53.HealthCheck(
      `payment-health-primary-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: primaryAlb.dnsName,
        port: 80,
        requestInterval: 10,
        failureThreshold: 3,
        measureLatency: true,
        tags: { ...tags, Name: `payment-health-primary-${environmentSuffix}` },
      },
      { parent: this }
    );

    const primaryTcpHealthCheck = new aws.route53.HealthCheck(
      `payment-health-tcp-primary-${environmentSuffix}`,
      {
        type: 'TCP',
        fqdn: primaryAlb.dnsName,
        port: 80,
        requestInterval: 10,
        failureThreshold: 3,
        tags: {
          ...tags,
          Name: `payment-health-tcp-primary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const secondaryHealthCheck = new aws.route53.HealthCheck(
      `payment-health-secondary-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: secondaryAlb.dnsName,
        port: 80,
        requestInterval: 10,
        failureThreshold: 3,
        measureLatency: true,
        tags: {
          ...tags,
          Name: `payment-health-secondary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const secondaryTcpHealthCheck = new aws.route53.HealthCheck(
      `payment-health-tcp-secondary-${environmentSuffix}`,
      {
        type: 'TCP',
        fqdn: secondaryAlb.dnsName,
        port: 80,
        requestInterval: 10,
        failureThreshold: 3,
        tags: {
          ...tags,
          Name: `payment-health-tcp-secondary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Combined health check using calculated health checks
    const primaryCombinedHealthCheck = new aws.route53.HealthCheck(
      `payment-health-combined-primary-${environmentSuffix}`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [primaryHealthCheck.id, primaryTcpHealthCheck.id],
        tags: {
          ...tags,
          Name: `payment-health-combined-primary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const secondaryCombinedHealthCheck = new aws.route53.HealthCheck(
      `payment-health-combined-secondary-${environmentSuffix}`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [
          secondaryHealthCheck.id,
          secondaryTcpHealthCheck.id,
        ],
        tags: {
          ...tags,
          Name: `payment-health-combined-secondary-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Route 53 Hosted Zone (create new for self-sufficient deployment)
    const zone = new aws.route53.Zone(
      `payment-zone-${environmentSuffix}`,
      {
        name: hostedZoneName,
        comment: `Hosted zone for payment API - ${environmentSuffix}`,
        tags: { ...tags, Name: `payment-zone-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIXED: Created both primary and secondary failover records
    const primaryRecord = new aws.route53.Record(
      `payment-primary-${environmentSuffix}`,
      {
        zoneId: zone.zoneId,
        name: `api-${environmentSuffix}`,
        type: 'A',
        setIdentifier: `primary-${environmentSuffix}`,
        failoverRoutingPolicies: [
          {
            type: 'PRIMARY',
          },
        ],
        aliases: [
          {
            name: primaryAlb.dnsName,
            zoneId: primaryAlb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
        healthCheckId: primaryCombinedHealthCheck.id,
      },
      { parent: this }
    );

    const secondaryRecord = new aws.route53.Record(
      `payment-secondary-${environmentSuffix}`,
      {
        zoneId: zone.zoneId,
        name: `api-${environmentSuffix}`,
        type: 'A',
        setIdentifier: `secondary-${environmentSuffix}`,
        failoverRoutingPolicies: [
          {
            type: 'SECONDARY',
          },
        ],
        aliases: [
          {
            name: secondaryAlb.dnsName,
            zoneId: secondaryAlb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
        healthCheckId: secondaryCombinedHealthCheck.id,
      },
      { parent: this }
    );

    this.primaryAlbDnsName = primaryAlb.dnsName;
    this.secondaryAlbDnsName = secondaryAlb.dnsName;
    this.primaryRoute53Record = primaryRecord.fqdn;
    this.secondaryRoute53Record = secondaryRecord.fqdn;

    this.registerOutputs({
      primaryAlbDnsName: this.primaryAlbDnsName,
      secondaryAlbDnsName: this.secondaryAlbDnsName,
      primaryRoute53Record: this.primaryRoute53Record,
      secondaryRoute53Record: this.secondaryRoute53Record,
      primaryTargetGroupArn: primaryTargetGroup.arn,
      secondaryTargetGroupArn: secondaryTargetGroup.arn,
      snsTopicArn: snsTopic.arn,
      kmsKeyId: kmsKey.id,
      logsBucketName: logsBucket.id,
    });
  }
}
