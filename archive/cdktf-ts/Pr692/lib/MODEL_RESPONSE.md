I'll create a comprehensive CDKTF TypeScript solution for multi-environment AWS infrastructure. Let me break this down into the required components while ensuring strict adherence to all constraints.

## Project Structure

```
cdktf-aws-multi-env/
├── src/
│   ├── main.ts
│   ├── stacks/
│   │   └── aws-infrastructure-stack.ts
│   ├── modules/
│   │   ├── vpc/
│   │   │   └── index.ts
│   │   ├── ec2/
│   │   │   └── index.ts
│   │   ├── s3/
│   │   │   └── index.ts
│   │   ├── iam/
│   │   │   └── index.ts
│   │   └── cloudwatch/
│   │       └── index.ts
│   └── config/
│       ├── development.ts
│       ├── staging.ts
│       └── production.ts
├── cdktf.json
├── package.json
└── README.md
```

## 1. Main Entry Point

**src/main.ts**
```typescript
import { App } from 'cdktf';
import { AwsInfrastructureStack } from './stacks/aws-infrastructure-stack';
import { developmentConfig } from './config/development';
import { stagingConfig } from './config/staging';
import { productionConfig } from './config/production';

const app = new App();

// Development Environment
new AwsInfrastructureStack(app, 'aws-infrastructure-development', {
  ...developmentConfig,
  environment: 'development',
});

// Staging Environment
new AwsInfrastructureStack(app, 'aws-infrastructure-staging', {
  ...stagingConfig,
  environment: 'staging',
});

// Production Environment
new AwsInfrastructureStack(app, 'aws-infrastructure-production', {
  ...productionConfig,
  environment: 'production',
});

app.synth();
```

## 2. Configuration Files

**src/config/development.ts**
```typescript
export const developmentConfig = {
  region: 'us-west-2',
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidr: '10.0.1.0/24',
  privateSubnetCidr: '10.0.2.0/24',
  databaseSubnetCidr: '10.0.3.0/24',
  availabilityZone: 'us-west-2a',
  instanceType: 't3.micro',
  enableS3Versioning: true,
  s3LifecycleEnabled: true,
  s3LifecycleDays: 30,
  cloudwatchRetentionDays: 7,
  tags: {
    Environment: 'development',
    Owner: 'DevOps Team',
    Service: 'Infrastructure',
    CostCenter: 'Engineering',
    Project: 'Multi-Env-Infrastructure'
  }
};
```

**src/config/staging.ts**
```typescript
export const stagingConfig = {
  region: 'us-west-2',
  vpcCidr: '10.1.0.0/16',
  publicSubnetCidr: '10.1.1.0/24',
  privateSubnetCidr: '10.1.2.0/24',
  databaseSubnetCidr: '10.1.3.0/24',
  availabilityZone: 'us-west-2a',
  instanceType: 't3.small',
  enableS3Versioning: true,
  s3LifecycleEnabled: true,
  s3LifecycleDays: 60,
  cloudwatchRetentionDays: 14,
  tags: {
    Environment: 'staging',
    Owner: 'DevOps Team',
    Service: 'Infrastructure',
    CostCenter: 'Engineering',
    Project: 'Multi-Env-Infrastructure'
  }
};
```

**src/config/production.ts**
```typescript
export const productionConfig = {
  region: 'us-west-2',
  vpcCidr: '10.2.0.0/16',
  publicSubnetCidr: '10.2.1.0/24',
  privateSubnetCidr: '10.2.2.0/24',
  databaseSubnetCidr: '10.2.3.0/24',
  availabilityZone: 'us-west-2a',
  instanceType: 't3.medium',
  enableS3Versioning: true,
  s3LifecycleEnabled: false,
  s3LifecycleDays: 0,
  cloudwatchRetentionDays: 365,
  tags: {
    Environment: 'production',
    Owner: 'DevOps Team',
    Service: 'Infrastructure',
    CostCenter: 'Engineering',
    Project: 'Multi-Env-Infrastructure'
  }
};
```

