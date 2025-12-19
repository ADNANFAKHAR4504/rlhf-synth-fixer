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

    // Get account ID for unique naming
    const accountData = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'account'
    );

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

    // Create S3 bucket for CloudTrail and Config with unique name
    const bucket = new aws.s3Bucket.S3Bucket(this, 'security-bucket', {
      bucket: `security-logs-${tags['Environment'] || 'dev'}-${accountData.accountId}`,
      forceDestroy: false, // Prevent accidental deletion
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

    // Bucket policy for CloudTrail - with explicit dependencies
    const bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(
      this,
      'cloudtrail-bucket-policy',
      {
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
        dependsOn: [bucket], // Explicit dependency
      }
    );

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
      dependsOn: [bucketPolicy], // CloudTrail depends on bucket policy
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
