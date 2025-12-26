I'll help you create a comprehensive CDKTF project that meets all your requirements. Let me break this down into a well-structured solution with proper separation of concerns.

## 1. Package Configuration

**package.json**

```json
{
  "name": "cdktf-multi-env-aws",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "get": "cdktf get",
    "validate": "tsc --noEmit && cdktf synth --validate-only"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**cdktf.json**

```json
{
  "language": "typescript",
  "app": "npm run --silent build && node dist/main.js",
  "projectId": "multi-env-aws-project",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {}
}
```

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 2. Type Definitions

**src/types/environment.ts**

```typescript
export interface EnvironmentConfig {
  name: string;
  region: string;
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  vpcCidr: string;
  publicSubnets: string[];
  privateSubnets: string[];
  enableDetailedMonitoring: boolean;
  logRetentionDays: number;
  backupRetentionDays: number;
  tags: Record<string, string>;
}

export type Environment = 'development' | 'staging' | 'production';
```

## 3. Environment Configuration

**src/config/environment-config.ts**

```typescript
import { Environment, EnvironmentConfig } from '../types/environment';

export const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    region: 'us-west-2',
    instanceType: 't3.micro',
    minSize: 1,
    maxSize: 2,
    desiredCapacity: 1,
    vpcCidr: '10.0.0.0/16',
    publicSubnets: ['10.0.1.0/24', '10.0.2.0/24'],
    privateSubnets: ['10.0.10.0/24', '10.0.20.0/24'],
    enableDetailedMonitoring: false,
    logRetentionDays: 7,
    backupRetentionDays: 7,
    tags: {
      Environment: 'development',
      Project: 'multi-env-aws',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
    },
  },
  staging: {
    name: 'staging',
    region: 'us-west-2',
    instanceType: 't3.small',
    minSize: 1,
    maxSize: 3,
    desiredCapacity: 2,
    vpcCidr: '10.1.0.0/16',
    publicSubnets: ['10.1.1.0/24', '10.1.2.0/24'],
    privateSubnets: ['10.1.10.0/24', '10.1.20.0/24'],
    enableDetailedMonitoring: true,
    logRetentionDays: 14,
    backupRetentionDays: 14,
    tags: {
      Environment: 'staging',
      Project: 'multi-env-aws',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
    },
  },
  production: {
    name: 'production',
    region: 'us-west-2',
    instanceType: 't3.medium',
    minSize: 2,
    maxSize: 10,
    desiredCapacity: 3,
    vpcCidr: '10.2.0.0/16',
    publicSubnets: ['10.2.1.0/24', '10.2.2.0/24'],
    privateSubnets: ['10.2.10.0/24', '10.2.20.0/24'],
    enableDetailedMonitoring: true,
    logRetentionDays: 30,
    backupRetentionDays: 30,
    tags: {
      Environment: 'production',
      Project: 'multi-env-aws',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
    },
  },
};
```

## 4. IAM

```typescript
import { Construct } from 'constructs';
import {
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib/iam';
import { EnvironmentConfig } from '../types/environment';

export class IAMConstruct extends Construct {
  public readonly ec2Role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: EnvironmentConfig) {
    super(scope, id);

    // EC2 Instance Role
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.name}-ec2-role`,
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
      tags: config.tags,
    });

    // EC2 Instance Policy - Least Privilege
    const ec2Policy = new IamRolePolicy(this, 'ec2-policy', {
      name: `${config.name}-ec2-policy`,
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
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
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${config.name}-app-artifacts/*`],
          },
        ],
      }),
    });

    // Instance Profile
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${config.name}-instance-profile`,
      role: this.ec2Role.name,
      tags: config.tags,
    });
  }
}
```

## 5. Networking

