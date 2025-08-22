AWS Multi-Region Web Application Deployment with Pulumi TypeScript



Project Structure
aws-govcloud-webapp/
├── index.ts
├── Pulumi.yaml
├── package.json
├── tsconfig.json
├── src/
│   ├── networking.ts
│   ├── security.ts
│   ├── application.ts
│   └── monitoring.ts
└── README.md

```yml
1. Pulumi.yaml
name: aws-govcloud-webapp
runtime: nodejs
description: Multi-region web application deployment on AWS GovCloud with auto-scaling
template:
  config:
    aws:region:
      description: Primary AWS GovCloud region
      default: us-gov-west-1
    aws-govcloud-webapp:secondaryRegion:
      description: Secondary AWS GovCloud region
      default: us-gov-east-1
    aws-govcloud-webapp:environment:
      description: Environment name
      default: production
    aws-govcloud-webapp:applicationName:
      description: Application name
      default: govcloud-webapp
    aws-govcloud-webapp:instanceType:
      description: EC2 instance type
      default: t3.micro
    aws-govcloud-webapp:minInstances:
      description: Minimum number of instances
      default: 2
    aws-govcloud-webapp:maxInstances:
      description: Maximum number of instances
      default: 10
    aws-govcloud-webapp:cpuThreshold:
      description: CPU utilization threshold for scaling
      default: 70
```

```json
2. package.json
{
  "name": "aws-govcloud-webapp",
  "version": "1.0.0",
  "description": "Multi-region AWS GovCloud web application with Pulumi TypeScript",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "start": "pulumi up",
    "preview": "pulumi preview",
    "destroy": "pulumi destroy"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.90.0",
    "@pulumi/aws": "^6.5.0",
    "@pulumi/awsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}

3. tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "outDir": "./bin",
    "rootDir": "./",
    "moduleResolution": "node",
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "files": [
    "index.ts"
  ]
}
```

