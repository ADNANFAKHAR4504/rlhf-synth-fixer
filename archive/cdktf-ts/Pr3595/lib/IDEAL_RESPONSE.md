## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';
import { Fn } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

// Common interfaces
export interface BaseModuleProps {
  projectName: string;
  environment: string;
  region: string;
  tags?: { [key: string]: string };
}

export interface VpcModuleProps extends BaseModuleProps {
  cidrBlock: string;
  azCount: number;
  enableNatGateway?: boolean;
  enableVpnGateway?: boolean;
}

export interface Ec2ModuleProps extends BaseModuleProps {
  vpc: VpcModule;
  instanceType: string;
  amiId: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  keyName?: string;
}

export interface RdsModuleProps extends BaseModuleProps {
  vpc: VpcModule;
  instanceClass: string;
  engine: string;
  allocatedStorage: number;
  databaseName: string;
  masterUsername: string;
  multiAz: boolean;
  backupRetentionPeriod: number;
}

export interface S3ModuleProps extends BaseModuleProps {
  bucketName?: string;
  versioning?: boolean;
  encryption?: boolean;
  publicReadAccess?: boolean;
}

// VPC Module
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateways: NatGateway[];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${namePrefix}-VPC`,
        ...commonTags,
      },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${namePrefix}-IGW`,
        ...commonTags,
      },
    });

    // Get availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
      this,
      'azs',
      {
        state: 'available',
      }
    );

    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    // Create subnets
    for (let i = 0; i < props.azCount; i++) {
      const az = Fn.element(azs.names, i);

      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${namePrefix}-PublicSubnet-${i + 1}`,
          Type: 'Public',
          ...commonTags,
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `${namePrefix}-PrivateSubnet-${i + 1}`,
          Type: 'Private',
          ...commonTags,
        },
      });
      this.privateSubnets.push(privateSubnet);

      // NAT Gateway
      if (props.enableNatGateway) {
        const eip = new Eip(this, `nat-eip-${i}`, {
          domain: 'vpc',
          tags: {
            Name: `${namePrefix}-NAT-EIP-${i + 1}`,
            ...commonTags,
          },
        });

        const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `${namePrefix}-NAT-${i + 1}`,
            ...commonTags,
          },
        });
        this.natGateways.push(natGateway);
      }
    }

    // Route tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${namePrefix}-PublicRouteTable`,
        ...commonTags,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables
    if (props.enableNatGateway) {
      this.privateSubnets.forEach((subnet, index) => {
        const privateRouteTable = new RouteTable(
          this,
          `private-route-table-${index}`,
          {
            vpcId: this.vpc.id,
            tags: {
              Name: `${namePrefix}-PrivateRouteTable-${index + 1}`,
              ...commonTags,
            },
          }
        );

        new Route(this, `private-route-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId:
            this.natGateways[Math.min(index, this.natGateways.length - 1)].id,
        });

        new RouteTableAssociation(this, `private-rta-${index}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        });
      });
    }
}
   
