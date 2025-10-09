lib/modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

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
  engineVersion: string;
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

export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.vpc.Subnet[];
  public readonly privateSubnets: aws.vpc.Subnet[];
  public readonly natGateways: aws.vpc.NatGateway[];
  public readonly internetGateway: aws.vpc.InternetGateway;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags
    };

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${namePrefix}-VPC`,
        ...commonTags
      }
    });

    // Internet Gateway
    this.internetGateway = new aws.vpc.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${namePrefix}-IGW`,
        ...commonTags
      }
    });

    // Get availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, 'azs', {
      state: 'available'
    });

    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    // Create subnets
    for (let i = 0; i < props.azCount; i++) {
      const az = `\${element(${azs.names}.*, ${i})}`;
      
      // Public subnet
      const publicSubnet = new aws.vpc.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${namePrefix}-PublicSubnet-${i + 1}`,
          Type: 'Public',
          ...commonTags
        }
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.vpc.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `${namePrefix}-PrivateSubnet-${i + 1}`,
          Type: 'Private',
          ...commonTags
        }
      });
      this.privateSubnets.push(privateSubnet);

      // NAT Gateway
      if (props.enableNatGateway) {
        const eip = new aws.vpc.Eip(this, `nat-eip-${i}`, {
          domain: 'vpc',
          tags: {
            Name: `${namePrefix}-NAT-EIP-${i + 1}`,
            ...commonTags
          }
        });

        const natGateway = new aws.vpc.NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `${namePrefix}-NAT-${i + 1}`,
            ...commonTags
          }
        });
        this.natGateways.push(natGateway);
      }
    }

    // Route tables
    const publicRouteTable = new aws.vpc.RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${namePrefix}-PublicRouteTable`,
        ...commonTags
      }
    });

    new aws.vpc.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.vpc.RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Private route tables
    if (props.enableNatGateway) {
      this.privateSubnets.forEach((subnet, index) => {
        const privateRouteTable = new aws.vpc.RouteTable(this, `private-route-table-${index}`, {
          vpcId: this.vpc.id,
          tags: {
            Name: `${namePrefix}-PrivateRouteTable-${index + 1}`,
            ...commonTags
          }
        });

        new aws.vpc.Route(this, `private-route-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[Math.min(index, this.natGateways.length - 1)].id
        });

        new aws.vpc.RouteTableAssociation(this, `private-rta-${index}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id
        });
      });
    }

    // VPC Flow Logs
    const flowLogRole = new aws.iamRole.IamRole(this, 'flow-log-role', {
      name: `${namePrefix}-VPCFlowLogRole`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      }),
      tags: commonTags
    });

    const flowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'flow-log-group', {
      name: `/aws/vpc/${namePrefix}`,
      retentionInDays: 30,
      tags: commonTags
    });

    new aws.iamRolePolicy.IamRolePolicy(this, 'flow-log-policy', {
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams'
          ],
          Resource: '*'
        }]
      })
    });

    new aws.vpcFlowLog.FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.name,
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      tags: commonTags

      new aws.vpcFlowLog.VpcFlowLog(this, 'flow-log', {
        iamRoleArn: flowLogRole.arn,
        logDestinationType: 'cloud-watch-logs',
        logGroupName: `/aws/vpc/${namePrefix}`,
        trafficType: 'ALL',
        vpcId: this.vpc.id,
        tags: commonTags,
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
      ...props.tags
    };

    // IAM Role for EC2 instances
    const ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: `${namePrefix}-EC2Role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      }),
      tags: commonTags
    });

    // Attach SSM managed policy for Session Manager
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
    });

    // Attach CloudWatch policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'cloudwatch-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
    });

    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(this, 'instance-profile', {
      name: `${namePrefix}-InstanceProfile`,
      role: ec2Role.name,
      tags: commonTags
    });

    // Security Groups
    this.webSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'web-sg', {
      name: `${namePrefix}-WebSG`,
      description: 'Security group for web servers',
      vpcId: props.vpc.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP from anywhere'
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS from anywhere'
        }
      ],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic'
      }],
      tags: commonTags
    });

    this.backendSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'backend-sg', {
      name: `${namePrefix}-BackendSG`,
      description: 'Security group for backend servers',
      vpcId: props.vpc.vpc.id,
      ingress: [{
        fromPort: 8080,
        toPort: 8080,
        protocol: 'tcp',
        securityGroups: [this.webSecurityGroup.id],
        description: 'Allow from web servers'
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic'
      }],
      tags: commonTags
    });

    // Application Load Balancer
    const albSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'alb-sg', {
      name: `${namePrefix}-ALBSG`,
      description: 'Security group for ALB',
      vpcId: props.vpc.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP from anywhere'
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS from anywhere'
        }
      ],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic'
      }],
      tags: commonTags
    });

    this.alb = new aws.alb.Alb(this, 'alb', {
      name: `${namePrefix}-ALB`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: props.vpc.publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: props.environment === 'Prod',
      enableHttp2: true,
      tags: commonTags
    });

    // Target Group for Web Servers
    const webTargetGroup = new aws.albTargetGroup.AlbTargetGroup(this, 'web-tg', {
      name: `${namePrefix}-WebTG`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpc.vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthy_threshold: 2,
        unhealthy_threshold: 2,
        timeout: 5,
        interval: 30,
        path: '/health',
        matcher: '200'
      },
      deregistrationDelay: 30,
      tags: commonTags
    });

    // ALB Listener
    new aws.albListener.AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: webTargetGroup.arn
      }],
      tags: commonTags
    });

    // Launch Template for Web Servers
    const webLaunchTemplate = new aws.launchTemplate.LaunchTemplate(this, 'web-lt', {
      name: `${namePrefix}-WebLT`,
      imageId: props.amiId,
      instanceType: props.instanceType,
      keyName: props.keyName,
      vpcSecurityGroupIds: [this.webSecurityGroup.id],
      iamInstanceProfile: { name: instanceProfile.name },
      userData: Buffer.from(`#!/bin/bash
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
`).toString('base64'),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          Name: `${namePrefix}-WebServer`,
          Type: 'Web',
          ...commonTags
        }
      }],
      tags: commonTags
    });

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
        version: '$Latest'
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances'
      ],
      tag: Object.entries(commonTags).map(([key, value]) => ({
        key,
        value,
        propagate_at_launch: true
      }))
    });

    // Launch Template for Backend Servers
    const backendLaunchTemplate = new aws.launchTemplate.LaunchTemplate(this, 'backend-lt', {
      name: `${namePrefix}-BackendLT`,
      imageId: props.amiId,
      instanceType: props.instanceType,
      keyName: props.keyName,
      vpcSecurityGroupIds: [this.backendSecurityGroup.id],
      iamInstanceProfile: { name: instanceProfile.name },
      userData: Buffer.from(`#!/bin/bash
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
`).toString('base64'),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          Name: `${namePrefix}-BackendServer`,
          Type: 'Backend',
          ...commonTags
        }
      }],
      tags: commonTags
    });

    // Auto Scaling Group for Backend Servers
    this.backendAsg = new aws.autoscalingGroup.AutoscalingGroup(this, 'backend-asg', {
      name: `${namePrefix}-BackendASG`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      vpcZoneIdentifier: props.vpc.privateSubnets.map(subnet => subnet.id),
      healthCheckType: 'EC2',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: backendLaunchTemplate.id,
        version: '$Latest'
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances'
      ],
      tag: Object.entries(commonTags).map(([key, value]) => ({
        key,
        value,
        propagate_at_launch: true
      }))
    });

    // Auto Scaling Policies
    new aws.autoscalingPolicy.AutoscalingPolicy(this, 'web-scale-up', {
      name: `${namePrefix}-WebScaleUp`,
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.webAsg.name
    });

    new aws.autoscalingPolicy.AutoscalingPolicy(this, 'web-scale-down', {
      name: `${namePrefix}-WebScaleDown`,
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.webAsg.name
    });
  }
}

// RDS Module
export class RdsModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags
    };

    // DB Security Group
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'db-sg', {
      name: `${namePrefix}-DBSG`,
      description: 'Security group for RDS database',
      vpcId: props.vpc.vpc.id,
      ingress: [{
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        cidrBlocks: [props.vpc.vpc.cidrBlock],
        description: 'MySQL from VPC'
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic'
      }],
      tags: commonTags
    });

    // DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(this, 'db-subnet-group', {
      name: `${namePrefix}-dbsubnet`.toLowerCase(),
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.id),
      tags: commonTags
    });

    // Generate random password
    const dbPassword = new aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(this, 'db-password', {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?'
    });

    // Store password in Secrets Manager
    const dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(this, 'db-secret', {
      name: `${namePrefix}-DBPassword`,
      description: 'RDS Master Password',
      tags: commonTags
    });

    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: props.masterUsername,
        password: dbPassword.randomPassword,
        engine: props.engine,
        host: '${aws_db_instance.database.endpoint}',
        port: 3306,
        dbInstanceIdentifier: `${namePrefix}-DB`.toLowerCase()
      })
    });

    // RDS Instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'database', {
      identifier: `${namePrefix}-DB`.toLowerCase(),
      allocatedStorage: props.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      engine: props.engine,
      engineVersion: props.engineVersion,
      instanceClass: props.instanceClass,
      dbName: props.databaseName,
      username: props.masterUsername,
      password: dbPassword.randomPassword,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      dbSubnetGroupName: this.dbSubnetGroup.name,
      multiAz: props.multiAz,
      backupRetentionPeriod: props.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: props.environment === 'Prod',
      skipFinalSnapshot: props.environment !== 'Prod',
      finalSnapshotIdentifier: props.environment === 'Prod' ? `${namePrefix}-final-snapshot-${Date.now()}` : undefined,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      tags: commonTags
    });

    // Store connection string in Parameter Store
    new aws.ssmParameter.SsmParameter(this, 'db-connection-string', {
      name: `/${props.projectName}/${props.environment}/db/connection-string`,
      type: 'SecureString',
      value: `mysql://${props.masterUsername}:${dbPassword.randomPassword}@${this.dbInstance.endpoint}/${props.databaseName}`,
      tags: commonTags
    });

    new TerraformOutput(this, 'db-endpoint', {
      value: this.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: false
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
      ...props.tags
    };

    const bucketName = props.bucketName || `${namePrefix}-assets-${Date.now()}`.toLowerCase();

    // S3 Bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: bucketName,
      tags: commonTags
    });

    // Bucket Versioning
    if (props.versioning) {
      new aws.s3BucketVersioning.S3BucketVersioningA(this, 'bucket-versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled'
        }
      });
    }

    // Bucket Encryption
    if (props.encryption !== false) {
      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
        bucket: this.bucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256'
          }
        }]
      });
    }

    // Bucket Public Access Block
    const publicAccessBlock = new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: !props.publicReadAccess,
      blockPublicPolicy: !props.publicReadAccess,
      ignorePublicAcls: !props.publicReadAccess,
      restrictPublicBuckets: !props.publicReadAccess
    });

    // Bucket Policy for public read access
    if (props.publicReadAccess) {
      this.bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(this, 'bucket-policy', {
        bucket: this.bucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `${this.bucket.arn}/*`
          }]
        }),
        dependsOn: [publicAccessBlock]
      });
    }

    // Lifecycle rules
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(this, 'bucket-lifecycle', {
      bucket: this.bucket.id,
      rule: [{
        id: 'delete-old-versions',
        status: 'Enabled',
        noncurrentVersionExpiration: {
          noncurrentDays: 90
        }
      }]
    });

    // CORS Configuration
    new aws.s3BucketCorsConfiguration.S3BucketCorsConfiguration(this, 'bucket-cors', {
      bucket: this.bucket.id,
      corsRule: [{
        allowedHeaders: ['*'],
        allowedMethods: ['GET', 'HEAD'],
        allowedOrigins: ['*'],
        exposeHeaders: ['ETag'],
        maxAgeSeconds: 3000
      }]
    });
  }
}

