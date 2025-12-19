```ts
aws-multi-region-infrastructure/
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── index.ts
│   │   └── regions.ts
│   ├── components/
│   │   ├── networking/
│   │   │   ├── vpc.ts
│   │   │   └── subnets.ts
│   │   ├── security/
│   │   │   ├── iam.ts
│   │   │   └── security-groups.ts
│   │   ├── compute/
│   │   │   ├── auto-scaling.ts
│   │   │   └── launch-template.ts
│   │   ├── monitoring/
│   │   │   └── cloudwatch.ts
│   │   └── shared/
│   │       └── tags.ts
│   └── types/
│       └── index.ts
├── Pulumi.yaml
├── Pulumi.prod.yaml
├── package.json
└── tsconfig.json
Configuration Files
package.json
{
  "name": "aws-multi-region-infrastructure",
  "version": "1.0.0",
  "description": "Multi-region AWS infrastructure for enterprise SaaS application",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "start": "pulumi up",
    "preview": "pulumi preview",
    "destroy": "pulumi destroy"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.95.0",
    "@pulumi/aws": "^6.15.0",
    "@pulumi/awsx": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```ts
```yaml
Pulumi.yaml
name: aws-multi-region-infrastructure
runtime:
  name: nodejs
  options:
    typescript: true
description: Multi-region AWS infrastructure for enterprise SaaS application


Pulumi.prod.yaml
config:
  aws-multi-region-infrastructure:environment: "production"
  aws-multi-region-infrastructure:primaryRegion: "us-east-1"
  aws-multi-region-infrastructure:secondaryRegions: "us-west-2,eu-west-1"
  aws-multi-region-infrastructure:instanceType: "t3.medium"
  aws-multi-region-infrastructure:minInstances: "2"
  aws-multi-region-infrastructure:maxInstances: "10"
  aws-multi-region-infrastructure:desiredInstances: "3"
Core Implementation

```yaml

