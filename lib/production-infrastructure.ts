import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Configuration
const config = new pulumi.Config();
const environment = 'production';
const region = 'ap-south-1';
const allowedSshCidr = config.get('allowedSshCidr') || '0.0.0.0/0';

// AWS Provider for ap-south-1 region
const provider = new aws.Provider('production-provider', {
  region: region,
});

export class ProductionInfrastructure {
  public vpc!: aws.ec2.Vpc;
  public publicSubnets!: aws.ec2.Subnet[];
  public privateSubnets!: aws.ec2.Subnet[];
  public internetGateway!: aws.ec2.InternetGateway;
  public natGateway!: aws.ec2.NatGateway;
  public elasticIp!: aws.ec2.Eip;
  public publicRouteTable!: aws.ec2.RouteTable;
  public privateRouteTable!: aws.ec2.RouteTable;
  public vpcFlowLogGroup!: aws.cloudwatch.LogGroup;
  public vpcFlowLogRole!: aws.iam.Role;
  public vpcFlowLog!: aws.ec2.FlowLog;
  public ec2SecurityGroup!: aws.ec2.SecurityGroup;
  public rdsSecurityGroup!: aws.ec2.SecurityGroup;
  public albSecurityGroup!: aws.ec2.SecurityGroup;
  public ec2Role!: aws.iam.Role;
  public ec2InstanceProfile!: aws.iam.InstanceProfile;
  public kmsKey!: aws.kms.Key;
  public s3Bucket!: aws.s3.Bucket;
  public rdsSubnetGroup!: aws.rds.SubnetGroup;
  public rdsInstance!: aws.rds.Instance;
  public launchTemplate!: aws.ec2.LaunchTemplate;
  public targetGroup!: aws.lb.TargetGroup;
  public applicationLoadBalancer!: aws.lb.LoadBalancer;
  public albListener!: aws.lb.Listener;
  public autoScalingGroup!: aws.autoscaling.Group;
  public scaleUpPolicy!: aws.autoscaling.Policy;
  public scaleDownPolicy!: aws.autoscaling.Policy;
  public cpuAlarmHigh!: aws.cloudwatch.MetricAlarm;
  public cpuAlarmLow!: aws.cloudwatch.MetricAlarm;

  private constructor() {
    // Private constructor - use create() method instead
  }

  public static create(): ProductionInfrastructure {
    const instance = new ProductionInfrastructure();
    instance.createNetworking();
    instance.createSecurity();
    instance.createStorage();
    instance.createDatabase();
    instance.createCompute();
    instance.createMonitoring();
    return instance;
  }