// EC2 Module with Auto Scaling
export class Ec2Module extends Construct {
  public readonly webAsg: aws.autoscalingGroup.AutoscalingGroup;
  public readonly backendAsg: aws.autoscalingGroup.AutoscalingGroup;
  public readonly alb: aws.alb.Alb;
  public readonly webSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly backendSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    // IAM Role for EC2 instances
    const ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: `${namePrefix}-EC2Role`,
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
      tags: commonTags,
    });

    // Attach SSM managed policy for Session Manager
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ssm-policy',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    // Attach CloudWatch policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'cloudwatch-policy',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'instance-profile',
      {
        name: `${namePrefix}-InstanceProfile`,
        role: ec2Role.name,
        tags: commonTags,
      }
    );

    // Security Groups
    this.webSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'web-sg',
      {
        name: `${namePrefix}-WebSG`,
        description: 'Security group for web servers',
        vpcId: props.vpc.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: commonTags,
      }
    );

    this.backendSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'backend-sg',
      {
        name: `${namePrefix}-BackendSG`,
        description: 'Security group for backend servers',
        vpcId: props.vpc.vpc.id,
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [this.webSecurityGroup.id],
            description: 'Allow from web servers',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: commonTags,
      }
    );

    // Application Load Balancer
    const albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'alb-sg',
      {
        name: `${namePrefix}-ALBSG`,
        description: 'Security group for ALB',
        vpcId: props.vpc.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: commonTags,
      }
    );

    this.alb = new aws.alb.Alb(this, 'alb', {
      name: `${namePrefix}-ALB`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: props.vpc.publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: props.environment === 'Prod',
      enableHttp2: true,
      tags: commonTags,
    });

    // Target Group for Web Servers
    const webTargetGroup = new aws.albTargetGroup.AlbTargetGroup(
      this,
      'web-tg',
      {
        name: `${namePrefix}-WebTG`,
        port: 80,
        protocol: 'HTTP',
        vpcId: props.vpc.vpc.id,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/health',
          matcher: '200',
        },
        deregistrationDelay: '30',
        tags: commonTags,
      }
    );

    // ALB Listener
    new aws.albListener.AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: webTargetGroup.arn,
        },
      ],
      tags: commonTags,
    });

    // Launch Template for Web Servers
    const webLaunchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'web-lt',
      {
        name: `${namePrefix}-WebLT`,
        imageId: props.amiId,
        instanceType: props.instanceType,
        keyName: props.keyName,
        vpcSecurityGroupIds: [this.webSecurityGroup.id],
        iamInstanceProfile: { name: instanceProfile.name },
        userData: Buffer.from(
          `#!/bin/bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install web server
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "metrics": {
    "namespace": "${namePrefix}",
    "metrics_collected": {
      "mem": {
        "measurement": [{"name": "mem_used_percent", "rename": "MemoryUtilization"}]
      },
      "disk": {
        "measurement": [{"name": "used_percent", "rename": "DiskUtilization"}],
        "resources": ["/"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/${namePrefix}/web",
            "log_stream_name": "{instance_id}/access_log"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/${namePrefix}/web",
            "log_stream_name": "{instance_id}/error_log"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${namePrefix}-WebServer`,
              Type: 'Web',
              ...commonTags,
            },
          },
        ],
        tags: commonTags,
      }
    );

    // Auto Scaling Group for Web Servers
    this.webAsg = new aws.autoscalingGroup.AutoscalingGroup(this, 'web-asg', {
      name: `${namePrefix}-WebASG`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      vpcZoneIdentifier: props.vpc.publicSubnets.map(subnet => subnet.id),
      targetGroupArns: [webTargetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: webLaunchTemplate.id,
        version: '$Latest',
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances',
      ],
      tag: Object.entries(commonTags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Launch Template for Backend Servers
    const backendLaunchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'backend-lt',
      {
        name: `${namePrefix}-BackendLT`,
        imageId: props.amiId,
        instanceType: props.instanceType,
        keyName: props.keyName,
        vpcSecurityGroupIds: [this.backendSecurityGroup.id],
        iamInstanceProfile: { name: instanceProfile.name },
        userData: Buffer.from(
          `#!/bin/bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install application
yum update -y
yum install -y java-11-amazon-corretto

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "metrics": {
    "namespace": "${namePrefix}",
    "metrics_collected": {
      "mem": {
        "measurement": [{"name": "mem_used_percent", "rename": "MemoryUtilization"}]
      },
      "disk": {
        "measurement": [{"name": "used_percent", "rename": "DiskUtilization"}],
        "resources": ["/"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/application/*.log",
            "log_group_name": "/aws/ec2/${namePrefix}/backend",
            "log_stream_name": "{instance_id}/app_log"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${namePrefix}-BackendServer`,
              Type: 'Backend',
              ...commonTags,
            },
          },
        ],
        tags: commonTags,
      }
    );

    // Auto Scaling Group for Backend Servers
    this.backendAsg = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      'backend-asg',
      {
        name: `${namePrefix}-BackendASG`,
        minSize: props.minSize,
        maxSize: props.maxSize,
        desiredCapacity: props.desiredCapacity,
        vpcZoneIdentifier: props.vpc.privateSubnets.map(subnet => subnet.id),
        healthCheckType: 'EC2',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: backendLaunchTemplate.id,
          version: '$Latest',
        },
        enabledMetrics: [
          'GroupMinSize',
          'GroupMaxSize',
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupTotalInstances',
        ],
        tag: Object.entries(commonTags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      }
    );

    // Auto Scaling Policies
    new aws.autoscalingPolicy.AutoscalingPolicy(this, 'web-scale-up', {
      name: `${namePrefix}-WebScaleUp`,
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.webAsg.name,
    });

    new aws.autoscalingPolicy.AutoscalingPolicy(this, 'web-scale-down', {
      name: `${namePrefix}-WebScaleDown`,
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.webAsg.name,
    });
  }
}

