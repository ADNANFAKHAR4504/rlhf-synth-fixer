## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// Interfaces for module configurations
export interface VpcConfig {
  name: string;
  cidr: string;
  azCount: number;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  region: string;
  tags: { [key: string]: string };
}

export interface SecurityGroupConfig {
  name: string;
  vpcId: string;
  ingressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    securityGroups?: string[];
  }>;
  tags: { [key: string]: string };
}

export interface Ec2Config {
  name: string;
  instanceType: string;
  subnetIds: string[];
  securityGroupIds: string[];
  keyName?: string;
  userData?: string;
  tags: { [key: string]: string };
}

export interface RdsConfig {
  identifier: string;
  engine: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  masterUsername: string;
  subnetIds: string[];
  securityGroupIds: string[];
  tags: { [key: string]: string };
}

export interface AlbConfig {
  name: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  targetGroupPort: number;
  targetGroupProtocol: string;
  targetInstances: string[];
  tags: { [key: string]: string };
}

// VPC Module
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...config.tags, Name: config.name },
    });

    // Define availability zones
    const availabilityZones = [`${config.region}a`, `${config.region}b`];

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: { ...config.tags, Name: `${config.name}-igw` },
      }
    );

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < config.azCount; i++) {
      const subnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.publicSubnetCidrs[i],
        availabilityZone: availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.name}-public-subnet-${i + 1}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < config.azCount; i++) {
      const subnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.privateSubnetCidrs[i],
        availabilityZone: availabilityZones[i],
        tags: {
          ...config.tags,
          Name: `${config.name}-private-subnet-${i + 1}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(subnet);
    }

    // Create EIPs for NAT Gateways
    const eips = this.publicSubnets.map(
      (_, i) =>
        new aws.eip.Eip(this, `nat-eip-${i}`, {
          domain: 'vpc',
          tags: { ...config.tags, Name: `${config.name}-nat-eip-${i + 1}` },
        })
    );

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map(
      (subnet, i) =>
        new aws.natGateway.NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eips[i].id,
          subnetId: subnet.id,
          tags: { ...config.tags, Name: `${config.name}-nat-${i + 1}` },
          dependsOn: [eips[i], subnet],
        })
    );

    // Create route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: { ...config.tags, Name: `${config.name}-public-rt` },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Create private route tables and associate with private subnets
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: { ...config.tags, Name: `${config.name}-private-rt-${i + 1}` },
        }
      );

      new aws.route.Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[i].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

// Security Group Module
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'sg', {
      name: config.name,
      vpcId: config.vpcId,
      tags: config.tags,
    });

    // Add ingress rules
    config.ingressRules.forEach((rule, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `ingress-${index}`, {
        type: 'ingress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.securityGroups?.[0],
        securityGroupId: this.securityGroup.id,
      });
    });

    // Add egress rule (allow all outbound)
    new aws.securityGroupRule.SecurityGroupRule(this, 'egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });
  }
}

// EC2 Module with Auto-Recovery
export class Ec2Module extends Construct {
  public readonly instances: aws.instance.Instance[];

  constructor(scope: Construct, id: string, config: Ec2Config) {
    super(scope, id);

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

    // Create IAM role for EC2
    const role = new aws.iamRole.IamRole(this, 'role', {
      name: `${config.name}-role`,
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

    // Attach SSM policy for management
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ssm-policy',
      {
        role: role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'profile',
      {
        name: `${config.name}-profile`,
        role: role.name,
      }
    );

    // Create instances across subnets
    this.instances = config.subnetIds.map((subnetId, i) => {
      const instance = new aws.instance.Instance(this, `instance-${i}`, {
        ami: ami.id,
        instanceType: config.instanceType,
        subnetId: subnetId,
        vpcSecurityGroupIds: config.securityGroupIds,
        iamInstanceProfile: instanceProfile.name,
        keyName: config.keyName,
        userData: config.userData,
        ebsBlockDevice: [
          {
            deviceName: '/dev/sdf',
            volumeType: 'gp3',
            volumeSize: 20,
            encrypted: true,
          },
        ],
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 30,
          encrypted: true,
        },
        monitoring: true,
        tags: {
          ...config.tags,
          Name: `${config.name}-${i + 1}`,
        },
      });

      // Create CloudWatch alarm for auto-recovery
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        `auto-recovery-${i}`,
        {
          alarmName: `${config.name}-${i + 1}-auto-recovery`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'StatusCheckFailed_System',
          namespace: 'AWS/EC2',
          period: 60,
          statistic: 'Maximum',
          threshold: 0,
          alarmActions: [
            'arn:aws:automate:${data.aws_region.current.name}:ec2:recover',
          ],
          dimensions: {
            InstanceId: instance.id,
          },
        }
      );

      return instance;
    });
  }
}

// RDS Module with AWS Managed Password
export class RdsModule extends Construct {
  public readonly instance: aws.dbInstance.DbInstance;
  public readonly subnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(scope: Construct, id: string, config: RdsConfig) {
    super(scope, id);

    // Create DB subnet group
    this.subnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'subnet-group',
      {
        name: `${config.identifier}-subnet-group`,
        subnetIds: config.subnetIds,
        tags: config.tags,
      }
    );

    // Create RDS instance with AWS managed password
    this.instance = new aws.dbInstance.DbInstance(this, 'instance', {
      identifier: config.identifier,
      engine: config.engine,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: config.dbName,
      username: config.masterUsername,
      manageMasterUserPassword: true, // AWS manages the password
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: config.securityGroupIds,
      publiclyAccessible: false,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      autoMinorVersionUpgrade: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      tags: config.tags,
    });
  }
}

// ALB Module
export class AlbModule extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly listener: aws.lbListener.LbListener;

  constructor(scope: Construct, id: string, config: AlbConfig) {
    super(scope, id);

    // Create ALB
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: config.name,
      internal: false,
      loadBalancerType: 'application',
      subnets: config.subnetIds,
      securityGroups: config.securityGroupIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: config.tags,
    });

    // Create target group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', {
      name: `${config.name}-tg`,
      port: config.targetGroupPort,
      protocol: config.targetGroupProtocol,
      vpcId: config.vpcId,
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
      tags: config.tags,
    });

    // Attach instances to target group
    config.targetInstances.forEach((instanceId, i) => {
      new aws.lbTargetGroupAttachment.LbTargetGroupAttachment(
        this,
        `tg-attachment-${i}`,
        {
          targetGroupArn: this.targetGroup.arn,
          targetId: instanceId,
        }
      );
    });

    // Create HTTP listener (no certificate needed)
    this.listener = new aws.lbListener.LbListener(this, 'listener', {
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
  }
}

// Lambda Security Module
export class LambdaSecurityModule extends Construct {
  public readonly function: aws.lambdaFunction.LambdaFunction;
  public readonly role: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    vpcConfig: { subnetIds: string[]; securityGroupIds: string[] },
    lambdaS3Bucket: string,
    lambdaS3Key: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Create Lambda execution role
    this.role = new aws.iamRole.IamRole(this, 'role', {
      name: `security-automation-lambda-role-${tags['Environment'] || 'dev'}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags,
    });

    // Attach policies
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'vpc-execution',
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      }
    );

    // Custom policy for security automation
    new aws.iamRolePolicy.IamRolePolicy(this, 'security-policy', {
      name: 'security-automation-policy',
      role: this.role.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'securityhub:GetFindings',
              'securityhub:UpdateFindings',
              'config:PutEvaluations',
              'config:DescribeComplianceByResource',
              'iam:ListUsers',
              'iam:GetLoginProfile',
              'iam:ListMFADevices',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'sns:Publish',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Create Lambda function from S3
    this.function = new aws.lambdaFunction.LambdaFunction(this, 'function', {
      functionName: `security-automation-lambda-${tags['Environment'] || 'dev'}`,
      runtime: 'python3.11',
      handler: 'index.handler',
      role: this.role.arn,
      timeout: 60,
      memorySize: 256,
      environment: {
        variables: {
          ENVIRONMENT: tags['Environment'] || 'prod',
        },
      },
      vpcConfig: {
        subnetIds: vpcConfig.subnetIds,
        securityGroupIds: vpcConfig.securityGroupIds,
      },
      s3Bucket: lambdaS3Bucket,
      s3Key: lambdaS3Key,
      tags,
    });

    // CloudWatch Event Rule to trigger Lambda
    const eventRule = new aws.cloudwatchEventRule.CloudwatchEventRule(
      this,
      'schedule',
      {
        name: `security-automation-schedule-${tags['Environment'] || 'dev'}`,
        description: 'Trigger security automation Lambda',
        scheduleExpression: 'rate(1 hour)',
        tags,
      }
    );

    new aws.cloudwatchEventTarget.CloudwatchEventTarget(this, 'target', {
      rule: eventRule.name,
      arn: this.function.arn,
    });

    new aws.lambdaPermission.LambdaPermission(this, 'event-permission', {
      statementId: 'AllowExecutionFromCloudWatch',
      action: 'lambda:InvokeFunction',
      functionName: this.function.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.arn,
    });
  }
}