```typescript
import { Construct } from 'constructs';
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  SecurityGroup,
  NatGateway,
  Eip,
} from '@cdktf/provider-aws/lib/vpc';
import { EnvironmentConfig } from '../types/environment';

export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: EnvironmentConfig) {
    super(scope, id);

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.name}-vpc`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.name}-igw`,
      },
    });

    // Public Subnets
    this.publicSubnets = config.publicSubnets.map((cidr, index) => {
      const az = ['a', 'b'][index];
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `${config.region}${az}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.name}-public-subnet-${az}`,
          Type: 'public',
        },
      });
    });

    // Private Subnets
    this.privateSubnets = config.privateSubnets.map((cidr, index) => {
      const az = ['a', 'b'][index];
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `${config.region}${az}`,
        tags: {
          ...config.tags,
          Name: `${config.name}-private-subnet-${az}`,
          Type: 'private',
        },
      });
    });

    // NAT Gateway (only for staging and production)
    if (config.name !== 'development') {
      const natEip = new Eip(this, 'nat-eip', {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${config.name}-nat-eip`,
        },
      });

      const natGateway = new NatGateway(this, 'nat-gateway', {
        allocationId: natEip.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          ...config.tags,
          Name: `${config.name}-nat-gateway`,
        },
      });

      // Private Route Table
      const privateRouteTable = new RouteTable(this, 'private-rt', {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.name}-private-rt`,
        },
      });

      new Route(this, 'private-route', {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      // Associate private subnets with private route table
      this.privateSubnets.forEach((subnet, index) => {
        new RouteTableAssociation(this, `private-rta-${index}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        });
      });
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.name}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Security Group
    this.securityGroup = new SecurityGroup(this, 'app-sg', {
      name: `${config.name}-app-sg`,
      description: `Security group for ${config.name} application`,
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP access',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS access',
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
        ...config.tags,
        Name: `${config.name}-app-sg`,
      },
    });
  }
}
```

## 6. Compute

```typescript
import { Construct } from 'constructs';
import {
  LaunchTemplate,
  AutoscalingGroup,
  AutoscalingPolicy,
} from '@cdktf/provider-aws/lib/autoscaling';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/ec2';
import { EnvironmentConfig } from '../types/environment';
import { IAMConstruct } from './iam';
import { NetworkingConstruct } from './networking';

export class ComputeConstruct extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    iam: IAMConstruct,
    networking: NetworkingConstruct
  ) {
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
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // User data script
    const userData = Buffer.from(
      `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "namespace": "AWS/EC2/Custom/${config.name}",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/${config.name}/system",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure awslogs
cat > /etc/awslogs/awslogs.conf << 'EOF'
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = /aws/ec2/${config.name}/system
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S
EOF

systemctl start awslogsd
systemctl enable awslogsd

# Install and start a simple web server for health checks
yum install -y httpd
echo "<h1>${config.name} Environment - $(hostname)</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
systemctl start httpd
systemctl enable httpd
    `
    ).toString('base64');

    // Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${config.name}-launch-template`,
      imageId: ami.id,
      instanceType: config.instanceType,
      userData: userData,
      vpcSecurityGroupIds: [networking.securityGroup.id],
      iamInstanceProfile: {
        name: iam.instanceProfile.name,
      },
      monitoring: {
        enabled: config.enableDetailedMonitoring,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...config.tags,
            Name: `${config.name}-instance`,
          },
        },
      ],
      tags: config.tags,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${config.name}-asg`,
      vpcZoneIdentifier:
        networking.privateSubnets.length > 0
          ? networking.privateSubnets.map(subnet => subnet.id)
          : networking.publicSubnets.map(subnet => subnet.id),
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Auto Scaling Policies
    new AutoscalingPolicy(this, 'scale-up-policy', {
      name: `${config.name}-scale-up`,
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });

    new AutoscalingPolicy(this, 'scale-down-policy', {
      name: `${config.name}-scale-down`,
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });
  }
}
```

## 7. Monitoring

