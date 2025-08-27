I'll help you build a robust, multi-environment AWS infrastructure using Pulumi and TypeScript. Let me break this down into manageable pieces with proper dependency management and comprehensive testing.

## 1. Main Stack Implementation

**lib/tap-stack.ts**

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface TapStackConfig {
  environment: string;
  region: string;
  accountId: string;
  vpcCidr: string;
  availabilityZones: string[];
  enableCloudTrail: boolean;
  enableConfig: boolean;
  monitoringEmail: string;
  tags: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpc: awsx.ec2.Vpc;
  public readonly securityGroups: { [key: string]: aws.ec2.SecurityGroup };
  public readonly iamRoles: { [key: string]: aws.iam.Role };
  public readonly parameterStore: { [key: string]: aws.ssm.Parameter };
  public readonly cloudWatchAlarms: { [key: string]: aws.cloudwatch.MetricAlarm };
  public readonly configRules: { [key: string]: aws.cfg.ConfigRule };
  public readonly cloudTrail: aws.cloudtrail.Trail;
  public readonly outputs: { [key: string]: pulumi.Output<string> };

  constructor(name: string, config: TapStackConfig, opts?: pulumi.ComponentResourceOptions) {
    super("custom:aws:TapStack", name, {}, opts);

    const defaultOpts = { parent: this };
    
    // Apply consistent tagging
    const commonTags = {
      Environment: config.environment,
      Project: "IaC-AWS-Nova-Model-Breaking",
      ManagedBy: "Pulumi",
      Region: config.region,
      ...config.tags,
    };

    // 1. VPC Infrastructure
    this.vpc = this.createVpcInfrastructure(config, commonTags, defaultOpts);

    // 2. Security Groups (depends on VPC)
    this.securityGroups = this.createSecurityGroups(config, commonTags, defaultOpts);

    // 3. IAM Roles and Policies
    this.iamRoles = this.createIamRoles(config, commonTags, defaultOpts);

    // 4. Parameter Store Configuration
    this.parameterStore = this.createParameterStore(config, commonTags, defaultOpts);

    // 5. CloudWatch Monitoring
    this.cloudWatchAlarms = this.createCloudWatchAlarms(config, commonTags, defaultOpts);

    // 6. AWS Config Rules (optional)
    this.configRules = config.enableConfig 
      ? this.createConfigRules(config, commonTags, defaultOpts)
      : {};

    // 7. CloudTrail (optional)
    this.cloudTrail = config.enableCloudTrail
      ? this.createCloudTrail(config, commonTags, defaultOpts)
      : undefined!;

    // 8. Output important resource information
    this.outputs = this.createOutputs();

    this.registerOutputs(this.outputs);
  }

  private createVpcInfrastructure(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): awsx.ec2.Vpc {
    
    return new awsx.ec2.Vpc(`${config.environment}-vpc`, {
      cidrBlock: config.vpcCidr,
      numberOfAvailabilityZones: config.availabilityZones.length,
      numberOfNatGateways: config.environment === "prod" ? 2 : 1, // Cost optimization for non-prod
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnets: [
        // Public subnets for load balancers, NAT gateways
        {
          type: "public",
          name: "public",
          cidrMask: 24,
        },
        // Private subnets for application workloads
        {
          type: "private",
          name: "private",
          cidrMask: 24,
        },
        // Isolated subnets for databases
        {
          type: "isolated",
          name: "database",
          cidrMask: 28,
        },
      ],
      tags: {
        ...tags,
        Name: `${config.environment}-vpc`,
        Type: "VPC",
      },
    }, opts);
  }

  private createSecurityGroups(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): { [key: string]: aws.ec2.SecurityGroup } {
    
    const securityGroups: { [key: string]: aws.ec2.SecurityGroup } = {};

    // Application Load Balancer Security Group
    securityGroups.alb = new aws.ec2.SecurityGroup(`${config.environment}-alb-sg`, {
      name: `${config.environment}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: this.vpc.vpcId,
      ingress: [
        {
          description: "HTTP",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "HTTPS",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        {
          description: "All outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...tags,
        Name: `${config.environment}-alb-sg`,
        Type: "SecurityGroup",
      },
    }, opts);

    // Application Security Group
    securityGroups.app = new aws.ec2.SecurityGroup(`${config.environment}-app-sg`, {
      name: `${config.environment}-app-sg`,
      description: "Security group for application instances",
      vpcId: this.vpc.vpcId,
      ingress: [
        {
          description: "HTTP from ALB",
          fromPort: 8080,
          toPort: 8080,
          protocol: "tcp",
          securityGroups: [securityGroups.alb.id],
        },
        {
          description: "SSH from bastion",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          securityGroups: [securityGroups.alb.id], // Replace with bastion SG if you have one
        },
      ],
      egress: [
        {
          description: "All outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...tags,
        Name: `${config.environment}-app-sg`,
        Type: "SecurityGroup",
      },
    }, opts);

    // Database Security Group
    securityGroups.database = new aws.ec2.SecurityGroup(`${config.environment}-db-sg`, {
      name: `${config.environment}-db-sg`,
      description: "Security group for database instances",
      vpcId: this.vpc.vpcId,
      ingress: [
        {
          description: "MySQL/Aurora from app",
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [securityGroups.app.id],
        },
        {
          description: "PostgreSQL from app",
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          securityGroups: [securityGroups.app.id],
        },
      ],
      tags: {
        ...tags,
        Name: `${config.environment}-db-sg`,
        Type: "SecurityGroup",
      },
    }, opts);

    return securityGroups;
  }

  private createIamRoles(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): { [key: string]: aws.iam.Role } {
    
    const roles: { [key: string]: aws.iam.Role } = {};

    // EC2 Instance Role
    const ec2AssumeRolePolicy = aws.iam.getPolicyDocument({
      statements: [{
        actions: ["sts:AssumeRole"],
        principals: [{
          type: "Service",
          identifiers: ["ec2.amazonaws.com"],
        }],
      }],
    });

    roles.ec2Instance = new aws.iam.Role(`${config.environment}-ec2-role`, {
      name: `${config.environment}-ec2-instance-role`,
      assumeRolePolicy: ec2AssumeRolePolicy.then(policy => policy.json),
      tags: {
        ...tags,
        Name: `${config.environment}-ec2-instance-role`,
        Type: "IAMRole",
      },
    }, opts);

    // EC2 Instance Profile
    new aws.iam.InstanceProfile(`${config.environment}-ec2-profile`, {
      name: `${config.environment}-ec2-instance-profile`,
      role: roles.ec2Instance.name,
    }, opts);

    // Attach necessary policies to EC2 role
    new aws.iam.RolePolicyAttachment(`${config.environment}-ec2-ssm-policy`, {
      role: roles.ec2Instance.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    }, opts);

    new aws.iam.RolePolicyAttachment(`${config.environment}-ec2-cloudwatch-policy`, {
      role: roles.ec2Instance.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    }, opts);

    // Lambda Execution Role (for potential Lambda functions)
    const lambdaAssumeRolePolicy = aws.iam.getPolicyDocument({
      statements: [{
        actions: ["sts:AssumeRole"],
        principals: [{
          type: "Service",
          identifiers: ["lambda.amazonaws.com"],
        }],
      }],
    });

    roles.lambdaExecution = new aws.iam.Role(`${config.environment}-lambda-role`, {
      name: `${config.environment}-lambda-execution-role`,
      assumeRolePolicy: lambdaAssumeRolePolicy.then(policy => policy.json),
      tags: {
        ...tags,
        Name: `${config.environment}-lambda-execution-role`,
        Type: "IAMRole",
      },
    }, opts);

    new aws.iam.RolePolicyAttachment(`${config.environment}-lambda-basic-policy`, {
      role: roles.lambdaExecution.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    }, opts);

    // CloudTrail Role (if CloudTrail is enabled)
    if (config.enableCloudTrail) {
      const cloudTrailAssumeRolePolicy = aws.iam.getPolicyDocument({
        statements: [{
          actions: ["sts:AssumeRole"],
          principals: [{
            type: "Service",
            identifiers: ["cloudtrail.amazonaws.com"],
          }],
        }],
      });

      roles.cloudTrail = new aws.iam.Role(`${config.environment}-cloudtrail-role`, {
        name: `${config.environment}-cloudtrail-role`,
        assumeRolePolicy: cloudTrailAssumeRolePolicy.then(policy => policy.json),
        tags: {
          ...tags,
          Name: `${config.environment}-cloudtrail-role`,
          Type: "IAMRole",
        },
      }, opts);
    }

    return roles;
  }

  private createParameterStore(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): { [key: string]: aws.ssm.Parameter } {
    
    const parameters: { [key: string]: aws.ssm.Parameter } = {};

    // Environment configuration
    parameters.environment = new aws.ssm.Parameter(`${config.environment}-env-param`, {
      name: `/${config.environment}/app/environment`,
      type: "String",
      value: config.environment,
      description: `Environment name for ${config.environment}`,
      tags: {
        ...tags,
        Name: `${config.environment}-environment-param`,
        Type: "SSMParameter",
      },
    }, opts);

    // VPC ID
    parameters.vpcId = new aws.ssm.Parameter(`${config.environment}-vpc-id-param`, {
      name: `/${config.environment}/network/vpc-id`,
      type: "String",
      value: this.vpc.vpcId,
      description: `VPC ID for ${config.environment}`,
      tags: {
        ...tags,
        Name: `${config.environment}-vpc-id-param`,
        Type: "SSMParameter",
      },
    }, opts);

    // Database connection string (placeholder)
    parameters.dbConnectionString = new aws.ssm.Parameter(`${config.environment}-db-connection-param`, {
      name: `/${config.environment}/database/connection-string`,
      type: "SecureString",
      value: `placeholder-connection-string-${config.environment}`,
      description: `Database connection string for ${config.environment}`,
      tags: {
        ...tags,
        Name: `${config.environment}-db-connection-param`,
        Type: "SSMParameter",
      },
    }, opts);

    // Application configuration
    parameters.appConfig = new aws.ssm.Parameter(`${config.environment}-app-config-param`, {
      name: `/${config.environment}/app/config`,
      type: "String",
      value: JSON.stringify({
        logLevel: config.environment === "prod" ? "INFO" : "DEBUG",
        enableMetrics: true,
        maxConnections: config.environment === "prod" ? 100 : 50,
      }),
      description: `Application configuration for ${config.environment}`,
      tags: {
        ...tags,
        Name: `${config.environment}-app-config-param`,
        Type: "SSMParameter",
      },
    }, opts);

    return parameters;
  }

  private createCloudWatchAlarms(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): { [key: string]: aws.cloudwatch.MetricAlarm } {
    
    const alarms: { [key: string]: aws.cloudwatch.MetricAlarm } = {};

    // SNS Topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(`${config.environment}-alarms`, {
      name: `${config.environment}-infrastructure-alarms`,
      tags: {
        ...tags,
        Name: `${config.environment}-infrastructure-alarms`,
        Type: "SNSTopic",
      },
    }, opts);

    // Subscribe email to SNS topic
    new aws.sns.TopicSubscription(`${config.environment}-alarm-email`, {
      topicArn: alarmTopic.arn,
      protocol: "email",
      endpoint: config.monitoringEmail,
    }, opts);

    // High CPU utilization alarm
    alarms.highCpuUtilization = new aws.cloudwatch.MetricAlarm(`${config.environment}-high-cpu`, {
      name: `${config.environment}-high-cpu-utilization`,
      description: "Alarm when CPU exceeds 80%",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: "GreaterThanThreshold",
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      tags: {
        ...tags,
        Name: `${config.environment}-high-cpu-alarm`,
        Type: "CloudWatchAlarm",
      },
    }, opts);

    // High memory utilization alarm
    alarms.highMemoryUtilization = new aws.cloudwatch.MetricAlarm(`${config.environment}-high-memory`, {
      name: `${config.environment}-high-memory-utilization`,
      description: "Alarm when memory exceeds 85%",
      metricName: "MemoryUtilization",
      namespace: "CWAgent",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 85,
      comparisonOperator: "GreaterThanThreshold",
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      tags: {
        ...tags,
        Name: `${config.environment}-high-memory-alarm`,
        Type: "CloudWatchAlarm",
      },
    }, opts);

    // Application error rate alarm
    alarms.applicationErrors = new aws.cloudwatch.MetricAlarm(`${config.environment}-app-errors`, {
      name: `${config.environment}-application-errors`,
      description: "Alarm when application error rate exceeds 5%",
      metricName: "ErrorRate",
      namespace: "AWS/ApplicationELB",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 5,
      comparisonOperator: "GreaterThanThreshold",
      treatMissingData: "notBreaching",
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      tags: {
        ...tags,
        Name: `${config.environment}-app-errors-alarm`,
        Type: "CloudWatchAlarm",
      },
    }, opts);

    return alarms;
  }

  private createConfigRules(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): { [key: string]: aws.cfg.ConfigRule } {
    
    const configRules: { [key: string]: aws.cfg.ConfigRule } = {};

    // Configuration Recorder (required for Config Rules)
    const configBucket = new aws.s3.Bucket(`${config.environment}-config-bucket`, {
      bucket: `${config.environment}-aws-config-${config.accountId}-${config.region}`,
      forceDestroy: config.environment !== "prod", // Only allow force destroy in non-prod
      tags: {
        ...tags,
        Name: `${config.environment}-config-bucket`,
        Type: "S3Bucket",
      },
    }, opts);

    const configRole = new aws.iam.Role(`${config.environment}-config-role`, {
      name: `${config.environment}-config-service-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Principal: { Service: "config.amazonaws.com" },
          Effect: "Allow",
        }],
      }),
      tags: {
        ...tags,
        Name: `${config.environment}-config-service-role`,
        Type: "IAMRole",
      },
    }, opts);

    new aws.iam.RolePolicyAttachment(`${config.environment}-config-policy`, {
      role: configRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/ConfigRole",
    }, opts);

    const configDeliveryChannel = new aws.cfg.DeliveryChannel(`${config.environment}-config-delivery`, {
      name: `${config.environment}-config-delivery-channel`,
      s3BucketName: configBucket.bucket,
    }, opts);

    const configRecorder = new aws.cfg.ConfigurationRecorder(`${config.environment}-config-recorder`, {
      name: `${config.environment}-config-recorder`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    }, { ...opts, dependsOn: [configDeliveryChannel] });

    // Security Group SSH Rule
    configRules.sshRestricted = new aws.cfg.ConfigRule(`${config.environment}-ssh-restricted`, {
      name: `${config.environment}-ssh-restricted`,
      description: "Checks whether security groups disallow unrestricted incoming SSH traffic",
      source: {
        owner: "AWS",
        sourceIdentifier: "INCOMING_SSH_DISABLED",
      },
      tags: {
        ...tags,
        Name: `${config.environment}-ssh-restricted-rule`,
        Type: "ConfigRule",
      },
    }, { ...opts, dependsOn: [configRecorder] });

    // Root access key check
    configRules.rootAccessKeyCheck = new aws.cfg.ConfigRule(`${config.environment}-root-access-key`, {
      name: `${config.environment}-root-access-key-check`,
      description: "Checks whether the root user access key is available",
      source: {
        owner: "AWS",
        sourceIdentifier: "ROOT_ACCESS_KEY_CHECK",
      },
      tags: {
        ...tags,
        Name: `${config.environment}-root-access-key-rule`,
        Type: "ConfigRule",
      },
    }, { ...opts, dependsOn: [configRecorder] });

    // S3 bucket public access prohibited
    configRules.s3BucketPublicAccessProhibited = new aws.cfg.ConfigRule(`${config.environment}-s3-public-access`, {
      name: `${config.environment}-s3-bucket-public-access-prohibited`,
      description: "Checks that S3 buckets do not allow public access",
      source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED",
      },
      tags: {
        ...tags,
        Name: `${config.environment}-s3-public-access-rule`,
        Type: "ConfigRule",
      },
    }, { ...opts, dependsOn: [configRecorder] });

    return configRules;
  }

  private createCloudTrail(
    config: TapStackConfig, 
    tags: Record<string, string>, 
    opts: pulumi.ComponentResourceOptions
  ): aws.cloudtrail.Trail {
    
    // S3 bucket for CloudTrail logs
    const cloudTrailBucket = new aws.s3.Bucket(`${config.environment}-cloudtrail-bucket`, {
      bucket: `${config.environment}-cloudtrail-${config.accountId}-${config.region}`,
      forceDestroy: config.environment !== "prod",
      tags: {
        ...tags,
        Name: `${config.environment}-cloudtrail-bucket`,
        Type: "S3Bucket",
      },
    }, opts);

    // Bucket policy for CloudTrail
    const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(`${config.environment}-cloudtrail-bucket-policy`, {
      bucket: cloudTrailBucket.id,
      policy: pulumi.all([cloudTrailBucket.arn, config.accountId]).apply(([bucketArn, accountId]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "AWSCloudTrailAclCheck",
              Effect: "Allow",
              Principal: { Service: "cloudtrail.amazonaws.com" },
              Action: "s3:GetBucketAcl",
              Resource: bucketArn,
            },
            {
              Sid: "AWSCloudTrailWrite",
              Effect: "Allow",
              Principal: { Service: "cloudtrail.amazonaws.com" },
              Action: "s3:PutObject",
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  "s3:x-amz-acl": "bucket-owner-full-control",
                },
              },
            },
          ],
        })
      ),
    }, opts);

    return new aws.cloudtrail.Trail(`${config.environment}-cloudtrail`, {
      name: `${config.environment}-cloudtrail`,
      s3BucketName: cloudTrailBucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      eventSelectors: [{
        readWriteType: "All",
        includeManagementEvents: true,
        dataResources: [{
          type: "AWS::S3::Object",
          values: ["arn:aws:s3:::*/*"],
        }],
      }],
      tags: {
        ...tags,
        Name: `${config.environment}-cloudtrail`,
        Type: "CloudTrail",
      },
    }, { ...opts, dependsOn: [cloudTrailBucketPolicy] });
  }

  private createOutputs(): { [key: string]: pulumi.Output<string> } {
    return {
      vpcId: this.vpc.vpcId,
      vpcCidr: pulumi.output(this.vpc.vpc.cidrBlock),
      publicSubnetIds: pulumi.output(this.vpc.publicSubnetIds).apply(ids => ids.join(",")),
      privateSubnetIds: pulumi.output(this.vpc.privateSubnetIds).apply(ids => ids.join(",")),
      isolatedSubnetIds: pulumi.output(this.vpc.isolatedSubnetIds).apply(ids => ids.join(",")),
      albSecurityGroupId: this.securityGroups.alb.id,
      appSecurityGroupId: this.securityGroups.app.id,
      databaseSecurityGroupId: this.securityGroups.database.id,
      ec2RoleArn: this.iamRoles.ec2Instance.arn,
      lambdaRoleArn: this.iamRoles.lambdaExecution.arn,
    };
  }
}