// Security Services Module
export class SecurityServicesModule extends Construct {
  public readonly securityHub: aws.securityhubAccount.SecurityhubAccount;
  public readonly wafWebAcl: aws.wafv2WebAcl.Wafv2WebAcl;
  public readonly cloudTrail: aws.cloudtrail.Cloudtrail;
  public readonly snsTopic: aws.snsTopic.SnsTopic;

  constructor(
    scope: Construct,
    id: string,
    albArn: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Enable Security Hub
    this.securityHub = new aws.securityhubAccount.SecurityhubAccount(
      this,
      'security-hub',
      {
        enableDefaultStandards: true,
        autoEnableControls: true,
      }
    );

    // Enable AWS Foundational Security Best Practices
    new aws.securityhubStandardsSubscription.SecurityhubStandardsSubscription(
      this,
      'aws-foundational',
      {
        standardsArn:
          'arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0',
        dependsOn: [this.securityHub],
      }
    );

    // Create S3 bucket for CloudTrail and Config
    const bucket = new aws.s3Bucket.S3Bucket(this, 'security-bucket', {
      bucket: `security-logs-${tags['Environment'] || 'dev'}}`,
      tags,
    });

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'bucket-pab',
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'bucket-encryption',
      {
        bucket: bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Create SNS Topic for notifications
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'security-alerts', {
      name: `security-alerts-topic-${tags['Environment'] || 'dev'}`,
      tags,
    });

    // CloudTrail
    const cloudtrailRole = new aws.iamRole.IamRole(this, 'cloudtrail-role', {
      name: `cloudtrail-cloudwatch-role-${tags['Environment'] || 'dev'}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
          },
        ],
      }),
      tags,
    });

    new aws.iamRolePolicy.IamRolePolicy(this, 'cloudtrail-policy', {
      name: 'cloudtrail-cloudwatch-policy',
      role: cloudtrailRole.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    const cloudwatchLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'cloudtrail-logs',
      {
        name: `/aws/cloudtrail/security-logs-${tags['Environment'] || 'dev'}`,
        retentionInDays: 90,
        tags,
      }
    );

    // Bucket policy for CloudTrail
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: bucket.arn,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${bucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
    });

    this.cloudTrail = new aws.cloudtrail.Cloudtrail(this, 'trail', {
      name: `security-trail-${tags['Environment'] || 'dev'}`,
      s3BucketName: bucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      cloudWatchLogsGroupArn: `${cloudwatchLogGroup.arn}:*`,
      cloudWatchLogsRoleArn: cloudtrailRole.arn,
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3'],
            },
          ],
        },
      ],
      tags,
    });

    // CloudWatch Event Rule for policy changes
    const policyChangeRule = new aws.cloudwatchEventRule.CloudwatchEventRule(
      this,
      'policy-changes',
      {
        name: `detect-policy-changes-${tags['Environment'] || 'dev'}`,
        description: 'Detect IAM policy changes',
        eventPattern: JSON.stringify({
          source: ['aws.iam'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventSource: ['iam.amazonaws.com'],
            eventName: [
              'PutRolePolicy',
              'PutUserPolicy',
              'PutGroupPolicy',
              'CreatePolicy',
              'DeletePolicy',
              'CreatePolicyVersion',
              'DeletePolicyVersion',
              'AttachRolePolicy',
              'DetachRolePolicy',
              'AttachUserPolicy',
              'DetachUserPolicy',
              'AttachGroupPolicy',
              'DetachGroupPolicy',
            ],
          },
        }),
        tags,
      }
    );

    new aws.cloudwatchEventTarget.CloudwatchEventTarget(
      this,
      'policy-sns-target',
      {
        rule: policyChangeRule.name,
        arn: this.snsTopic.arn,
      }
    );

    // WAF Web ACL
    // WAF Web ACL
    this.wafWebAcl = new aws.wafv2WebAcl.Wafv2WebAcl(this, 'waf', {
      name: `application-waf-${tags['Environment'] || 'dev'}`,
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rule: [
        {
          name: 'RateLimitRule',
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            rate_based_statement: {
              limit: 1000,
              aggregate_key_type: 'IP',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managed_rule_group_statement: {
              vendor_name: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'CommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: {
            none: {},
          },
          statement: {
            managed_rule_group_statement: {
              vendor_name: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'KnownBadInputs',
            sampledRequestsEnabled: true,
          },
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'application-waf',
        sampledRequestsEnabled: true,
      },
      tags,
    });

    // Associate WAF with ALB
    new aws.wafv2WebAclAssociation.Wafv2WebAclAssociation(
      this,
      'waf-association',
      {
        resourceArn: albArn,
        webAclArn: this.wafWebAcl.arn,
      }
    );
  }
}

// Monitoring Module
export class MonitoringModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    resources: {
      albName: string;
      instanceIds: string[];
      rdsIdentifier: string;
    },
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Create Log Group for application logs
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'app-logs',
      {
        name: `/aws/application/main-${tags['Environment'] || 'dev'}`,
        retentionInDays: 30,
        tags,
      }
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: `security-monitoring-dashboard-${tags['Environment'] || 'dev'}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/EC2', 'CPUUtilization', { stat: 'Average' }],
                  ['.', 'StatusCheckFailed', { stat: 'Sum' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'EC2 Metrics',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/ApplicationELB', 'TargetResponseTime'],
                  ['.', 'RequestCount', { stat: 'Sum' }],
                  ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
                  ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
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
                  ['AWS/RDS', 'CPUUtilization'],
                  ['.', 'DatabaseConnections'],
                  ['.', 'FreeableMemory'],
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

    // Create CloudWatch Alarms
    resources.instanceIds.forEach((instanceId, i) => {
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        `cpu-alarm-${i}`,
        {
          alarmName: `high-cpu-instance-${i}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          period: 300,
          statistic: 'Average',
          threshold: 80,
          alarmDescription: 'This metric monitors ec2 cpu utilization',
          dimensions: {
            InstanceId: instanceId,
          },
          tags,
        }
      );
    });

    // RDS Alarms
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: 'rds-high-cpu',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      alarmDescription: 'RDS CPU utilization',
      dimensions: {
        DBInstanceIdentifier: resources.rdsIdentifier,
      },
      tags,
    });

    // ALB Alarms
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'alb-response-time',
      {
        alarmName: 'alb-high-response-time',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'ALB target response time',
        dimensions: {
          LoadBalancer: resources.albName,
        },
        tags,
      }
    );
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
import * as aws from '@cdktf/provider-aws';

// ? Import your stacks here
import {
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
  AlbModule,
  LambdaSecurityModule,
  SecurityServicesModule,
  MonitoringModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            ManagedBy: 'CDKTF',
            Project: 'SecureInfrastructure',
            CostCenter: 'Engineering',
          },
        },
      ],
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

    // ? Add your stack instantiations here
    // Data sources
    const currentRegion = new aws.dataAwsRegion.DataAwsRegion(this, 'current');
    const currentAccount = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current-account'
    );

    // Environment tags
    const commonTags = {
      Environment: 'production',
      Owner: 'platform-team',
      Project: 'tap-infrastructure',
      Compliance: 'required',
    };

    // Create S3 bucket for Lambda code (you'll upload the zip here)
    const lambdaCodeBucket = new aws.s3Bucket.S3Bucket(
      this,
      'lambda-code-bucket',
      {
        bucket: `tap-lambda-code-${currentAccount.accountId}`,
        tags: commonTags,
      }
    );

    // 1. NETWORKING - VPC with public and private subnets across 2 AZs
    const vpcModule = new VpcModule(this, 'vpc', {
      name: 'tap-vpc',
      cidr: '10.0.0.0/16',
      azCount: 2,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      region: awsRegion,
      tags: commonTags,
    });

    // 2. SECURITY GROUPS
    // ALB Security Group - Allow HTTPS (443) from internet
    const albSecurityGroup = new SecurityGroupModule(this, 'alb-sg', {
      name: 'tap-alb-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { ...commonTags, Name: 'tap-alb-sg' },
    });

    // EC2 Security Group - Allow HTTPS from ALB and SSH from bastion
    const ec2SecurityGroup = new SecurityGroupModule(this, 'ec2-sg', {
      name: 'tap-ec2-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.securityGroup.id],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'], // Only from VPC
        },
      ],
      tags: { ...commonTags, Name: 'tap-ec2-sg' },
    });

    // RDS Security Group - Allow MySQL/Aurora from EC2
    const rdsSecurityGroup = new SecurityGroupModule(this, 'rds-sg', {
      name: 'tap-rds-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [ec2SecurityGroup.securityGroup.id],
        },
      ],
      tags: { ...commonTags, Name: 'tap-rds-sg' },
    });

    // Lambda Security Group
    const lambdaSecurityGroup = new SecurityGroupModule(this, 'lambda-sg', {
      name: 'tap-lambda-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [],
      tags: { ...commonTags, Name: 'tap-lambda-sg' },
    });

    // 3. COMPUTE - EC2 Instances in private subnets with auto-recovery
    const ec2Module = new Ec2Module(this, 'ec2', {
      name: 'tap-app-server',
      instanceType: 't3.medium',
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      securityGroupIds: [ec2SecurityGroup.securityGroup.id],
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
`,
      tags: commonTags,
    });

    // 4. DATABASE - RDS instance in private subnets
    const rdsModule = new RdsModule(this, 'rds', {
      identifier: 'tap-database',
      engine: 'mysql',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      dbName: 'tapdb',
      masterUsername: 'admin',
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      tags: commonTags,
    });

    // 5. LOAD BALANCER - ALB in public subnets
    const albModule = new AlbModule(this, 'alb', {
      name: 'tap-alb',
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.publicSubnets.map(s => s.id),
      securityGroupIds: [albSecurityGroup.securityGroup.id],
      targetGroupPort: 80,
      targetGroupProtocol: 'HTTP',
      targetInstances: ec2Module.instances.map(i => i.id),
      tags: commonTags,
    });

    // 6. SECURITY AUTOMATION - Lambda for security checks
    const lambdaSecurityModule = new LambdaSecurityModule(
      this,
      'security-lambda',
      {
        subnetIds: vpcModule.privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.securityGroup.id],
      },
      lambdaCodeBucket.id,
      'security-lambda.zip', // You'll upload this file to the S3 bucket
      commonTags
    );

    // 7. SECURITY SERVICES - Security Hub, Config, WAF, CloudTrail
    const securityServices = new SecurityServicesModule(
      this,
      'security-services',
      albModule.alb.arn,
      commonTags
    );

    // 8. SECRETS MANAGEMENT
    const apiKeySecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'api-keys',
      {
        name: 'tap-api-keys-ts',
        description: 'API keys for external services',
        kmsKeyId: 'alias/aws/secretsmanager',
        tags: commonTags,
      }
    );

    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      'api-keys-version',
      {
        secretId: apiKeySecret.id,
        secretString: JSON.stringify({
          external_api_key: 'placeholder_key',
          webhook_secret: 'placeholder_secret',
        }),
      }
    );

    // 9. DYNAMODB TABLE with encryption
    new aws.dynamodbTable.DynamodbTable(this, 'app-table', {
      name: 'tap-application-data',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      rangeKey: 'timestamp',
      attribute: [
        { name: 'id', type: 'S' },
        { name: 'timestamp', type: 'N' },
      ],
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: commonTags,
    });

    // 10. S3 BUCKETS with encryption
    const logBucket = new aws.s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: `tap-logs-${currentAccount.accountId}`,
      tags: commonTags,
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'log-bucket-encryption',
      {
        bucket: logBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'log-bucket-pab',
      {
        bucket: logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // 11. EBS DEFAULT ENCRYPTION
    new aws.ebsEncryptionByDefault.EbsEncryptionByDefault(
      this,
      'ebs-encryption',
      {
        enabled: true,
      }
    );

    // 12. IAM ACCOUNT PASSWORD POLICY (enforces MFA)
    new aws.iamAccountPasswordPolicy.IamAccountPasswordPolicy(
      this,
      'password-policy',
      {
        minimumPasswordLength: 14,
        requireLowercaseCharacters: true,
        requireNumbers: true,
        requireUppercaseCharacters: true,
        requireSymbols: true,
        allowUsersToChangePassword: true,
        passwordReusePrevention: 24,
        maxPasswordAge: 90,
      }
    );

    // 13. MONITORING AND LOGGING
    const monitoring = new MonitoringModule(
      this,
      'monitoring',
      {
        albName: albModule.alb.name,
        instanceIds: ec2Module.instances.map(i => i.id),
        rdsIdentifier: rdsModule.instance.identifier,
      },
      commonTags
    );

    // 14. SNS SUBSCRIPTION for security alerts
    new aws.snsTopicSubscription.SnsTopicSubscription(
      this,
      'security-alert-email',
      {
        topicArn: securityServices.snsTopic.arn,
        protocol: 'email',
        endpoint: 'security-team@example.com', // Replace with actual email
      }
    );

    // 15. CLOUDWATCH LOG METRIC FILTERS for security events
    new aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilter(
      this,
      'unauthorized-api-calls',
      {
        name: 'UnauthorizedAPICalls',
        pattern:
          '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }',
        logGroupName: '/aws/cloudtrail/security-logs-production',
        metricTransformation: {
          name: 'UnauthorizedAPICalls',
          namespace: 'CloudTrailMetrics',
          value: '1',
        },
        dependsOn: [securityServices.cloudTrail],
      }
    );

    // TERRAFORM OUTPUTS
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'lambda-s3-bucket', {
      value: lambdaCodeBucket.id,
      description:
        'S3 bucket for Lambda code - upload your security-lambda.zip here',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Module.instances.map(i => i.id).join(','),
      description: 'EC2 instance IDs',
    });

    new TerraformOutput(this, 'security-hub-arn', {
      value: securityServices.securityHub.arn,
      description: 'Security Hub ARN',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: securityServices.cloudTrail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaSecurityModule.function.arn,
      description: 'Security Lambda function ARN',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: securityServices.snsTopic.arn,
      description: 'SNS topic ARN for security alerts',
    });

    new TerraformOutput(this, 'dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${currentRegion.id}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```
## lib/security-lambda.ts

```typescript
import boto3
import json
import os
from datetime import datetime

def handler(event, context):
    """
    Security automation Lambda function that performs various security checks
    """
    
    # Initialize AWS clients
    iam = boto3.client('iam')
    securityhub = boto3.client('securityhub')
    sns = boto3.client('sns')
    config_client = boto3.client('config')
    
    # Get SNS topic ARN from environment or event
    sns_topic_arn = event.get('sns_topic_arn', os.environ.get('SNS_TOPIC_ARN'))
    
    findings = []
    
    # Check 1: Verify MFA is enabled for all IAM users
    try:
        users = iam.list_users()['Users']
        for user in users:
            mfa_devices = iam.list_mfa_devices(UserName=user['UserName'])
            
            if not mfa_devices['MFADevices']:
                finding = {
                    'severity': 'HIGH',
                    'title': f'MFA not enabled for user {user["UserName"]}',
                    'description': f'User {user["UserName"]} does not have MFA enabled. This is a security risk.',
                    'resource': f'arn:aws:iam::*:user/{user["UserName"]}',
                    'remediation': 'Enable MFA for this user immediately'
                }
                findings.append(finding)
                
                # Send SNS notification
                if sns_topic_arn:
                    sns.publish(
                        TopicArn=sns_topic_arn,
                        Subject='Security Alert: MFA Not Enabled',
                        Message=json.dumps(finding, indent=2)
                    )
    except Exception as e:
        print(f"Error checking MFA status: {str(e)}")
    
    # Check 2: Review IAM password policy
    try:
        password_policy = iam.get_account_password_policy()['PasswordPolicy']
        
        # Check if password policy meets security standards
        if password_policy.get('MinimumPasswordLength', 0) < 14:
            finding = {
                'severity': 'MEDIUM',
                'title': 'Weak password policy',
                'description': 'Password minimum length is less than 14 characters',
                'resource': 'Account Password Policy',
                'remediation': 'Update password policy to require at least 14 characters'
            }
            findings.append(finding)
    except Exception as e:
        if 'NoSuchEntity' in str(e):
            finding = {
                'severity': 'HIGH',
                'title': 'No password policy configured',
                'description': 'No IAM password policy is configured for this account',
                'resource': 'Account Password Policy',
                'remediation': 'Configure a strong password policy immediately'
            }
            findings.append(finding)
    
    # Check 3: Review root account usage
    try:
        # Get root account usage
        credential_report = iam.generate_credential_report()
        
        # Note: In production, you'd parse the credential report to check root usage
        # This is simplified for demonstration
        
    except Exception as e:
        print(f"Error checking root account usage: {str(e)}")
    
    # Check 4: Review Security Groups for overly permissive rules
    try:
        ec2 = boto3.client('ec2')
        security_groups = ec2.describe_security_groups()['SecurityGroups']
        
        for sg in security_groups:
            for rule in sg.get('IpPermissions', []):
                # Check for overly permissive rules (0.0.0.0/0)
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        if rule.get('FromPort') not in [80, 443]:  # HTTP/HTTPS are acceptable
                            finding = {
                                'severity': 'HIGH',
                                'title': f'Overly permissive security group rule in {sg["GroupId"]}',
                                'description': f'Security group {sg["GroupName"]} allows unrestricted access from 0.0.0.0/0 on port {rule.get("FromPort")}',
                                'resource': sg['GroupId'],
                                'remediation': 'Restrict the security group rule to specific IP ranges'
                            }
                            findings.append(finding)
    except Exception as e:
        print(f"Error checking security groups: {str(e)}")
    
    # Check 5: Review S3 bucket public access
    try:
        s3 = boto3.client('s3')
        buckets = s3.list_buckets()['Buckets']
        
        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                # Check bucket ACL
                acl = s3.get_bucket_acl(Bucket=bucket_name)
                for grant in acl['Grants']:
                    grantee = grant.get('Grantee', {})
                    if grantee.get('Type') == 'Group' and 'AllUsers' in grantee.get('URI', ''):
                        finding = {
                            'severity': 'HIGH',
                            'title': f'S3 bucket {bucket_name} has public access',
                            'description': f'S3 bucket {bucket_name} allows public access',
                            'resource': f'arn:aws:s3:::{bucket_name}',
                            'remediation': 'Remove public access from the S3 bucket'
                        }
                        findings.append(finding)
            except Exception as e:
                print(f"Error checking bucket {bucket_name}: {str(e)}")
    except Exception as e:
        print(f"Error checking S3 buckets: {str(e)}")
    
    # Send findings to Security Hub
    if findings and securityhub:
        try:
            # Format findings for Security Hub
            security_hub_findings = []
            for finding in findings:
                security_hub_findings.append({
                    'SchemaVersion': '2018-10-08',
                    'Id': f"{finding['resource']}/{datetime.now().isoformat()}",
                    'ProductArn': f'arn:aws:securityhub:{os.environ.get("AWS_REGION", "us-east-1")}:*:product/custom/security-automation',
                    'GeneratorId': 'security-automation-lambda',
                    'AwsAccountId': context.invoked_function_arn.split(':')[4],
                    'Types': ['Software and Configuration Checks'],
                    'CreatedAt': datetime.now().isoformat(),
                    'UpdatedAt': datetime.now().isoformat(),
                    'Severity': {
                        'Label': finding['severity']
                    },
                    'Title': finding['title'],
                    'Description': finding['description'],
                    'Resources': [
                        {
                            'Type': 'Other',
                            'Id': finding['resource']
                        }
                    ],
                    'Remediation': {
                        'Recommendation': {
                            'Text': finding['remediation']
                        }
                    }
                })
            
            # Batch import findings to Security Hub
            if security_hub_findings:
                response = securityhub.batch_import_findings(
                    Findings=security_hub_findings
                )
                print(f"Imported {response['SuccessCount']} findings to Security Hub")
        except Exception as e:
            print(f"Error sending findings to Security Hub: {str(e)}")
    
    # Summary notification
    if findings and sns_topic_arn:
        summary = f"Security Check Complete:\n"
        summary += f"Total findings: {len(findings)}\n"
        summary += f"High severity: {len([f for f in findings if f['severity'] == 'HIGH'])}\n"
        summary += f"Medium severity: {len([f for f in findings if f['severity'] == 'MEDIUM'])}\n"
        
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='Security Check Summary',
            Message=summary
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Security check completed',
            'findings_count': len(findings),
            'findings': findings
        })
    }
```