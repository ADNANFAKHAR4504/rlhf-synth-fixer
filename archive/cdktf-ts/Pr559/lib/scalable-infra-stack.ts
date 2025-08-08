import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface ScalableInfrastructureProps {
  provider: AwsProvider;
  allowedCidr: string;
  dbUsername: string;
}

export class ScalableInfrastructure extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ScalableInfrastructureProps
  ) {
    super(scope, id);

    // Data sources for AZs and AMI
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      provider: props.provider,
      state: 'available',
    });

    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux', {
      provider: props.provider,
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // VPC Configuration
    const vpc = new Vpc(this, 'main-vpc', {
      provider: props.provider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        Environment: 'production',
      },
    });

    // Internet Gateway for public subnet internet access
    const internetGateway = new InternetGateway(this, 'igw', {
      provider: props.provider,
      vpcId: vpc.id,
      tags: {
        Name: `${id}-igw`,
        Environment: 'production',
      },
    });

    // Public Subnets across multiple AZs for high availability
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet for each AZ
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        provider: props.provider,
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${id}-public-subnet-${i + 1}`,
          Type: 'Public',
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet for each AZ
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        provider: props.provider,
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        tags: {
          Name: `${id}-private-subnet-${i + 1}`,
          Type: 'Private',
        },
      });
      privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const natEip = new Eip(this, `nat-eip-${i}`, {
        provider: props.provider,
        domain: 'vpc',
        tags: {
          Name: `${id}-nat-eip-${i + 1}`,
        },
      });

      // NAT Gateway for private subnet internet access
      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        provider: props.provider,
        allocationId: natEip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `${id}-nat-gateway-${i + 1}`,
        },
      });
      natGateways.push(natGateway);
    }

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      provider: props.provider,
      vpcId: vpc.id,
      tags: {
        Name: `${id}-public-rt`,
      },
    });

    // Route to internet gateway for public subnets
    new Route(this, 'public-route', {
      provider: props.provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        provider: props.provider,
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Route tables and routes for private subnets
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        provider: props.provider,
        vpcId: vpc.id,
        tags: {
          Name: `${id}-private-rt-${index + 1}`,
          Environment: 'production',
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
        provider: props.provider,
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        provider: props.provider,
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Groups
    // ALB Security Group - allows HTTP traffic from specified CIDR
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      provider: props.provider,
      name: `${id}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: [props.allowedCidr],
          description: 'HTTP access from allowed CIDR',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${id}-alb-sg`,
        Environment: 'production',
      },
    });

    // EC2 Security Group - allows traffic from ALB and SSH from specified CIDR
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      provider: props.provider,
      name: `${id}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'HTTP from ALB',
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [props.allowedCidr],
          description: 'SSH access from allowed CIDR',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${id}-ec2-sg`,
        Environment: 'production',
      },
    });

    // RDS Security Group - allows MySQL access from EC2 instances
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${id}-rds-sg`,
      description: 'Security group for RDS MySQL instance',
      vpcId: vpc.id,
      provider: props.provider,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [ec2SecurityGroup.id],
          description: 'MySQL access from EC2 instances',
        },
      ],
      tags: {
        Name: `${id}-rds-sg`,
        Environment: 'production',
      },
    });

    // S3 Bucket with server-side encryption
    const s3Bucket = new S3Bucket(this, 'app-bucket', {
      provider: props.provider,
      bucketPrefix: `${process.env.COMMIT_AUTHOR || 'unknown'}-app-bucket`,
      tags: {
        Name: `${id}-app-bucket`,
        Environment: 'production',
      },
    });

    // Enable server-side encryption for S3 bucket
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      provider: props.provider,
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      provider: props.provider,
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DynamoDB Table with primary key
    const dynamoTable = new DynamodbTable(this, 'app-table', {
      provider: props.provider,
      name: `${id}-app-table`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
      ],
      tags: {
        Name: `${id}-app-table`,
        Environment: 'production',
      },
    });

    // IAM Role for EC2 instances with least privilege access
    const ec2Role = new IamRole(this, 'ec2-role', {
      provider: props.provider,
      name: `${id}-ec2-role`,
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
        Name: `${id}-ec2-role`,
        Environment: 'production',
      },
    });

    // IAM Policy for S3 access (scoped to specific bucket)
    const s3Policy = new IamPolicy(this, 's3-policy', {
      provider: props.provider,
      name: `${id}-s3-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${s3Bucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: s3Bucket.arn,
          },
        ],
      }),
      tags: {
        Name: `${id}-s3-policy`,
        Environment: 'production',
      },
    });

    // IAM Policy for DynamoDB access (scoped to specific table)
    const dynamoPolicy = new IamPolicy(this, 'dynamo-policy', {
      provider: props.provider,
      name: `${id}-dynamo-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: dynamoTable.arn,
          },
        ],
      }),
      tags: {
        Name: `${id}-dynamo-policy`,
        Environment: 'production',
      },
    });

    // IAM Policy for CloudWatch logging
    const cloudwatchPolicy = new IamPolicy(this, 'cloudwatch-policy', {
      provider: props.provider,
      name: `${id}-cloudwatch-policy`,
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
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${id}-cloudwatch-policy`,
        Environment: 'production',
      },
    });

    // Attach policies to EC2 role
    new IamRolePolicyAttachment(this, 'ec2-s3-policy-attachment', {
      provider: props.provider,
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-dynamo-policy-attachment', {
      provider: props.provider,
      role: ec2Role.name,
      policyArn: dynamoPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy-attachment', {
      provider: props.provider,
      role: ec2Role.name,
      policyArn: cloudwatchPolicy.arn,
    });

    // Instance profile for EC2 instances
    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        provider: props.provider,
        name: `${id}-ec2-instance-profile`,
        role: ec2Role.name,
        tags: {
          Name: `${id}-ec2-instance-profile`,
          Environment: 'production',
        },
      }
    );

    // S3 Bucket Policy - restrict access to EC2 role only
    new S3BucketPolicy(this, 'bucket-policy', {
      provider: props.provider,
      bucket: s3Bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowEC2RoleAccess',
            Effect: 'Allow',
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${s3Bucket.arn}/*`,
          },
          {
            Sid: 'AllowEC2RoleListBucket',
            Effect: 'Allow',
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: 's3:ListBucket',
            Resource: s3Bucket.arn,
          },
        ],
      }),
    });

    // CloudWatch Log Group for VPC Flow Logs
    const vpcFlowLogGroup = new CloudwatchLogGroup(this, 'vpc-flow-logs', {
      provider: props.provider,
      name: `/aws/vpc/flowlogs/${id.replace(/\s+/g, '-')}`,
      retentionInDays: 14,
      tags: {
        Name: `${id}-vpc-flow-logs`,
        Environment: 'production',
      },
    });

    // IAM Role for VPC Flow Logs
    const vpcFlowLogRole = new IamRole(this, 'flow-log-role', {
      provider: props.provider,
      name: `${id.replace(/\s+/g, '-')}-flow-log-role`,
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
        Name: `${id}-flow-log-role`,
        Environment: 'production',
      },
    });

    // IAM Policy for VPC Flow Logs
    const vpcFlowLogPolicy = new IamPolicy(this, 'flow-log-policy', {
      provider: props.provider,
      name: `${id.replace(/\s+/g, '-')}-flow-log-policy`,
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
      tags: {
        Name: `${id}-flow-log-policy`,
        Environment: 'production',
      },
    });

    // Attach policy to VPC Flow Log Role
    new IamRolePolicyAttachment(this, 'flow-log-role-policy-attachment', {
      provider: props.provider,
      role: vpcFlowLogRole.name,
      policyArn: vpcFlowLogPolicy.arn,
    });

    // Enable VPC Flow Logs
    new FlowLog(this, 'vpc-flow-log', {
      provider: props.provider,
      vpcId: vpc.id,
      logDestination: vpcFlowLogGroup.arn,
      iamRoleArn: vpcFlowLogRole.arn,
      trafficType: 'ALL',
      tags: {
        Name: `${id}-vpc-flow-log`,
        Environment: 'production',
      },
    });

    // RDS Subnet Group for multi-AZ deployment
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      provider: props.provider,
      name: `${id.replace(/\s+/g, '-')}-db-subnet-group`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${id}-db-subnet-group`,
        Environment: 'production',
      },
    });

    // RDS MySQL Instance with Multi-AZ and encryption, using the secret for master password
    const rdsInstance = new DbInstance(this, 'rds-mysql', {
      provider: props.provider,
      identifier: `${id}-mysql`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      dbName: 'appdb',
      username: props.dbUsername,
      manageMasterUserPassword: true,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      tags: {
        Name: `${id}-rds-mysql`,
        Environment: 'production',
      },
      lifecycle: {
        ignoreChanges: ['username'], // Ignore changes to master username
      },
    });

    // Launch Template for Auto Scaling Group
    const launchTemplate = new LaunchTemplate(this, 'ec2-launch-template', {
      provider: props.provider,
      namePrefix: `${id}-launch-template-`,
      imageId: amazonLinuxAmi.id,
      instanceType: 't3.micro',
      keyName: undefined, // No key pair for security
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: {
        name: ec2InstanceProfile.name,
      },
      userData: Buffer.from(
        `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo '<h1>Hello from Auto Scaling Group Instance</h1>' > /var/www/html/index.html

