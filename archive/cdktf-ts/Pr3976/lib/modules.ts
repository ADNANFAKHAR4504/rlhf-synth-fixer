// modules.ts
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// ========== VPC Module ==========
export interface VpcModuleConfig {
  vpcCidr: string;
  availabilityZones: string[]; // Changed from azCount to explicit AZs
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
        Name: 'ts-dev-vpc',
      },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: 'ts-dev-igw',
        },
      }
    );

    // Initialize subnet arrays
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    // Create subnets in each specified AZ
    config.availabilityZones.forEach((az, i) => {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: az, // Use the passed AZ directly
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `ts-dev-public-subnet-${az}`,
          Type: 'Public',
          AvailabilityZone: az,
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az, // Use the passed AZ directly
        tags: {
          ...config.tags,
          Name: `ts-dev-private-subnet-${az}`,
          Type: 'Private',
          AvailabilityZone: az,
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `ts-dev-nat-eip-${az}`,
        },
      });

      // NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(
        this,
        `nat-gateway-${i}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            ...config.tags,
            Name: `ts-dev-nat-gateway-${az}`,
          },
        }
      );
      this.natGateways.push(natGateway);
    });

    // Route tables for public subnets
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: 'ts-dev-public-rt',
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Route tables for private subnets
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...config.tags,
            Name: `ts-dev-private-rt-${config.availabilityZones[index]}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // VPC Flow Logs
    if (config.enableFlowLogs && config.flowLogsBucket) {
      const flowLogRole = new aws.iamRole.IamRole(this, 'flow-log-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: config.tags,
      });

      new aws.iamRolePolicy.IamRolePolicy(this, 'flow-log-policy', {
        role: flowLogRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:GetBucketLocation', 's3:ListBucket'],
              Resource: [
                `arn:aws:s3:::${config.flowLogsBucket}`,
                `arn:aws:s3:::${config.flowLogsBucket}/*`,
              ],
            },
          ],
        }),
      });

      new aws.flowLog.FlowLog(this, 'vpc-flow-log', {
        trafficType: 'ALL',
        vpcId: this.vpc.id,
        logDestinationType: 's3',
        logDestination: `arn:aws:s3:::${config.flowLogsBucket}/vpc-flow-logs/`,
        tags: config.tags,
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
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach necessary policies
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ssm-managed-instance',
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'cloudwatch-agent',
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    // Custom policy for S3 and Parameter Store
    new aws.iamRolePolicy.IamRolePolicy(this, 'instance-policy', {
      role: this.instanceRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            Resource: ['arn:aws:s3:::*'],
          },
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParametersByPath',
            ],
            Resource: `arn:aws:ssm:*:*:parameter${config.ssmParameterPrefix}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*',
          },
        ],
      }),
    });

    // Instance Profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'instance-profile',
      {
        role: this.instanceRole.name,
        tags: config.tags,
      }
    );

    // Security Group for EC2 instances
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ec2-sg', {
      vpcId: config.vpcId,
      description: 'Security group for EC2 instances',
      tags: {
        ...config.tags,
        Name: 'ts-dev-ec2-sg',
      },
    });

    // Allow traffic from ALB
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: config.albSecurityGroupId,
      securityGroupId: this.securityGroup.id,
      description: 'HTTP from ALB',
    });

    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      sourceSecurityGroupId: config.albSecurityGroupId,
      securityGroupId: this.securityGroup.id,
      description: 'HTTPS from ALB',
    });

    // Egress rule
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // User data script with CloudWatch agent
    const userData =
      config.userData ||
      `#!/bin/bash
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
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'launch-template',
      {
        namePrefix: 'ts-dev-lt-',
        imageId: ami.id,
        instanceType: config.instanceType,
        keyName: config.keyName,
        vpcSecurityGroupIds: [this.securityGroup.id],
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...config.tags,
              Name: 'ts-dev-instance',
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required',
          httpEndpoint: 'enabled',
          httpPutResponseHopLimit: 1,
        },
        monitoring: {
          enabled: true,
        },
      }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      'asg',
      {
        name: 'ts-dev-asg',
        vpcZoneIdentifier: config.privateSubnetIds,
        minSize: config.minSize,
        maxSize: config.maxSize,
        desiredCapacity: config.desiredCapacity,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tag: Object.entries(config.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
        enabledMetrics: [
          'GroupMinSize',
          'GroupMaxSize',
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupTotalInstances',
        ],
      }
    );
  }
}

