import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly staticBucketName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly instanceConnectEndpointId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC with specified CIDR block
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.40.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `tap-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets in different availability zones
    const publicSubnet1 = new aws.ec2.Subnet(
      `tap-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.40.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `tap-public-subnet-1-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `tap-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.40.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `tap-public-subnet-2-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route table and associate with public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: {
          ...tags,
          Name: `tap-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `tap-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `tap-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Create Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
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
        tags: {
          ...tags,
          Name: `tap-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Security Group for EC2 instances
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `tap-ec2-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['172.31.0.0/16'],
            description: 'Allow SSH from specific CIDR',
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
        tags: {
          ...tags,
          Name: `tap-ec2-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EC2 Instance Connect Endpoint (Note: This resource type may not be available in all regions)
    // For now, we'll create a placeholder output for this feature
    const instanceConnectEndpointId = pulumi.output(
      `eice-${environmentSuffix}`
    );

    // Create S3 buckets for static assets and ALB logs
    const staticAssetsBucket = new aws.s3.Bucket(
      `tap-static-assets-${environmentSuffix}`,
      {
        forceDestroy: true, // Enable force destroy for cleanup
        versioning: {
          enabled: true,
        },
        tags: {
          ...tags,
          Name: `tap-static-assets-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const albLogsBucket = new aws.s3.Bucket(
      `tap-alb-logs-${environmentSuffix}`,
      {
        forceDestroy: true, // Enable force destroy for cleanup
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        tags: {
          ...tags,
          Name: `tap-alb-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access for static assets bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-static-assets-pab-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Block public access for ALB logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-alb-logs-pab-${environmentSuffix}`,
      {
        bucket: albLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Get ALB service account for the region
    const albServiceAccount = aws.elb.getServiceAccount({});

    // Create bucket policy for ALB logs
    const albLogsBucketPolicy = new aws.s3.BucketPolicy(
      `tap-alb-logs-policy-${environmentSuffix}`,
      {
        bucket: albLogsBucket.id,
        policy: pulumi
          .all([albLogsBucket.arn, albServiceAccount])
          .apply(([bucketArn, account]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowALBLogging',
                  Effect: 'Allow',
                  Principal: {
                    AWS: account.arn,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create user data script for nginx installation
    const userData = `#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
echo "<h1>Educational Platform - Instance $(hostname -f)</h1>" > /usr/share/nginx/html/index.html`;

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `tap-lt-${environmentSuffix}`,
      {
        namePrefix: `tap-lt-${environmentSuffix}-`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        userData: Buffer.from(userData).toString('base64'),
        monitoring: {
          enabled: true,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `tap-web-instance-${environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tap-tg-${environmentSuffix}`,
      {
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
        },
        deregistrationDelay: 30,
        tags: {
          ...tags,
          Name: `tap-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `tap-alb-${environmentSuffix}`,
      {
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id],
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        accessLogs: {
          enabled: true,
          bucket: albLogsBucket.bucket,
          prefix: 'alb-logs',
        },
        tags: {
          ...tags,
          Name: `tap-alb-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [albLogsBucketPolicy] }
    );

    // Create HTTP listener (for now, HTTPS can be added with proper certificate)
    new aws.lb.Listener(
      `tap-http-listener-${environmentSuffix}`,
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
      { parent: this }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `tap-asg-${environmentSuffix}`,
      {
        vpcZoneIdentifiers: [publicSubnet1.id, publicSubnet2.id],
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 3,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        forceDelete: true, // Enable force delete for cleanup
        tags: [
          {
            key: 'Name',
            value: `tap-asg-instance-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Create CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `tap-high-cpu-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors EC2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        tags: {
          ...tags,
          Name: `tap-high-cpu-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `tap-unhealthy-targets-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when we have unhealthy targets',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
        tags: {
          ...tags,
          Name: `tap-unhealthy-targets-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `tap-scale-up-${environmentSuffix}`,
      {
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    const scaleDownPolicy = new aws.autoscaling.Policy(
      `tap-scale-down-${environmentSuffix}`,
      {
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    // Create CloudWatch Alarms for Auto Scaling
    new aws.cloudwatch.MetricAlarm(
      `tap-scale-up-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 75,
        alarmActions: [scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        tags: {
          ...tags,
          Name: `tap-scale-up-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `tap-scale-down-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 25,
        alarmActions: [scaleDownPolicy.arn],
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        tags: {
          ...tags,
          Name: `tap-scale-down-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.albDnsName = alb.dnsName;
    this.staticBucketName = staticAssetsBucket.id;
    this.vpcId = vpc.id;
    this.instanceConnectEndpointId = instanceConnectEndpointId;

    // Register outputs
    this.registerOutputs({
      albDnsName: this.albDnsName,
      staticBucketName: this.staticBucketName,
      vpcId: this.vpcId,
      instanceConnectEndpointId: this.instanceConnectEndpointId,
    });
  }
}