```ts
4. src/networking.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface NetworkingArgs {
  region: string;
  environment: string;
  tags: Record<string, string>;
}

export class Networking extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];

  constructor(name: string, args: NetworkingArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:networking:Networking", name, {}, opts);

    // VPC
    this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...args.tags,
        Name: `${name}-vpc`,
        Component: "networking"
      }
    }, { parent: this });

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `${name}-igw`,
        Component: "networking"
      }
    }, { parent: this });

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: "available"
    });

    // Public Subnets
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    for (let i = 0; i < 2; i++) {
      // Public Subnet
      const publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet-${i + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: azs.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...args.tags,
          Name: `${name}-public-subnet-${i + 1}`,
          Type: "public",
          Component: "networking"
        }
      }, { parent: this });

      this.publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new aws.ec2.Subnet(`${name}-private-subnet-${i + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: azs.then(azs => azs.names[i]),
        tags: {
          ...args.tags,
          Name: `${name}-private-subnet-${i + 1}`,
          Type: "private",
          Component: "networking"
        }
      }, { parent: this });

      this.privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(`${name}-nat-eip-${i + 1}`, {
        domain: "vpc",
        tags: {
          ...args.tags,
          Name: `${name}-nat-eip-${i + 1}`,
          Component: "networking"
        }
      }, { parent: this });

      // NAT Gateway
      const natGateway = new aws.ec2.NatGateway(`${name}-nat-gateway-${i + 1}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...args.tags,
          Name: `${name}-nat-gateway-${i + 1}`,
          Component: "networking"
        }
      }, { parent: this });

      this.natGateways.push(natGateway);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `${name}-public-rt`,
        Type: "public",
        Component: "networking"
      }
    }, { parent: this });

    new aws.ec2.Route(`${name}-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    }, { parent: this });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      }, { parent: this });
    });

    // Private Route Tables
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt-${i + 1}`, {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-private-rt-${i + 1}`,
          Type: "private",
          Component: "networking"
        }
      }, { parent: this });

      new aws.ec2.Route(`${name}-private-route-${i + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[i].id
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      }, { parent: this });
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id)
    });
  }
}
5. src/security.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface SecurityArgs {
  vpcId: pulumi.Input<string>;
  environment: string;
  tags: Record<string, string>;
}

export class Security extends pulumi.ComponentResource {
  public readonly webSecurityGroup: aws.ec2.SecurityGroup;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly instanceProfile: aws.iam.InstanceProfile;
  public readonly serviceRole: aws.iam.Role;

  constructor(name: string, args: SecurityArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:Security", name, {}, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg`, {
      name: `${name}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: args.vpcId,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTP"
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS"
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic"
        }
      ],
      tags: {
        ...args.tags,
        Name: `${name}-alb-sg`,
        Component: "security"
      }
    }, { parent: this });

    // Web Security Group
    this.webSecurityGroup = new aws.ec2.SecurityGroup(`${name}-web-sg`, {
      name: `${name}-web-sg`,
      description: "Security group for web servers",
      vpcId: args.vpcId,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          securityGroups: [this.albSecurityGroup.id],
          description: "HTTP from ALB"
        },
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["10.0.0.0/16"],
          description: "SSH from VPC"
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic"
        }
      ],
      tags: {
        ...args.tags,
        Name: `${name}-web-sg`,
        Component: "security"
      }
    }, { parent: this });

    // IAM Role for Elastic Beanstalk Service
    this.serviceRole = new aws.iam.Role(`${name}-eb-service-role`, {
      name: `${name}-eb-service-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "elasticbeanstalk.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        ...args.tags,
        Name: `${name}-eb-service-role`,
        Component: "security"
      }
    }, { parent: this });

    // Attach managed policies to service role
    new aws.iam.RolePolicyAttachment(`${name}-eb-service-policy`, {
      role: this.serviceRole.name,
      policyArn: "arn:aws-us-gov:iam::aws:policy/service-role/AWSElasticBeanstalkService"
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`${name}-eb-enhanced-health-policy`, {
      role: this.serviceRole.name,
      policyArn: "arn:aws-us-gov:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
    }, { parent: this });

    // IAM Role for EC2 instances
    const instanceRole = new aws.iam.Role(`${name}-eb-instance-role`, {
      name: `${name}-eb-instance-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        ...args.tags,
        Name: `${name}-eb-instance-role`,
        Component: "security"
      }
    }, { parent: this });

    // Attach managed policies to instance role
    new aws.iam.RolePolicyAttachment(`${name}-eb-web-tier-policy`, {
      role: instanceRole.name,
      policyArn: "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkWebTier"
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`${name}-eb-worker-tier-policy`, {
      role: instanceRole.name,
      policyArn: "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`${name}-eb-multicontainer-docker-policy`, {
      role: instanceRole.name,
      policyArn: "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
    }, { parent: this });

    // Instance Profile
    this.instanceProfile = new aws.iam.InstanceProfile(`${name}-eb-instance-profile`, {
      name: `${name}-eb-instance-profile`,
      role: instanceRole.name,
      tags: {
        ...args.tags,
        Name: `${name}-eb-instance-profile`,
        Component: "security"
      }
    }, { parent: this });

    this.registerOutputs({
      webSecurityGroupId: this.webSecurityGroup.id,
      albSecurityGroupId: this.albSecurityGroup.id,
      instanceProfileName: this.instanceProfile.name,
      serviceRoleArn: this.serviceRole.arn
    });
  }
}
6. src/application.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface ApplicationArgs {
  applicationName: string;
  environment: string;
  region: string;
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  instanceProfile: pulumi.Input<string>;
  serviceRole: pulumi.Input<string>;
  instanceType: string;
  minInstances: number;
  maxInstances: number;
  cpuThreshold: number;
  tags: Record<string, string>;
}

export class Application extends pulumi.ComponentResource {
  public readonly application: aws.elasticbeanstalk.Application;
  public readonly applicationVersion: aws.elasticbeanstalk.ApplicationVersion;
  public readonly environment: aws.elasticbeanstalk.Environment;

  constructor(name: string, args: ApplicationArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:application:Application", name, {}, opts);

    // Elastic Beanstalk Application
    this.application = new aws.elasticbeanstalk.Application(`${name}-app`, {
      name: `${args.applicationName}-${args.region}`,
      description: `Multi-region web application for ${args.environment} environment`,
      tags: {
        ...args.tags,
        Name: `${args.applicationName}-${args.region}`,
        Component: "application"
      }
    }, { parent: this });

    // Sample application bundle (you would replace this with your actual application)
    const sampleApp = new aws.s3.BucketObject(`${name}-sample-app`, {
      bucket: "elasticbeanstalk-samples-us-gov-west-1", // Use appropriate GovCloud sample bucket
      key: "nodejs-sample.zip",
      source: new pulumi.asset.RemoteArchive("https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/samples/nodejs-v1.zip")
    }, { parent: this });

    // Application Version
    this.applicationVersion = new aws.elasticbeanstalk.ApplicationVersion(`${name}-app-version`, {
      name: `${args.applicationName}-${args.region}-v1`,
      application: this.application.name,
      bucket: sampleApp.bucket,
      key: sampleApp.key,
      tags: {
        ...args.tags,
        Name: `${args.applicationName}-${args.region}-v1`,
        Component: "application"
      }
    }, { parent: this });

    // Elastic Beanstalk Environment
    this.environment = new aws.elasticbeanstalk.Environment(`${name}-env`, {
      name: `${args.applicationName}-${args.environment}-${args.region}`,
      application: this.application.name,
      solutionStackName: "64bit Amazon Linux 2 v5.8.0 running Node.js 18",
      version: this.applicationVersion.name,
      settings: [
        // VPC Configuration
        {
          namespace: "aws:ec2:vpc",
          name: "VPCId",
          value: args.vpcId
        },
        {
          namespace: "aws:ec2:vpc",
          name: "Subnets",
          value: pulumi.all(args.subnetIds).apply(ids => ids.join(","))
        },
        {
          namespace: "aws:ec2:vpc",
          name: "ELBSubnets",
          value: pulumi.all(args.subnetIds).apply(ids => ids.join(","))
        },
        // Security Groups
        {
          namespace: "aws:autoscaling:launchconfiguration",
          name: "SecurityGroups",
          value: pulumi.all(args.securityGroupIds).apply(ids => ids.join(","))
        },
        // Instance Configuration
        {
          namespace: "aws:autoscaling:launchconfiguration",
          name: "InstanceType",
          value: args.instanceType
        },
        {
          namespace: "aws:autoscaling:launchconfiguration",
          name: "IamInstanceProfile",
          value: args.instanceProfile
        },
        // Auto Scaling Configuration
        {
          namespace: "aws:autoscaling:asg",
          name: "MinSize",
          value: args.minInstances.toString()
        },
        {
          namespace: "aws:autoscaling:asg",
          name: "MaxSize",
          value: args.maxInstances.toString()
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "MeasureName",
          value: "CPUUtilization"
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "Statistic",
          value: "Average"
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "Unit",
          value: "Percent"
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "UpperThreshold",
          value: args.cpuThreshold.toString()
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "LowerThreshold",
          value: (args.cpuThreshold - 20).toString()
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "ScaleUpIncrement",
          value: "1"
        },
        {
          namespace: "aws:autoscaling:trigger",
          name: "ScaleDownIncrement",
          value: "-1"
        },
        // Load Balancer Configuration
        {
          namespace: "aws:elasticbeanstalk:environment",
          name: "LoadBalancerType",
          value: "application"
        },
        {
          namespace: "aws:elbv2:loadbalancer",
          name: "SecurityGroups",
          value: pulumi.all(args.securityGroupIds).apply(ids => ids.join(","))
        },
        // Service Role
        {
          namespace: "aws:elasticbeanstalk:environment",
          name: "ServiceRole",
          value: args.serviceRole
        },
        // Health Monitoring
        {
          namespace: "aws:elasticbeanstalk:healthreporting:system",
          name: "SystemType",
          value: "enhanced"
        },
        {
          namespace: "aws:elasticbeanstalk:healthreporting:system",
          name: "HealthCheckSuccessThreshold",
          value: "Ok"
        },
        // Rolling Updates
        {
          namespace: "aws:autoscaling:updatepolicy:rollingupdate",
          name: "RollingUpdateEnabled",
          value: "true"
        },
        {
          namespace: "aws:autoscaling:updatepolicy:rollingupdate",
          name: "RollingUpdateType",
          value: "Health"
        },
        {
          namespace: "aws:autoscaling:updatepolicy:rollingupdate",
          name: "MinInstancesInService",
          value: "1"
        },
        // Compliance and Security Settings
        {
          namespace: "aws:elasticbeanstalk:application:environment",
          name: "COMPLIANCE_MODE",
          value: "GOVCLOUD"
        },
        {
          namespace: "aws:elasticbeanstalk:application:environment",
          name: "ENVIRONMENT",
          value: args.environment
        }
      ],
      tags: {
        ...args.tags,
        Name: `${args.applicationName}-${args.environment}-${args.region}`,
        Component: "application"
      }
    }, { parent: this });

    this.registerOutputs({
      applicationName: this.application.name,
      environmentName: this.environment.name,
      environmentUrl: this.environment.endpointUrl
    });
  }
}
7. src/monitoring.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface MonitoringArgs {
  applicationName: string;
  environmentName: pulumi.Input<string>;
  region: string;
  tags: Record<string, string>;
}

export class Monitoring extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly cpuAlarm: aws.cloudwatch.MetricAlarm;
  public readonly healthAlarm: aws.cloudwatch.MetricAlarm;

  constructor(name: string, args: MonitoringArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:monitoring:Monitoring", name, {}, opts);

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(`${name}-dashboard`, {
      dashboardName: `${args.applicationName}-${args.region}-dashboard`,
      dashboardBody: pulumi.all([args.environmentName]).apply(([envName]) => JSON.stringify({
        widgets: [
          {
            type: "metric",
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ["AWS/ElasticBeanstalk", "ApplicationRequests2xx", "EnvironmentName", envName],
                [".", "ApplicationRequests4xx", ".", "."],
                [".", "ApplicationRequests5xx", ".", "."]
              ],
              view: "timeSeries",
              stacked: false,
              region: args.region,
              title: "Application Requests",
              period: 300
            }
          },
          {
            type: "metric",
            x: 0,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ["AWS/ElasticBeanstalk", "EnvironmentHealth", "EnvironmentName", envName]
              ],
              view: "timeSeries",
              stacked: false,
              region: args.region,
              title: "Environment Health",
              period: 300
            }
          },
          {
            type: "metric",
            x: 0,
            y: 12,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", `${envName}-asg`]
              ],
              view: "timeSeries",
              stacked: false,
              region: args.region,
              title: "CPU Utilization",
              period: 300
            }
          }
        ]
      }))
    }, { parent: this });

    // CPU Utilization Alarm
    this.cpuAlarm = new aws.cloudwatch.MetricAlarm(`${name}-cpu-alarm`, {
      name: `${args.applicationName}-${args.region}-high-cpu`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "This metric monitors ec2 cpu utilization",
      dimensions: {
        AutoScalingGroupName: pulumi.interpolate`${args.environmentName}-asg`
      },
      tags: {
        ...args.tags,
        Name: `${args.applicationName}-${args.region}-high-cpu`,
        Component: "monitoring"
      }
    }, { parent: this });

    // Environment Health Alarm
    this.healthAlarm = new aws.cloudwatch.MetricAlarm(`${name}-health-alarm`, {
      name: `${args.applicationName}-${args.region}-environment-health`,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 1,
      metricName: "EnvironmentHealth",
      namespace: "AWS/ElasticBeanstalk",
      period: 300,
      statistic: "Average",
      threshold: 15, // Health values: 0-No Data, 10-Ok, 15-Info, 20-Warning, 25-Degraded, 30-Severe
      alarmDescription: "This metric monitors Elastic Beanstalk environment health",
      dimensions: {
        EnvironmentName: args.environmentName
      },
      tags: {
        ...args.tags,
        Name: `${args.applicationName}-${args.region}-environment-health`,
        Component: "monitoring"
      }
    }, { parent: this });

    this.registerOutputs({
      dashboardUrl: pulumi.interpolate`https://${args.region}.console.aws.amazon.com/cloudwatch/home?region=${args.region}#dashboards:name=${this.dashboard.dashboardName}`,
      cpuAlarmArn: this.cpuAlarm.arn,
      healthAlarmArn: this.healthAlarm.arn
    });
  }
}
8. index.ts (Main Entry Point)
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Networking } from "./src/networking";
import { Security } from "./src/security";
import { Application } from "./src/application";
import { Monitoring } from "./src/monitoring";