## 3. Main Infrastructure Stack

**src/stacks/aws-infrastructure-stack.ts**
```typescript
import { Construct } from 'constructs';
import { TerraformStack, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { VpcModule } from '../modules/vpc';
import { Ec2Module } from '../modules/ec2';
import { S3Module } from '../modules/s3';
import { IamModule } from '../modules/iam';
import { CloudWatchModule } from '../modules/cloudwatch';

interface StackConfig {
  environment: string;
  region: string;
  vpcCidr: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  databaseSubnetCidr: string;
  availabilityZone: string;
  instanceType: string;
  enableS3Versioning: boolean;
  s3LifecycleEnabled: boolean;
  s3LifecycleDays: number;
  cloudwatchRetentionDays: number;
  tags: Record<string, string>;
}

export class AwsInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: StackConfig) {
    super(scope, id);

    // Configure S3 Backend for state separation
    new S3Backend(this, {
      bucket: `terraform-state-${config.environment}-${config.region}`,
      key: `infrastructure/${config.environment}/terraform.tfstate`,
      region: config.region,
      dynamodbTable: `terraform-locks-${config.environment}`,
      encrypt: true,
    });

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: config.region,
      defaultTags: [{
        tags: config.tags,
      }],
    });

    // VPC Module
    const vpc = new VpcModule(this, 'vpc', {
      environment: config.environment,
      vpcCidr: config.vpcCidr,
      publicSubnetCidr: config.publicSubnetCidr,
      privateSubnetCidr: config.privateSubnetCidr,
      databaseSubnetCidr: config.databaseSubnetCidr,
      availabilityZone: config.availabilityZone,
      tags: config.tags,
    });

    // IAM Module
    const iam = new IamModule(this, 'iam', {
      environment: config.environment,
      tags: config.tags,
    });

    // EC2 Module
    const ec2 = new Ec2Module(this, 'ec2', {
      environment: config.environment,
      instanceType: config.instanceType,
      vpcId: vpc.vpcId,
      publicSubnetId: vpc.publicSubnetId,
      privateSubnetId: vpc.privateSubnetId,
      instanceProfileName: iam.instanceProfileName,
      tags: config.tags,
    });

    // S3 Module
    const s3 = new S3Module(this, 's3', {
      environment: config.environment,
      enableVersioning: config.enableS3Versioning,
      lifecycleEnabled: config.s3LifecycleEnabled,
      lifecycleDays: config.s3LifecycleDays,
      tags: config.tags,
    });

    // CloudWatch Module
    new CloudWatchModule(this, 'cloudwatch', {
      environment: config.environment,
      vpcId: vpc.vpcId,
      instanceId: ec2.instanceId,
      s3BucketName: s3.bucketName,
      retentionDays: config.cloudwatchRetentionDays,
      tags: config.tags,
    });
  }
}
```

## 4. VPC Module