  private createNetworking() {
    // VPC
    this.vpc = new aws.ec2.Vpc(
      `${environment}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${environment}-vpc`,
          environment: environment,
        },
      },
      { provider }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider }
    );

    // Public Subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      this.publicSubnets.push(
        new aws.ec2.Subnet(
          `${environment}-public-subnet-${i + 1}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i + 1}.0/24`,
            availabilityZone: azs.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `${environment}-public-subnet-${i + 1}`,
              environment: environment,
              Type: 'Public',
            },
          },
          { provider }
        )
      );
    }

    // Private Subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      this.privateSubnets.push(
        new aws.ec2.Subnet(
          `${environment}-private-subnet-${i + 1}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: azs.then(azs => azs.names[i]),
            tags: {
              Name: `${environment}-private-subnet-${i + 1}`,
              environment: environment,
              Type: 'Private',
            },
          },
          { provider }
        )
      );
    }

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${environment}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${environment}-igw`,
          environment: environment,
        },
      },
      { provider }
    );

    // Elastic IP for NAT Gateway
    this.elasticIp = new aws.ec2.Eip(
      `${environment}-nat-eip`,
      {
        domain: 'vpc',
        tags: {
          Name: `${environment}-nat-eip`,
          environment: environment,
        },
      },
      { provider }
    );

    // NAT Gateway
    this.natGateway = new aws.ec2.NatGateway(
      `${environment}-nat-gateway`,
      {
        allocationId: this.elasticIp.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          Name: `${environment}-nat-gateway`,
          environment: environment,
        },
      },
      { provider }
    );

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${environment}-public-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.internetGateway.id,
          },
        ],
        tags: {
          Name: `${environment}-public-rt`,
          environment: environment,
        },
      },
      { provider }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${environment}-public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { provider }
      );
    });

    // Private Route Table
    this.privateRouteTable = new aws.ec2.RouteTable(
      `${environment}-private-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: this.natGateway.id,
          },
        ],
        tags: {
          Name: `${environment}-private-rt`,
          environment: environment,
        },
      },
      { provider }
    );

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${environment}-private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTable.id,
        },
        { provider }
      );
    });

    // VPC Flow Logs
    this.vpcFlowLogGroup = new aws.cloudwatch.LogGroup(
      `${environment}-vpc-flow-logs`,
      {
        retentionInDays: 14,
        tags: {
          Name: `${environment}-vpc-flow-logs`,
          environment: environment,
        },
      },
      { provider }
    );

    this.vpcFlowLogRole = new aws.iam.Role(
      `${environment}-vpc-flow-log-role`,
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
        tags: {
          Name: `${environment}-vpc-flow-log-role`,
          environment: environment,
        },
      },
      { provider }
    );

    new aws.iam.RolePolicy(
      `${environment}-vpc-flow-log-policy`,
      {
        role: this.vpcFlowLogRole.id,
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
      { provider }
    );

    this.vpcFlowLog = new aws.ec2.FlowLog(
      `${environment}-vpc-flow-log`,
      {
        iamRoleArn: this.vpcFlowLogRole.arn,
        logDestination: this.vpcFlowLogGroup.arn,
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        tags: {
          Name: `${environment}-vpc-flow-log`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  private createSecurity() {
    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-alb-sg`,
      {
        name: `${environment}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc.id,
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
          Name: `${environment}-alb-sg`,
          environment: environment,
        },
      },
      { provider }
    );

    // EC2 Security Group
    this.ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-ec2-sg`,
      {
        name: `${environment}-ec2-sg`,
        description: 'Security group for EC2 instances',
        vpcId: this.vpc.id,
        ingress: [
          {
            description: 'SSH',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: [allowedSshCidr],
          },
          {
            description: 'HTTP from ALB',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [this.albSecurityGroup.id],
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
          Name: `${environment}-ec2-sg`,
          environment: environment,
        },
      },
      { provider }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-rds-sg`,
      {
        name: `${environment}-rds-sg`,
        description: 'Security group for RDS database',
        vpcId: this.vpc.id,
        ingress: [
          {
            description: 'MySQL/Aurora',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [this.ec2SecurityGroup.id],
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
          Name: `${environment}-rds-sg`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  private createStorage() {
    // KMS Key with proper policy and rotation
    this.kmsKey = new aws.kms.Key(
      `${environment}-kms-key`,
      {
        description: 'KMS key for encryption at rest',
        enableKeyRotation: true,
        policy: pulumi
          .all([aws.getCallerIdentity({}, { provider })])
          .apply(([identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Id: 'key-default-1',
              Statement: [
                {
                  Sid: 'Enable IAM User Permissions',
                  Effect: 'Allow',
                  Principal: { AWS: `arn:aws:iam::${identity.accountId}:root` },
                  Action: 'kms:*',
                  Resource: '*',
                },
                {
                  Sid: 'Allow RDS and S3 use of the key',
                  Effect: 'Allow',
                  Principal: {
                    Service: ['rds.amazonaws.com', 's3.amazonaws.com'],
                  },
                  Action: [
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
        tags: {
          Name: `${environment}-kms-key`,
          environment: environment,
        },
      },
      { provider }
    );

    new aws.kms.Alias(
      `${environment}-kms-alias`,
      {
        name: `alias/${environment}-key`,
        targetKeyId: this.kmsKey.keyId,
      },
      { provider }
    );

    // S3 Bucket
    this.s3Bucket = new aws.s3.Bucket(
      `${environment}-s3-bucket`,
      {
        bucket: `${environment}-app-data-${Date.now()}`,
        tags: {
          Name: `${environment}-s3-bucket`,
          environment: environment,
        },
      },
      { provider }
    );

    // S3 Bucket Encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${environment}-s3-encryption`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioning(
      `${environment}-s3-versioning`,
      {
        bucket: this.s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider }
    );

    // S3 Public Access Block
    new aws.s3.BucketPublicAccessBlock(
      `${environment}-s3-pab`,
      {
        bucket: this.s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider }
    );

    // S3 Lifecycle Policy
    new aws.s3.BucketLifecycleConfiguration(
      `${environment}-s3-lifecycle`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            id: 'cleanup-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { provider }
    );
  }

  private createDatabase() {
    // RDS Enhanced Monitoring Role
    const rdsMonitoringRole = new aws.iam.Role(
      `${environment}-rds-monitoring-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'monitoring.rds.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `${environment}-rds-monitoring-role`,
          environment: environment,
        },
      },
      { provider }
    );

    new aws.iam.RolePolicyAttachment(
      `${environment}-rds-monitoring-attach`,
      {
        role: rdsMonitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { provider }
    );

    // RDS Subnet Group
    this.rdsSubnetGroup = new aws.rds.SubnetGroup(
      `${environment}-rds-subnet-group`,
      {
        name: `${environment}-rds-subnet-group`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${environment}-rds-subnet-group`,
          environment: environment,
        },
      },
      { provider }
    );

    // RDS Instance with managed password and enhanced monitoring
    this.rdsInstance = new aws.rds.Instance(
      `${environment}-rds-mysql`,
      {
        identifier: `${environment}-mysql-db`,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        dbName: 'appdb',
        username: 'admin',
        manageMasterUserPassword: true,
        vpcSecurityGroupIds: [this.rdsSecurityGroup.id],
        dbSubnetGroupName: this.rdsSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `${environment}-final-snapshot`,
        deletionProtection: true,
        monitoringRoleArn: rdsMonitoringRole.arn,
        monitoringInterval: 60,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: this.kmsKey.arn,
        tags: {
          Name: `${environment}-rds-mysql`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  private createCompute() {
    // EC2 IAM Role with least privilege
    this.ec2Role = new aws.iam.Role(
      `${environment}-ec2-role`,
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
          Name: `${environment}-ec2-role`,
          environment: environment,
        },
      },
      { provider }
    );

    // SSM Managed Instance Core Policy
    new aws.iam.RolePolicyAttachment(
      `${environment}-ec2-ssm-policy`,
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider }
    );

    // EC2 Role Policy with least privilege
    new aws.iam.RolePolicy(
      `${environment}-ec2-policy`,
      {
        role: this.ec2Role.id,
        policy: pulumi
          .all([this.s3Bucket.arn, this.vpcFlowLogGroup.arn])
          .apply(([bucketArn, logGroupArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: logGroupArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: this.kmsKey.arn,
                },
              ],
            })
          ),
      },
      { provider }
    );

    this.ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${environment}-ec2-profile`,
      {
        role: this.ec2Role.name,
        tags: {
          Name: `${environment}-ec2-profile`,
          environment: environment,
        },
      },
      { provider }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
        ],
      },
      { provider }
    );

    // Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${environment}-launch-template`,
      {
        name: `${environment}-launch-template`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        keyName: 'my-key-pair',
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: this.ec2InstanceProfile.name,
        },
        userData: pulumi
          .all([this.s3Bucket.bucket, this.rdsInstance.endpoint])
          .apply(([bucketName, rdsEndpoint]) =>
            Buffer.from(
              `#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho \"<h1>Hello from ${environment} environment</h1>\" > /var/www/html/index.html\necho \"S3 Bucket: ${bucketName}\" >> /var/www/html/index.html\necho \"RDS Endpoint: ${rdsEndpoint}\" >> /var/www/html/index.html\n`
            ).toString('base64')
          ),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${environment}-web-server`,
              environment: environment,
            },
          },
        ],
      },
      { provider }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${environment}-tg`,
      {
        name: `${environment}-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
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
          Name: `${environment}-tg`,
          environment: environment,
        },
      },
      { provider }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${environment}-alb`,
      {
        name: `${environment}-alb`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [this.albSecurityGroup.id],
        subnets: this.publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false,
        tags: {
          Name: `${environment}-alb`,
          environment: environment,
        },
      },
      { provider }
    );

    // ALB HTTP Listener
    this.albListener = new aws.lb.Listener(
      `${environment}-alb-listener-http`,
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
      { provider }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscaling.Group(
      `${environment}-asg`,
      {
        name: `${environment}-asg`,
        vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${environment}-asg`,
            propagateAtLaunch: true,
          },
          {
            key: 'environment',
            value: environment,
            propagateAtLaunch: true,
          },
        ],
      },
      { provider }
    );
  }

  private createMonitoring() {
    // Auto Scaling Policies
    this.scaleUpPolicy = new aws.autoscaling.Policy(
      `${environment}-scale-up`,
      {
        name: `${environment}-scale-up`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
      },
      { provider }
    );

    this.scaleDownPolicy = new aws.autoscaling.Policy(
      `${environment}-scale-down`,
      {
        name: `${environment}-scale-down`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
      },
      { provider }
    );

    // CloudWatch Alarms
    this.cpuAlarmHigh = new aws.cloudwatch.MetricAlarm(
      `${environment}-cpu-high`,
      {
        name: `${environment}-cpu-high`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [this.scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        tags: {
          Name: `${environment}-cpu-high`,
          environment: environment,
        },
      },
      { provider }
    );

    this.cpuAlarmLow = new aws.cloudwatch.MetricAlarm(
      `${environment}-cpu-low`,
      {
        name: `${environment}-cpu-low`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 10,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [this.scaleDownPolicy.arn],
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        tags: {
          Name: `${environment}-cpu-low`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  public getOutputs() {
    return {
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      albDnsName: this.applicationLoadBalancer.dnsName,
      s3BucketName: this.s3Bucket.bucket,
      rdsEndpoint: this.rdsInstance.endpoint,
      natGatewayIp: this.elasticIp.publicIp,
    };
  }
}
