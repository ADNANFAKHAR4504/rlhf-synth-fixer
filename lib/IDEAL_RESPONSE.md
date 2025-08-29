Here's a complete Pulumi TypeScript implementation for a production-ready AWS infrastructure stack:

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Configuration
const config = new pulumi.Config();
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
  public rdsConnectionsAlarm!: aws.cloudwatch.MetricAlarm;
  public rdsCpuAlarm!: aws.cloudwatch.MetricAlarm;

  private environment: string;

  private constructor(environment: string) {
    this.environment = environment;
  }

  public static create(environment: string): ProductionInfrastructure {
    const instance = new ProductionInfrastructure(environment);
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
      `${this.environment}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${this.environment}-vpc`,
          environment: this.environment,
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
          `${this.environment}-public-subnet-${i + 1}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i + 1}.0/24`,
            availabilityZone: azs.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `${this.environment}-public-subnet-${i + 1}`,
              environment: this.environment,
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
          `${this.environment}-private-subnet-${i + 1}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: azs.then(azs => azs.names[i]),
            tags: {
              Name: `${this.environment}-private-subnet-${i + 1}`,
              environment: this.environment,
              Type: 'Private',
            },
          },
          { provider }
        )
      );
    }

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${this.environment}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${this.environment}-igw`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // Elastic IP for NAT Gateway
    this.elasticIp = new aws.ec2.Eip(
      `${this.environment}-nat-eip`,
      {
        domain: 'vpc',
        tags: {
          Name: `${this.environment}-nat-eip`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // NAT Gateway
    this.natGateway = new aws.ec2.NatGateway(
      `${this.environment}-nat-gateway`,
      {
        allocationId: this.elasticIp.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          Name: `${this.environment}-nat-gateway`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${this.environment}-public-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.internetGateway.id,
          },
        ],
        tags: {
          Name: `${this.environment}-public-rt`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${this.environment}-public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { provider }
      );
    });

    // Private Route Table
    this.privateRouteTable = new aws.ec2.RouteTable(
      `${this.environment}-private-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: this.natGateway.id,
          },
        ],
        tags: {
          Name: `${this.environment}-private-rt`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${this.environment}-private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTable.id,
        },
        { provider }
      );
    });

    // VPC Flow Logs
    this.vpcFlowLogGroup = new aws.cloudwatch.LogGroup(
      `${this.environment}-vpc-flow-logs`,
      {
        retentionInDays: 14,
        tags: {
          Name: `${this.environment}-vpc-flow-logs`,
          environment: this.environment,
        },
      },
      { provider }
    );

    this.vpcFlowLogRole = new aws.iam.Role(
      `${this.environment}-vpc-flow-log-role`,
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
          Name: `${this.environment}-vpc-flow-log-role`,
          environment: this.environment,
        },
      },
      { provider }
    );

    new aws.iam.RolePolicy(
      `${this.environment}-vpc-flow-log-policy`,
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
      `${this.environment}-vpc-flow-log`,
      {
        iamRoleArn: this.vpcFlowLogRole.arn,
        logDestination: this.vpcFlowLogGroup.arn,
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        tags: {
          Name: `${this.environment}-vpc-flow-log`,
          environment: this.environment,
        },
      },
      { provider }
    );
  }

  private createSecurity() {
    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `${this.environment}-alb-sg`,
      {
        name: `${this.environment}-alb-sg`,
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
          Name: `${this.environment}-alb-sg`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // EC2 Security Group
    this.ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${this.environment}-ec2-sg`,
      {
        name: `${this.environment}-ec2-sg`,
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
          Name: `${this.environment}-ec2-sg`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${this.environment}-rds-sg`,
      {
        name: `${this.environment}-rds-sg`,
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
          Name: `${this.environment}-rds-sg`,
          environment: this.environment,
        },
      },
      { provider }
    );
  }

  private createStorage() {
    // KMS Key with proper policy and rotation
    this.kmsKey = new aws.kms.Key(
      `${this.environment}-kms-key`,
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
          Name: `${this.environment}-kms-key`,
          environment: this.environment,
        },
      },
      { provider }
    );

    new aws.kms.Alias(
      `${this.environment}-kms-alias`,
      {
        name: `alias/${this.environment}-key`,
        targetKeyId: this.kmsKey.keyId,
      },
      { provider }
    );

    // S3 Bucket
    this.s3Bucket = new aws.s3.Bucket(
      `${this.environment}-s3-bucket`,
      {
        bucket: `${this.environment}-app-data-bucket`,
        tags: {
          Name: `${this.environment}-s3-bucket`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // S3 Bucket Encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${this.environment}-s3-encryption`,
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
      `${this.environment}-s3-versioning`,
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
      `${this.environment}-s3-pab`,
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
      `${this.environment}-s3-lifecycle`,
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
      `${this.environment}-rds-monitoring-role`,
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
          Name: `${this.environment}-rds-monitoring-role`,
          environment: this.environment,
        },
      },
      { provider }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.environment}-rds-monitoring-attach`,
      {
        role: rdsMonitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { provider }
    );

    // RDS Subnet Group
    this.rdsSubnetGroup = new aws.rds.SubnetGroup(
      `${this.environment}-rds-subnet-group`,
      {
        name: `${this.environment}-rds-subnet-group`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${this.environment}-rds-subnet-group`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // RDS Instance with managed password and enhanced monitoring
    this.rdsInstance = new aws.rds.Instance(
      `${this.environment}-rds-mysql`,
      {
        identifier: `${this.environment}-mysql-db`,
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
        finalSnapshotIdentifier: `${this.environment}-final-snapshot`,
        deletionProtection: true,
        monitoringRoleArn: rdsMonitoringRole.arn,
        monitoringInterval: 60,
        tags: {
          Name: `${this.environment}-rds-mysql`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // RDS CloudWatch Alarms
    this.rdsConnectionsAlarm = new aws.cloudwatch.MetricAlarm(
      `${this.environment}-rds-connections`,
      {
        name: `${this.environment}-rds-connections`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS database connections are high',
        dimensions: {
          DBInstanceIdentifier: this.rdsInstance.id,
        },
        tags: {
          Name: `${this.environment}-rds-connections`,
          environment: this.environment,
        },
      },
      { provider }
    );

    this.rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `${this.environment}-rds-cpu`,
      {
        name: `${this.environment}-rds-cpu`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 75,
        alarmDescription: 'RDS CPU utilization is high',
        dimensions: {
          DBInstanceIdentifier: this.rdsInstance.id,
        },
        tags: {
          Name: `${this.environment}-rds-cpu`,
          environment: this.environment,
        },
      },
      { provider }
    );
  }

  private createCompute() {
    // EC2 IAM Role with least privilege
    this.ec2Role = new aws.iam.Role(
      `${this.environment}-ec2-role`,
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
          Name: `${this.environment}-ec2-role`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // SSM Managed Instance Core Policy
    new aws.iam.RolePolicyAttachment(
      `${this.environment}-ec2-ssm-policy`,
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider }
    );

    // EC2 Role Policy with least privilege
    new aws.iam.RolePolicy(
      `${this.environment}-ec2-policy`,
      {
        role: this.ec2Role.id,
        policy: pulumi
          .all([this.s3Bucket.arn, this.vpcFlowLogGroup.arn, this.kmsKey.arn])
          .apply(([bucketArn, logGroupArn, kmsKeyArn]) =>
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
                  Resource: kmsKeyArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { provider }
    );

    this.ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${this.environment}-ec2-profile`,
      {
        role: this.ec2Role.name,
        tags: {
          Name: `${this.environment}-ec2-profile`,
          environment: this.environment,
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
      `${this.environment}-launch-template`,
      {
        name: `${this.environment}-launch-template`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',

        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: this.ec2InstanceProfile.name,
        },
        userData: pulumi
          .all([this.s3Bucket.bucket, this.rdsInstance.endpoint])
          .apply(([bucketName, rdsEndpoint]) =>
            Buffer.from(
              `#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho \"<h1>Hello from ${this.environment} environment</h1>\" > /var/www/html/index.html\necho \"S3 Bucket: ${bucketName}\" >> /var/www/html/index.html\necho \"RDS Endpoint: ${rdsEndpoint}\" >> /var/www/html/index.html\n`
            ).toString('base64')
          ),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${this.environment}-web-server`,
              environment: this.environment,
            },
          },
        ],
      },
      { provider }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${this.environment}-tg`,
      {
        name: `${this.environment}-tg`,
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
          Name: `${this.environment}-tg`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${this.environment}-alb`,
      {
        name: `${this.environment}-alb`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [this.albSecurityGroup.id],
        subnets: this.publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false,
        tags: {
          Name: `${this.environment}-alb`,
          environment: this.environment,
        },
      },
      { provider }
    );

    // ALB HTTP Listener
    this.albListener = new aws.lb.Listener(
      `${this.environment}-alb-listener-http`,
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
      `${this.environment}-asg`,
      {
        name: `${this.environment}-asg`,
        vpcZoneIdentifiers: this.publicSubnets.map(subnet => subnet.id),
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
            value: `${this.environment}-asg`,
            propagateAtLaunch: true,
          },
          {
            key: 'environment',
            value: this.environment,
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
      `${this.environment}-scale-up`,
      {
        name: `${this.environment}-scale-up`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
      },
      { provider }
    );

    this.scaleDownPolicy = new aws.autoscaling.Policy(
      `${this.environment}-scale-down`,
      {
        name: `${this.environment}-scale-down`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
      },
      { provider }
    );

    // CloudWatch Alarms
    this.cpuAlarmHigh = new aws.cloudwatch.MetricAlarm(
      `${this.environment}-cpu-high`,
      {
        name: `${this.environment}-cpu-high`,
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
          Name: `${this.environment}-cpu-high`,
          environment: this.environment,
        },
      },
      { provider }
    );

    this.cpuAlarmLow = new aws.cloudwatch.MetricAlarm(
      `${this.environment}-cpu-low`,
      {
        name: `${this.environment}-cpu-low`,
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
          Name: `${this.environment}-cpu-low`,
          environment: this.environment,
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
      // Additional outputs for comprehensive testing
      albArn: this.applicationLoadBalancer.arn,
      targetGroupArn: this.targetGroup.arn,
      autoScalingGroupName: this.autoScalingGroup.name,
      kmsKeyId: this.kmsKey.keyId,
      kmsKeyArn: this.kmsKey.arn,
      ec2SecurityGroupId: this.ec2SecurityGroup.id,
      rdsSecurityGroupId: this.rdsSecurityGroup.id,
      albSecurityGroupId: this.albSecurityGroup.id,
      rdsInstanceId: this.rdsInstance.id,
      rdsSubnetGroupName: this.rdsSubnetGroup.name,
      launchTemplateId: this.launchTemplate.id,
      vpcFlowLogGroupName: this.vpcFlowLogGroup.name,
      ec2RoleName: this.ec2Role.name,
      scaleUpPolicyArn: this.scaleUpPolicy.arn,
      scaleDownPolicyArn: this.scaleDownPolicy.arn,
      cpuAlarmHighName: this.cpuAlarmHigh.name,
      cpuAlarmLowName: this.cpuAlarmLow.name,
      internetGatewayId: this.internetGateway.id,
      publicRouteTableId: this.publicRouteTable.id,
      privateRouteTableId: this.privateRouteTable.id,
    };
  }
}
```
