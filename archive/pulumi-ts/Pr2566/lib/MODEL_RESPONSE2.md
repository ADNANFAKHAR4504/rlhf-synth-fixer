Here's the corrected code with all the TypeScript errors fixed:

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration
const config = new pulumi.Config();
const environment = 'production';
const region = 'ap-south-1';
const allowedSshCidr = config.require('allowedSshCidr'); // e.g., "203.0.113.0/24"

// AWS Provider for ap-south-1 region
const provider = new aws.Provider('production-provider', {
  region: region,
});

class ProductionInfrastructure {
  public vpc: aws.ec2.Vpc;
  public publicSubnets: aws.ec2.Subnet[];
  public privateSubnets: aws.ec2.Subnet[];
  public internetGateway: aws.ec2.InternetGateway;
  public natGateway: aws.ec2.NatGateway;
  public elasticIp: aws.ec2.Eip;
  public publicRouteTable: aws.ec2.RouteTable;
  public privateRouteTable: aws.ec2.RouteTable;
  public vpcFlowLogGroup: aws.cloudwatch.LogGroup;
  public vpcFlowLogRole: aws.iam.Role;
  public vpcFlowLog: aws.ec2.FlowLog;
  public ec2SecurityGroup: aws.ec2.SecurityGroup;
  public rdsSecurityGroup: aws.ec2.SecurityGroup;
  public albSecurityGroup: aws.ec2.SecurityGroup;
  public ec2Role: aws.iam.Role;
  public ec2InstanceProfile: aws.iam.InstanceProfile;
  public kmsKey: aws.kms.Key;
  public s3Bucket: aws.s3.Bucket;
  public rdsSubnetGroup: aws.rds.SubnetGroup;
  public rdsInstance: aws.rds.Instance;
  public launchTemplate: aws.ec2.LaunchTemplate;
  public targetGroup: aws.lb.TargetGroup;
  public applicationLoadBalancer: aws.lb.LoadBalancer;
  public albListener: aws.lb.Listener;
  public autoScalingGroup: aws.autoscaling.Group;
  public scaleUpPolicy: aws.autoscaling.Policy;
  public scaleDownPolicy: aws.autoscaling.Policy;
  public cpuAlarmHigh: aws.cloudwatch.MetricAlarm;
  public cpuAlarmLow: aws.cloudwatch.MetricAlarm;