// ========== RDS Module ==========
export interface RdsModuleConfig {
  vpcId: string;
  privateSubnetIds: string[];
  engine: string;
  engineVersion?: string;
  instanceClass: string;
  allocatedStorage: number;
  storageEncrypted: boolean;
  backupRetentionPeriod: number;
  multiAz: boolean;
  tags: { [key: string]: string };
  masterUsername: string;
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
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: 'ts-dev-db-subnet-group',
        subnetIds: config.privateSubnetIds,
        tags: {
          ...config.tags,
          Name: 'ts-dev-db-subnet-group',
        },
      }
    );

    // Security Group for RDS
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'rds-sg', {
      vpcId: config.vpcId,
      description: 'Security group for RDS database',
      tags: {
        ...config.tags,
        Name: 'ts-dev-rds-sg',
      },
    });

    // Allow access from specified security groups
    config.allowedSecurityGroupIds.forEach((sgId, index) => {
      new aws.securityGroupRule.SecurityGroupRule(
        this,
        `rds-ingress-${index}`,
        {
          type: 'ingress',
          fromPort: config.engine === 'mysql' ? 3306 : 5432,
          toPort: config.engine === 'mysql' ? 3306 : 5432,
          protocol: 'tcp',
          sourceSecurityGroupId: sgId,
          securityGroupId: this.securityGroup.id,
          description: `Database access from security group ${index}`,
        }
      );
    });

    // KMS key for encryption
    const kmsKey = new aws.kmsKey.KmsKey(this, 'rds-kms-key', {
      description: 'KMS key for RDS encryption - ts-dev',
      enableKeyRotation: true,
      tags: config.tags,
    });

    new aws.kmsAlias.KmsAlias(this, 'rds-kms-alias', {
      name: 'alias/ts-dev-rds',
      targetKeyId: kmsKey.id,
    });

    // Parameter group for enhanced monitoring
    const parameterGroup = new aws.dbParameterGroup.DbParameterGroup(
      this,
      'db-parameter-group',
      {
        family: config.engine === 'mysql' ? 'mysql8.0' : 'postgres13',
        name: 'ts-dev-params',
        parameter:
          config.engine === 'mysql'
            ? [
                {
                  name: 'slow_query_log',
                  value: '1',
                },
                {
                  name: 'long_query_time',
                  value: '2',
                },
              ]
            : [
                {
                  name: 'log_statement',
                  value: 'all',
                },
                {
                  name: 'log_min_duration_statement',
                  value: '1000',
                },
              ],
        tags: config.tags,
      }
    );

    // RDS Instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db-instance', {
      identifier: 'ts-dev-db',
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: config.storageEncrypted,
      kmsKeyId: kmsKey.arn,
      dbName: config.databaseName,
      username: config.masterUsername,
      manageMasterUserPassword: true,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      parameterGroupName: parameterGroup.name,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: config.multiAz,
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      enabledCloudwatchLogsExports:
        config.engine === 'mysql' ? ['error'] : ['postgresql'],
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      monitoringRoleArn: new aws.iamRole.IamRole(this, 'rds-monitoring-role', {
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        ],
        tags: config.tags,
      }).arn,
      tags: config.tags,
    });

    this.endpoint = this.dbInstance.endpoint;
  }
}

// ========== ELB Module ==========
export interface ElbModuleConfig {
  vpcId: string;
  publicSubnetIds: string[];
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
        Name: 'ts-dev-alb-sg',
      },
    });

    // Ingress rules for HTTP and HTTPS
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'HTTP from anywhere',
    });

    // Egress rule
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: 'ts-dev-alb',
      loadBalancerType: 'application',
      subnets: config.publicSubnetIds,
      securityGroups: [this.securityGroup.id],
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      accessLogs: {
        bucket: config.accessLogsBucket,
        prefix: 'alb-logs',
        enabled: true,
      },
      tags: config.tags,
    });

    // Target Group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(
      this,
      'target-group',
      {
        name: 'ts-dev-tg',
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
          matcher: '200-299',
        },
        deregistrationDelay: '30',
        stickiness: {
          type: 'lb_cookie',
          enabled: true,
          cookieDuration: 86400,
        },
        tags: config.tags,
      }
    );

    // HTTP Listener (redirects to HTTPS)
    new aws.lbListener.LbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: config.tags,
    });

    // Attach Auto Scaling Group to Target Group
    if (config.autoScalingGroupId) {
      new aws.autoscalingAttachment.AutoscalingAttachment(
        this,
        'asg-attachment',
        {
          autoscalingGroupName: config.autoScalingGroupId,
          lbTargetGroupArn: this.targetGroup.arn,
        }
      );
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
    this.bucketName = `${config.bucketPrefix}-ts`;

    // S3 Bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: this.bucketName,
      tags: config.tags,
    });

    // Bucket versioning
    if (config.versioning) {
      new aws.s3BucketVersioning.S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Server-side encryption
    if (config.encryption) {
      const kmsKey = new aws.kmsKey.KmsKey(this, 's3-kms-key', {
        description: `KMS key for S3 bucket ${this.bucketName}`,
        enableKeyRotation: true,
        tags: config.tags,
      });

      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
        this,
        'encryption',
        {
          bucket: this.bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: kmsKey.id,
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );
    }

    // Access logging
    if (config.accessLogging) {
      new aws.s3BucketLogging.S3BucketLoggingA(this, 'logging', {
        bucket: this.bucket.id,
        targetBucket: this.bucket.id,
        targetPrefix: 'access-logs/',
      });
    }

    // Block all public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'public-access-block',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

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
            Action: ['s3:PutObject', 's3:PutObjectAcl', 's3:DeleteObject'],
            Resource: `${this.bucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                'aws:SourceAccount':
                  new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
                    this,
                    'current'
                  ).accountId,
              },
            },
          },
          {
            Sid: 'EnforceSSLRequestsOnly',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [this.bucket.arn, `${this.bucket.arn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
        ],
      }),
    });

    // Lifecycle rules
    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
        this,
        'lifecycle',
        {
          bucket: this.bucket.id,
          rule: config.lifecycleRules.map(rule => ({
            ...rule,
            // Ensure each rule has at least one action
            expiration: rule.expiration || {
              days: 90, // Default expiration
            },
          })),
        }
      );
    }
  }
}