// Export factory function for easy instantiation
export function createTapStack(name: string, config: TapStackConfig): TapStack {
  return new TapStack(name, config);
}
```

## 2. Unit Tests

**test/tap-stack.unit.test.ts**

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack, TapStackConfig } from "../lib/tap-stack";

// Mock Pulumi for unit testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : `${args.type}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe("TapStack Unit Tests", () => {
  let stack: TapStack;
  let config: TapStackConfig;

  beforeEach(() => {
    config = {
      environment: "test",
      region: "us-east-1",
      accountId: "123456789012",
      vpcCidr: "10.0.0.0/16",
      availabilityZones: ["us-east-1a", "us-east-1b"],
      enableCloudTrail: true,
      enableConfig: true,
      monitoringEmail: "test@example.com",
      tags: {
        Owner: "TestTeam",
        CostCenter: "Engineering",
      },
    };
  });

  afterEach(() => {
    // Clean up any resources if needed
  });

  describe("Stack Initialization", () => {
    it("should create a TapStack with valid configuration", () => {
      expect(() => {
        stack = new TapStack("test-stack", config);
      }).not.toThrow();
    });

    it("should apply correct tags to resources", async () => {
      stack = new TapStack("test-stack", config);
      
      // Test that VPC has correct tags
      const vpcTags = await stack.vpc.vpc.tags;
      expect(vpcTags).toMatchObject({
        Environment: "test",
        Project: "IaC-AWS-Nova-Model-Breaking",
        ManagedBy: "Pulumi",
        Region: "us-east-1",
        Owner: "TestTeam",
        CostCenter: "Engineering",
        Name: "test-vpc",
        Type: "VPC",
      });
    });

    it("should create all required security groups", () => {
      stack = new TapStack("test-stack", config);
      
      expect(stack.securityGroups).toHaveProperty("alb");
      expect(stack.securityGroups).toHaveProperty("app");
      expect(stack.securityGroups).toHaveProperty("database");
    });

    it("should create all required IAM roles", () => {
      stack = new TapStack("test-stack", config);
      
      expect(stack.iamRoles).toHaveProperty("ec2Instance");
      expect(stack.iamRoles).toHaveProperty("lambdaExecution");
    });

    it("should create parameter store entries", () => {
      stack = new TapStack("test-stack", config);
      
      expect(stack.parameterStore).toHaveProperty("environment");
      expect(stack.parameterStore).toHaveProperty("vpcId");
      expect(stack.parameterStore).toHaveProperty("dbConnectionString");
      expect(stack.parameterStore).toHaveProperty("appConfig");
    });

    it("should create CloudWatch alarms", () => {
      stack = new TapStack("test-stack", config);
      
      expect(stack.cloudWatchAlarms).toHaveProperty("highCpuUtilization");
      expect(stack.cloudWatchAlarms).toHaveProperty("highMemoryUtilization");
      expect(stack.cloudWatchAlarms).toHaveProperty("applicationErrors");
    });
  });

  describe("Configuration Validation", () => {
    it("should handle different environments correctly", () => {
      const prodConfig = { ...config, environment: "prod" };
      const prodStack = new TapStack("prod-stack", prodConfig);
      
      expect(prodStack).toBeDefined();
      // In production, we should have more NAT gateways
      // This would be tested in integration tests with actual resources
    });

    it("should handle optional CloudTrail configuration", () => {
      const configWithoutCloudTrail = { ...config, enableCloudTrail: false };
      const stackWithoutCloudTrail = new TapStack("stack-no-cloudtrail", configWithoutCloudTrail);
      
      expect(stackWithoutCloudTrail.cloudTrail).toBeUndefined();
    });

    it("should handle optional Config rules configuration", () => {
      const configWithoutConfigRules = { ...config, enableConfig: false };
      const stackWithoutConfigRules = new TapStack("stack-no-config", configWithoutConfigRules);
      
      expect(Object.keys(stackWithoutConfigRules.configRules)).toHaveLength(0);
    });

    it("should validate required configuration parameters", () => {
      expect(() => {
        new TapStack("invalid-stack", {} as TapStackConfig);
      }).toThrow();
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", config);
    });

    it("should create security groups that reference the V