export class MonitoringModule extends Construct {
  public readonly snsTopic: aws.snsTopic.SnsTopic;
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, props: BaseModuleProps & {
    emailEndpoint: string;
    ec2Module?: Ec2Module;
    rdsModule?: RdsModule;
  }) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags
    };

    // SNS Topic for alerts
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'alerts-topic', {
      name: `${namePrefix}-Alerts`,
      displayName: `${namePrefix} Infrastructure Alerts`,
      tags: commonTags
    });

    // SNS Email Subscription
    new aws.snsTopicSubscription.SnsTopicSubscription(this, 'email-subscription', {
      topicArn: this.snsTopic.arn,
      protocol: 'email',
      endpoint: props.emailEndpoint
    });

    this.alarms = [];

    // EC2 Alarms
    if (props.ec2Module) {
      // High CPU Utilization Alarm for Web ASG
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'web-cpu-alarm', {
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
          AutoScalingGroupName: props.ec2Module.webAsg.name
        },
        tags: commonTags
      }));

      // ALB Target Health Alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'alb-health-alarm', {
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
          LoadBalancer: props.ec2Module.alb.arnSuffix
        },
        tags: commonTags
      }));
    }

    // RDS Alarms
    if (props.rdsModule) {
      // Database CPU Alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'db-cpu-alarm', {
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
          DBInstanceIdentifier: props.rdsModule.dbInstance.id
        },
        tags: commonTags
      }));

      // Database Storage Space Alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'db-storage-alarm', {
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
          DBInstanceIdentifier: props.rdsModule.dbInstance.id
        },
        tags: commonTags
      }));
    }
  }
}