// ========== CloudFront Module ==========
export interface CloudFrontModuleConfig {
  s3BucketDomainName: string;
  s3BucketId: string;
  tags: { [key: string]: string };
  logBucket: string;
}

export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly domainName: string;

  constructor(scope: Construct, id: string, config: CloudFrontModuleConfig) {
    super(scope, id);

    // Origin Access Control for S3
    const oac =
      new aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl(
        this,
        'oac',
        {
          name: 'ts-dev-oac',
          description: 'OAC for ts-dev',
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
        }
      );

    // CloudFront Distribution
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      'distribution',
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: 'CloudFront distribution for ts-dev',
        defaultRootObject: 'index.html',
        priceClass: 'PriceClass_100',

        origin: [
          {
            domainName: config.s3BucketDomainName,
            originId: 's3-origin',
            originAccessControlId: oac.id,
          },
        ],

        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: 's3-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          compress: true,

          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },

          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        loggingConfig: {
          bucket: `${config.logBucket}.s3.amazonaws.com`,
          prefix: 'cloudfront-logs/',
          includeCookies: false,
        },

        customErrorResponse: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 10,
          },
        ],

        tags: config.tags,
      }
    );

    // Update S3 bucket policy for CloudFront
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'cf-bucket-policy', {
      bucket: config.s3BucketId,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAC',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${config.s3BucketId}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': this.distribution.arn,
              },
            },
          },
        ],
      }),
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
      tags: config.tags,
    });

    // ACM Certificate for domain
    this.certificate = new aws.acmCertificate.AcmCertificate(
      this,
      'certificate',
      {
        domainName: config.domainName,
        subjectAlternativeNames: [`*.${config.domainName}`],
        validationMethod: 'DNS',
        tags: config.tags,
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // DNS validation records
    const validationRecord = new aws.route53Record.Route53Record(
      this,
      'cert-validation',
      {
        zoneId: this.hostedZone.zoneId,
        name: this.certificate.domainValidationOptions.get(0)
          .resourceRecordName,
        type: this.certificate.domainValidationOptions.get(0)
          .resourceRecordType,
        records: [
          this.certificate.domainValidationOptions.get(0).resourceRecordValue,
        ],
        ttl: 60,
        allowOverwrite: true,
      }
    );

    // Certificate validation
    new aws.acmCertificateValidation.AcmCertificateValidation(
      this,
      'cert-validation-complete',
      {
        certificateArn: this.certificate.arn,
        validationRecordFqdns: [validationRecord.fqdn],
      }
    );

    // A record for ALB
    if (config.albDnsName && config.albZoneId) {
      new aws.route53Record.Route53Record(this, 'alb-record', {
        zoneId: this.hostedZone.zoneId,
        name: `api.${config.domainName}`,
        type: 'A',
        alias: {
          name: config.albDnsName,
          zoneId: config.albZoneId,
          evaluateTargetHealth: true,
        },
      });

      // Health check for ALB
      const healthCheck = new aws.route53HealthCheck.Route53HealthCheck(
        this,
        'alb-health-check',
        {
          fqdn: `api.${config.domainName}`,
          type: 'HTTPS',
          resourcePath: '/health',
          failureThreshold: 3,
          requestInterval: 30,
          tags: config.tags,
        }
      );

      // CloudWatch alarm for health check
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'health-check-alarm',
        {
          alarmName: 'ts-dev-health-check-alarm',
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 2,
          metricName: 'HealthCheckStatus',
          namespace: 'AWS/Route53',
          period: 60,
          statistic: 'Minimum',
          threshold: 1,
          alarmDescription: 'Health check alarm for ALB endpoint',
          dimensions: {
            HealthCheckId: healthCheck.id,
          },
          tags: config.tags,
        }
      );
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
          evaluateTargetHealth: false,
        },
      });

      new aws.route53Record.Route53Record(this, 'cloudfront-www-record', {
        zoneId: this.hostedZone.zoneId,
        name: `www.${config.domainName}`,
        type: 'A',
        alias: {
          name: config.cloudfrontDomainName,
          zoneId: 'Z2FDTNDATAQYW2',
          evaluateTargetHealth: false,
        },
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
      description: 'KMS key for SSM parameters - ts-dev',
      enableKeyRotation: true,
      tags: config.tags,
    });

    new aws.kmsAlias.KmsAlias(this, 'parameter-kms-alias', {
      name: 'alias/ts-dev-ssm-params',
      targetKeyId: kmsKey.id,
    });

    // Create default parameters
    const defaultParams = {
      'db-password': this.generateRandomPassword(),
      'app-secret-key': this.generateRandomPassword(),
      'api-key': this.generateRandomPassword(),
      'jwt-secret': this.generateRandomPassword(),
    };

    Object.entries(defaultParams).forEach(([key, value]) => {
      const param = new aws.ssmParameter.SsmParameter(this, `param-${key}`, {
        name: `${config.parameterPrefix}/${key}`,
        type: 'SecureString',
        value: value,
        keyId: kmsKey.id,
        description: `${key} for application`,
        tags: config.tags,
      });
      this.parameters.set(key, param);
    });
  }

  private generateRandomPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
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
    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'trail-log-group',
      {
        name: '/aws/cloudtrail/ts-dev',
        tags: config.tags,
      }
    );

    // IAM Role for CloudTrail
    const trailRole = new aws.iamRole.IamRole(this, 'trail-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.tags,
    });

    new aws.iamRolePolicy.IamRolePolicy(this, 'trail-policy', {
      role: trailRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${logGroup.arn}:*`,
          },
        ],
      }),
    });

    // CloudTrail
    this.trail = new aws.cloudtrail.Cloudtrail(this, 'trail', {
      name: 'ts-dev-trail',
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: 'cloudtrail',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      isOrganizationTrail: false,
      enableLogFileValidation: true,
      enableLogging: true,
      cloudWatchLogsGroupArn: `${logGroup.arn}:*`,
      cloudWatchLogsRoleArn: trailRole.arn,
      tags: config.tags,
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
      name: 'ts-dev-alarms',
      displayName: 'Infrastructure Alarms',
      tags: config.tags,
    });

    new aws.snsTopicSubscription.SnsTopicSubscription(
      this,
      'alarm-subscription',
      {
        topicArn: snsTopic.arn,
        protocol: 'email',
        endpoint: config.snsEmailEndpoint,
      }
    );

    // ALB Target Health Alarm
    const albHealthAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'alb-health-alarm',
      {
        alarmName: 'ts-dev-alb-unhealthy-targets',
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
          LoadBalancer: config.albArn.split('/').slice(-3).join('/'),
        },
        tags: config.tags,
      }
    );
    this.alarms.push(albHealthAlarm);

    // ASG CPU Alarm
    const cpuAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'asg-cpu-alarm',
      {
        alarmName: 'ts-dev-asg-high-cpu',
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
          AutoScalingGroupName: config.asgName,
        },
        tags: config.tags,
      }
    );
    this.alarms.push(cpuAlarm);

    // RDS CPU Alarm
    const rdsAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-cpu-alarm',
      {
        alarmName: 'ts-dev-rds-high-cpu',
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
          DBInstanceIdentifier: config.dbInstanceId,
        },
        tags: config.tags,
      }
    );
    this.alarms.push(rdsAlarm);

    // RDS Storage Space Alarm
    const storageAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-storage-alarm',
      {
        alarmName: 'ts-dev-rds-low-storage',
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
          DBInstanceIdentifier: config.dbInstanceId,
        },
        tags: config.tags,
      }
    );
    this.alarms.push(storageAlarm);

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: 'ts-dev-dashboard',
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/ApplicationELB',
                    'RequestCount',
                    { stat: 'Sum', label: 'Request Count' },
                  ],
                  [
                    'AWS/ApplicationELB',
                    'TargetResponseTime',
                    { stat: 'Average', label: 'Response Time' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'ALB Metrics',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/EC2',
                    'CPUUtilization',
                    { stat: 'Average', label: 'EC2 CPU' },
                  ],
                  [
                    'AWS/RDS',
                    'CPUUtilization',
                    { stat: 'Average', label: 'RDS CPU' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'CPU Utilization',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                  ['AWS/RDS', 'FreeStorageSpace', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'RDS Metrics',
              },
            },
          ],
        }),
      }
    );
  }
}