// Configuration
const config = new pulumi.Config();
const primaryRegion = config.require("aws:region");
const secondaryRegion = config.require("secondaryRegion");
const environment = config.require("environment");
const applicationName = config.require("applicationName");
const instanceType = config.require("instanceType");
const minInstances = config.requireNumber("minInstances");
const maxInstances = config.requireNumber("maxInstances");
const cpuThreshold = config.requireNumber("cpuThreshold");

// Common tags for compliance and governance
const commonTags = {
  Environment: environment,
  Application: applicationName,
  ManagedBy: "Pulumi",
  Compliance: "GovCloud",
  Classification: "Restricted",
  Owner: "DevOps-Team",
  CostCenter: "IT-Operations",
  BackupRequired: "true",
  MonitoringEnabled: "true"
};

// Deploy to Primary Region
const primaryProvider = new aws.Provider("primary", {
  region: primaryRegion,
  defaultTags: {
    tags: commonTags
  }
});

const primaryNetworking = new Networking("primary", {
  region: primaryRegion,
  environment: environment,
  tags: { ...commonTags, Region: primaryRegion }
}, { provider: primaryProvider });

const primarySecurity = new Security("primary", {
  vpcId: primaryNetworking.vpc.id,
  environment: environment,
  tags: { ...commonTags, Region: primaryRegion }
}, { provider: primaryProvider });

const primaryApplication = new Application("primary", {
  applicationName: applicationName,
  environment: environment,
  region: primaryRegion,
  vpcId: primaryNetworking.vpc.id,
  subnetIds: primaryNetworking.privateSubnets.map(s => s.id),
  securityGroupIds: [primarySecurity.webSecurityGroup.id],
  instanceProfile: primarySecurity.instanceProfile.name,
  serviceRole: primarySecurity.serviceRole.arn,
  instanceType: instanceType,
  minInstances: minInstances,
  maxInstances: maxInstances,
  cpuThreshold: cpuThreshold,
  tags: { ...commonTags, Region: primaryRegion }
}, { provider: primaryProvider });

const primaryMonitoring = new Monitoring("primary", {
  applicationName: applicationName,
```