// RDS Module
// RDS Module
export class RdsModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}-new`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    // DB Security Group
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'db-sg', {
      name: `${namePrefix}-DBSG`,
      description: 'Security group for RDS database',
      vpcId: props.vpc.vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          cidrBlocks: [props.vpc.vpc.cidrBlock],
          description: 'MySQL from VPC',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: commonTags,
    });

    // DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${namePrefix}-dbsubnet`.toLowerCase(),
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.id),
        tags: commonTags,
      }
    );

    // Create Secret with auto-generated password
    this.dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-secret',
      {
        name: `${namePrefix}-DBSecret`,
        description: 'RDS Master Password',
        tags: commonTags,
      }
    );

    // Create a random password using Secrets Manager's password generator
    new aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
      this,
      'db-random-password',
      {
        passwordLength: 32,
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        requireEachIncludedType: true,
      }
    );

    // RDS Instance using AWS managed password
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'database', {
      identifier: `${namePrefix}-DB`.toLowerCase(),
      allocatedStorage: props.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      engine: props.engine,
      instanceClass: props.instanceClass,
      dbName: props.databaseName,
      username: props.masterUsername,
      // Use manage_master_user_password for automatic password management
      manageMasterUserPassword: true,
      masterUserSecretKmsKeyId: 'alias/aws/secretsmanager', // Use AWS managed key
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      dbSubnetGroupName: this.dbSubnetGroup.name,
      multiAz: props.multiAz,
      backupRetentionPeriod: props.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: props.environment === 'Prod',
      skipFinalSnapshot: props.environment !== 'Prod',
      finalSnapshotIdentifier:
        props.environment === 'Prod'
          ? `${namePrefix}-final-snapshot-${Date.now()}`
          : undefined,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      tags: commonTags,
    });

    // Store connection details in Parameter Store (without password)
    new aws.ssmParameter.SsmParameter(this, 'db-endpoint-param', {
      name: `/${props.projectName}/${props.environment}/db/endpoint`,
      type: 'String',
      value: this.dbInstance.endpoint,
      tags: commonTags,
    });

    new aws.ssmParameter.SsmParameter(this, 'db-secret-arn-param', {
      name: `/${props.projectName}/${props.environment}/db/secret-arn`,
      type: 'String',
      value: this.dbInstance.masterUserSecret.get(0).secretArn,
      description:
        'ARN of the Secrets Manager secret containing DB credentials',
      tags: commonTags,
    });

    new TerraformOutput(this, 'db-endpoint-output', {
      value: this.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: false,
    });

    new TerraformOutput(this, 'db-secret-arn-output', {
      value: this.dbInstance.masterUserSecret.get(0).secretArn,
      description: 'Secret ARN for database credentials',
      sensitive: false,
    });
  }
}

// S3 Module
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    const bucketName =
      props.bucketName || `${namePrefix}-assets-${Date.now()}`.toLowerCase();

    // S3 Bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: bucketName,
      tags: commonTags,
    });

    // Bucket Versioning
    if (props.versioning) {
      new aws.s3BucketVersioning.S3BucketVersioningA(
        this,
        'bucket-versioning',
        {
          bucket: this.bucket.id,
          versioningConfiguration: {
            status: 'Enabled',
          },
        }
      );
    }

    // Bucket Encryption
    if (props.encryption !== false) {
      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
        this,
        'bucket-encryption',
        {
          bucket: this.bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        }
      );
    }

    // Bucket Public Access Block
    const publicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        'bucket-pab',
        {
          bucket: this.bucket.id,
          blockPublicAcls: !props.publicReadAccess,
          blockPublicPolicy: !props.publicReadAccess,
          ignorePublicAcls: !props.publicReadAccess,
          restrictPublicBuckets: !props.publicReadAccess,
        }
      );

    // Bucket Policy for public read access
    if (props.publicReadAccess) {
      this.bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(
        this,
        'bucket-policy',
        {
          bucket: this.bucket.id,
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `${this.bucket.arn}/*`,
              },
            ],
          }),
          dependsOn: [publicAccessBlock],
        }
      );
    }

    // Lifecycle rules
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'bucket-lifecycle',
      {
        bucket: this.bucket.id,
        rule: [
          {
            id: 'delete-old-versions',
            status: 'Enabled',
            filter: [
              {
                prefix: '',
              },
            ],
            noncurrentVersionExpiration: [
              {
                noncurrentDays: 90,
              },
            ],
          },
        ],
      }
    );

    // CORS Configuration
    new aws.s3BucketCorsConfiguration.S3BucketCorsConfiguration(
      this,
      'bucket-cors',
      {
        bucket: this.bucket.id,
        corsRule: [
          {
            allowedHeaders: ['*'],
            allowedMethods: ['GET', 'HEAD'],
            allowedOrigins: ['*'],
            exposeHeaders: ['ETag'],
            maxAgeSeconds: 3000,
          },
        ],
      }
    );
  }
}

