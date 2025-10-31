## lib/modules.ts

```typescript
import { Construct } from "constructs";
import * as aws from "@cdktf/provider-aws";
import { Fn, Token } from "cdktf";

// Common interfaces for configuration
export interface CommonTags {
  Environment: string;
  Project: string;
}

export interface VPCConfig {
  cidrBlock: string;
  azCount: number;
  tags: CommonTags;
}

export interface SubnetConfig {
  vpcId: string;
  cidrBlocks: {
    public: string[];
    private: string[];
  };
  availabilityZones: string[];
  tags: CommonTags;
}

// VPC Construct with public and private subnets
export class VPCConstruct extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.vpc.Subnet[];
  public readonly privateSubnets: aws.vpc.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly availabilityZones: string[];

  constructor(scope: Construct, id: string, config: VPCConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.tags.Project}-vpc`,
        ...config.tags,
      },
    });

    // Get availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
      this,
      "azs",
      {
        state: "available",
      }
    );

    this.availabilityZones = [
      Fn.element(azs.names, 0),
      Fn.element(azs.names, 1),
    ];

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.tags.Project}-igw`,
        ...config.tags,
      },
    });

    // Create public subnets
    this.publicSubnets = this.availabilityZones.map((az, index) => {
      return new aws.vpc.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: Fn.cidrsubnet(config.cidrBlock, 8, index),
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.tags.Project}-public-subnet-${index + 1}`,
          Type: "Public",
          ...config.tags,
        },
      });
    });

    // Create private subnets
    this.privateSubnets = this.availabilityZones.map((az, index) => {
      return new aws.vpc.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: Fn.cidrsubnet(config.cidrBlock, 8, index + 10),
        availabilityZone: az,
        tags: {
          Name: `${config.tags.Project}-private-subnet-${index + 1}`,
          Type: "Private",
          ...config.tags,
        },
      });
    });

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      this,
      "public-route-table",
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.tags.Project}-public-rt`,
          ...config.tags,
        },
      }
    );

    // Add route to internet gateway
    new aws.ec2.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });
  }
}

// NAT Gateway Construct
export class NATConstruct extends Construct {
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly elasticIps: aws.ec2.Eip[];

  constructor(
    scope: Construct,
    id: string,
    config: {
      publicSubnets: aws.vpc.Subnet[];
      privateSubnets: aws.vpc.Subnet[];
      vpcId: string;
      tags: CommonTags;
    }
  ) {
    super(scope, id);

    // Create Elastic IPs for NAT Gateways
    this.elasticIps = config.publicSubnets.map((_, index) => {
      return new aws.ec2.Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: {
          Name: `${config.tags.Project}-nat-eip-${index + 1}`,
          ...config.tags,
        },
      });
    });

    // Create NAT Gateways in each public subnet for HA
    this.natGateways = config.publicSubnets.map((subnet, index) => {
      return new aws.ec2.NatGateway(this, `nat-gateway-${index}`, {
        allocationId: this.elasticIps[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `${config.tags.Project}-nat-${index + 1}`,
          ...config.tags,
        },
      });
    });

    // Create private route tables and associate with private subnets
    config.privateSubnets.forEach((subnet, index) => {
      const routeTable = new aws.ec2.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: config.vpcId,
          tags: {
            Name: `${config.tags.Project}-private-rt-${index + 1}`,
            ...config.tags,
          },
        }
      );

      // Route to NAT Gateway (use corresponding NAT in same AZ for efficiency)
      const natIndex = index % this.natGateways.length;
      new aws.ec2.Route(this, `private-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[natIndex].id,
      });

      // Associate with subnet
      new aws.ec2.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        }
      );
    });
  }
}

// Security Groups Construct
export class SecurityGroupsConstruct extends Construct {
  public readonly albSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly ec2SecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly rdsSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      vpcId: string;
      tags: CommonTags;
    }
  ) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      "alb-sg",
      {
        name: `${config.tags.Project}-alb-sg`,
        description: "Security group for Application Load Balancer",
        vpcId: config.vpcId,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTPS from anywhere",
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTP from anywhere (redirect to HTTPS)",
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
          },
        ],
        tags: {
          Name: `${config.tags.Project}-alb-sg`,
          ...config.tags,
        },
      }
    );

    // EC2 Security Group
    this.ec2SecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      "ec2-sg",
      {
        name: `${config.tags.Project}-ec2-sg`,
        description: "Security group for EC2 application servers",
        vpcId: config.vpcId,
        ingress: [
          {
            fromPort: 3000,
            toPort: 3000,
            protocol: "tcp",
            securityGroups: [this.albSecurityGroup.id],
            description: "Node.js app from ALB",
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
          },
        ],
        tags: {
          Name: `${config.tags.Project}-ec2-sg`,
          ...config.tags,
        },
      }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      "rds-sg",
      {
        name: `${config.tags.Project}-rds-sg`,
        description: "Security group for RDS PostgreSQL database",
        vpcId: config.vpcId,
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: "tcp",
            securityGroups: [this.ec2SecurityGroup.id],
            description: "PostgreSQL from EC2 instances",
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
          },
        ],
        tags: {
          Name: `${config.tags.Project}-rds-sg`,
          ...config.tags,
        },
      }
    );
  }
}

