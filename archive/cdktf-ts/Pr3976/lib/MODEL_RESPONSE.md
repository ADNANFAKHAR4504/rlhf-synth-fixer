### Reasoning Trace
---

This is a comprehensive AWS infrastructure request using CDKTF in TypeScript. I need to create two main files:

1. `modules.ts` - Containing reusable infrastructure modules
2. `tap-stack.ts` - Composing and deploying the full stack

The infrastructure needs:
- VPC with multi-AZ setup
- Application Load Balancer
- EC2 Auto Scaling Groups
- RDS Multi-AZ
- S3 buckets with encryption
- CloudFront CDN
- Route 53 DNS
- CloudTrail for auditing
- Systems Manager Parameter Store for secrets
- CloudWatch monitoring
- Security best practices throughout

Let me structure this properly with all the required modules and then the main stack composition.
### Answer 
---

I'll create a comprehensive CDKTF solution for your AWS web application infrastructure. This will be a production-ready, secure, and highly available architecture.

## `modules.ts` - Infrastructure Modules

```typescript
// modules.ts
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

// ========== VPC Module ==========
export interface VpcModuleConfig {
  vpcCidr: string;
  azCount: number;
  tags: { [key: string]: string };
  enableFlowLogs: boolean;
  flowLogsBucket?: string;
}

export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  
  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);
    
    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${id}-vpc`
      }
    });
    
    // Get availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, 'azs', {
      state: 'available'
    });
    
    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${id}-igw`
      }
    });
    
    // Initialize subnet arrays
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];
    
    // Create subnets in each AZ
    for (let i = 0; i < config.azCount; i++) {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: azs.names.get(i),
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${id}-public-subnet-${i}`,
          Type: 'Public'
        }
      });
      this.publicSubnets.push(publicSubnet);
      
      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: azs.names.get(i),
        tags: {
          ...config.tags,
          Name: `${id}-private-subnet-${i}`,
          Type: 'Private'
        }
      });
      this.privateSubnets.push(privateSubnet);
      
      // Elastic IP for NAT Gateway
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${id}-nat-eip-${i}`
        }
      });
      
      // NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...config.tags,
          Name: `${id}-nat-gateway-${i}`
        }
      });
      this.natGateways.push(natGateway);
    }
    
    // Route tables for public subnets
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${id}-public-rt`
      }
    });
    
    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id
    });
    
    // Associate public subnets with route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });
    
    // Route tables for private subnets
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${id}-private-rt-${index}`
        }
      });
      
      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id
      });
      
      new aws.routeTableAssociation.RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });
    
    // VPC Flow Logs
    if (config.enableFlowLogs && config.flowLogsBucket) {
      const flowLogRole = new aws.iamRole.IamRole(this, 'flow-log-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        }),
        tags: config.tags
      });
      
      new aws.iamRolePolicy.IamRolePolicy(this, 'flow-log-policy', {
        role: flowLogRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetBucketLocation',
              's3:ListBucket'
            ],
            Resource: [
              `arn:aws:s3:::${config.flowLogsBucket}`,
              `arn:aws:s3:::${config.flowLogsBucket}/*`
            ]
          }]
        })
      });
      
      new aws.flowLog.FlowLog(this, 'vpc-flow-log', {
        trafficType: 'ALL',
        vpcId: this.vpc.id,
        logDestinationType: 's3',
        logDestination: `arn:aws:s3:::${config.flowLogsBucket}/vpc-flow-logs/`,
        tags: config.tags
      });
    }
  }
}

// ========== EC2 Module ==========
export interface Ec2ModuleConfig {
  vpcId: string;
  privateSubnetIds: string[];
  albSecurityGroupId: string;
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  tags: { [key: string]: string };
  userData?: string;
  keyName?: string;
  ssmParameterPrefix: string;
}

export class Ec2Module extends Construct {
  public readonly autoScalingGroup: aws.autoscalingGroup.AutoscalingGroup;
  public readonly launchTemplate: aws.launchTemplate.LaunchTemplate;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly instanceRole: aws.iamRole.IamRole;
  
  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);
    
    // EC2 IAM Role
    this.instanceRole = new aws.iamRole.IamRole(this, 'instance-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      }),
      tags: config.tags
    });
    
    // Attach necessary policies
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'ssm-managed-instance', {
      role: this.instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
    });
    
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'cloudwatch-agent', {
      role: this.instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
    });
    
    // Custom policy for S3 and Parameter Store
    new aws.iamRolePolicy.IamRolePolicy(this, 'instance-policy', {
      role: this.instanceRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:ListBucket'
            ],
            Resource: ['arn:aws:s3:::*']
          },
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParametersByPath'
            ],
            Resource: `arn:aws:ssm:*:*:parameter${config.ssmParameterPrefix}/*`
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*'
          }
        ]
      })
    });
    
    // Instance Profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(this, 'instance-profile', {
      role: this.instanceRole.name,
      tags: config.tags
    });
    
    // Security Group for EC2 instances
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ec2-sg', {
      vpcId: config.vpcId,
      description: 'Security group for EC2 instances',
      tags: {
        ...config.tags,
        Name: `${id}-ec2-sg`
      }
    });
    
    // Allow traffic from ALB
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: config.albSecurityGroupId,
      securityGroupId: this.securityGroup.id,
      description: 'HTTP from ALB'
    });
    
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      sourceSecurityGroupId: config.albSecurityGroupId,
      securityGroupId: this.securityGroup.id,
      description: 'HTTPS from ALB'
    });
    
    // Egress rule
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic'
    });
    
    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2']
        },
        {
          name: 'virtualization-type',
          values: ['hvm']
        }
      ]
    });
    
    // User data script with CloudWatch agent
    const userData = config.userData || `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent httpd

# Start Apache
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/apache/access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/apache/error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CustomApp",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
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

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
  -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "<h1>Healthy</h1>" > /var/www/html/health.html
`;
    
    // Launch Template
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(this, 'launch-template', {
      namePrefix: `${id}-lt-`,
      imageId: ami.id,
      instanceType: config.instanceType,
      keyName: config.keyName,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: {
        arn: instanceProfile.arn
      },
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          ...config.tags,
          Name: `${id}-instance`
        }
      }],
      metadataOptions: {
        httpTokens: 'required',
        httpEndpoint: 'enabled',
        httpPutResponseHopLimit: 1
      },
      monitoring: {
        enabled: true
      }
    });
    
    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscalingGroup.AutoscalingGroup(this, 'asg', {
      name: `${id}-asg`,
      vpcZoneIdentifier: config.privateSubnetIds,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest'
      },
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true
      })),
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances'
      ]
    });
  }
}

// ========== RDS Module ==========
export interface RdsModuleConfig {
  vpcId: string;
  privateSubnetIds: string[];
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  storageEncrypted: boolean;
  backupRetentionPeriod: number;
  multiAz: boolean;
  tags: { [key: string]: string };
  masterUsername: string;
  masterPasswordParameterName: string;
  databaseName: string;
  allowedSecurityGroupIds: string[];
}

export class RdsModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly endpoint: string;
  
  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);
    
    // DB Subnet Group
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(this, 'db-subnet-group', {
      name: `${id}-db-subnet-group`,
      subnetIds: config.privateSubnetIds,
      tags: {
        ...config.tags,
        Name: `${id}-db-subnet-group`
      }
    });
    
    // Security Group for RDS
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'rds-sg', {
      vpcId: config.vpcId,
      description: 'Security group for RDS database',
      tags: {
        ...config.tags,
        Name: `${id}-rds-sg`
      }
    });
    
    // Allow access from specified security groups
    config.allowedSecurityGroupIds.forEach((sgId, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `rds-ingress-${index}`, {
        type: 'ingress',
        fromPort: config.engine === 'mysql' ? 3306 : 5432,
        toPort: config.engine === 'mysql' ? 3306 : 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: sgId,
        securityGroupId: this.securityGroup.id,
        description: `Database access from security group ${index}`
      });
    });
    
    // KMS key for encryption
    const kmsKey = new aws.kmsKey.KmsKey(this, 'rds-kms-key', {
      description: `KMS key for RDS encryption - ${id}`,
      enableKeyRotation: true,
      tags: config.tags
    });
    
    new aws.kmsAlias.KmsAlias(this, 'rds-kms-alias', {
      name: `alias/${id}-rds`,
      targetKeyId: kmsKey.id
    });
    
    // Parameter group for enhanced monitoring
    const parameterGroup = new aws.dbParameterGroup.DbParameterGroup(this, 'db-parameter-group', {
      family: config.engine === 'mysql' ? 'mysql8.0' : 'postgres13',
      name: `${id}-params`,
      parameter: config.engine === 'mysql' ? [
        {
          name: 'slow_query_log',
          value: '1'
        },
        {
          name: 'long_query_time',
          value: '2'
        }
      ] : [
        {
          name: 'log_statement',
          value: 'all'
        },
        {
          name: 'log_min_duration_statement',
          value: '1000'
        }
      ],
      tags: config.tags
    });
    
    // Get password from Parameter Store
    const passwordData = new aws.dataAwsSsmParameter.DataAwsSsmParameter(this, 'db-password', {
      name: config.masterPasswordParameterName,
      withDecryption: true
    });
    
    // RDS Instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db-instance', {
      identifier: `${id}-db`,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: config.storageEncrypted,
      kmsKeyId: kmsKey.arn,
      dbName: config.databaseName,
      username: config.masterUsername,
      password: passwordData.value,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      parameterGroupName: parameterGroup.name,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: config.multiAz,
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      enabledCloudwatchLogsExports: config.engine === 'mysql' 
        ? ['error', 'general', 'slowquery'] 
        : ['postgresql'],
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      monitoringRoleArn: new aws.iamRole.IamRole(this, 'rds-monitoring-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'monitoring.rds.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
        ],
        tags: config.tags
      }).arn,
      tags: config.tags
    });
    
    this.endpoint = this.dbInstance.endpoint;
  }
}

// ========== ELB Module ==========
export interface ElbModuleConfig {
  vpcId: string;
  publicSubnetIds: string[];
  certificateArn: string;
  targetGroupPort: number;
  healthCheckPath: string;
  tags: { [key: string]: string };
  accessLogsBucket: string;
  autoScalingGroupId?: string;
}

export class ElbModule extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly dnsName: string;
  
  constructor(scope: Construct, id: string, config: ElbModuleConfig) {
    super(scope, id);
    
    // Security Group for ALB
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'alb-sg', {
      vpcId: config.vpcId,
      description: 'Security group for Application Load Balancer',
      tags: {
        ...config.tags,
        Name: `${id}-alb-sg`
      }
    });
    
    // Ingress rules for HTTP and HTTPS
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'HTTP from anywhere'
    });
    
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'HTTPS from anywhere'
    });
    
    // Egress rule
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic'
    });
    
    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: `${id}-alb`,
      loadBalancerType: 'application',
      subnets: config.publicSubnetIds,
      securityGroups: [this.securityGroup.id],
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      accessLogs: {
        bucket: config.accessLogsBucket,
        prefix: 'alb-logs',
        enabled: true
      },
      tags: config.tags
    });
    
    // Target Group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'target-group', {
      name: `${id}-tg`,
      port: config.targetGroupPort,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: config.healthCheckPath,
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200-299'
      },
      deregistrationDelay: 30,
      stickiness: {
        type: 'lb_cookie',
        enabled: true,
        cookieDuration: 86400
      },
      tags: config.tags
    });
    
    // HTTP Listener (redirects to HTTPS)
    new aws.lbListener.LbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{
        type: 'redirect',
        redirect: {
          port: '443',
          protocol: 'HTTPS',
          statusCode: 'HTTP_301'
        }
      }],
      tags: config.tags
    });
    
    // HTTPS Listener
    new aws.lbListener.LbListener(this, 'https-listener', {
      loadBalancerArn: this.alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: config.certificateArn,
      defaultAction: [{
        type: 'forward',
        targetGroupArn: this.targetGroup.arn
      }],
      tags: config.tags
    });
    
    // Attach Auto Scaling Group to Target Group
    if (config.autoScalingGroupId) {
      new aws.autoscalingAttachment.AutoscalingAttachment(this, 'asg-attachment', {
        autoscalingGroupName: config.autoScalingGroupId,
        lbTargetGroupArn: this.targetGroup.arn
      });
    }
    
    this.dnsName = this.alb.dnsName;
  }
}

// ========== S3 Module ==========
export interface S3ModuleConfig {
  bucketPrefix: string;
  versioning: boolean;
  encryption: boolean;
  accessLogging: boolean;
  tags: { [key: string]: string };
  lifecycleRules?: any[];
}

export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketName: string;
  
  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);
    
    // Create unique bucket name
    this.bucketName = `${config.bucketPrefix}-${Date.now()}`;
    
    // S3 Bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: this.bucketName,
      tags: config.tags
    });
    
    // Bucket versioning
    if (config.versioning) {
      new aws.s3BucketVersioning.S3BucketVersioning(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled'
        }
      });
    }
    
    // Server-side encryption
    if (config.encryption) {
      const kmsKey = new aws.kmsKey.KmsKey(this, 's3-kms-key', {
        description: `KMS key for S3 bucket ${this.bucketName}`,
        enableKeyRotation: true,
        tags: config.tags
      });
      
      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfiguration(
        this,
        'encryption',
        {
          bucket: this.bucket.id,
          rule: [{
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.id
            },
            bucketKeyEnabled: true
          }]
        }
      );
    }
    
    // Access logging
    if (config.accessLogging) {
      new aws.s3BucketLogging.S3BucketLogging(this, 'logging', {
        bucket: this.bucket.id,
        targetBucket: this.bucket.id,
        targetPrefix: 'access-logs/'
      });
    }
    
    // Block all public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });
    
    // Bucket policy to deny public write
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyPublicWrite',
            Effect: 'Deny',
            Principal: '*',
            Action: [
              's3:PutObject',
              's3:PutObjectAcl',
              's3:DeleteObject'
            ],
            Resource: `${this.bucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                'aws:SourceAccount': new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(this, 'current').accountId
              }
            }
          },
          {
            Sid: 'EnforceSSLRequestsOnly',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              this.bucket.arn,
              `${this.bucket.arn}/*`
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false'
              }
            }
          }
        ]
      })
    });
    
    // Lifecycle rules
    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
        this,
        'lifecycle',
        {
          bucket: this.bucket.id,
          rule: config.lifecycleRules
        }
      );
    }
  }
}

// ========== CloudFront Module ==========
export interface CloudFrontModuleConfig {
  s3BucketDomainName: string;
  s3BucketId: string;
  certificateArn: string;
  domainNames: string[];
  tags: { [key: string]: string };
  logBucket: string;
}

export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly domainName: string;
  
  constructor(scope: Construct, id: string, config: CloudFrontModuleConfig) {
    super(scope, id);
    
    // Origin Access Control for S3
    const oac = new aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl(this, 'oac', {
      name: `${id}-oac`,
      description: `OAC for ${id}`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4'
    });
    
    // CloudFront Distribution
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(this, 'distribution', {
      enabled: true,
      isIpv6Enabled: true,
      comment: `CloudFront distribution for ${id}`,
      defaultRootObject: 'index.html',
      aliases: config.domainNames,
      priceClass: 'PriceClass_100',
      
      origin: [{
        domainName: config.s3BucketDomainName,
        originId: 's3-origin',
        originAccessControlId: oac.id
      }],
      
      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: 's3-origin',
        viewerProtocolPolicy: 'redirect-to-https',
        compress: true,
        
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none'
          }
        },
        
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400
      },
      
      restrictions: {
        geoRestriction: {
          restrictionType: 'none'
        }
      },
      
      viewerCertificate: {
        acmCertificateArn: config.certificateArn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021'
      },
      
      loggingConfig: {
        bucket: `${config.logBucket}.s3.amazonaws.com`,
        prefix: 'cloudfront-logs/',
        includeCookies: false
      },
      
      customErrorResponse: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 10
        }
      ],
      
      tags: config.tags
    });
    
    // Update S3 bucket policy for CloudFront
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'cf-bucket-policy', {
      bucket: config.s3BucketId,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Sid: 'AllowCloudFrontOAC',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com'
          },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${config.s3BucketId}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': this.distribution.arn
            }
          }
        }]
      })
    });
    
    this.domainName = this.distribution.domainName;
  }
}

// ========== Route53 Module ==========
export interface Route53ModuleConfig {
  domainName: string;
  albDnsName?: string;
  albZoneId?: string;
  cloudfrontDomainName?: string;
  cloudfrontZoneId?: string;
  tags: { [key: string]: string };
}

export class Route53Module extends Construct {
  public readonly hostedZone: aws.route53Zone.Route53Zone;
  public readonly certificate: aws.acmCertificate.AcmCertificate;
  
  constructor(scope: Construct, id: string, config: Route53ModuleConfig) {
    super(scope, id);
    
    // Create or import hosted zone
    this.hostedZone = new aws.route53Zone.Route53Zone(this, 'hosted-zone', {
      name: config.domainName,
      tags: config.tags
    });
    
    // ACM Certificate for domain
    this.certificate = new aws.acmCertificate.AcmCertificate(this, 'certificate', {
      domainName: config.domainName,
      subjectAlternativeNames: [`*.${config.domainName}`],
      validationMethod: 'DNS',
      tags: config.tags,
      lifecycle: {
        createBeforeDestroy: true
      }
    });
    
    // DNS validation records
    const validationRecord = new aws.route53Record.Route53Record(this, 'cert-validation', {
      zoneId: this.hostedZone.zoneId,
      name: this.certificate.domainValidationOptions.get(0).resourceRecordName,
      type: this.certificate.domainValidationOptions.get(0).resourceRecordType,
      records: [this.certificate.domainValidationOptions.get(0).resourceRecordValue],
      ttl: 60,
      allowOverwrite: true
    });
    
    // Certificate validation
    new aws.acmCertificateValidation.AcmCertificateValidation(this, 'cert-validation-complete', {
      certificateArn: this.certificate.arn,
      validationRecordFqdns: [validationRecord.fqdn]
    });
    
    // A record for ALB
    if (config.albDnsName && config.albZoneId) {
      new aws.route53Record.Route53Record(this, 'alb-record', {
        zoneId: this.hostedZone.zoneId,
        name: `api.${config.domainName}`,
        type: 'A',
        alias: {
          name: config.albDnsName,
          zoneId: config.albZoneId,
          evaluateTargetHealth: true
        }
      });
      
      // Health check for ALB
      const healthCheck = new aws.route53HealthCheck.Route53HealthCheck(this, 'alb-health-check', {
        fqdn: `api.${config.domainName}`,
        type: 'HTTPS',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: config.tags
      });
      
      // CloudWatch alarm for health check
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'health-check-alarm', {
        alarmName: `${id}-health-check-alarm`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Health check alarm for ALB endpoint',
        dimensions: {
          HealthCheckId: healthCheck.id
        },
        tags: config.tags
      });
    }
    
    // A record for CloudFront
    if (config.cloudfrontDomainName) {
      new aws.route53Record.Route53Record(this, 'cloudfront-record', {
        zoneId: this.hostedZone.zoneId,
        name: config.domainName,
        type: 'A',
        alias: {
          name: config.cloudfrontDomainName,
          zoneId: 'Z2FDTNDATAQYW2', // CloudFront hosted zone ID
          evaluateTargetHealth: false
        }
      });
      
      new aws.route53Record.Route53Record(this, 'cloudfront-www-record', {
        zoneId: this.hostedZone.zoneId,
        name: `www.${config.domainName}`,
        type: 'A',
        alias: {
          name: config.cloudfrontDomainName,
          zoneId: 'Z2FDTNDATAQYW2',
          evaluateTargetHealth: false
        }
      });
    }
  }
}

// ========== Secrets Module ==========
export interface SecretsModuleConfig {
  parameterPrefix: string;
  tags: { [key: string]: string };
}

export class SecretsModule extends Construct {
  public readonly parameters: Map<string, aws.ssmParameter.SsmParameter>;
  
  constructor(scope: Construct, id: string, config: SecretsModuleConfig) {
    super(scope, id);
    
    this.parameters = new Map();
    
    // KMS key for parameter encryption
    const kmsKey = new aws.kmsKey.KmsKey(this, 'parameter-kms-key', {
      description: `KMS key for SSM parameters - ${id}`,
      enableKeyRotation: true,
      tags: config.tags
    });
    
    new aws.kmsAlias.KmsAlias(this, 'parameter-kms-alias', {
      name: `alias/${id}-ssm-params`,
      targetKeyId: kmsKey.id
    });
    
    // Create default parameters
    const defaultParams = {
      'db-password': this.generateRandomPassword(),
      'app-secret-key': this.generateRandomPassword(),
      'api-key': this.generateRandomPassword(),
      'jwt-secret': this.generateRandomPassword()
    };
    
    Object.entries(defaultParams).forEach(([key, value]) => {
      const param = new aws.ssmParameter.SsmParameter(this, `param-${key}`, {
        name: `${config.parameterPrefix}/${key}`,
        type: 'SecureString',
        value: value,
        keyId: kmsKey.id,
        description: `${key} for application`,
        tags: config.tags
      });
      this.parameters.set(key, param);
    });
  }
  
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
  
  public getParameterName(key: string): string {
    const param = this.parameters.get(key);
    return param ? param.name : '';
  }
}

// ========== CloudTrail Module ==========
export interface CloudTrailModuleConfig {
  s3BucketName: string;
  tags: { [key: string]: string };
}

export class CloudTrailModule extends Construct {
  public readonly trail: aws.cloudtrail.Cloudtrail;
  
  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);
    
    // CloudWatch Log Group for CloudTrail
    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'trail-log-group', {
      name: `/aws/cloudtrail/${id}`,
      retentionInDays: 90,
      tags: config.tags
    });
    
    // IAM Role for CloudTrail
    const trailRole = new aws.iamRole.IamRole(this, 'trail-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'cloudtrail.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      }),
      tags: config.tags
    });
    
    new aws.iamRolePolicy.IamRolePolicy(this, 'trail-policy', {
      role: trailRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          Resource: `${logGroup.arn}:*`
        }]
      })
    });
    
    // CloudTrail
    this.trail = new aws.cloudtrail.Cloudtrail(this, 'trail', {
      name: `${id}-trail`,
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: 'cloudtrail',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      isOrganizationTrail: false,
      enableLogFileValidation: true,
      enableLogging: true,
      cloudWatchLogsGroupArn: `${logGroup.arn}:*`,
      cloudWatchLogsRoleArn: trailRole.arn,
      eventSelector: [{
        readWriteType: 'All',
        includeManagementEvents: true,
        dataResource: [
          {
            type: 'AWS::S3::Object',
            values: ['arn:aws:s3:::*/*']
          },
          {
            type: 'AWS::RDS::DBCluster',
            values: ['arn:aws:rds:*:*:cluster/*']
          }
        ]
      }],
      tags: config.tags
    });
  }
}