// Route53 Module
export class Route53Module extends Construct {
  public readonly hostedZone: aws.route53Zone.Route53Zone;
  public readonly records: aws.route53Record.Route53Record[];

  constructor(scope: Construct, id: string, props: BaseModuleProps & {
    domainName: string;
    albDnsName?: string;
    albZoneId?: string;
  }) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags
    };

    // Create Hosted Zone
    this.hostedZone = new aws.route53Zone.Route53Zone(this, 'hosted-zone', {
      name: props.domainName,
      comment: `Hosted zone for ${namePrefix}`,
      tags: commonTags
    });

    this.records = [];

    // Create A record for ALB if provided
    if (props.albDnsName && props.albZoneId) {
      this.records.push(new aws.route53Record.Route53Record(this, 'alb-record', {
        zoneId: this.hostedZone.zoneId,
        name: props.domainName,
        type: 'A',
        alias: {
          name: props.albDnsName,
          zoneId: props.albZoneId,
          evaluateTargetHealth: true
        }
      }));

      // www subdomain
      this.records.push(new aws.route53Record.Route53Record(this, 'www-record', {
        zoneId: this.hostedZone.zoneId,
        name: `www.${props.domainName}`,
        type: 'CNAME',
        ttl: 300,
        records: [props.domainName]
      }));
    }

    new TerraformOutput(this, 'nameservers', {
      value: this.hostedZone.nameServers,
      description: 'Name servers for the hosted zone'
    });
  }
}