  constructor() {
    this.createNetworking();
    this.createSecurity();
    this.createStorage();
    this.createDatabase();
    this.createCompute();
    this.createMonitoring();
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

    new aws.iam.RolePolicyAttachment(
      `${environment}-vpc-flow-log-policy`,
      {
        role: this.vpcFlowLogRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy',
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

    // EC2 IAM Role
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

    // EC2 IAM Policy
    new aws.iam.RolePolicy(
      `${environment}-ec2-policy`,
      {
        role: this.ec2Role.id,
        policy: JSON.stringify({
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
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              Resource: ['*'],
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
        }),
      },
      { provider }
    );

    this.ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${environment}-ec2-instance-profile`,
      {
        role: this.ec2Role.name,
        tags: {
          Name: `${environment}-ec2-instance-profile`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  private createStorage() {
    // KMS Key
    this.kmsKey = new aws.kms.Key(
      `${environment}-kms-key`,
      {
        description: `${environment} KMS key for encryption`,
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
        tags: {
          Name: `${environment}-s3-bucket`,
          environment: environment,
        },
      },
      { provider }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioningV2(
      `${environment}-s3-versioning`,
      {
        bucket: this.s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider }
    );

    // S3 Bucket Encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${environment}-s3-encryption`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: this.kmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      { provider }
    );

    // S3 Bucket Public Access Block
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
  }

  private createDatabase() {
    // RDS Subnet Group
    this.rdsSubnetGroup = new aws.rds.SubnetGroup(
      `${environment}-rds-subnet-group`,
      {
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${environment}-rds-subnet-group`,
          environment: environment,
        },
      },
      { provider }
    );

    // RDS Instance
    this.rdsInstance = new aws.rds.Instance(
      `${environment}-rds-mysql`,
      {
        identifier: `${environment}-mysql-db`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        dbName: 'productiondb',
        username: 'admin',
        password: 'changeme123!', // In production, use AWS Secrets Manager
        vpcSecurityGroupIds: [this.rdsSecurityGroup.id],
        dbSubnetGroupName: this.rdsSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        tags: {
          Name: `${environment}-rds-mysql`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  private createCompute() {
    // Get latest Amazon Linux 2 AMI
    const amiId = aws.ec2
      .getAmi(
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
      )
      .then(ami => ami.id);

    // Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${environment}-launch-template`,
      {
        namePrefix: `${environment}-lt-`,
        imageId: amiId,
        instanceType: 't3.micro',
        keyName: `${environment}-key-pair`, // Ensure this key pair exists
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: this.ec2InstanceProfile.name,
        },
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${environment} Environment</h1>" > /var/www/html/index.html
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${environment}-ec2-instance`,
              environment: environment,
            },
          },
        ],
      },
      { provider }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${environment}-alb`,
      {
        name: `${environment}-alb`,
        loadBalancerType: 'application',
        subnets: this.publicSubnets.map(subnet => subnet.id),
        securityGroups: [this.albSecurityGroup.id],
        tags: {
          Name: `${environment}-alb`,
          environment: environment,
        },
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

    // ALB Listener
    this.albListener = new aws.lb.Listener(
      `${environment}-alb-listener`,
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
        vpcZoneIdentifiers: this.publicSubnets.map(subnet => subnet.id),
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
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
  }

  private createMonitoring() {
    // CloudWatch Alarms
    this.cpuAlarmHigh = new aws.cloudwatch.MetricAlarm(
      `${environment}-cpu-alarm-high`,
      {
        name: `${environment}-cpu-alarm-high`,
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
          Name: `${environment}-cpu-alarm-high`,
          environment: environment,
        },
      },
      { provider }
    );

    this.cpuAlarmLow = new aws.cloudwatch.MetricAlarm(
      `${environment}-cpu-alarm-low`,
      {
        name: `${environment}-cpu-alarm-low`,
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
          Name: `${environment}-cpu-alarm-low`,
          environment: environment,
        },
      },
      { provider }
    );
  }

  // Output methods
  public getOutputs() {
    return {
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      albDnsName: this.applicationLoadBalancer.dnsName,
      s3BucketName: this.s3Bucket.id,
      rdsEndpoint: this.rdsInstance.endpoint,
      natGatewayIp: this.elasticIp.publicIp,
    };
  }
}

// Create the infrastructure
const infrastructure = new ProductionInfrastructure();
const outputs = infrastructure.getOutputs();

// Export outputs
export const vpcId = outputs.vpcId;
export const publicSubnetIds = outputs.publicSubnetIds;
export const privateSubnetIds = outputs.privateSubnetIds;
export const albDnsName = outputs.albDnsName;
export const s3BucketName = outputs.s3BucketName;
export const rdsEndpoint = outputs.rdsEndpoint;
export const natGatewayIp = outputs.natGatewayIp;
```

## Key Fixes Made:

1. **VPC Flow Log**: Changed `resourceId` to `vpcId` and removed `resourceType` property
2. **S3 Encryption**: Fixed the structure by using `rules` array directly instead of nested `serverSideEncryptionConfiguration`
3. **ALB Listener**: Changed port from string `'80'` to number `80`
4. **CloudWatch Alarms**: Changed all string values to numbers:
   - `evaluationPeriods: '2'` → `evaluationPeriods: 2`
   - `period: '120'` → `period: 120`
   - `threshold: '80'` → `threshold: 80`
   - `threshold: '10'` → `threshold: 10`

The code should now compile without TypeScript errors. All the functionality remains the same, but the type issues have been resolved according to the Pulumi AWS provider's TypeScript definitions.