// Monitoring Module
export class MonitoringModule extends Construct {
  public readonly snsTopic: aws.snsTopic.SnsTopic;
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & {
      emailEndpoint: string;
      ec2Module?: Ec2Module;
      rdsModule?: RdsModule;
    }
  ) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    // SNS Topic for alerts
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'alerts-topic', {
      name: `${namePrefix}-Alerts`,
      displayName: `${namePrefix} Infrastructure Alerts`,
      tags: commonTags,
    });

    // SNS Email Subscription
    new aws.snsTopicSubscription.SnsTopicSubscription(
      this,
      'email-subscription',
      {
        topicArn: this.snsTopic.arn,
        protocol: 'email',
        endpoint: props.emailEndpoint,
      }
    );

    this.alarms = [];

    // EC2 Alarms
    if (props.ec2Module) {
      // High CPU Utilization Alarm for Web ASG
      this.alarms.push(
        new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          'web-cpu-alarm',
          {
            alarmName: `${namePrefix}-Web-HighCPU`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'This metric monitors ec2 cpu utilization',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
              AutoScalingGroupName: props.ec2Module.webAsg.name,
            },
            tags: commonTags,
          }
        )
      );

      // ALB Target Health Alarm
      this.alarms.push(
        new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          'alb-health-alarm',
          {
            alarmName: `${namePrefix}-ALB-UnhealthyTargets`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 1,
            metricName: 'UnHealthyHostCount',
            namespace: 'AWS/ApplicationELB',
            period: 60,
            statistic: 'Average',
            threshold: 0,
            alarmDescription: 'Alert when we have any unhealthy targets',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
              LoadBalancer: props.ec2Module.alb.arnSuffix,
            },
            tags: commonTags,
          }
        )
      );
    }

    // RDS Alarms
    if (props.rdsModule) {
      // Database CPU Alarm
      this.alarms.push(
        new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          'db-cpu-alarm',
          {
            alarmName: `${namePrefix}-DB-HighCPU`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 75,
            alarmDescription: 'Database CPU utilization',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
              DBInstanceIdentifier: props.rdsModule.dbInstance.id,
            },
            tags: commonTags,
          }
        )
      );

      // Database Storage Space Alarm
      this.alarms.push(
        new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          'db-storage-alarm',
          {
            alarmName: `${namePrefix}-DB-LowStorage`,
            comparisonOperator: 'LessThanThreshold',
            evaluationPeriods: 1,
            metricName: 'FreeStorageSpace',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 10737418240, // 10GB in bytes
            alarmDescription: 'Database free storage space',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
              DBInstanceIdentifier: props.rdsModule.dbInstance.id,
            },
            tags: commonTags,
          }
        )
      );
    }
  }
}

// Route53 Module
export class Route53Module extends Construct {
  public readonly hostedZone: aws.route53Zone.Route53Zone;
  public readonly records: aws.route53Record.Route53Record[];

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & {
      domainName: string;
      albDnsName?: string;
      albZoneId?: string;
    }
  ) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    // Create Hosted Zone
    this.hostedZone = new aws.route53Zone.Route53Zone(this, 'hosted-zone', {
      name: props.domainName,
      comment: `Hosted zone for ${namePrefix}`,
      tags: commonTags,
    });

    this.records = [];

    // Create A record for ALB if provided
    if (props.albDnsName && props.albZoneId) {
      this.records.push(
        new aws.route53Record.Route53Record(this, 'alb-record', {
          zoneId: this.hostedZone.zoneId,
          name: props.domainName,
          type: 'A',
          alias: {
            name: props.albDnsName,
            zoneId: props.albZoneId,
            evaluateTargetHealth: true,
          },
        })
      );

      // www subdomain
      this.records.push(
        new aws.route53Record.Route53Record(this, 'www-record', {
          zoneId: this.hostedZone.zoneId,
          name: 'pr2333.youractualdomainname.com',
          type: 'CNAME',
          ttl: 300,
          records: [props.domainName],
        })
      );
    }

    new TerraformOutput(this, 'nameservers', {
      value: this.hostedZone.nameServers,
      description: 'Name servers for the hosted zone',
    });
  }
}