```ts
src/types/index.ts
export interface RegionConfig {
  name: string;
  provider: any;
  availabilityZones: string[];
}

export interface InfrastructureConfig {
  environment: string;
  primaryRegion: string;
  secondaryRegions: string[];
  instanceType: string;
  minInstances: number;
  maxInstances: number;
  desiredInstances: number;
}

export interface NetworkingResources {
  vpc: any;
  publicSubnets: any[];
  privateSubnets: any[];
  internetGateway: any;
  natGateways: any[];
  routeTables: any[];
}

export interface SecurityResources {
  webSecurityGroup: any;
  appSecurityGroup: any;
  dbSecurityGroup: any;
  instanceRole: any;
  instanceProfile: any;
}

export interface ComputeResources {
  launchTemplate: any;
  autoScalingGroup: any;
  targetGroup: any;
  loadBalancer: any;
}
src/config/index.ts
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const infrastructureConfig = {
  environment: config.require("environment"),
  primaryRegion: config.require("primaryRegion"),
  secondaryRegions: config.require("secondaryRegions").split(","),
  instanceType: config.require("instanceType"),
  minInstances: config.requireNumber("minInstances"),
  maxInstances: config.requireNumber("maxInstances"),
  desiredInstances: config.requireNumber("desiredInstances"),
};

export const getResourceName = (resourceType: string, suffix?: string): string => {
  const parts = ["prod", resourceType];
  if (suffix) parts.push(suffix);
  return parts.join("-");
};
src/config/regions.ts
import * as aws from "@pulumi/aws";
import { RegionConfig } from "../types";

export const createRegionConfigs = (regions: string[]): RegionConfig[] => {
  return regions.map(region => ({
    name: region,
    provider: new aws.Provider(`provider-${region}`, { region }),
    availabilityZones: getAvailabilityZones(region)
  }));
};

const getAvailabilityZones = (region: string): string[] => {
  const azMap: Record<string, string[]> = {
    "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c"],
    "us-west-2": ["us-west-2a", "us-west-2b", "us-west-2c"],
    "eu-west-1": ["eu-west-1a", "eu-west-1b", "eu-west-1c"],
  };
  
  return azMap[region] || [`${region}a`, `${region}b`, `${region}c`];
};
src/components/shared/tags.ts
export const getCommonTags = (resourceName: string, additionalTags: Record<string, string> = {}) => ({
  Environment: "Production",
  Name: resourceName,
  ManagedBy: "Pulumi",
  Project: "Enterprise-SaaS",
  ...additionalTags,
});
src/components/networking/vpc.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { getResourceName } from "../../config";
import { getCommonTags } from "../shared/tags";
import { RegionConfig, NetworkingResources } from "../../types";

export const createNetworking = (regionConfig: RegionConfig): NetworkingResources => {
  const { name: regionName, provider, availabilityZones } = regionConfig;
  
  // VPC
  const vpc = new aws.ec2.Vpc(
    getResourceName("vpc", regionName),
    {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: getCommonTags(getResourceName("vpc", regionName), {
        Description: `Main VPC for ${regionName} region`,
      }),
    },
    { provider }
  );

  // Internet Gateway
  const internetGateway = new aws.ec2.InternetGateway(
    getResourceName("igw", regionName),
    {
      vpcId: vpc.id,
      tags: getCommonTags(getResourceName("igw", regionName)),
    },
    { provider }
  );

  // Public Subnets
  const publicSubnets = availabilityZones.map((az, index) => 
    new aws.ec2.Subnet(
      getResourceName("subnet-public", `${regionName}-${index + 1}`),
      {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: getCommonTags(
          getResourceName("subnet-public", `${regionName}-${index + 1}`),
          {
            Type: "Public",
            AvailabilityZone: az,
          }
        ),
      },
      { provider }
    )
  );

  // Private Subnets
  const privateSubnets = availabilityZones.map((az, index) => 
    new aws.ec2.Subnet(
      getResourceName("subnet-private", `${regionName}-${index + 1}`),
      {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: getCommonTags(
          getResourceName("subnet-private", `${regionName}-${index + 1}`),
          {
            Type: "Private",
            AvailabilityZone: az,
          }
        ),
      },
      { provider }
    )
  );

  // Elastic IPs for NAT Gateways
  const eips = publicSubnets.map((_, index) => 
    new aws.ec2.Eip(
      getResourceName("eip", `${regionName}-${index + 1}`),
      {
        domain: "vpc",
        tags: getCommonTags(getResourceName("eip", `${regionName}-${index + 1}`)),
      },
      { provider }
    )
  );

  // NAT Gateways
  const natGateways = publicSubnets.map((subnet, index) => 
    new aws.ec2.NatGateway(
      getResourceName("nat", `${regionName}-${index + 1}`),
      {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: getCommonTags(getResourceName("nat", `${regionName}-${index + 1}`)),
      },
      { provider }
    )
  );

  // Public Route Table
  const publicRouteTable = new aws.ec2.RouteTable(
    getResourceName("rt-public", regionName),
    {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: internetGateway.id,
        },
      ],
      tags: getCommonTags(getResourceName("rt-public", regionName), {
        Type: "Public",
      }),
    },
    { provider }
  );

  // Associate public subnets with public route table
  publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      getResourceName("rta-public", `${regionName}-${index + 1}`),
      {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      },
      { provider }
    );
  });

  // Private Route Tables (one per AZ)
  const privateRouteTables = privateSubnets.map((subnet, index) => {
    const routeTable = new aws.ec2.RouteTable(
      getResourceName("rt-private", `${regionName}-${index + 1}`),
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: "0.0.0.0/0",
            natGatewayId: natGateways[index].id,
          },
        ],
        tags: getCommonTags(getResourceName("rt-private", `${regionName}-${index + 1}`), {
          Type: "Private",
        }),
      },
      { provider }
    );

    new aws.ec2.RouteTableAssociation(
      getResourceName("rta-private", `${regionName}-${index + 1}`),
      {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      },
      { provider }
    );

    return routeTable;
  });

  return {
    vpc,
    publicSubnets,
    privateSubnets,
    internetGateway,
    natGateways,
    routeTables: [publicRouteTable, ...privateRouteTables],
  };
};
src/components/security/security-groups.ts
import * as aws from "@pulumi/aws";
import { getResourceName } from "../../config";
import { getCommonTags } from "../shared/tags";
import { RegionConfig } from "../../types";

export const createSecurityGroups = (regionConfig: RegionConfig, vpcId: any) => {
  const { name: regionName, provider } = regionConfig;

  // Web Security Group (ALB)
  const webSecurityGroup = new aws.ec2.SecurityGroup(
    getResourceName("sg-web", regionName),
    {
      name: getResourceName("sg-web", regionName),
      description: "Security group for web tier (ALB)",
      vpcId: vpcId,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTP access from internet",
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS access from internet",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: getCommonTags(getResourceName("sg-web", regionName), {
        Tier: "Web",
        Description: "Security group for Application Load Balancer",
      }),
    },
    { provider }
  );

  // Application Security Group
  const appSecurityGroup = new aws.ec2.SecurityGroup(
    getResourceName("sg-app", regionName),
    {
      name: getResourceName("sg-app", regionName),
      description: "Security group for application tier",
      vpcId: vpcId,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 8080,
          toPort: 8080,
          securityGroups: [webSecurityGroup.id],
          description: "Application port from ALB",
        },
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["10.0.0.0/16"],
          description: "SSH access from VPC",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: getCommonTags(getResourceName("sg-app", regionName), {
        Tier: "Application",
        Description: "Security group for application servers",
      }),
    },
    { provider }
  );

  // Database Security Group
  const dbSecurityGroup = new aws.ec2.SecurityGroup(
    getResourceName("sg-db", regionName),
    {
      name: getResourceName("sg-db", regionName),
      description: "Security group for database tier",
      vpcId: vpcId,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 3306,
          toPort: 3306,
          securityGroups: [appSecurityGroup.id],
          description: "MySQL/Aurora access from application tier",
        },
        {
          protocol: "tcp",
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [appSecurityGroup.id],
          description: "PostgreSQL access from application tier",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: getCommonTags(getResourceName("sg-db", regionName), {
        Tier: "Database",
        Description: "Security group for database servers",
      }),
    },
    { provider }
  );

  return {
    webSecurityGroup,
    appSecurityGroup,
    dbSecurityGroup,
  };
};
src/components/security/iam.ts
import * as aws from "@pulumi/aws";
import { getResourceName } from "../../config";
import { getCommonTags } from "../shared/tags";
import { RegionConfig } from "../../types";

export const createIAMResources = (regionConfig: RegionConfig) => {
  const { name: regionName, provider } = regionConfig;

  // EC2 Instance Role
  const instanceRole = new aws.iam.Role(
    getResourceName("role-ec2", regionName),
    {
      name: getResourceName("role-ec2", regionName),
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: getCommonTags(getResourceName("role-ec2", regionName), {
        Description: "IAM role for EC2 instances",
      }),
    },
    { provider }
  );

  // CloudWatch Agent Policy
  const cloudWatchPolicy = new aws.iam.Policy(
    getResourceName("policy-cloudwatch", regionName),
    {
      name: getResourceName("policy-cloudwatch", regionName),
      description: "Policy for CloudWatch agent and logging",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "ec2:DescribeVolumes",
              "ec2:DescribeTags",
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: getCommonTags(getResourceName("policy-cloudwatch", regionName)),
    },
    { provider }
  );

  // S3 Access Policy (for application data)
  const s3Policy = new aws.iam.Policy(
    getResourceName("policy-s3", regionName),
    {
      name: getResourceName("policy-s3", regionName),
      description: "Policy for S3 access",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:ListBucket",
            ],
            Resource: [
              `arn:aws:s3:::${getResourceName("app-data", regionName)}`,
              `arn:aws:s3:::${getResourceName("app-data", regionName)}/*`,
            ],
          },
        ],
      }),
      tags: getCommonTags(getResourceName("policy-s3", regionName)),
    },
    { provider }
  );

  // Attach policies to role
  new aws.iam.RolePolicyAttachment(
    getResourceName("rpa-cloudwatch", regionName),
    {
      role: instanceRole.name,
      policyArn: cloudWatchPolicy.arn,
    },
    { provider }
  );

  new aws.iam.RolePolicyAttachment(
    getResourceName("rpa-s3", regionName),
    {
      role: instanceRole.name,
      policyArn: s3Policy.arn,
    },
    { provider }
  );

  new aws.iam.RolePolicyAttachment(
    getResourceName("rpa-ssm", regionName),
    {
      role: instanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    },
    { provider }
  );

  // Instance Profile
  const instanceProfile = new aws.iam.InstanceProfile(
    getResourceName("profile-ec2", regionName),
    {
      name: getResourceName("profile-ec2", regionName),
      role: instanceRole.name,
      tags: getCommonTags(getResourceName("profile-ec2", regionName)),
    },
    { provider }
  );

  return {
    instanceRole,
    instanceProfile,
    cloudWatchPolicy,
    s3Policy,
  };
};
src/components/compute/launch-template.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { getResourceName, infrastructureConfig } from "../../config";
import { getCommonTags } from "../shared/tags";
import { RegionConfig } from "../../types";

export const createLaunchTemplate = (
  regionConfig: RegionConfig,
  securityGroupId: pulumi.Input<string>,
  instanceProfileName: pulumi.Input<string>
) => {
  const { name: regionName, provider } = regionConfig;

  // Get latest Amazon Linux 2 AMI
  const ami = aws.ec2.getAmiOutput({
    filters: [
      {
        name: "name",
        values: ["amzn2-ami-hvm-*-x86_64-gp2"],
      },
      {
        name: "owner-alias",
        values: ["amazon"],
      },
    ],
    mostRecent: true,
  }, { provider });

  // User data script for instance initialization
  const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c ssm:${getResourceName("cwagent-config", regionName)}

# Configure application
mkdir -p /opt/app
cat > /opt/app/docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    image: nginx:latest
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - REGION=${regionName}
      - ENVIRONMENT=${infrastructureConfig.environment}
EOF

cd /opt/app
docker-compose up -d

# Signal CloudFormation that the instance is ready
/opt/aws/bin/cfn-signal -e $? --stack \${AWS::StackName} --resource AutoScalingGroup --region \${AWS::Region}
`;

  const launchTemplate = new aws.ec2.LaunchTemplate(
    getResourceName("lt-app", regionName),
    {
      name: getResourceName("lt-app", regionName),
      description: `Launch template for application servers in ${regionName}`,
      imageId: ami.id,
      instanceType: infrastructureConfig.instanceType,
      keyName: getResourceName("keypair", regionName), // You'll need to create this separately
      
      vpcSecurityGroupIds: [securityGroupId],
      
      iamInstanceProfile: {
        name: instanceProfileName,
      },
      
      userData: pulumi.output(userData).apply(data => Buffer.from(data).toString("base64")),
      
      blockDeviceMappings: [
        {
          deviceName: "/dev/xvda",
          ebs: {
            volumeSize: 20,
            volumeType: "gp3",
            encrypted: true,
            deleteOnTermination: true,
          },
        },
      ],
      
      monitoring: {
        enabled: true,
      },
      
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: getCommonTags(getResourceName("instance", regionName), {
            Description: "Application server instance",
            LaunchedBy: "AutoScaling",
          }),
        },
        {
          resourceType: "volume",
          tags: getCommonTags(getResourceName("volume", regionName), {
            Description: "Application server volume",
          }),
        },
      ],
      
      tags: getCommonTags(getResourceName("lt-app", regionName), {
        Description: "Launch template for application servers",
      }),
    },
    { provider }
  );

  return launchTemplate;
};
src/components/compute/auto-scaling.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { getResourceName, infrastructureConfig } from "../../config";
import { getCommonTags } from "../shared/tags";
import { RegionConfig } from "../../types";

export const createAutoScaling = (
  regionConfig: RegionConfig,
  launchTemplateId: pulumi.Input<string>,
  launchTemplateVersion: pulumi.Input<string>,
  subnetIds: pulumi.Input<string>[],
  targetGroupArn?: pulumi.Input<string>
) => {
  const { name: regionName, provider } = regionConfig;

  // Auto Scaling Group
  const autoScalingGroup = new aws.autoscaling.Group(
    getResourceName("asg-app", regionName),
    {
      name: getResourceName("asg-app", regionName),
      minSize: infrastructureConfig.minInstances,
      maxSize: infrastructureConfig.maxInstances,
      desiredCapacity: infrastructureConfig.desiredInstances,
      
      vpcZoneIdentifiers: subnetIds,
      
      launchTemplate: {
        id: launchTemplateId,
        version: launchTemplateVersion,
      },
      
      targetGroupArns: targetGroupArn ? [targetGroupArn] : [],
      
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      
      enabledMetrics: [
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances",
      ],
      
      tags: [
        {
          key: "Name",
          value: getResourceName("asg-app", regionName),
          propagateAtLaunch: true,
        },
        {
          key: "Environment",
          value: "Production",
          propagateAtLaunch: true,
        },
        {
          key: "ManagedBy",
          value: "Pulumi",
          propagateAtLaunch: true,
        },
      ],
    },
    { provider }
  );

  // Auto Scaling Policies
  const scaleUpPolicy = new aws.autoscaling.Policy(
    getResourceName("policy-scale-up", regionName),
    {
      name: getResourceName("policy-scale-up", regionName),
      scalingAdjustment: 1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 300,
      autoscalingGroupName: autoScalingGroup.name,
      policyType: "SimpleScaling",
    },
    { provider }
  );

  const scaleDownPolicy = new aws.autoscaling.Policy(
    getResourceName("policy-scale-down", regionName),
    {
      name: getResourceName("policy-scale-down", regionName),
      scalingAdjustment: -1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 300,
      autoscalingGroupName: autoScalingGroup.name,
      policyType: "SimpleScaling",
    },
    { provider }
  );

  // CloudWatch Alarms
  const highCpuAlarm = new aws.cloudwatch.MetricAlarm(
    getResourceName("alarm-cpu-high", regionName),
    {
      name: getResourceName("alarm-cpu-high", regionName),
      description: "High CPU utilization alarm",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      statistic: "Average",
      period: 120,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: "GreaterThanThreshold",
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      alarmActions: [scaleUpPolicy.arn],
      tags: getCommonTags(getResourceName("alarm-cpu-high", regionName)),
    },
    { provider }
  );

  const lowCpuAlarm = new aws.cloudwatch.MetricAlarm(
    getResourceName("alarm-cpu-low", regionName),
    {
      name: getResourceName("alarm-cpu-low", regionName),
      description: "Low CPU utilization alarm",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      statistic: "Average",
      period: 120,
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: "LessThanThreshold",
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      alarmActions: [scaleDownPolicy.arn],
      tags: getCommonTags(getResourceName("alarm-cpu-low", regionName)),
    },
    { provider }
  );

  return {
    autoScalingGroup,
    scaleUpPolicy,
    scaleDownPolicy,
    highCpuAlarm,
    lowCpuAlarm,
  };
};

export const createLoadBalancer = (
  regionConfig: RegionConfig,
  subnetIds: pulumi.Input<string>[],
  securityGroupId: pulumi.Input<string>,
  vpcId: pulumi.Input<string>
) => {
  const { name: regionName, provider } = regionConfig;

  // Application Load Balancer
  const loadBalancer = new aws.lb.LoadBalancer(
    getResourceName("alb-app", regionName),
    {
      name: getResourceName("alb-app", regionName),
      loadBalancerType: "application",
      scheme: "internet-facing",
      securityGroups: [securityGroupId],
      subnets: subnetIds,
      
      enableDeletionProtection: true,
      
      accessLogs: {
        bucket: getResourceName("alb-logs", regionName),
        enabled: true,
      },
      
      tags: getCommonTags(getResourceName("alb-app", regionName), {
        Description: "Application Load Balancer for web tier",