// ========== Monitoring Module ==========
export interface MonitoringModuleConfig {
  albArn: string;
  asgName: string;
  dbInstanceId: string;
  tags: { [key: string]: string };
  snsEmailEndpoint: string;
}

export class MonitoringModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];
  
  constructor(scope: Construct, id: string, config: MonitoringModuleConfig) {
    super(scope, id);
    
    this.alarms = [];
    
    // SNS Topic for alarms
    const snsTopic = new aws.snsTopic.SnsTopic(this, 'alarm-topic', {
      name: `${id}-alarms`,
      displayName: 'Infrastructure Alarms',
      tags: config.tags
    });
    
    new aws.snsTopicSubscription.SnsTopicSubscription(this, 'alarm-subscription', {
      topicArn: snsTopic.arn,
      protocol: 'email',
      endpoint: config.snsEmailEndpoint
    });
    
    // ALB Target Health Alarm
    const albHealthAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'alb-health-alarm', {
      alarmName: `${id}-alb-unhealthy-targets`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'Alert when ALB has unhealthy targets',
      alarmActions: [snsTopic.arn],
      dimensions: {
        LoadBalancer: config.albArn.split('/').slice(-3).join('/')
      },
      tags: config.tags
    });
    this.alarms.push(albHealthAlarm);
    
    // ASG CPU Alarm
    const cpuAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'asg-cpu-alarm', {
      alarmName: `${id}-asg-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when ASG CPU exceeds 80%',
      alarmActions: [snsTopic.arn],
      dimensions: {
        AutoScalingGroupName: config.asgName
      },
      tags: config.tags
    });
    this.alarms.push(cpuAlarm);
    
    // RDS CPU Alarm
    const rdsAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `${id}-rds-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      alarmDescription: 'Alert when RDS CPU exceeds 75%',
      alarmActions: [snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: config.dbInstanceId
      },
      tags: config.tags
    });
    this.alarms.push(rdsAlarm);
    
    // RDS Storage Space Alarm
    const storageAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'rds-storage-alarm', {
      alarmName: `${id}-rds-low-storage`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 10737418240, // 10GB in bytes
      alarmDescription: 'Alert when RDS storage is below 10GB',
      alarmActions: [snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: config.dbInstanceId
      },
      tags: config.tags
    });
    this.alarms.push(storageAlarm);
    
    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `${id}-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum', label: 'Request Count' }],
                ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average', label: 'Response Time' }]
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'ALB Metrics'
            }
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/EC2', 'CPUUtilization', { stat: 'Average', label: 'EC2 CPU' }],
                ['AWS/RDS', 'CPUUtilization', { stat: 'Average', label: 'RDS CPU' }]
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'CPU Utilization'
            }
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                ['AWS/RDS', 'FreeStorageSpace', { stat: 'Average' }]
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'RDS Metrics'
            }
          }
        ]
      })
    });
  }
}
```