```typescript
import { Construct } from 'constructs';
import {
  CloudwatchLogGroup,
  CloudwatchMetricAlarm,
} from '@cdktf/provider-aws/lib/cloudwatch';
import {
  ApplicationLoadBalancer,
  LbTargetGroup,
  LbListener,
} from '@cdktf/provider-aws/lib/elb';
import { EnvironmentConfig } from '../types/environment';
import { NetworkingConstruct } from './networking';
import { ComputeConstruct } from './compute';

export class MonitoringConstruct extends Construct {
  public readonly loadBalancer: ApplicationLoadBalancer;
  public readonly targetGroup: LbTargetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    networking: NetworkingConstruct,
    compute: ComputeConstruct
  ) {
    super(scope, id);

    // CloudWatch Log Groups
    new CloudwatchLogGroup(this, 'system-logs', {
      name: `/aws/ec2/${config.name}/system`,
      retentionInDays: config.logRetentionDays,
      tags: config.tags,
    });

    new CloudwatchLogGroup(this, 'application-logs', {
      name: `/aws/ec2/${config.name}/application`,
      retentionInDays: config.logRetentionDays,
      tags: config.tags,
    });

    // Application Load Balancer
    this.loadBalancer = new ApplicationLoadBalancer(this, 'alb', {
      name: `${config.name}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [networking.securityGroup.id],
      subnets: networking.publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: config.name === 'production',
      tags: config.tags,
    });

    // Target Group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${config.name}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: networking.vpc.id,
      healthCheck: {
        enabled: true,
        path: '/health',
        port: '80',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      tags: config.tags,
    });

    // Load Balancer Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: '80',
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: `${config.name}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: '300',
      statistic: 'Average',
      threshold: '80',
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      dimensions: {
        AutoScalingGroupName: compute.autoScalingGroup.name,
      },
      tags: config.tags,
    });

    new CloudwatchMetricAlarm(this, 'alb-response-time-alarm', {
      alarmName: `${config.name}-high-response-time`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: '300',
      statistic: 'Average',
      threshold: '1',
      alarmDescription: 'This metric monitors ALB response time',
      dimensions: {
        LoadBalancer: this.loadBalancer.arnSuffix,
      },
      tags: config.tags,
    });

    // Health Check Alarm
    new CloudwatchMetricAlarm(this, 'unhealthy-hosts-alarm', {
      alarmName: `${config.name}-unhealthy-hosts`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: '300',
      statistic: 'Average',
      threshold: '0',
      alarmDescription: 'This metric monitors unhealthy hosts',
      dimensions: {
        TargetGroup: this.targetGroup.arnSuffix,
        LoadBalancer: this.loadBalancer.arnSuffix,
      },
      tags: config.tags,
    });
  }
}
```

## 8. Application

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EnvironmentConfig } from '../types/environment';
import { IAMConstruct } from '../constructs/iam';
import { NetworkingConstruct } from '../constructs/networking';
import { ComputeConstruct } from '../constructs/compute';
import { MonitoringConstruct } from '../constructs/monitoring';

export class ApplicationStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: config.region,
      defaultTags: {
        tags: config.tags,
      },
    });

    // Create constructs
    const iam = new IAMConstruct(this, 'iam', config);
    const networking = new NetworkingConstruct(this, 'networking', config);
    const compute = new ComputeConstruct(
      this,
      'compute',
      config,
      iam,
      networking
    );
    const monitoring = new MonitoringConstruct(
      this,
      'monitoring',
      config,
      networking,
      compute
    );

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'load-balancer-dns', {
      value: monitoring.loadBalancer.dnsName,
      description: 'Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'load-balancer-url', {
      value: `http://${monitoring.loadBalancer.dnsName}`,
      description: 'Load Balancer URL',
    });

    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: compute.autoScalingGroup.name,
      description: 'Auto Scaling Group Name',
    });
  }
}
```

## 9. Main Application

**src/main.ts**

```typescript
import { App } from 'cdktf';
import { ApplicationStack } from './stacks/application-stack';
import { environmentConfigs } from './config/environment-config';
import { Environment } from './types/environment';

const app = new App();

// Create stacks for each environment
const environments: Environment[] = ['development', 'staging', 'production'];

environments.forEach(env => {
  const config = environmentConfigs[env];
  new ApplicationStack(app, `${env}-stack`, config);
});

app.synth();
```

## Deployment Instructions

1. **Initialize the project:**

```bash
npm install
cdktf get
```

2. **Validate the configuration:**

```bash
npm run validate
```

3. **Deploy individual environments:**

```bash
# Deploy development
cdktf deploy development-stack

# Deploy staging
cdktf deploy staging-stack

# Deploy production
cdktf deploy production-stack
```

4. **Deploy all environments:**

```bash
cdktf deploy "*"
```

## Key Features Implemented

### **Environment Separation**

- Three isolated stacks (dev, staging, prod)
- Environment-specific configurations
- Consistent architecture across environments

### **Least Privilege IAM**

- Minimal permissions for EC2 instances
- Environment-specific resource access
- Proper role separation

### **Parameterized Configuration**

- Environment-specific settings in config files
- No hardcoded values in infrastructure code
- Easy to modify without code changes

### **Health Checks & Monitoring**

- Application Load Balancer with health checks
- CloudWatch alarms for CPU, response time, and unhealthy hosts
- Centralized logging with retention policies
- Custom metrics collection

### **Proper Tagging**

- Consistent tagging strategy
- Environment and project identification
- Cost center tracking

### **TypeScript & CDKTF**

- Full TypeScript implementation
- Type safety and validation
- Modular construct-based architecture

### **AWS us-west-2 Deployment**

- Configured for us-west-2 region
- Multi-AZ deployment for high availability

This solution provides a robust, scalable, and maintainable infrastructure setup that meets all your requirements while following AWS best practices for security, monitoring, and resource management.