// SSM Parameter Store Module
export class SsmModule extends Construct {
  public readonly parameters: aws.ssmParameter.SsmParameter[];

  constructor(scope: Construct, id: string, props: BaseModuleProps & {
    parameters: { name: string; value: string; type?: string; description?: string }[];
  }) {
    super(scope, id);

    const namePrefix = `${props.projectName}-${props.environment}`;
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: 'DevOps',
      ManagedBy: 'CDKTF',
      ...props.tags
    };

    this.parameters = props.parameters.map((param, index) => {
      return new aws.ssmParameter.SsmParameter(this, `param-${index}`, {
        name: `/${props.projectName}/${props.environment}/${param.name}`,
        type: param.type || 'SecureString',
        value: param.value,
        description: param.description,
        tags: commonTags
      });
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, RemoteBackend } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import {
  VpcModule,
  Ec2Module,
  RdsModule,
  S3Module,
  MonitoringModule,
  Route53Module,
  SsmModule
} from './modules';

export interface TapStackConfig {
  projectName: string;
  environment: 'Dev' | 'Staging' | 'Prod';
  region: string;
  secondaryRegion?: string;
  domainName: string;
  emailAlerts: string;
  keyPairName?: string;
  amiId: string;
  multiRegion?: boolean;
}

export class TapStack extends TerraformStack {
  private config: TapStackConfig;
  private primaryProvider: aws.provider.AwsProvider;
  private secondaryProvider?: aws.provider.AwsProvider;

  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);
    this.config = config;

    // Configure remote backend for state management
    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'tap-infrastructure',
      workspaces: {
        name: `tap-${config.environment.toLowerCase()}`
      }
    });

    // Primary AWS Provider
    this.primaryProvider = new aws.provider.AwsProvider(this, 'aws-primary', {
      region: config.region,
      defaultTags: [{
        tags: {
          Project: config.projectName,
          Environment: config.environment,
          ManagedBy: 'CDKTF',
          Terraform: 'true'
        }
      }]
    });

    // Secondary AWS Provider for multi-region setup
    if (config.multiRegion && config.secondaryRegion) {
      this.secondaryProvider = new aws.provider.AwsProvider(this, 'aws-secondary', {
        alias: 'secondary',
        region: config.secondaryRegion,
        defaultTags: [{
          tags: {
            Project: config.projectName,
            Environment: config.environment,
            ManagedBy: 'CDKTF',
            Terraform: 'true',
            Region: 'Secondary'
          }
        }]
      });
    }

    // Deploy primary region infrastructure
    this.deployInfrastructure('primary', this.primaryProvider);

    // Deploy secondary region infrastructure if multi-region is enabled
    if (config.multiRegion && this.secondaryProvider) {
      this.deployInfrastructure('secondary', this.secondaryProvider);
    }
  }

  private deployInfrastructure(regionType: 'primary' | 'secondary', provider: aws.provider.AwsProvider) {
    const regionSuffix = regionType === 'secondary' ? '-Secondary' : '';
    const baseProps = {
      projectName: this.config.projectName,
      environment: this.config.environment,
      region: regionType === 'primary' ? this.config.region : this.config.secondaryRegion!
    };

    // VPC Module
    const vpcModule = new VpcModule(this, `vpc${regionSuffix}`, {
      ...baseProps,
      cidrBlock: regionType === 'primary' ? '10.0.0.0/16' : '10.1.0.0/16',
      azCount: this.config.environment === 'Prod' ? 3 : 2,
      enableNatGateway: true,
      enableVpnGateway: this.config.environment === 'Prod'
    });

    // S3 Module for static assets
    const s3Module = new S3Module(this, `s3-assets${regionSuffix}`, {
      ...baseProps,
      versioning: true,
      encryption: true,
      publicReadAccess: true
    });

    // S3 Module for data/etl
    const s3DataModule = new S3Module(this, `s3-data${regionSuffix}`, {
      ...baseProps,
      bucketName: `${this.config.projectName}-${this.config.environment}-data-${Date.now()}`.toLowerCase(),
      versioning: true,
      encryption: true,
      publicReadAccess: false
    });

    // EC2 Module with Auto Scaling
    const ec2Module = new Ec2Module(this, `ec2${regionSuffix}`, {
      ...baseProps,
      vpc: vpcModule,
      instanceType: this.getInstanceType(),
      amiId: this.config.amiId,
      minSize: this.getMinSize(),
      maxSize: this.getMaxSize(),
      desiredCapacity: this.getDesiredCapacity(),
      keyName: this.config.keyPairName
    });

    // RDS Module (only in primary region for now)
    let rdsModule: RdsModule | undefined;
    if (regionType === 'primary') {
      rdsModule = new RdsModule(this, 'rds', {
        ...baseProps,
        vpc: vpcModule,
        instanceClass: this.getDbInstanceClass(),
        engine: 'mysql',
        engineVersion: '8.0.35',
        allocatedStorage: this.getDbStorage(),
        databaseName: 'tapdb',
        masterUsername: 'admin',
        multiAz: this.config.environment === 'Prod',
        backupRetentionPeriod: this.config.environment === 'Prod' ? 30 : 7
      });
    }

    // SSM Parameter Store
    const ssmModule = new SsmModule(this, `ssm${regionSuffix}`, {
      ...baseProps,
      parameters: [
        {
          name: 'api-key',
          value: 'placeholder-api-key',
          type: 'SecureString',
          description: 'API Key for external services'
        },
        {
          name: 'jwt-secret',
          value: 'placeholder-jwt-secret',
          type: 'SecureString',
          description: 'JWT signing secret'
        },
        {
          name: 's3-assets-bucket',
          value: s3Module.bucket.bucket,
          type: 'String',
          description: 'S3 bucket for static assets'
        },
        {
          name: 's3-data-bucket',
          value: s3DataModule.bucket.bucket,
          type: 'String',
          description: 'S3 bucket for data processing'
        },
        {
          name: 'alb-dns',
          value: ec2Module.alb.dnsName,
          type: 'String',
          description: 'Application Load Balancer DNS name'
        }
      ]
    });

    // Route53 Module (only in primary region)
    let route53Module: Route53Module | undefined;
    if (regionType === 'primary') {
      route53Module = new Route53Module(this, 'route53', {
        ...baseProps,
        domainName: this.config.domainName,
        albDnsName: ec2Module.alb.dnsName,
        albZoneId: ec2Module.alb.zoneId
      });
    }

    // Monitoring Module
    const monitoringModule = new MonitoringModule(this, `monitoring${regionSuffix}`, {
      ...baseProps,
      emailEndpoint: this.config.emailAlerts,
      ec2Module: ec2Module,
      rdsModule: rdsModule
    });

    // CloudWatch Dashboard
    new aws.cloudwatchDashboard.CloudwatchDashboard(this, `dashboard${regionSuffix}`, {
      dashboardName: `${this.config.projectName}-${this.config.environment}${regionSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/EC2', 'CPUUtilization', { stat: 'Average' }],
                ['.', 'NetworkIn', { stat: 'Sum' }],
                ['.', 'NetworkOut', { stat: 'Sum' }]
              ],
              period: 300,
              stat: 'Average',
              region: baseProps.region,
              title: 'EC2 Metrics'
            }
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
                ['.', 'RequestCount', { stat: 'Sum' }],
                ['.', 'HTTPCode_Target_2XX_Count', { stat: 'Sum' }],
                ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
                ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }]
              ],
              period: 300,
              stat: 'Average',
              region: baseProps.region,
              title: 'ALB Metrics'
            }
          },
          ...(rdsModule ? [{
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/RDS', 'CPUUtilization', { stat: 'Average' }],
                ['.', 'DatabaseConnections', { stat: 'Average' }],
                ['.', 'FreeStorageSpace', { stat: 'Average' }]
              ],
              period: 300,
              stat: 'Average',
              region: baseProps.region,
              title: 'RDS Metrics'
            }
          }] : [])
        ]
      })
    });

    // Outputs
    new TerraformOutput(this, `vpc-id${regionSuffix}`, {
      value: vpcModule.vpc.id,
      description: `VPC ID for ${regionType} region`
    });

    new TerraformOutput(this, `alb-dns${regionSuffix}`, {
      value: ec2Module.alb.dnsName,
      description: `ALB DNS name for ${regionType} region`
    });

    new TerraformOutput(this, `s3-assets-bucket${regionSuffix}`, {
      value: s3Module.bucket.bucket,
      description: `S3 assets bucket name for ${regionType} region`
    });

    new TerraformOutput(this, `s3-data-bucket${regionSuffix}`, {
      value: s3DataModule.bucket.bucket,
      description: `S3 data bucket name for ${regionType} region`
    });

    if (route53Module) {
      new TerraformOutput(this, 'route53-zone-id', {
        value: route53Module.hostedZone.zoneId,
        description: 'Route53 Hosted Zone ID'
      });
    }

    new TerraformOutput(this, `sns-topic-arn${regionSuffix}`, {
      value: monitoringModule.snsTopic.arn,
      description: `SNS Topic ARN for alerts in ${regionType} region`
    });
  }

  // Helper methods for environment-specific configuration
  private getInstanceType(): string {
    switch (this.config.environment) {
      case 'Prod':
        return 't3.large';
      case 'Staging':
        return 't3.medium';
      case 'Dev':
      default:
        return 't3.small';
    }
  }

  private getDbInstanceClass(): string {
    switch (this.config.environment) {
      case 'Prod':
        return 'db.r6g.xlarge';
      case 'Staging':
        return 'db.t3.medium';
      case 'Dev':
      default:
        return 'db.t3.small';
    }
  }

  private getDbStorage(): number {
    switch (this.config.environment) {
      case 'Prod':
        return 100;
      case 'Staging':
        return 50;
      case 'Dev':
      default:
        return 20;
    }
  }

  private getMinSize(): number {
    switch (this.config.environment) {
      case 'Prod':
        return 3;
      case 'Staging':
        return 2;
      case 'Dev':
      default:
        return 1;
    }
  }

  private getMaxSize(): number {
    switch (this.config.environment) {
      case 'Prod':
        return 10;
      case 'Staging':
        return 5;
      case 'Dev':
      default:
        return 3;
    }
  }

  private getDesiredCapacity(): number {
    switch (this.config.environment) {
      case 'Prod':
        return 3;
      case 'Staging':
        return 2;
      case 'Dev':
      default:
        return 1;
    }
  }
}

// Main application entry point
const app = new App();

// Development environment
new TapStack(app, 'tap-dev', {
  projectName: 'Tap',
  environment: 'Dev',
  region: 'us-east-1',
  domainName: 'dev.tap-example.com',
  emailAlerts: 'devops@tap-example.com',
  amiId: 'ami-0c02fb55731490381', // Amazon Linux 2023
  keyPairName: 'tap-dev-keypair'
});

// Staging environment
new TapStack(app, 'tap-staging', {
  projectName: 'Tap',
  environment: 'Staging',
  region: 'us-east-1',
  domainName: 'staging.tap-example.com',
  emailAlerts: 'devops@tap-example.com',
  amiId: 'ami-0c02fb55731490381',
  keyPairName: 'tap-staging-keypair'
});

// Production environment with multi-region
new TapStack(app, 'tap-prod', {
  projectName: 'Tap',
  environment: 'Prod',
  region: 'us-east-1',
  secondaryRegion: 'us-west-2',
  domainName: 'tap-example.com',
  emailAlerts: 'devops@tap-example.com',
  amiId: 'ami-0c02fb55731490381',
  keyPairName: 'tap-prod-keypair',
  multiRegion: true
});

app.synth();
```