// RDS Construct with Secrets Manager
export class RDSConstruct extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly dbSecretVersion: aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      privateSubnets: aws.vpc.Subnet[];
      securityGroupId: string;
      tags: CommonTags;
      dbName: string;
      instanceClass: string;
    }
  ) {
    super(scope, id);

    // Create DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      "db-subnet-group",
      {
        name: `${config.tags.Project}-db-subnet-group`,
        subnetIds: config.privateSubnets.map(subnet => subnet.id),
        description: "Subnet group for RDS PostgreSQL",
        tags: {
          Name: `${config.tags.Project}-db-subnet-group`,
          ...config.tags,
        },
      }
    );

    // Generate random password for DB
    const dbPassword = new aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
      this,
      "db-password",
      {
        length: 32,
        special: true,
        excludeCharacters: '"@/\\',
      }
    );

    // Create secret for database credentials
    this.dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      "db-secret",
      {
        name: `${config.tags.Project}-db-credentials`,
        description: "RDS PostgreSQL database credentials",
        recoveryWindowInDays: 7,
        tags: config.tags,
      }
    );

    // Store credentials in secret
    this.dbSecretVersion = new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      "db-secret-version",
      {
        secretId: this.dbSecret.id,
        secretString: Fn.jsonencode({
          username: "dbadmin",
          password: dbPassword.randomPassword,
          engine: "postgres",
          host: Token.asString(Fn.lookup(this.dbInstance, "address", "")),
          port: 5432,
          dbname: config.dbName,
        }),
      }
    );

    // Create RDS PostgreSQL instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, "db", {
      identifier: `${config.tags.Project}-db`,
      engine: "postgres",
      engineVersion: "15.4",
      instanceClass: config.instanceClass,
      allocatedStorage: 100,
      storageType: "gp3",
      storageEncrypted: true,
      dbName: config.dbName,
      username: "dbadmin",
      password: dbPassword.randomPassword,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroupId],
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      multiAz: true,
      autoMinorVersionUpgrade: true,
      applyImmediately: false,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.tags.Project}-db-final-snapshot-${Date.now()}`,
      enabledCloudwatchLogsExports: ["postgresql"],
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      tags: {
        Name: `${config.tags.Project}-db`,
        ...config.tags,
      },
    });
  }
}

// Application Load Balancer Construct
export class ALBConstruct extends Construct {
  public readonly alb: aws.alb.Alb;
  public readonly targetGroup: aws.albTargetGroup.AlbTargetGroup;
  public readonly httpsListener: aws.albListener.AlbListener;
  public readonly httpListener: aws.albListener.AlbListener;
  public readonly certificate: aws.acmCertificate.AcmCertificate;

  constructor(
    scope: Construct,
    id: string,
    config: {
      publicSubnets: aws.vpc.Subnet[];
      securityGroupId: string;
      vpcId: string;
      domainName: string;
      tags: CommonTags;
    }
  ) {
    super(scope, id);

    // Create ACM Certificate
    this.certificate = new aws.acmCertificate.AcmCertificate(
      this,
      "certificate",
      {
        domainName: config.domainName,
        validationMethod: "DNS",
        subjectAlternativeNames: [`*.${config.domainName}`],
        tags: {
          Name: `${config.tags.Project}-certificate`,
          ...config.tags,
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // Create Application Load Balancer
    this.alb = new aws.alb.Alb(this, "alb", {
      name: `${config.tags.Project}-alb`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [config.securityGroupId],
      subnets: config.publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: true,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: `${config.tags.Project}-alb`,
        ...config.tags,
      },
    });

    // Create Target Group
    this.targetGroup = new aws.albTargetGroup.AlbTargetGroup(
      this,
      "tg",
      {
        name: `${config.tags.Project}-tg`,
        port: 3000,
        protocol: "HTTP",
        vpcId: config.vpcId,
        targetType: "instance",
        healthCheck: {
          enabled: true,
          healthy_threshold: 2,
          unhealthy_threshold: 2,
          timeout: 5,
          interval: 30,
          path: "/health",
          matcher: "200",
        },
        deregistrationDelay: 30,
        stickiness: {
          type: "lb_cookie",
          enabled: true,
          cookieDuration: 86400,
        },
        tags: {
          Name: `${config.tags.Project}-tg`,
          ...config.tags,
        },
      }
    );

    // HTTPS Listener
    this.httpsListener = new aws.albListener.AlbListener(
      this,
      "https-listener",
      {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: "HTTPS",
        certificateArn: this.certificate.arn,
        sslPolicy: "ELBSecurityPolicy-TLS13-1-2-2021-06",
        defaultAction: [
          {
            type: "forward",
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      }
    );

    // HTTP Listener (redirect to HTTPS)
    this.httpListener = new aws.albListener.AlbListener(
      this,
      "http-listener",
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: "HTTP",
        defaultAction: [
          {
            type: "redirect",
            redirect: {
              port: "443",
              protocol: "HTTPS",
              statusCode: "HTTP_301",
            },
          },
        ],
      }
    );
  }
}

// EC2 Application Instances Construct
export class EC2ApplicationConstruct extends Construct {
  public readonly instances: aws.instance.Instance[];
  public readonly launchTemplate: aws.launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscalingGroup.AutoscalingGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      privateSubnets: aws.vpc.Subnet[];
      securityGroupId: string;
      targetGroupArn: string;
      instanceType: string;
      keyName?: string;
      dbSecretArn: string;
      tags: CommonTags;
      envVars: Record<string, string>;
    }
  ) {
    super(scope, id);

    // Get latest Amazon Linux 2023 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, "app-ami", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["al2023-ami-*-x86_64"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
    });

    // Create IAM role for EC2 instances
    const instanceRole = new aws.iamRole.IamRole(this, "instance-role", {
      name: `${config.tags.Project}-instance-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach policies for Secrets Manager and CloudWatch
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "ssm-policy",
      {
        role: instanceRole.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "cloudwatch-policy",
      {
        role: instanceRole.name,
        policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      }
    );

    // Inline policy for Secrets Manager access
    new aws.iamRolePolicy.IamRolePolicy(this, "secrets-policy", {
      role: instanceRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
            ],
            Resource: config.dbSecretArn,
          },
        ],
      }),
    });

    // Create Instance Profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      "instance-profile",
      {
        name: `${config.tags.Project}-instance-profile`,
        role: instanceRole.name,
      }
    );

    // Create Launch Template
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      "launch-template",
      {
        name: `${config.tags.Project}-launch-template`,
        imageId: ami.id,
        instanceType: config.instanceType,
        keyName: config.keyName,
        vpcSecurityGroupIds: [config.securityGroupId],
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        blockDeviceMappings: [
          {
            deviceName: "/dev/xvda",
            ebs: {
              volumeSize: 30,
              volumeType: "gp3",
              encrypted: true,
              deleteOnTermination: true,
            },
          },
        ],
        metadataOptions: {
          httpTokens: "required",
          httpPutResponseHopLimit: 1,
          instanceMetadataTags: "enabled",
        },
        monitoring: {
          enabled: true,
        },
        tagSpecifications: [
          {
            resourceType: "instance",
            tags: {
              Name: `${config.tags.Project}-app-instance`,
              ...config.tags,
            },
          },
          {
            resourceType: "volume",
            tags: {
              Name: `${config.tags.Project}-app-volume`,
              ...config.tags,
            },
          },
        ],
      }
    );

    // Create Auto Scaling Group
    this.autoScalingGroup = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      "asg",
      {
        name: `${config.tags.Project}-asg`,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        vpcZoneIdentifier: config.privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [config.targetGroupArn],
        healthCheckType: "ELB",
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: "$Latest",
        },
        enabledMetrics: [
          "GroupMinSize",
          "GroupMaxSize",
          "GroupDesiredCapacity",
          "GroupInServiceInstances",
          "GroupTotalInstances",
        ],
        tag: [
          {
            key: "Name",
            value: `${config.tags.Project}-asg-instance`,
            propagateAtLaunch: true,
          },
          ...Object.entries(config.tags).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
          })),
        ],
      }
    );

    // Create Auto Scaling Policies
    new aws.autoscalingPolicy.AutoscalingPolicy(
      this,
      "scale-up-policy",
      {
        name: `${config.tags.Project}-scale-up`,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: "TargetTrackingScaling",
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "ASGAverageCPUUtilization",
          },
          targetValue: 70,
        },
      }
    );
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput, TerraformVariable } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import {
  VPCConstruct,
  NATConstruct,
  SecurityGroupsConstruct,
  RDSConstruct,
  ALBConstruct,
  EC2ApplicationConstruct,
  CommonTags,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Provider configuration
    new aws.provider.AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            ManagedBy: "CDKTF",
            Terraform: "true",
          },
        },
      ],
    });

    // Variables for configuration
    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      default: "production",
      description: "Environment name (dev, staging, production)",
    });

    const projectName = new TerraformVariable(this, "project_name", {
      type: "string",
      default: "tap-ecommerce",
      description: "Project name for resource naming",
    });

    const domainName = new TerraformVariable(this, "domain_name", {
      type: "string",
      default: "example.com",
      description: "Domain name for the application",
    });

    const dbInstanceClass = new TerraformVariable(this, "db_instance_class", {
      type: "string",
      default: "db.t3.medium",
      description: "RDS instance class",
    });

    const ec2InstanceType = new TerraformVariable(this, "ec2_instance_type", {
      type: "string",
      default: "t3.medium",
      description: "EC2 instance type for application servers",
    });

    const vpcCidr = new TerraformVariable(this, "vpc_cidr", {
      type: "string",
      default: "10.0.0.0/16",
      description: "CIDR block for VPC",
    });

    // Environment variables for the application
    const apiKey = new TerraformVariable(this, "third_party_api_key", {
      type: "string",
      sensitive: true,
      description: "Third-party API key",
    });

    const apiUrl = new TerraformVariable(this, "third_party_api_url", {
      type: "string",
      default: "https://api.thirdparty.com",
      description: "Third-party API URL",
    });

    // Common tags
    const commonTags: CommonTags = {
      Environment: environment.stringValue,
      Project: projectName.stringValue,
    };

    // Create VPC with public and private subnets
    const vpcConstruct = new VPCConstruct(this, "vpc", {
      cidrBlock: vpcCidr.stringValue,
      azCount: 2,
      tags: commonTags,
    });

    // Create NAT Gateways for private subnet internet access
    const natConstruct = new NATConstruct(this, "nat", {
      publicSubnets: vpcConstruct.publicSubnets,
      privateSubnets: vpcConstruct.privateSubnets,
      vpcId: vpcConstruct.vpc.id,
      tags: commonTags,
    });

    // Create Security Groups
    const securityGroups = new SecurityGroupsConstruct(this, "security", {
      vpcId: vpcConstruct.vpc.id,
      tags: commonTags,
    });

    // Create RDS PostgreSQL database
    const rdsConstruct = new RDSConstruct(this, "database", {
      privateSubnets: vpcConstruct.privateSubnets,
      securityGroupId: securityGroups.rdsSecurityGroup.id,
      tags: commonTags,
      dbName: "ecommerce",
      instanceClass: dbInstanceClass.stringValue,
    });

    // Create Application Load Balancer
    const albConstruct = new ALBConstruct(this, "alb", {
      publicSubnets: vpcConstruct.publicSubnets,
      securityGroupId: securityGroups.albSecurityGroup.id,
      vpcId: vpcConstruct.vpc.id,
      domainName: domainName.stringValue,
      tags: commonTags,
    });

    // Environment variables for EC2 instances
    const appEnvVars: Record<string, string> = {
      NODE_ENV: environment.stringValue,
      AWS_REGION: "us-west-2",
      DB_SECRET_ARN: rdsConstruct.dbSecret.arn,
      THIRD_PARTY_API_KEY: apiKey.stringValue,
      THIRD_PARTY_API_URL: apiUrl.stringValue,
      APP_PORT: "3000",
    };

    // Create EC2 Application instances with Auto Scaling
    const ec2Construct = new EC2ApplicationConstruct(this, "application", {
      privateSubnets: vpcConstruct.privateSubnets,
      securityGroupId: securityGroups.ec2SecurityGroup.id,
      targetGroupArn: albConstruct.targetGroup.arn,
      instanceType: ec2InstanceType.stringValue,
      dbSecretArn: rdsConstruct.dbSecret.arn,
      tags: commonTags,
      envVars: appEnvVars,
    });

    // CloudWatch Alarms for monitoring
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      "alb-unhealthy-hosts",
      {
        alarmName: `${projectName.stringValue}-alb-unhealthy-hosts`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "UnHealthyHostCount",
        namespace: "AWS/ApplicationELB",
        period: 300,
        statistic: "Average",
        threshold: 0,
        alarmDescription: "Alert when we have unhealthy ALB targets",
        dimensions: {
          TargetGroup: albConstruct.targetGroup.arnSuffix,
          LoadBalancer: albConstruct.alb.arnSuffix,
        },
        tags: commonTags,
      }
    );

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      "rds-cpu-high",
      {
        alarmName: `${projectName.stringValue}-rds-cpu-high`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Alert when RDS CPU exceeds 80%",
        dimensions: {
          DBInstanceIdentifier: rdsConstruct.dbInstance.identifier,
        },
        tags: commonTags,
      }
    );

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      "asg-cpu-high",
      {
        alarmName: `${projectName.stringValue}-asg-cpu-high`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Alert when ASG instances CPU exceeds 80%",
        dimensions: {
          AutoScalingGroupName: ec2Construct.autoScalingGroup.name,
        },
        tags: commonTags,
      }
    );

    // CloudWatch Dashboard
    new aws.cloudwatchDashboard.CloudwatchDashboard(this, "main-dashboard", {
      dashboardName: `${projectName.stringValue}-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ApplicationELB", "TargetResponseTime", { stat: "Average" }],
                [".", "RequestCount", { stat: "Sum" }],
                [".", "HTTPCode_Target_2XX_Count", { stat: "Sum" }],
                [".", "HTTPCode_Target_5XX_Count", { stat: "Sum" }],
              ],
              period: 300,
              stat: "Average",
              region: "us-west-2",
              title: "ALB Metrics",
            },
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/RDS", "CPUUtilization", { stat: "Average" }],
                [".", "DatabaseConnections", { stat: "Average" }],
                [".", "FreeableMemory", { stat: "Average" }],
              ],
              period: 300,
              stat: "Average",
              region: "us-west-2",
              title: "RDS Metrics",
            },
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/EC2", "CPUUtilization", { stat: "Average" }],
                [".", "NetworkIn", { stat: "Sum" }],
                [".", "NetworkOut", { stat: "Sum" }],
              ],
              period: 300,
              stat: "Average",
              region: "us-west-2",
              title: "EC2 Metrics",
            },
          },
        ],
      }),
    });

    // Outputs
    new TerraformOutput(this, "alb_dns_name", {
      value: albConstruct.alb.dnsName,
      description: "DNS name of the Application Load Balancer",
    });

    new TerraformOutput(this, "alb_zone_id", {
      value: albConstruct.alb.zoneId,
      description: "Zone ID of the Application Load Balancer",
    });

    new TerraformOutput(this, "db_endpoint", {
      value: rdsConstruct.dbInstance.endpoint,
      description: "RDS database endpoint",
      sensitive: true,
    });

    new TerraformOutput(this, "db_secret_arn", {
      value: rdsConstruct.dbSecret.arn,
      description: "ARN of the database credentials secret",
    });

    new TerraformOutput(this, "vpc_id", {
      value: vpcConstruct.vpc.id,
      description: "ID of the VPC",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: vpcConstruct.privateSubnets.map(subnet => subnet.id),
      description: "IDs of private subnets",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: vpcConstruct.publicSubnets.map(subnet => subnet.id),
      description: "IDs of public subnets",
    });

    new TerraformOutput(this, "nat_gateway_ips", {
      value: natConstruct.elasticIps.map(eip => eip.publicIp),
      description: "Elastic IPs of NAT Gateways",
    });

    new TerraformOutput(this, "asg_name", {
      value: ec2Construct.autoScalingGroup.name,
      description: "Name of the Auto Scaling Group",
    });

    new TerraformOutput(this, "certificate_arn", {
      value: albConstruct.certificate.arn,
      description: "ARN of the ACM certificate",
    });

    new TerraformOutput(this, "target_group_arn", {
      value: albConstruct.targetGroup.arn,
      description: "ARN of the target group",
    });

    new TerraformOutput(this, "launch_template_id", {
      value: ec2Construct.launchTemplate.id,
      description: "ID of the launch template",
    });

    new TerraformOutput(this, "deployment_info", {
      value: JSON.stringify({
        region: "us-west-2",
        environment: environment.stringValue,
        project: projectName.stringValue,
        alb_url: `https://${albConstruct.alb.dnsName}`,
      }),
      description: "Deployment information summary",
    });
  }
}
```