import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'WebApp',
      ManagedBy: 'Pulumi',
      ...args.tags,
    };

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `webapp-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `webapp-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnet1 = new aws.ec2.Subnet(
      `webapp-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `webapp-public-subnet-1-${environmentSuffix}`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `webapp-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `webapp-public-subnet-2-${environmentSuffix}`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    // Create private subnets for database
    const privateSubnet1 = new aws.ec2.Subnet(
      `webapp-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        tags: {
          ...commonTags,
          Name: `webapp-private-subnet-1-${environmentSuffix}`,
          Type: 'Private',
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `webapp-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.4.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        tags: {
          ...commonTags,
          Name: `webapp-private-subnet-2-${environmentSuffix}`,
          Type: 'Private',
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `webapp-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `webapp-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `webapp-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          ...commonTags,
          Name: `webapp-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate public subnets with route table
    new aws.ec2.RouteTableAssociation(
      `webapp-public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `webapp-public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `webapp-alb-sg-${environmentSuffix}`,
      {
        name: `webapp-alb-sg-${environmentSuffix}`,
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `webapp-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for EC2 instances
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `webapp-ec2-sg-${environmentSuffix}`,
      {
        name: `webapp-ec2-sg-${environmentSuffix}`,
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `webapp-ec2-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `webapp-rds-sg-${environmentSuffix}`,
      {
        name: `webapp-rds-sg-${environmentSuffix}`,
        vpcId: vpc.id,
        description: 'Security group for RDS PostgreSQL',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [ec2SecurityGroup.id],
            description: 'PostgreSQL from EC2',
          },
        ],
        tags: {
          ...commonTags,
          Name: `webapp-rds-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `webapp-db-subnet-group-${environmentSuffix}`,
      {
        name: `webapp-db-subnet-group-${environmentSuffix}`,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          ...commonTags,
          Name: `webapp-db-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance with correct version
    const database = new aws.rds.Instance(
      `webapp-postgres-${environmentSuffix}`,
      {
        identifier: `webapp-postgres-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15.4',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        multiAz: true,
        dbName: 'webapp',
        username: 'webappuser',
        password: 'TempPassword123!',
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        deletionProtection: false,
        tags: {
          ...commonTags,
          Name: `webapp-postgres-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create S3 bucket for static content with simplified naming
    const bucket = new aws.s3.BucketV2(
      `webapp-static-${environmentSuffix}`,
      {
        bucket: `webapp-${environmentSuffix.toLowerCase().substring(0, 20)}`,
        tags: {
          ...commonTags,
          Name: `webapp-static-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add versioning to bucket
    new aws.s3.BucketVersioningV2(
      `webapp-static-versioning-${environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Add encryption to bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `webapp-static-encryption-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Create S3 bucket public access block
    new aws.s3.BucketPublicAccessBlock(
      `webapp-static-pab-${environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `webapp-ec2-role-${environmentSuffix}`,
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
          ...commonTags,
          Name: `webapp-ec2-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach policies to EC2 role
    new aws.iam.RolePolicyAttachment(
      `webapp-ec2-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `webapp-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `webapp-instance-profile-${environmentSuffix}`,
      {
        name: `webapp-instance-profile-${environmentSuffix}`,
        role: ec2Role.name,
        tags: {
          ...commonTags,
          Name: `webapp-instance-profile-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create launch template with proper user data encoding
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${environmentSuffix}</h1>" > /var/www/html/index.html`;

    const launchTemplate = new aws.ec2.LaunchTemplate(
      `webapp-launch-template-${environmentSuffix}`,
      {
        name: `webapp-launch-template-${environmentSuffix}`,
        imageId: 'ami-0e2c8caa4b6378d8c',
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...commonTags,
              Name: `webapp-instance-${environmentSuffix}`,
            },
          },
        ],
        tags: {
          ...commonTags,
          Name: `webapp-launch-template-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Log Groups
    const systemLogGroup = new aws.cloudwatch.LogGroup(
      `webapp-${environmentSuffix}-system`,
      {
        name: `webapp-${environmentSuffix}-system`,
        retentionInDays: 30,
        tags: {
          ...commonTags,
          Name: `webapp-${environmentSuffix}-system-logs`,
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `webapp-tg-${environmentSuffix}`,
      {
        name: `webapp-tg-${environmentSuffix.substring(0, 20)}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: {
          ...commonTags,
          Name: `webapp-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer with unique name
    const timestamp = Date.now().toString().substring(8);
    const loadBalancer = new aws.lb.LoadBalancer(
      `webapp-alb-${environmentSuffix}`,
      {
        name: `web-${environmentSuffix.substring(0, 15)}-${timestamp}`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id],
        enableDeletionProtection: false,
        tags: {
          ...commonTags,
          Name: `webapp-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create listener
    new aws.lb.Listener(
      `webapp-listener-${environmentSuffix}`,
      {
        loadBalancerArn: loadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: {
          ...commonTags,
          Name: `webapp-listener-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `webapp-asg-${environmentSuffix}`,
      {
        name: `webapp-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: [publicSubnet1.id, publicSubnet2.id],
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `webapp-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          ...Object.entries(commonTags).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
          })),
        ],
      },
      { parent: this }
    );

    // Create Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `webapp-scale-up-${environmentSuffix}`,
      {
        name: `webapp-scale-up-${environmentSuffix}`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    const scaleDownPolicy = new aws.autoscaling.Policy(
      `webapp-scale-down-${environmentSuffix}`,
      {
        name: `webapp-scale-down-${environmentSuffix}`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    // Create CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `webapp-high-cpu-${environmentSuffix}`,
      {
        name: `webapp-high-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        tags: {
          ...commonTags,
          Name: `webapp-high-cpu-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `webapp-low-cpu-${environmentSuffix}`,
      {
        name: `webapp-low-cpu-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 10,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [scaleDownPolicy.arn],
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        tags: {
          ...commonTags,
          Name: `webapp-low-cpu-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export important values
    this.loadBalancerDns = loadBalancer.dnsName;
    this.bucketName = bucket.bucket;
    this.databaseEndpoint = database.endpoint;
    this.vpcId = vpc.id;

    this.registerOutputs({
      loadBalancerDns: this.loadBalancerDns,
      bucketName: this.bucketName,
      databaseEndpoint: this.databaseEndpoint,
      vpcId: this.vpcId,
      autoScalingGroupName: autoScalingGroup.name,
      targetGroupArn: targetGroup.arn,
      albSecurityGroupId: albSecurityGroup.id,
      ec2SecurityGroupId: ec2SecurityGroup.id,
      rdsSecurityGroupId: rdsSecurityGroup.id,
      publicSubnet1Id: publicSubnet1.id,
      publicSubnet2Id: publicSubnet2.id,
      privateSubnet1Id: privateSubnet1.id,
      privateSubnet2Id: privateSubnet2.id,
      ec2RoleArn: ec2Role.arn,
      instanceProfileName: instanceProfile.name,
      systemLogGroupName: systemLogGroup.name,
    });
  }
}