## `tap-stack.ts` - Complete Main Stack Composition

```typescript
// tap-stack.ts
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import {
  VpcModule,
  Ec2Module,
  RdsModule,
  ElbModule,
  S3Module,
  CloudFrontModule,
  Route53Module,
  SecretsModule,
  CloudTrailModule,
  MonitoringModule
} from './modules';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    // AWS Provider Configuration
    new aws.provider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: {
        tags: {
          Environment: 'Production',
          Owner: 'DevOps',
          Security: 'Enforced',
          ManagedBy: 'CDKTF',
          Project: 'TAP'
        }
      }
    });
    
    // Global Tags
    const globalTags = {
      Environment: 'Production',
      Owner: 'DevOps',
      Security: 'Enforced',
      ManagedBy: 'CDKTF',
      Project: 'TAP',
      CreatedAt: new Date().toISOString()
    };
    
    // Domain configuration
    const domainName = 'example.com'; // Replace with your domain
    const adminEmail = 'admin@example.com'; // Replace with your email
    
    // ========== Storage (Create logs bucket first) ==========
    const logsBucket = new S3Module(this, 'logs-bucket', {
      bucketPrefix: 'tap-logs',
      versioning: true,
      encryption: true,
      accessLogging: false, // Avoid circular dependency
      tags: globalTags,
      lifecycleRules: [{
        id: 'expire-old-logs',
        status: 'Enabled',
        expiration: {
          days: 90
        },
        transition: [{
          days: 30,
          storageClass: 'STANDARD_IA'
        }],
        noncurrentVersionExpiration: {
          days: 30
        }
      }]
    });
    
    const assetsBucket = new S3Module(this, 'assets-bucket', {
      bucketPrefix: 'tap-assets',
      versioning: true,
      encryption: true,
      accessLogging: true,
      tags: globalTags,
      lifecycleRules: [{
        id: 'manage-old-assets',
        status: 'Enabled',
        transition: [{
          days: 60,
          storageClass: 'STANDARD_IA'
        }, {
          days: 180,
          storageClass: 'GLACIER'
        }],
        noncurrentVersionExpiration: {
          days: 90
        }
      }]
    });
    
    // ========== Networking ==========
    const vpcModule = new VpcModule(this, 'vpc', {
      vpcCidr: '10.0.0.0/16',
      azCount: 2,
      tags: globalTags,
      enableFlowLogs: true,
      flowLogsBucket: logsBucket.bucketName
    });
    
    // ========== Secrets Management ==========
    const secretsModule = new SecretsModule(this, 'secrets', {
      parameterPrefix: '/tap/app',
      tags: globalTags
    });
    
    // ========== DNS and SSL ==========
    const route53Module = new Route53Module(this, 'dns', {
      domainName: domainName,
      tags: globalTags
    });
    
    // ========== Load Balancer ==========
    const elbModule = new ElbModule(this, 'elb', {
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      certificateArn: route53Module.certificate.arn,
      targetGroupPort: 80,
      healthCheckPath: '/health.html',
      tags: globalTags,
      accessLogsBucket: logsBucket.bucketName
    });
    
    // ========== Compute ==========
    const ec2Module = new Ec2Module(this, 'ec2', {
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      albSecurityGroupId: elbModule.securityGroup.id,
      instanceType: 't3.medium',
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 3,
      tags: globalTags,
      ssmParameterPrefix: '/tap/app',
      keyName: 'tap-keypair' // Create this keypair in AWS console or via CDKTF
    });
    
    // Attach ASG to Target Group
    new aws.autoscalingAttachment.AutoscalingAttachment(this, 'asg-tg-attachment', {
      autoscalingGroupName: ec2Module.autoScalingGroup.name,
      lbTargetGroupArn: elbModule.targetGroup.arn
    });
    
    // Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscalingPolicy.AutoscalingPolicy(this, 'scale-up-policy', {
      name: 'tap-scale-up',
      scalingAdjustment: 2,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: ec2Module.autoScalingGroup.name
    });
    
    const scaleDownPolicy = new aws.autoscalingPolicy.AutoscalingPolicy(this, 'scale-down-policy', {
      name: 'tap-scale-down',
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: ec2Module.autoScalingGroup.name
    });
    
    // CloudWatch Alarms for Auto Scaling
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'cpu-high-alarm', {
      alarmName: 'tap-cpu-high',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'Scale up when CPU exceeds 70%',
      alarmActions: [scaleUpPolicy.arn],
      dimensions: {
        AutoScalingGroupName: ec2Module.autoScalingGroup.name
      }
    });
    
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'cpu-low-alarm', {
      alarmName: 'tap-cpu-low',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 30,
      alarmDescription: 'Scale down when CPU is below 30%',
      alarmActions: [scaleDownPolicy.arn],
      dimensions: {
        AutoScalingGroupName: ec2Module.autoScalingGroup.name
      }
    });
    
    // ========== Database ==========
    const rdsModule = new RdsModule(this, 'rds', {
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      engine: 'mysql',
      engineVersion: '8.0.33',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      multiAz: true,
      tags: globalTags,
      masterUsername: 'admin',
      masterPasswordParameterName: secretsModule.getParameterName('db-password'),
      databaseName: 'tapdb',
      allowedSecurityGroupIds: [ec2Module.securityGroup.id]
    });
    
    // ========== CDN ==========
    const cloudFrontModule = new CloudFrontModule(this, 'cdn', {
      s3BucketDomainName: assetsBucket.bucket.bucketRegionalDomainName,
      s3BucketId: assetsBucket.bucket.id,
      certificateArn: route53Module.certificate.arn,
      domainNames: [domainName, `www.${domainName}`],
      tags: globalTags,
      logBucket: logsBucket.bucketName
    });
    
    // ========== Update Route53 Records ==========
    new aws.route53Record.Route53Record(this, 'api-record', {
      zoneId: route53Module.hostedZone.zoneId,
      name: `api.${domainName}`,
      type: 'A',
      alias: {
        name: elbModule.alb.dnsName,
        zoneId: elbModule.alb.zoneId,
        evaluateTargetHealth: true
      }
    });
    
    new aws.route53Record.Route53Record(this, 'cdn-record', {
      zoneId: route53Module.hostedZone.zoneId,
      name: domainName,
      type: 'A',
      alias: {
        name: cloudFrontModule.distribution.domainName,
        zoneId: 'Z2FDTNDATAQYW2', // CloudFront's hosted zone ID
        evaluateTargetHealth: false
      }
    });
    
    new aws.route53Record.Route53Record(this, 'cdn-www-record', {
      zoneId: route53Module.hostedZone.zoneId,
      name: `www.${domainName}`,
      type: 'A',
      alias: {
        name: cloudFrontModule.distribution.domainName,
        zoneId: 'Z2FDTNDATAQYW2',
        evaluateTargetHealth: false
      }
    });
    
    // ========== Audit and Compliance ==========
    const cloudTrailModule = new CloudTrailModule(this, 'audit', {
      s3BucketName: logsBucket.bucketName,
      tags: globalTags
    });
    
    // ========== Monitoring ==========
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      albArn: elbModule.alb.arn,
      asgName: ec2Module.autoScalingGroup.name,
      dbInstanceId: rdsModule.dbInstance.id,
      tags: globalTags,
      snsEmailEndpoint: adminEmail
    });
    
    // ========== Additional Security Configurations ==========
    
    // WAF for CloudFront
    const wafWebAcl = new aws.wafv2WebAcl.Wafv2WebAcl(this, 'waf-web-acl', {
      name: 'tap-waf-acl',
      scope: 'CLOUDFRONT',
      defaultAction: {
        allow: {}
      },
      rule: [
        {
          name: 'RateLimitRule',
          priority: 1,
          action: {
            block: {}
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS'
            }
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
            sampledRequestsEnabled: true
          }
        }
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'tap-waf-metric',
        sampledRequestsEnabled: true
      },
      tags: globalTags
    });
    
    // AWS Config Rules for Compliance (without Config Recorder)
    const configRole = new aws.iamRole.IamRole(this, 'config-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'config.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/ConfigRole'
      ],
      tags: globalTags
    });
    
    // S3 Bucket Policy for ALB Access Logs
    const elbAccountId = '127311923021'; // US East 1 ELB Account ID
    
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'alb-logs-bucket-policy', {
      bucket: logsBucket.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'ALBAccessLogsPolicy',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${elbAccountId}:root`
            },
            Action: 's3:PutObject',
            Resource: `${logsBucket.bucket.arn}/alb-logs/*`
          },
          {
            Sid: 'CloudTrailAccessLogsPolicy',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com'
            },
            Action: [
              's3:GetBucketAcl',
              's3:PutObject'
            ],
            Resource: [
              logsBucket.bucket.arn,
              `${logsBucket.bucket.arn}/*`
            ]
          }
        ]
      })
    });
    
    // ========== Terraform Outputs ==========
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID'
    });
    
    new TerraformOutput(this, 'alb-dns-name', {
      value: elbModule.alb.dnsName,
      description: 'Application Load Balancer DNS Name'
    });
    
    new TerraformOutput(this, 'alb-url', {
      value: `https://api.${domainName}`,
      description: 'Application Load Balancer URL'
    });
    
    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS Database Endpoint',
      sensitive: true
    });
    
    new TerraformOutput(this, 'rds-database-name', {
      value: rdsModule.dbInstance.dbName,
      description: 'RDS Database Name'
    });
    
    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: cloudFrontModule.distribution.id,
      description: 'CloudFront Distribution ID'
    });
    
    new TerraformOutput(this, 'cloudfront-domain-name', {
      value: cloudFrontModule.distribution.domainName,
      description: 'CloudFront Distribution Domain Name'
    });
    
    new TerraformOutput(this, 'cdn-url', {
      value: `https://${domainName}`,
      description: 'CDN URL'
    });
    
    new TerraformOutput(this, 's3-logs-bucket', {
      value: logsBucket.bucketName,
      description: 'S3 Logs Bucket Name'
    });
    
    new TerraformOutput(this, 's3-assets-bucket', {
      value: assetsBucket.bucketName,
      description: 'S3 Assets Bucket Name'
    });
    
    new TerraformOutput(this, 'route53-hosted-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'Route 53 Hosted Zone ID'
    });
    
    new TerraformOutput(this, 'cloudtrail-name', {
      value: cloudTrailModule.trail.name,
      description: 'CloudTrail Name'
    });
    
    new TerraformOutput(this, 'ec2-instance-role-arn', {
      value: ec2Module.instanceRole.arn,
      description: 'EC2 Instance IAM Role ARN'
    });
    
    new TerraformOutput(this, 'asg-name', {
      value: ec2Module.autoScalingGroup.name,
      description: 'Auto Scaling Group Name'
    });
    
    new TerraformOutput(this, 'monitoring-dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${monitoringModule.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL'
    });
    
    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(s => s.id),
      description: 'Private Subnet IDs'
    });
    
    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(s => s.id),
      description: 'Public Subnet IDs'
    });
    
    new TerraformOutput(this, 'nat-gateway-ips', {
      value: vpcModule.natGateways.map(n => n.publicIp),
      description: 'NAT Gateway Elastic IPs'
    });
    
    new TerraformOutput(this, 'acm-certificate-arn', {
      value: route53Module.certificate.arn,
      description: 'ACM Certificate ARN'
    });
    
    new TerraformOutput(this, 'ssm-parameter-prefix', {
      value: '/tap/app',
      description: 'SSM Parameter Store Prefix for Application Secrets'
    });
  }
}

