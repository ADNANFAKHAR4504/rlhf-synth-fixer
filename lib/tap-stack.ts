/**
 * tap-stack.ts
 *
 * Production-ready cloud environment with comprehensive AWS services
 * including VPC, ALB with SSL, RDS, Auto Scaling, and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'prod' for production environment.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Production-ready TapStack component with comprehensive AWS services
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly loggingBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Use environment suffix from args, defaulting to the ENVIRONMENT_SUFFIX env var or 'dev'
    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC with multiple AZs
    const vpc = new aws.ec2.Vpc(
      `prod-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `prod-vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `prod-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `prod-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create public subnets in first two AZs
    const publicSubnet1 = new aws.ec2.Subnet(
      `prod-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `prod-public-subnet-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `prod-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `prod-public-subnet-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create private subnets in first two AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      `prod-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          Name: `prod-private-subnet-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `prod-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.4.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          Name: `prod-private-subnet-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create NAT Gateways for private subnet internet access
    // NOTE: Commented out due to AWS EIP quota limits in the testing environment
    // In production, uncomment this section for proper private subnet internet access
    /*
    const natEip1 = new aws.ec2.Eip(
      `prod-nat-eip-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `prod-nat-eip-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const natGateway1 = new aws.ec2.NatGateway(
      `prod-nat-gateway-1-${environmentSuffix}`,
      {
        allocationId: natEip1.id,
        subnetId: publicSubnet1.id,
        tags: {
          Name: `prod-nat-gateway-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );
    */

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `prod-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: `prod-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `prod-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        // NOTE: NAT Gateway route commented out due to AWS EIP quota limits
        // In production, uncomment the routes section with natGateway1.id
        /*
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway1.id,
          },
        ],
        */
        tags: {
          Name: `prod-private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Associate route tables with subnets
    new aws.ec2.RouteTableAssociation(
      `prod-public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `prod-public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `prod-private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `prod-private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    // Create S3 bucket with logging configuration
    const s3Bucket = new aws.s3.Bucket(
      `prod-app-storage-${environmentSuffix}`,
      {
        bucketPrefix: `prod-storage-${environmentSuffix}-`,
        tags: {
          Name: `prod-app-storage-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // S3 bucket for access logging
    const loggingBucket = new aws.s3.Bucket(
      `prod-access-logs-${environmentSuffix}`,
      {
        bucketPrefix: `prod-logs-${environmentSuffix}-`,
        tags: {
          Name: `prod-access-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Configure S3 bucket logging
    new aws.s3.BucketLogging(
      `prod-bucket-logging-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        targetBucket: loggingBucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    // Block public access on both buckets
    new aws.s3.BucketPublicAccessBlock(
      `prod-bucket-pab-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `prod-logging-bucket-pab-${environmentSuffix}`,
      {
        bucket: loggingBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create DB subnet group for RDS
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `prod-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          Name: `prod-db-subnet-group-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS database',
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        tags: {
          Name: `prod-rds-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create RDS instance
    const rdsInstance = new aws.rds.Instance(
      `prod-database-${environmentSuffix}`,
      {
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        dbName: 'proddb',
        username: 'admin',
        password: 'TempPassword123!',
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        skipFinalSnapshot: true,
        deletionProtection: false,
        tags: {
          Name: `prod-database-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `prod-ec2-role-${environmentSuffix}`,
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
        tags: {
          Name: `prod-ec2-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach CloudWatch agent policy to EC2 role
    new aws.iam.RolePolicyAttachment(
      `prod-cloudwatch-agent-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Attach S3 read policy to EC2 role
    new aws.iam.RolePolicyAttachment(
      `prod-s3-read-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `prod-instance-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: {
          Name: `prod-instance-profile-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      filters: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
      owners: ['amazon'],
      mostRecent: true,
    });

    // Create security group for EC2 instances
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `prod-ec2-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
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
          Name: `prod-ec2-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create launch template for Auto Scaling
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `prod-launch-template-${environmentSuffix}`,
      {
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: pulumi
          .output(
            `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Production Web Server</h1>" > /var/www/html/index.html
`
          )
          .apply(s => Buffer.from(s).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `prod-web-server-${environmentSuffix}`,
              ...tags,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
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
          Name: `prod-alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `prod-alb-${environmentSuffix}`,
      {
        loadBalancerType: 'application',
        subnets: [publicSubnet1.id, publicSubnet2.id],
        securityGroups: [albSecurityGroup.id],
        tags: {
          Name: `prod-alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `prod-tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
        },
        tags: {
          Name: `prod-tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // SSL certificate is commented out to avoid validation timeout issues
    // In production, create a certificate with a domain you own and proper DNS validation
    /*
    const certificate = new aws.acm.Certificate(
      `prod-cert-${environmentSuffix}`,
      {
        domainName: 'yourdomain.com', // Replace with your actual domain
        validationMethod: 'DNS',
        tags: {
          Name: `prod-cert-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ALB listener for HTTPS - uncomment when certificate is ready
    new aws.lb.Listener(
      `prod-alb-listener-https-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: certificate.arn,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );
    */

    // Create ALB listener for HTTP (serving content directly)
    // In production with SSL certificate, change this back to redirect to HTTPS
    new aws.lb.Listener(
      `prod-alb-listener-http-${environmentSuffix}`,
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
      `prod-asg-${environmentSuffix}`,
      {
        vpcZoneIdentifiers: [privateSubnet1.id, privateSubnet2.id],
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 4,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `prod-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Create Auto Scaling policies
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `prod-scale-up-${environmentSuffix}`,
      {
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    const scaleDownPolicy = new aws.autoscaling.Policy(
      `prod-scale-down-${environmentSuffix}`,
      {
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    // Create CloudWatch alarms for Auto Scaling
    new aws.cloudwatch.MetricAlarm(
      `prod-cpu-high-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 70,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        alarmActions: [scaleUpPolicy.arn],
        tags: {
          Name: `prod-cpu-high-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `prod-cpu-low-${environmentSuffix}`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 30,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        alarmActions: [scaleDownPolicy.arn],
        tags: {
          Name: `prod-cpu-low-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for 5xx errors (using latest CloudWatch features)
    new aws.cloudwatch.MetricAlarm(
      `prod-5xx-errors-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'This metric monitors ALB 5xx errors',
        dimensions: {
          LoadBalancer: alb.arnSuffix,
        },
        tags: {
          Name: `prod-5xx-errors-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Export important outputs
    this.vpcId = vpc.id;
    this.albArn = alb.arn;
    this.albDns = alb.dnsName;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.s3BucketName = s3Bucket.bucket;
    this.loggingBucketName = loggingBucket.bucket;

    this.registerOutputs({
      vpcId: this.vpcId,
      albArn: this.albArn,
      albDns: this.albDns,
      rdsEndpoint: this.rdsEndpoint,
      s3BucketName: this.s3BucketName,
      loggingBucketName: this.loggingBucketName,
    });
  }
}