// SSM Parameter Store Module
export class SsmModule extends Construct {
  public readonly parameters: aws.ssmParameter.SsmParameter[];

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & {
      parameters: {
        name: string;
        value: string;
        type?: string;
        description?: string;
      }[];
    }
  ) {
    super(scope, id);

    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags,
    };

    this.parameters = props.parameters.map((param, index) => {
      return new aws.ssmParameter.SsmParameter(this, `param-${index}`, {
        name: `/${props.projectName}/${props.environment}/${param.name}`,
        type: param.type || 'SecureString',
        value: param.value,
        description: param.description,
        tags: commonTags,
      });
    });
  }
}

```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import {
  VpcModule,
  Ec2Module,
  RdsModule,
  S3Module,
  MonitoringModule,
  Route53Module,
  SsmModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  domainName?: string;
  alertEmail?: string;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Project configuration
    const projectName = 'tap-infrastructure';
    const domainName =
      props?.domainName || `${environmentSuffix}.yourdomain.com`;
    const alertEmail = props?.alertEmail || 'alerts@yourdomain.com';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Common tags for all resources
    const commonTags = {
      Project: projectName,
      Environment: environmentSuffix,
      ManagedBy: 'CDKTF',
      Owner: 'DevOps',
    };

    // 1. Create VPC Module
    const vpcModule = new VpcModule(this, 'vpc', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      cidrBlock: '10.0.0.0/16',
      azCount: 2,
      enableNatGateway: true,
      enableVpnGateway: false,
      tags: commonTags,
    });

    // 2. Create EC2 Module
    const ec2Module = new Ec2Module(this, 'ec2', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      vpc: vpcModule,
      instanceType: 't2.micro',
      amiId: 'ami-084a7d336e816906b',
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2,
      tags: commonTags,
    });

    // 3. Create RDS Module
    const rdsModule = new RdsModule(this, 'rds', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      vpc: vpcModule,
      instanceClass: 'db.t3.medium',
      engine: 'mysql',
      allocatedStorage: 20,
      databaseName: 'appdb',
      masterUsername: 'admin',
      multiAz: environmentSuffix === 'prod',
      backupRetentionPeriod: environmentSuffix === 'prod' ? 30 : 7,
      tags: commonTags,
    });

    // 4. Create Public S3 Module (for app assets)
    const publicS3Module = new S3Module(this, 's3-public', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      bucketName: `${projectName}-${environmentSuffix}-public-assets`,
      versioning: true,
      encryption: true,
      publicReadAccess: true,
      tags: commonTags,
    });

    // 5. Create Private S3 Module (for internal data)
    const privateS3Module = new S3Module(this, 's3-private', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      bucketName: `${projectName}-${environmentSuffix}-private-data`,
      versioning: true,
      encryption: true,
      publicReadAccess: false,
      tags: commonTags,
    });

    const route53Module = new Route53Module(this, 'route53', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      domainName,
      albDnsName: ec2Module.alb.dnsName,
      albZoneId: ec2Module.alb.zoneId,
      tags: commonTags,
    });

    // 8. Create Monitoring Module
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      emailEndpoint: alertEmail,
      ec2Module,
      rdsModule,
      tags: commonTags,
    });

    // 9. Create SSM Parameter Store Module
    const ssmModule = new SsmModule(this, 'ssm', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      parameters: [
        {
          name: 'api/endpoint',
          value: `https://${domainName}/api`,
          type: 'String',
          description: 'API endpoint URL',
        },
        {
          name: 'app/version',
          value: '1.0.0',
          type: 'String',
          description: 'Application version',
        },
        {
          name: 'features/enabled',
          value: 'true',
          type: 'String',
          description: 'Feature flags',
        },
      ],
      tags: commonTags,
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: ec2Module.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'monitoring-sns-topic-arn', {
      value: monitoringModule.snsTopic.arn,
      description: 'SNS topic ARN for monitoring alerts',
    });

    new TerraformOutput(this, 'route53-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'Route53 hosted zone ID',
    });

    new TerraformOutput(this, 'ssm-parameters', {
      value: ssmModule.parameters?.map(p => p.name) || [],
      description: 'SSM parameter names',
    });
  }
}

```