**src/modules/vpc/index.ts**
```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';

interface VpcModuleConfig {
  environment: string;
  vpcCidr: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  databaseSubnetCidr: string;
  availabilityZone: string;
  tags: Record<string, string>;
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetId: string;
  public readonly privateSubnetId: string;
  public readonly databaseSubnetId: string;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `vpc-${config.environment}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `igw-${config.environment}`,
      },
    });

    // Public Subnet
    const publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: vpc.id,
      cidrBlock: config.publicSubnetCidr,
      availabilityZone: config.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: {
        ...config.tags,
        Name: `public-subnet-${config.environment}`,
        Type: 'public',
      },
    });

    // Private Subnet
    const privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: vpc.id,
      cidrBlock: config.privateSubnetCidr,
      availabilityZone: config.availabilityZone,
      tags: {
        ...config.tags,
        Name: `private-subnet-${config.environment}`,
        Type: 'private',
      },
    });

    // Database Subnet
    const databaseSubnet = new Subnet(this, 'database-subnet', {
      vpcId: vpc.id,
      cidrBlock: config.databaseSubnetCidr,
      availabilityZone: config.availabilityZone,
      tags: {
        ...config.tags,
        Name: `database-subnet-${config.environment}`,
        Type: 'database',
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...config.tags,
        Name: `nat-eip-${config.environment}`,
      },
    });

    // NAT Gateway
    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnet.id,
      tags: {
        ...config.tags,
        Name: `nat-gateway-${config.environment}`,
      },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `public-rt-${config.environment}`,
      },
    });

    // Private Route Table
    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `private-rt-${config.environment}`,
      },
    });

    // Routes
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Route Table Associations
    new RouteTableAssociation(this, 'public-rta', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta', {
      subnetId: privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // Database subnet uses private route table
    new RouteTableAssociation(this, 'database-rta', {
      subnetId: databaseSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // Export values
    this.vpcId = vpc.id;
    this.publicSubnetId = publicSubnet.id;
    this.privateSubnetId = privateSubnet.id;
    this.databaseSubnetId = databaseSubnet.id;
  }
}
```

## 5. IAM Module

**src/modules/iam/index.ts**
```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';

interface IamModuleConfig {
  environment: string;
  tags: Record<string, string>;
}

export class IamModule extends Construct {
  public readonly instanceProfileName: string;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // EC2 Instance Role
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `ec2-role-${config.environment}`,
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
        ...config.tags,
        Name: `ec2-role-${config.environment}`,
      },
    });

    // Custom policy for least privilege access
    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `ec2-policy-${config.environment}`,
      description: `Least privilege policy for EC2 instances in ${config.environment}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
            ],
            Resource: `arn:aws:s3:::app-bucket-${config.environment}/*`,
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach custom policy to role
    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // Instance Profile
    const instanceProfile = new IamInstanceProfile(this, 'ec2-instance-profile', {
      name: `ec2-instance-profile-${config.environment}`,
      role: ec2Role.name,
      tags: config.tags,
    });

    this.instanceProfileName = instanceProfile.name;
  }
}
```

## 6. EC2 Module

**src/modules/ec2/index.ts**
```typescript
import { Construct } from 'constructs';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface Ec2ModuleConfig {
  environment: string;
  instanceType: string;
  vpcId: string;
  publicSubnetId: string;
  privateSubnetId: string;
  instanceProfileName: string;
  tags: Record<string, string>;
}

export class Ec2Module extends Construct {
  public readonly instanceId: string;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Security Group for Web Server
    const webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `web-sg-${config.environment}`,
      description: `Security group for web servers in ${config.environment}`,
      vpcId: config.vpcId,
      
      ingress: [
        {
          description: 'HTTP',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Justified for web server
        },
        {
          description: 'HTTPS',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Justified for web server
        },
        {
          description: 'SSH',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/8'], // Only from private networks
        },
      ],
      
      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      
      tags: {
        ...config.tags,
        Name: `web-sg-${config.environment}`,
      },
    });

    // User Data Script
    const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "AWS/EC2/Custom",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 300
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 300,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 300
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/${config.environment}/httpd/access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/${config.environment}/httpd/error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create a simple index page
echo "<h1>Environment: ${config.environment}</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
`;

    // EC2 Instance
    const instance = new Instance(this, 'web-instance', {
      ami: ami.id,
      instanceType: config.instanceType,
      subnetId: config.publicSubnetId, // Public subnet for web server
      vpcSecurityGroupIds: [webSecurityGroup.id],
      iamInstanceProfile: config.instanceProfileName,
      userData: Buffer.from(userData).toString('base64'),
      
      tags: {
        ...config.tags,
        Name: `web-instance-${config.environment}`,
      },
    });

    this.instanceId = instance.id;
  }
}
```

## 7. S3 Module

**src/modules/s3/index.ts**
```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketLogging } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

interface S3ModuleConfig {
  environment: string;
  enableVersioning: boolean;
  lifecycleEnabled: boolean;
  lifecycleDays: number;
  tags: Record<string, string>;
}

export class S3Module extends Construct {
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Main Application Bucket
    const appBucket = new S3Bucket(this, 'app-bucket', {
      bucket: `app-bucket-${config.environment}-${Math.random().toString(36).substring(2, 15)}`,
      tags: {
        ...config.tags,
        Name: `app-bucket-${config.environment}`,
      },
    });

    // Access Logs Bucket
    const logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `app-logs-bucket-${config.environment}-${Math.random().toString(36).substring(2, 15)}`,
      tags: {
        ...config.tags,
        Name: `app-logs-bucket-${config.environment}`,
      },
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'app-bucket-pab', {
      bucket: appBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning
    if (config.enableVersioning) {
      new S3BucketVersioning(this, 'app-bucket-versioning', {
        bucket: appBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Server-side encryption
    new S3BucketServerSideEncryptionConfiguration(this, 'app-bucket-encryption', {
      bucket: appBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketServerSideEncryptionConfiguration(this, 'logs-bucket-encryption', {
      bucket: logsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Lifecycle configuration
    if (config.lifecycleEnabled && config.lifecycleDays > 0) {
      new S3BucketLifecycleConfiguration(this, 'app-bucket-lifecycle', {
        bucket: appBucket.id,
        rule: [
          {
            id: 'delete-old-objects',
            status: 'Enabled',
            expiration: {
              days: config.lifecycleDays,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: config.lifecycleDays,
            },
          },
        ],
      });
    }

    // Access logging
    new S3BucketLogging(this, 'app-bucket-logging', {
      bucket: appBucket.id,
      targetBucket: logsBucket.id,
      targetPrefix: 'access-logs/',
    });

    this.bucketName = appBucket.id;
  }
}
```

## 8. CloudWatch Module

**src/modules/cloudwatch/index.ts**
```typescript
import { Construct } from 'constructs';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

interface CloudWatchModuleConfig {
  environment: string;
  vpcId: string;
  instanceId: string;
  s3BucketName: string;
  retentionDays: number;
  tags: Record<string, string>;
}

export class CloudWatchModule extends Construct {
  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    // CloudWatch Log Groups
    const vpcLogGroup = new CloudwatchLogGroup(this, 'vpc-flow-logs', {
      name: `/aws/vpc/${config.environment}/flowlogs`,
      retentionInDays: config.retentionDays,
      tags: {
        ...config.tags,
        Name: `vpc-flow-logs-${config.environment}`,
      },
    });

    new CloudwatchLogGroup(this, 'ec2-httpd-access-logs', {
      name: `/aws/ec2/${config.environment}/httpd/access`,
      retentionInDays: config.retentionDays,
      tags: {
        ...config.tags,
        Name: `ec2-httpd-access-logs-${config.environment}`,
      },
    });

    new CloudwatchLogGroup(this, 'ec2-httpd-error-logs', {
      name: `/aws/ec2/${config.environment}/httpd/error`,
      retentionInDays: config.retentionDays,
      tags: {
        ...config.tags,
        Name: `ec2-httpd-error-logs-${config.environment}`,
      },
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: `flow-log-role-${config.environment}`,
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
        ...config.tags,
        Name: `flow-log-role-${config.environment}`,
      },
    });

    // Attach policy to flow log role
    new IamRolePolicyAttachment(this, 'flow-log-policy-attachment', {
      role: flowLogRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy',
    });

    // VPC Flow Logs
    new FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestination: vpcLogGroup.arn,
      resourceId: config.vpcId,
      resourceType: 'VPC',
      trafficType: 'ALL',
      tags: {
        ...config.tags,
        Name: `vpc-flow-log-${config.environment}`,
      },
    });
  }
}
```

## 9. Package Configuration

**package