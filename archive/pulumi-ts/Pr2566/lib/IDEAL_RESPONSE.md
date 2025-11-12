Here's a complete Pulumi TypeScript implementation for a production-ready AWS infrastructure stack:

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

interface InfraConfig {
  allowedSshCidr: string;
  rdsConnectionsThreshold: number;
  rdsCpuThreshold: number;
  asgCpuHighThreshold: number;
  asgCpuLowThreshold: number;
  asgTargetCpuUtilization: number;
}

export class ProductionInfrastructure {
  public vpc?: aws.ec2.Vpc;
  public publicSubnets?: aws.ec2.Subnet[];
  public privateSubnets?: aws.ec2.Subnet[];
  public internetGateway?: aws.ec2.InternetGateway;
  public natGateway?: aws.ec2.NatGateway;
  public elasticIp?: aws.ec2.Eip;
  public publicRouteTable?: aws.ec2.RouteTable;
  public privateRouteTable?: aws.ec2.RouteTable;
  public vpcFlowLogGroup?: aws.cloudwatch.LogGroup;
  public vpcFlowLogRole?: aws.iam.Role;
  public vpcFlowLog?: aws.ec2.FlowLog;
  public ec2SecurityGroup?: aws.ec2.SecurityGroup;
  public rdsSecurityGroup?: aws.ec2.SecurityGroup;
  public albSecurityGroup?: aws.ec2.SecurityGroup;
  public ec2Role?: aws.iam.Role;
  public ec2InstanceProfile?: aws.iam.InstanceProfile;
  public kmsKey?: aws.kms.Key;
  public s3Bucket?: aws.s3.Bucket;
  public rdsSubnetGroup?: aws.rds.SubnetGroup;
  public rdsInstance?: aws.rds.Instance;
  public launchTemplate?: aws.ec2.LaunchTemplate;
  public targetGroup?: aws.lb.TargetGroup;
  public applicationLoadBalancer?: aws.lb.LoadBalancer;
  public albListener?: aws.lb.Listener;
  public autoScalingGroup?: aws.autoscaling.Group;
  public scaleUpPolicy?: aws.autoscaling.Policy;
  public scaleDownPolicy?: aws.autoscaling.Policy;
  public cpuAlarmHigh?: aws.cloudwatch.MetricAlarm;
  public cpuAlarmLow?: aws.cloudwatch.MetricAlarm;
  public rdsConnectionsAlarm?: aws.cloudwatch.MetricAlarm;
  public rdsCpuAlarm?: aws.cloudwatch.MetricAlarm;
  public appLogGroup?: aws.cloudwatch.LogGroup;
  public webAcl?: aws.wafv2.WebAcl;
  public cloudFrontDistribution?: aws.cloudfront.Distribution;

  private readonly environment: string;
  private provider?: aws.Provider;
  private readonly config: InfraConfig;
  private callerIdentity?: pulumi.Output<aws.GetCallerIdentityResult>;

  private constructor(environment: string) {
    this.environment = environment;

    const pulumiConfig = new pulumi.Config();
    this.config = {
      allowedSshCidr: pulumiConfig.get('allowedSshCidr') || '10.0.0.0/8',
      rdsConnectionsThreshold:
        pulumiConfig.getNumber('rdsConnectionsThreshold') || 80,
      rdsCpuThreshold: pulumiConfig.getNumber('rdsCpuThreshold') || 75,
      asgCpuHighThreshold: pulumiConfig.getNumber('asgCpuHighThreshold') || 80,
      asgCpuLowThreshold: pulumiConfig.getNumber('asgCpuLowThreshold') || 10,
      asgTargetCpuUtilization:
        pulumiConfig.getNumber('asgTargetCpuUtilization') || 50,
    };
  }

  private setupProvider(region: string) {
    this.provider = new aws.Provider('production-provider', {
      region: region,
    });
    this.callerIdentity = pulumi.output(
      aws.getCallerIdentity({}, { provider: this.provider })
    );
    this.region = region;
  }

  private region!: string;