// ========== App Entry Point ==========
const app = new App();
new TapStack(app, 'tap-stack');
app.synth();
```

## Additional Files Needed

### `package.json`

```json
{
  "name": "tap-infrastructure",
  "version": "1.0.0",
  "main": "main.js",
  "types": "main.ts",
  "license": "MIT",
  "private": true,
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write '**/*.ts'"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^15.0.0",
    "cdktf": "^0.17.0",
    "constructs": "^10.2.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "eslint": "^8.38.0",
    "jest": "^29.5.0",
    "prettier": "^2.8.7",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### `cdktf.json`

```json
{
  "language": "typescript",
  "app": "npx ts-node tap-stack.ts",
  "projectId": "tap-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "outDir": "dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "cdktf.out"]
}
```

## Deployment Instructions

```bash
# 1. Install dependencies
npm install

# 2. Generate provider bindings
cdktf get

# 3. Compile TypeScript
npm run build

# 4. Synthesize Terraform configuration
cdktf synth

# 5. Deploy infrastructure
cdktf deploy tap-stack

# 6. To destroy infrastructure
cdktf destroy tap-stack
```

## Important Notes

1. **Replace Domain**: Update `domainName` and `adminEmail` in `tap-stack.ts` with your actual values
2. **Key Pair**: Create an EC2 key pair named 'tap-keypair' or update the `keyName` parameter
3. **IAM Permissions**: Ensure your AWS credentials have sufficient permissions to create all resources
4. **Cost Considerations**: This creates production-grade resources that will incur AWS charges
5. **Security**: Review and adjust security group rules based on your requirements
6. **Monitoring**: Check CloudWatch dashboards and set up appropriate alarms
7. **Backup**: Verify RDS backup settings meet your recovery requirements

This complete solution provides a secure, highly available, and production-ready AWS infrastructure using CDKTF in TypeScript.