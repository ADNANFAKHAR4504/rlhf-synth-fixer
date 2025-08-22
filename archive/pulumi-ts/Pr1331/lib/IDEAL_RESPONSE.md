# IDEAL_RESPONSE for Pr1331

## compute-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ComputeStackArgs {
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  publicSubnetIds: pulumi.Input<string[]>;
  webSecurityGroupId: pulumi.Input<string>;
  albSecurityGroupId: pulumi.Input<string>;
  instanceProfileName: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly applicationLoadBalancer: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;
  public readonly cpuAlarm: aws.cloudwatch.MetricAlarm;
  public readonly scaleUpPolicy: aws.autoscaling.Policy;
  public readonly scaleDownPolicy: aws.autoscaling.Policy;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:compute:ComputeStack', name, args, opts);

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

    // User data script
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "WebApp/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s`;

    // Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${name}-launch-template`,
      {
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        iamInstanceProfile: {
          name: args.instanceProfileName,
        },
        vpcSecurityGroupIds: [args.webSecurityGroupId],
        userData: Buffer.from(userData).toString('base64'),
        tags: {
          ...args.tags,
          Name: `${name}-launch-template-${args.environmentSuffix}`,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...args.tags,
              Name: `${name}-web-instance-${args.environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        loadBalancerType: 'application',
        subnets: args.publicSubnetIds,
        securityGroups: [args.albSecurityGroupId],
        tags: {
          ...args.tags,
          Name: `${name}-alb-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
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
          ...args.tags,
          Name: `${name}-tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ALB Listener
    this.listener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: this.applicationLoadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Auto Scaling Group with highly responsive scaling
    this.autoScalingGroup = new aws.autoscaling.Group(
      `${name}-asg`,
      {
        vpcZoneIdentifiers: args.privateSubnetIds,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        tags: [
          {
            key: 'Name',
            value: pulumi.interpolate`${name}-asg-${args.environmentSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Scale Up Policy (Highly Responsive)
    this.scaleUpPolicy = new aws.autoscaling.Policy(
      `${name}-scale-up`,
      {
        scalingAdjustment: 2,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // Scale Down Policy
    this.scaleDownPolicy = new aws.autoscaling.Policy(
      `${name}-scale-down`,
      {
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // CloudWatch Alarm for Scale Up (High Resolution)
    this.cpuAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-cpu-high`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 60, // High resolution - 1 minute
        statistic: 'Average',
        threshold: 70,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        alarmActions: [this.scaleUpPolicy.arn],
        tags: {
          ...args.tags,
          Name: `${name}-cpu-high-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Scale Down
    new aws.cloudwatch.MetricAlarm(
      `${name}-cpu-low`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 30,
        alarmDescription:
          'This metric monitors ec2 cpu utilization for scale down',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        alarmActions: [this.scaleDownPolicy.arn],
        tags: {
          ...args.tags,
          Name: `${name}-cpu-low-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albDnsName: this.applicationLoadBalancer.dnsName,
      asgName: this.autoScalingGroup.name,
    });
  }
}
```

## database-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DatabaseStackArgs {
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  dbSecurityGroupId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly dbSubnetGroup: aws.rds.SubnetGroup;
  public readonly dbCluster: aws.rds.Cluster;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:database:DatabaseStack', name, args, opts);

    // DB Subnet Group
    this.dbSubnetGroup = new aws.rds.SubnetGroup(
      `${name}-db-subnet-group`,
      {
        subnetIds: args.privateSubnetIds,
        tags: {
          ...args.tags,
          Name: `${name}-db-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Aurora Serverless v2 PostgreSQL Cluster
    this.dbCluster = new aws.rds.Cluster(
      `${name}-db-cluster`,
      {
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '16.4',
        databaseName: 'webapp',
        masterUsername: 'postgres',
        masterPassword: 'changeme123!', // In production, use AWS Secrets Manager
        dbSubnetGroupName: this.dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.dbSecurityGroupId],
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        serverlessv2ScalingConfiguration: {
          maxCapacity: 2,
          minCapacity: 0.5,
        },
        tags: {
          ...args.tags,
          Name: `${name}-db-cluster-${args.environmentSuffix}`,
        },
        skipFinalSnapshot: true, // Ensure resource can be deleted
        finalSnapshotIdentifier: undefined, // No final snapshot on deletion
      },
      { parent: this }
    );

    // Aurora Serverless v2 Instance
    new aws.rds.ClusterInstance(
      `${name}-db-instance`,
      {
        identifier: `${name}-db-instance-${args.environmentSuffix}`,
        clusterIdentifier: this.dbCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql' as aws.types.enums.rds.EngineType,
        engineVersion: '16.4',
        tags: {
          ...args.tags,
          Name: `${name}-db-instance-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      dbEndpoint: this.dbCluster.endpoint,
      dbPort: this.dbCluster.port,
    });
  }
}
```

## iam-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  s3BucketArn?: pulumi.Input<string>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly instanceRole: aws.iam.Role;
  public readonly instanceProfile: aws.iam.InstanceProfile;

  constructor(
    name: string,
    args: IamStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:iam:IamStack', name, args, opts);

    // IAM Role for EC2 instances
    this.instanceRole = new aws.iam.Role(
      `${name}-ec2-role`,
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
          ...args.tags,
          Name: `${name}-ec2-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch policy
    const cloudWatchPolicy = new aws.iam.Policy(
      `${name}-cloudwatch-policy`,
      {
        description: 'Policy for CloudWatch access',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // S3 policy for log storage
    const s3LogsPolicy = new aws.iam.Policy(
      `${name}-s3-logs-policy`,
      {
        description: 'Policy for S3 logs access',
        policy: pulumi.all([args.s3BucketArn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: bucketArn ? `${bucketArn}/*` : 'arn:aws:s3:::*/*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: bucketArn || 'arn:aws:s3:::*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      `${name}-cloudwatch-attach`,
      {
        role: this.instanceRole.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-s3-attach`,
      {
        role: this.instanceRole.name,
        policyArn: s3LogsPolicy.arn,
      },
      { parent: this }
    );

    // Attach AWS managed policy for SSM (Systems Manager)
    new aws.iam.RolePolicyAttachment(
      `${name}-ssm-attach`,
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Instance Profile
    this.instanceProfile = new aws.iam.InstanceProfile(
      `${name}-instance-profile`,
      {
        role: this.instanceRole.name,
        tags: {
          ...args.tags,
          Name: `${name}-instance-profile-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      instanceRoleArn: this.instanceRole.arn,
      instanceProfileName: this.instanceProfile.name,
    });
  }
}
```

## network-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:network:NetworkStack', name, args, opts);

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...args.tags,
          Name: `${name}-vpc-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-igw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `${name}-public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(publicSubnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            ...args.tags,
            Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(privateSubnet);
    }

    // Create single Elastic IP for NAT Gateway (to avoid EIP limit)
    const eip = new aws.ec2.Eip(
      `${name}-nat-eip`,
      {
        domain: 'vpc',
        tags: {
          ...args.tags,
          Name: `${name}-nat-eip-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create single NAT Gateway (cost optimization, avoid EIP limit)
    const natGateway = new aws.ec2.NatGateway(
      `${name}-nat-gw`,
      {
        allocationId: eip.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          ...args.tags,
          Name: `${name}-nat-gw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );
    this.natGateways = [natGateway];

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-public-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public route
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: this.publicSubnets[i].id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create private route tables
    this.privateRouteTables = [];
    for (let i = 0; i < 2; i++) {
      const privateRouteTable = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...args.tags,
            Name: `${name}-private-rt-${i}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Create private route (all use the single NAT gateway)
      new aws.ec2.Route(
        `${name}-private-route-${i}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { parent: this }
      );

      // Associate private subnet with private route table
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}`,
        {
          subnetId: this.privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );

      this.privateRouteTables.push(privateRouteTable);
    }

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
    });
  }
}
```

## security-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SecurityStackArgs {
  vpcId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly webSecurityGroup: aws.ec2.SecurityGroup;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly dbSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:security:SecurityStack', name, args, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            description: 'HTTP',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTPS',
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
          ...args.tags,
          Name: `${name}-alb-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Web Server Security Group
    this.webSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-web-sg`,
      {
        vpcId: args.vpcId,
        description: 'Security group for web servers',
        ingress: [
          {
            description: 'HTTP from ALB',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [this.albSecurityGroup.id],
          },
          {
            description: 'SSH',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'], // Only from VPC
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
          ...args.tags,
          Name: `${name}-web-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Database Security Group
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-db-sg`,
      {
        vpcId: args.vpcId,
        description: 'Security group for database',
        ingress: [
          {
            description: 'PostgreSQL',
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [this.webSecurityGroup.id],
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
          ...args.tags,
          Name: `${name}-db-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      webSecurityGroupId: this.webSecurityGroup.id,
      albSecurityGroupId: this.albSecurityGroup.id,
      dbSecurityGroupId: this.dbSecurityGroup.id,
    });
  }
}
```

## storage-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly logsBucket: aws.s3.Bucket;
  public readonly bucketVersioning: aws.s3.BucketVersioningV2;

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:storage:StorageStack', name, args, opts);

    // S3 Bucket for logs
    this.logsBucket = new aws.s3.Bucket(
      `${name}-logs-bucket`,
      {
        forceDestroy: true, // Allow bucket to be deleted even if not empty
        tags: {
          ...args.tags,
          Name: `${name}-logs-bucket-${args.environmentSuffix}`,
          Purpose: 'Application Logs',
        },
      },
      { parent: this }
    );

    // Enable versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(
      `${name}-logs-versioning`,
      {
        bucket: this.logsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Server-side encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${name}-logs-encryption`,
      {
        bucket: this.logsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Lifecycle configuration
    new aws.s3.BucketLifecycleConfigurationV2(
      `${name}-logs-lifecycle`,
      {
        bucket: this.logsBucket.id,
        rules: [
          {
            id: 'log_lifecycle',
            status: 'Enabled',
            expiration: {
              days: 90,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${name}-logs-pab`,
      {
        bucket: this.logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.registerOutputs({
      logsBucketName: this.logsBucket.id,
      logsBucketArn: this.logsBucket.arn,
    });
  }
}
```

## tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { IamStack } from './iam-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly networkStack: NetworkStack;
  public readonly securityStack: SecurityStack;
  public readonly storageStack: StorageStack;
  public readonly iamStack: IamStack;
  public readonly computeStack: ComputeStack;
  public readonly databaseStack: DatabaseStack;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Configure AWS provider for us-east-1 (avoid VPC limit in us-west-2)
    const awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    const resourceOpts = { parent: this, provider: awsProvider };

    // Create Network Stack
    this.networkStack = new NetworkStack(
      'webapp-network',
      {
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create Storage Stack
    this.storageStack = new StorageStack(
      'webapp-storage',
      {
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create Security Stack
    this.securityStack = new SecurityStack(
      'webapp-security',
      {
        vpcId: this.networkStack.vpc.id,
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create IAM Stack
    this.iamStack = new IamStack(
      'webapp-iam',
      {
        environmentSuffix,
        tags,
        s3BucketArn: this.storageStack.logsBucket.arn,
      },
      resourceOpts
    );

    // Create Compute Stack
    this.computeStack = new ComputeStack(
      'webapp-compute',
      {
        vpcId: this.networkStack.vpc.id,
        privateSubnetIds: pulumi.all(
          this.networkStack.privateSubnets.map(s => s.id)
        ),
        publicSubnetIds: pulumi.all(
          this.networkStack.publicSubnets.map(s => s.id)
        ),
        webSecurityGroupId: this.securityStack.webSecurityGroup.id,
        albSecurityGroupId: this.securityStack.albSecurityGroup.id,
        instanceProfileName: this.iamStack.instanceProfile.name,
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create Database Stack
    this.databaseStack = new DatabaseStack(
      'webapp-database',
      {
        vpcId: this.networkStack.vpc.id,
        privateSubnetIds: pulumi.all(
          this.networkStack.privateSubnets.map(s => s.id)
        ),
        dbSecurityGroupId: this.securityStack.dbSecurityGroup.id,
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.networkStack.vpc.id,
      albDnsName: this.computeStack.applicationLoadBalancer.dnsName,
      dbEndpoint: this.databaseStack.dbCluster.endpoint,
      logsBucketName: this.storageStack.logsBucket.id,
    });
  }
}
```