  public static create(
    environment: string,
    region: string = 'ap-south-1'
  ): ProductionInfrastructure {
    const instance = new ProductionInfrastructure(environment);
    instance.setupProvider(region);
    instance.createStorage();
    instance.createNetworking();
    instance.createSecurity();
    instance.createDatabase();
    instance.createIAMRoles();
    instance.createLaunchTemplate();
    instance.createLoadBalancer();
    instance.createAutoScaling();
    instance.createWAF();
    instance.createCloudFront();
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
      { provider: this.provider }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: this.provider }
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
          { provider: this.provider }
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
          { provider: this.provider }
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
      { provider: this.provider }
    );

    // Elastic IPs for NAT Gateways (one per AZ for high availability)
    const natEips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 2; i++) {
      natEips.push(
        new aws.ec2.Eip(
          `${this.environment}-nat-eip-${i + 1}`,
          {
            domain: 'vpc',
            tags: {
              Name: `${this.environment}-nat-eip-${i + 1}`,
              environment: this.environment,
            },
          },
          { provider: this.provider }
        )
      );
    }

    // NAT Gateways (one per AZ to eliminate SPOF)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 2; i++) {
      natGateways.push(
        new aws.ec2.NatGateway(
          `${this.environment}-nat-gateway-${i + 1}`,
          {
            allocationId: natEips[i].id,
            subnetId: this.publicSubnets[i].id,
            tags: {
              Name: `${this.environment}-nat-gateway-${i + 1}`,
              environment: this.environment,
            },
          },
          { provider: this.provider }
        )
      );
    }

    // Store first NAT Gateway for backward compatibility
    this.natGateway = natGateways[0];
    this.elasticIp = natEips[0];

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
      { provider: this.provider }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${this.environment}-public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable!.id,
        },
        { provider: this.provider }
      );
    });

    // Private Route Tables (one per AZ for better isolation)
    const privateRouteTables: aws.ec2.RouteTable[] = [];
    for (let i = 0; i < 2; i++) {
      privateRouteTables.push(
        new aws.ec2.RouteTable(
          `${this.environment}-private-rt-${i + 1}`,
          {
            vpcId: this.vpc.id,
            routes: [
              {
                cidrBlock: '0.0.0.0/0',
                natGatewayId: natGateways[i].id,
              },
            ],
            tags: {
              Name: `${this.environment}-private-rt-${i + 1}`,
              environment: this.environment,
            },
          },
          { provider: this.provider }
        )
      );
    }

    // Associate each private subnet with its own route table
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${this.environment}-private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[index].id,
        },
        { provider: this.provider }
      );
    });

    // Store first private route table for backward compatibility
    this.privateRouteTable = privateRouteTables[0];

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
      { provider: this.provider }
    );

    // Application Log Group
    this.appLogGroup = new aws.cloudwatch.LogGroup(
      `${this.environment}-app-logs`,
      {
        retentionInDays: 30,
        tags: {
          Name: `${this.environment}-app-logs`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
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
      { provider: this.provider }
    );

    new aws.iam.RolePolicy(
      `${this.environment}-vpc-flow-log-policy`,
      {
        role: this.vpcFlowLogRole.id,
        policy: pulumi.all([this.vpcFlowLogGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
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
                Resource: [logGroupArn, `${logGroupArn}:*`],
              },
            ],
          })
        ),
      },
      { provider: this.provider }
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
      { provider: this.provider }
    );
  }

  private createSecurity() {
    // ALB Security Group (allowing all traffic as per requirement)
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `${this.environment}-alb-sg`,
      {
        name: `${this.environment}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc!.id,
        ingress: [
          {
            description: 'HTTP from anywhere',
            fromPort: 80,
            toPort: 80,
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
      { provider: this.provider }
    );

    // EC2 Security Group
    this.ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${this.environment}-ec2-sg`,
      {
        name: `${this.environment}-ec2-sg`,
        description: 'Security group for EC2 instances',
        vpcId: this.vpc!.id,
        ingress: [
          {
            description: 'SSH',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: [this.config.allowedSshCidr],
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
      { provider: this.provider }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${this.environment}-rds-sg`,
      {
        name: `${this.environment}-rds-sg`,
        description: 'Security group for RDS database',
        vpcId: this.vpc!.id,
        ingress: [
          {
            description: 'MySQL/Aurora',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [this.ec2SecurityGroup.id],
          },
        ],
        egress: [],
        tags: {
          Name: `${this.environment}-rds-sg`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );
  }

  private createStorage() {
    // KMS Key with proper policy and rotation
    this.kmsKey = new aws.kms.Key(
      `${this.environment}-kms-key`,
      {
        description: 'KMS key for encryption at rest',
        enableKeyRotation: true,
        policy: this.callerIdentity!.apply(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Id: 'key-default-1',
            Statement: [
              {
                Sid: 'EnableRoot',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${identity.accountId}:root` },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'AllowServicesViaRegion',
                Effect: 'Allow',
                Principal: {
                  Service: [
                    'rds.amazonaws.com',
                    's3.amazonaws.com',
                    'logs.amazonaws.com',
                  ],
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'kms:ViaService': [
                      `rds.${this.region}.amazonaws.com`,
                      `s3.${this.region}.amazonaws.com`,
                      `logs.${this.region}.amazonaws.com`,
                    ],
                  },
                },
              },
            ],
          })
        ),
        tags: {
          Name: `${this.environment}-kms-key`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );

    new aws.kms.Alias(
      `${this.environment}-kms-alias`,
      {
        name: `alias/${this.environment}-key`,
        targetKeyId: this.kmsKey.keyId,
      },
      { provider: this.provider }
    );

    // S3 Bucket with unique name
    this.s3Bucket = new aws.s3.Bucket(
      `${this.environment}-s3-bucket`,
      {
        bucket: pulumi.interpolate`${this.environment}-app-data-bucket-${
          this.callerIdentity!.accountId
        }`,
        tags: {
          Name: `${this.environment}-s3-bucket`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );

    // S3 Bucket Encryption (SSE-S3 for ALB compatibility)
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${this.environment}-s3-encryption`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { provider: this.provider }
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
      { provider: this.provider }
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
      { provider: this.provider }
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
      { provider: this.provider }
    );

    // S3 Bucket Policy for secure transport and ALB access logs
    const elbServiceAccount = aws.elb.getServiceAccount(
      {},
      { provider: this.provider }
    );
    new aws.s3.BucketPolicy(
      `${this.environment}-s3-policy`,
      {
        bucket: this.s3Bucket.id,
        policy: pulumi
          .all([this.s3Bucket.arn, elbServiceAccount])
          .apply(([bucketArn, elbAccount]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureTransport',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
                {
                  Sid: 'AllowALBAccessLogs',
                  Effect: 'Allow',
                  Principal: {
                    AWS: elbAccount.arn,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/alb-logs/*`,
                },
                {
                  Sid: 'AllowALBLogDeliveryWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/alb-logs/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Sid: 'AllowALBLogDeliveryCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { provider: this.provider }
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
      { provider: this.provider }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.environment}-rds-monitoring-attach`,
      {
        role: rdsMonitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { provider: this.provider }
    );

    // RDS Subnet Group
    this.rdsSubnetGroup = new aws.rds.SubnetGroup(
      `${this.environment}-rds-subnet-group`,
      {
        name: `${this.environment}-rds-subnet-group`,
        subnetIds: this.privateSubnets!.map(subnet => subnet.id),
        tags: {
          Name: `${this.environment}-rds-subnet-group`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );

    // RDS Instance with managed password and enhanced monitoring
    this.rdsInstance = new aws.rds.Instance(
      `${this.environment}-rds-mysql`,
      {
        identifier: `${this.environment}-mysql-db`,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: this.kmsKey!.arn,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        dbName: 'appdb',
        username: 'admin',
        manageMasterUserPassword: true,
        multiAz: true,
        publiclyAccessible: false,
        vpcSecurityGroupIds: [this.rdsSecurityGroup!.id],
        dbSubnetGroupName: this.rdsSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `${this.environment}-final-snapshot`,
        deletionProtection: true,
        monitoringRoleArn: rdsMonitoringRole.arn,
        monitoringInterval: 60,
        enabledCloudwatchLogsExports: [
          'error',
          'general',
          'slowquery',
          'audit',
        ],
        performanceInsightsEnabled: false,
        tags: {
          Name: `${this.environment}-rds-mysql`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
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
        threshold: this.config.rdsConnectionsThreshold,
        alarmDescription: 'RDS database connections are high',
        dimensions: {
          DBInstanceIdentifier: this.rdsInstance.id,
        },
        tags: {
          Name: `${this.environment}-rds-connections`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
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
        threshold: this.config.rdsCpuThreshold,
        alarmDescription: 'RDS CPU utilization is high',
        dimensions: {
          DBInstanceIdentifier: this.rdsInstance.id,
        },
        tags: {
          Name: `${this.environment}-rds-cpu`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );
  }

  private createIAMRoles() {
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
      { provider: this.provider }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.environment}-ec2-ssm-policy`,
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider: this.provider }
    );

    const rdsSecretArn = this.rdsInstance!.masterUserSecrets.apply(
      (secrets: any) =>
        secrets && secrets.length > 0 ? secrets[0]?.secretArn : undefined
    );

    const ec2InlinePolicy = pulumi
      .all([
        this.s3Bucket!.arn,
        this.appLogGroup!.arn,
        this.kmsKey!.arn,
        rdsSecretArn,
        this.callerIdentity!,
      ])
      .apply(([bucketArn, appLogGroupArn, kmsKeyArn, secretArn, identity]) => {
        const stmts: any[] = [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: [`${bucketArn}/app/*`, `${bucketArn}/logs/*`],
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: bucketArn,
            Condition: {
              StringLike: {
                's3:prefix': ['app/*', 'logs/*'],
              },
            },
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: [`${appLogGroupArn}:log-stream:*`],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: kmsKeyArn,
            Condition: {
              StringEquals: {
                'kms:ViaService': [
                  `s3.${this.region}.amazonaws.com`,
                  `logs.${this.region}.amazonaws.com`,
                  `secretsmanager.${this.region}.amazonaws.com`,
                ],
                'aws:SourceAccount': identity.accountId,
              },
            },
          },
        ];
        if (secretArn) {
          stmts.push({
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: secretArn,
          });
        }
        return JSON.stringify({ Version: '2012-10-17', Statement: stmts });
      });

    new aws.iam.RolePolicy(
      `${this.environment}-ec2-policy`,
      {
        role: this.ec2Role.id,
        policy: ec2InlinePolicy,
      },
      { provider: this.provider }
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
      { provider: this.provider }
    );
  }

  private createLaunchTemplate() {
    const ami = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['al2023-ami-*-x86_64'],
          },
        ],
      },
      { provider: this.provider }
    );

    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${this.environment}-launch-template`,
      {
        name: `${this.environment}-launch-template`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [this.ec2SecurityGroup!.id],
        iamInstanceProfile: {
          name: this.ec2InstanceProfile!.name,
        },
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${this.environment} environment</h1>" > /var/www/html/index.html
echo "Application server running" >> /var/www/html/index.html
`
        ).toString('base64'),
        metadataOptions: {
          httpTokens: 'required',
        },
        monitoring: {
          enabled: true,
        },
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
      { provider: this.provider }
    );
  }

  private createLoadBalancer() {
    this.targetGroup = new aws.lb.TargetGroup(
      `${this.environment}-tg`,
      {
        name: `${this.environment}-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc!.id,
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
      { provider: this.provider }
    );

    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${this.environment}-alb`,
      {
        name: `${this.environment}-alb`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [this.albSecurityGroup!.id],
        subnets: this.publicSubnets!.map(subnet => subnet.id),
        enableDeletionProtection: true,
        accessLogs: {
          bucket: this.s3Bucket!.bucket,
          prefix: 'alb-logs',
          enabled: true,
        },
        tags: {
          Name: `${this.environment}-alb`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );

    this.albListener = new aws.lb.Listener(
      `${this.environment}-alb-http`,
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
      { provider: this.provider }
    );
  }

  private createAutoScaling() {
    this.autoScalingGroup = new aws.autoscaling.Group(
      `${this.environment}-asg`,
      {
        name: `${this.environment}-asg`,
        vpcZoneIdentifiers: this.publicSubnets!.map(subnet => subnet.id),
        targetGroupArns: [this.targetGroup!.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate!.id,
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
      { provider: this.provider }
    );
  }

  private createWAF() {
    // Create US East 1 provider for CloudFront WAF
    const usEast1Provider = new aws.Provider('us-east-1-provider', {
      region: 'us-east-1',
    });

    this.webAcl = new aws.wafv2.WebAcl(
      `${this.environment}-web-acl`,
      {
        name: `${this.environment}-web-acl`,
        description: 'WebACL for CloudFront with managed rule sets',
        scope: 'CLOUDFRONT',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${this.environment}WebAcl`,
          sampledRequestsEnabled: true,
        },
        tags: {
          Name: `${this.environment}-web-acl`,
          environment: this.environment,
        },
      },
      { provider: usEast1Provider }
    );
  }

  private createCloudFront() {
    this.cloudFrontDistribution = new aws.cloudfront.Distribution(
      `${this.environment}-cloudfront`,
      {
        origins: [
          {
            domainName: this.applicationLoadBalancer!.dnsName,
            originId: 'ALB',
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        enabled: true,
        defaultCacheBehavior: {
          targetOriginId: 'ALB',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          forwardedValues: {
            queryString: true,
            cookies: { forward: 'all' },
            headers: ['*'],
          },
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        webAclId: this.webAcl!.arn,
        tags: {
          Name: `${this.environment}-cloudfront`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );
  }

  private createMonitoring() {
    // Target Tracking Scaling Policy (preferred over simple scaling)
    new aws.autoscaling.Policy(
      `${this.environment}-cpu-tt`,
      {
        name: `${this.environment}-cpu-tt`,
        autoscalingGroupName: this.autoScalingGroup!.name,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          targetValue: this.config.asgTargetCpuUtilization,
        },
      },
      { provider: this.provider }
    );

    // CloudWatch Alarms for monitoring (without scaling actions)
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
        threshold: this.config.asgCpuHighThreshold,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup!.name,
        },
        tags: {
          Name: `${this.environment}-cpu-high`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
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
        threshold: this.config.asgCpuLowThreshold,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup!.name,
        },
        tags: {
          Name: `${this.environment}-cpu-low`,
          environment: this.environment,
        },
      },
      { provider: this.provider }
    );
  }

  public getOutputs() {
    return {
      vpcId: this.vpc!.id,
      publicSubnetIds: this.publicSubnets!.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets!.map(subnet => subnet.id),
      albDnsName: this.applicationLoadBalancer!.dnsName,
      s3BucketName: this.s3Bucket!.bucket,
      rdsEndpoint: this.rdsInstance!.endpoint,
      natGatewayIp: this.elasticIp!.publicIp,
      albArn: this.applicationLoadBalancer!.arn,
      targetGroupArn: this.targetGroup!.arn,
      autoScalingGroupName: this.autoScalingGroup!.name,
      kmsKeyId: this.kmsKey!.keyId,
      kmsKeyArn: this.kmsKey!.arn,
      ec2SecurityGroupId: this.ec2SecurityGroup!.id,
      rdsSecurityGroupId: this.rdsSecurityGroup!.id,
      albSecurityGroupId: this.albSecurityGroup!.id,
      rdsInstanceId: this.rdsInstance!.id,
      rdsSubnetGroupName: this.rdsSubnetGroup!.name,
      launchTemplateId: this.launchTemplate!.id,
      vpcFlowLogGroupName: this.vpcFlowLogGroup!.name,
      ec2RoleName: this.ec2Role!.name,
      cpuAlarmHighName: this.cpuAlarmHigh!.name,
      cpuAlarmLowName: this.cpuAlarmLow!.name,
      rdsConnectionsAlarmName: this.rdsConnectionsAlarm!.name,
      rdsCpuAlarmName: this.rdsCpuAlarm!.name,
      internetGatewayId: this.internetGateway!.id,
      publicRouteTableId: this.publicRouteTable!.id,
      privateRouteTableId: this.privateRouteTable!.id,
      webAclId: this.webAcl!.id,
      webAclArn: this.webAcl!.arn,
      cloudFrontDomainName: this.cloudFrontDistribution!.domainName,
      cloudFrontDistributionId: this.cloudFrontDistribution!.id,
    };
  }
}
```