# Configure CloudWatch Agent for memory monitoring
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`
      ).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `${id}-asg-instance`,
            Environment: 'production',
          },
        },
      ],
      tags: {
        Name: `${id}-launch-template`,
        Environment: 'production',
      },
    });

    // Target Group for ALB
    const targetGroup = new LbTargetGroup(this, 'alb-target-group', {
      provider: props.provider,
      name: `${id}-tg`,
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
        Name: `${id}-target-group`,
        Environment: 'production',
      },
    });

    // Auto Scaling Group
    const autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      provider: props.provider,
      name: `${id}-asg`,
      minSize: 3,
      maxSize: 9,
      desiredCapacity: 3,
      vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id),
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: [
        {
          key: 'Name',
          value: `${id}-asg`,
          propagateAtLaunch: false,
        },
        {
          key: 'Environment',
          value: 'production',
          propagateAtLaunch: true,
        },
      ],
    });

    // Auto Scaling Policy - Scale Out (CPU)
    const scaleOutPolicyCpu = new AutoscalingPolicy(
      this,
      'scale-out-policy-cpu',
      {
        provider: props.provider,
        name: `${id}-scale-out-cpu`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      }
    );

    // Auto Scaling Policy - Scale In (CPU)
    const scaleInPolicyCpu = new AutoscalingPolicy(
      this,
      'scale-in-policy-cpu',
      {
        provider: props.provider,
        name: `${id}-scale-in-cpu`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      }
    );

    // Auto Scaling Policy - Scale Out (Memory)
    const scaleOutPolicyMemory = new AutoscalingPolicy(
      this,
      'scale-out-policy-memory',
      {
        provider: props.provider,
        name: `${id}-scale-out-memory`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      }
    );

    // Auto Scaling Policy - Scale In (Memory)
    const scaleInPolicyMemory = new AutoscalingPolicy(
      this,
      'scale-in-policy-memory',
      {
        provider: props.provider,
        name: `${id}-scale-in-memory`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      }
    );

    // CloudWatch Alarm - High CPU (Scale Out)
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      provider: props.provider,
      alarmName: `${id}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [scaleOutPolicyCpu.arn],
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      tags: {
        Name: `${id}-high-cpu-alarm`,
        Environment: 'production',
      },
    });

    // CloudWatch Alarm - Low CPU (Scale In)
    new CloudwatchMetricAlarm(this, 'low-cpu-alarm', {
      provider: props.provider,
      alarmName: `${id}-low-cpu`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 30,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [scaleInPolicyCpu.arn],
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      tags: {
        Name: `${id}-low-cpu-alarm`,
        Environment: 'production',
      },
    });

    // CloudWatch Alarm - High Memory (Scale Out)
    new CloudwatchMetricAlarm(this, 'high-memory-alarm', {
      provider: props.provider,
      alarmName: `${id}-high-memory`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'mem_used_percent',
      namespace: 'CWAgent',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors ec2 memory utilization',
      alarmActions: [scaleOutPolicyMemory.arn],
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      tags: {
        Name: `${id}-high-memory-alarm`,
        Environment: 'production',
      },
    });

    // CloudWatch Alarm - Low Memory (Scale In)
    new CloudwatchMetricAlarm(this, 'low-memory-alarm', {
      provider: props.provider,
      alarmName: `${id}-low-memory`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'mem_used_percent',
      namespace: 'CWAgent',
      period: 120,
      statistic: 'Average',
      threshold: 40,
      alarmDescription: 'This metric monitors ec2 memory utilization',
      alarmActions: [scaleInPolicyMemory.arn],
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      tags: {
        Name: `${id}-low-memory-alarm`,
        Environment: 'production',
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      provider: props.provider,
      name: `${id}-alb`,
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      tags: {
        Name: `${id}-alb`,
        Environment: 'production',
      },
    });

    // ALB Listener
    new LbListener(this, 'alb-listener', {
      provider: props.provider,
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: `${id}-alb-listener`,
        Environment: 'production',
      },
    });

    // Outputs for important resource information
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Bucket.bucket,
      description: 'S3 Bucket name',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: dynamoTable.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS MySQL endpoint',
    });

    new TerraformOutput(this, 'rds-username', {
      value: props.dbUsername,
      description: 'RDS MySQL username',
    });
    new TerraformOutput(this, 'rds-master-password-secret', {
      value: rdsInstance.masterUserSecret,
      description: 'RDS MySQL master password',
      sensitive: true,
    });

    new TerraformOutput(this, 'asg-name', {
      value: autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'target-group-arn', {
      value: targetGroup.arn,
      description: 'Load Balancer Target Group ARN',
    });

    new TerraformOutput(this, 'launch-template-id', {
      value: launchTemplate.id,
      description: 'Launch Template ID',
    });
  }
}
