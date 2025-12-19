**tap-stack.ts**

```typescript
// lib/tap-stack.ts
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import {
  VpcConstruct,
  SubnetConstruct,
  InternetGatewayConstruct,
  NatGatewayConstruct,
  RouteTableConstruct,
  SecurityGroupConstruct,
  IamRoleConstruct,
  ApplicationLoadBalancerConstruct,
  AutoScalingGroupConstruct,
  SqsQueueConstruct,
  LambdaFunctionConstruct,
  CloudWatchAlarmsConstruct,
  SsmParametersConstruct,
  TagConfig
} from './modules';

interface TapStackConfig {
  projectName: string;
  environment: string;
  owner: string;
  region?: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: TapStackConfig) {
    super(scope, name);

    // Validate required inputs
    if (!config.projectName) throw new Error('projectName is required');
    if (!config.environment) throw new Error('environment is required');
    if (!config.owner) throw new Error('owner is required');

    const region = config.region || 'us-east-1';
    const azs = ['us-east-1a', 'us-east-1b'];

    // Standard tags
    const tags: TagConfig = {
      project: config.projectName,
      environment: config.environment,
      owner: config.owner
    };

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: region
    });

    // VPC
    const vpc = new VpcConstruct(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      tags
    });

    // Public Subnets
    const publicSubnet1 = new SubnetConstruct(this, 'public-subnet-1', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: azs[0],
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: `${config.projectName}-public-subnet-1` }
    });

    const publicSubnet2 = new SubnetConstruct(this, 'public-subnet-2', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: azs[1],
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: `${config.projectName}-public-subnet-2` }
    });

    // Private Subnets
    const privateSubnet1 = new SubnetConstruct(this, 'private-subnet-1', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: azs[0],
      mapPublicIpOnLaunch: false,
      tags: { ...tags, Name: `${config.projectName}-private-subnet-1` }
    });

    const privateSubnet2 = new SubnetConstruct(this, 'private-subnet-2', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: azs[1],
      mapPublicIpOnLaunch: false,
      tags: { ...tags, Name: `${config.projectName}-private-subnet-2` }
    });

    // Internet Gateway
    const igw = new InternetGatewayConstruct(this, 'igw', {
      vpcId: vpc.vpcId,
      tags
    });

    // NAT Gateway
    const natGw = new NatGatewayConstruct(this, 'nat-gateway', {
      subnetId: publicSubnet1.subnetId,
      tags
    });

    // Route Tables
    const publicRouteTable = new RouteTableConstruct(this, 'public-route-table', {
      vpcId: vpc.vpcId,
      gatewayId: igw.gatewayId,
      isPublic: true,
      subnetIds: [publicSubnet1.subnetId, publicSubnet2.subnetId],
      tags
    });

    const privateRouteTable = new RouteTableConstruct(this, 'private-route-table', {
      vpcId: vpc.vpcId,
      natGatewayId: natGw.natGatewayId,
      isPublic: false,
      subnetIds: [privateSubnet1.subnetId, privateSubnet2.subnetId],
      tags
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroupConstruct(this, 'alb-sg', {
      name: `${config.projectName}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.vpcId,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere'
        }
      ],
      tags
    });

    const ec2SecurityGroup = new SecurityGroupConstruct(this, 'ec2-sg', {
      name: `${config.projectName}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpc.vpcId,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          sourceSecurityGroupId: albSecurityGroup.securityGroupId,
          description: 'Allow HTTP from ALB'
        }
      ],
      tags
    });

    // IAM Roles
    const ec2Role = new IamRoleConstruct(this, 'ec2-role', {
      name: `${config.projectName}-ec2-role`,
      service: 'ec2.amazonaws.com',
      managedPolicies: ['arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'],
      tags
    });

    const lambdaRole = new IamRoleConstruct(this, 'lambda-role', {
      name: `${config.projectName}-lambda-role`,
      service: 'lambda.amazonaws.com',
      managedPolicies: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      ],
      inlinePolicies: [
        {
          name: 'sqs-poll-policy',
          policy: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'sqs:ReceiveMessage',
                  'sqs:DeleteMessage',
                  'sqs:GetQueueAttributes'
                ],
                Resource: '*'
              }
            ]
          }
        }
      ],
      tags
    });

    // SSM Parameters
    const ssmParams = new SsmParametersConstruct(this, 'ssm-params', {
      parameters: [
        {
          name: `/${config.projectName}/${config.environment}/queue-name`,
          value: `${config.projectName}-${config.environment}-queue`,
          type: 'String'
        },
        {
          name: `/${config.projectName}/${config.environment}/environment-type`,
          value: config.environment,
          type: 'String'
        }
      ],
      tags
    });

    // SQS Queue
    const sqsQueue = new SqsQueueConstruct(this, 'sqs-queue', {
      name: `${config.projectName}-${config.environment}-queue`,
      visibilityTimeout: 300,
      messageRetention: 1209600,
      tags
    });

    // Lambda Function
    const lambdaFunction = new LambdaFunctionConstruct(this, 'lambda-function', {
      name: `${config.projectName}-sqs-processor`,
      roleArn: lambdaRole.roleArn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      timeout: 60,
      memorySize: 256,
      environment: {
        QUEUE_NAME: sqsQueue.queueName,
        ENVIRONMENT: config.environment
      },
      sqsQueueArn: sqsQueue.queueArn,
      code: `
exports.handler = async (event) => {
  console.log('Processing SQS messages:', JSON.stringify(event, null, 2));
  
  const results = [];
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      console.log('Processing message:', body);
      
      // Process the message here
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        messageId: record.messageId,
        status: 'success'
      });
    } catch (error) {
      console.error('Error processing message:', error);
      results.push({
        messageId: record.messageId,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return {
    batchItemFailures: results
      .filter(r => r.status === 'failed')
      .map(r => ({ itemIdentifier: r.messageId }))
  };
};
      `,
      tags
    });

    // Application Load Balancer
    const alb = new ApplicationLoadBalancerConstruct(this, 'alb', {
      name: `${config.projectName}-alb`,
      subnetIds: [publicSubnet1.subnetId, publicSubnet2.subnetId],
      securityGroupIds: [albSecurityGroup.securityGroupId],
      tags
    });

    // Auto Scaling Group
    const asg = new AutoScalingGroupConstruct(this, 'asg', {
      name: `${config.projectName}-asg`,
      vpcZoneIdentifiers: [privateSubnet1.subnetId, privateSubnet2.subnetId],
      targetGroupArns: [alb.targetGroupArn],
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      instanceType: 't3.micro',
      keyName: undefined,
      iamInstanceProfile: ec2Role.instanceProfileName,
      securityGroups: [ec2SecurityGroup.securityGroupId],
      userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from \$(hostname -f)</h1>" > /var/www/html/index.html
`,
      tags: [
        { key: 'project', value: config.projectName, propagateAtLaunch: true },
        { key: 'environment', value: config.environment, propagateAtLaunch: true },
        { key: 'owner', value: config.owner, propagateAtLaunch: true },
        { key: 'Name', value: `${config.projectName}-asg-instance`, propagateAtLaunch: true }
      ]
    });

    // CloudWatch Alarms
    const cloudwatchAlarms = new CloudWatchAlarmsConstruct(this, 'cloudwatch-alarms', {
      asgName: asg.asgName,
      alarmPrefix: `${config.projectName}-${config.environment}`,
      cpuThreshold: 80,
      evaluationPeriods: 2,
      period: 300,
      tags
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: 'VPC ID'
    });

    new TerraformOutput(this, 'alb_dns_name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name'
    });

    new TerraformOutput(this, 'sqs_queue_url', {
      value: sqsQueue.queueUrl,
      description: 'SQS Queue URL'
    });

    new TerraformOutput(this, 'lambda_arn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda Function ARN'
    });

    new TerraformOutput(this, 'asg_name', {
      value: asg.asgName,
      description: 'Auto Scaling Group name'
    });
  }
}
```
**modules.ts**

```typescript
// lib/modules.ts
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { DataAwsAmiFilter } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Fn } from 'cdktf';

export interface TagConfig {
  [key: string]: string;
}

// VPC Construct
export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: {
    cidrBlock: string;
    tags: TagConfig;
  }) {
    super(scope, id);

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.tags.project}-vpc`
      }
    });

    this.vpcId = this.vpc.id;
  }
}

// Subnet Construct
export class SubnetConstruct extends Construct {
  public readonly subnetId: string;
  public readonly subnet: Subnet;

  constructor(scope: Construct, id: string, props: {
    vpcId: string;
    cidrBlock: string;
    availabilityZone: string;
    mapPublicIpOnLaunch: boolean;
    tags: TagConfig;
  }) {
    super(scope, id);

    this.subnet = new Subnet(this, 'subnet', {
      vpcId: props.vpcId,
      cidrBlock: props.cidrBlock,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: props.mapPublicIpOnLaunch,
      tags: props.tags
    });

    this.subnetId = this.subnet.id;
  }
}

// Internet Gateway Construct
export class InternetGatewayConstruct extends Construct {
  public readonly gatewayId: string;

  constructor(scope: Construct, id: string, props: {
    vpcId: string;
    tags: TagConfig;
  }) {
    super(scope, id);

    const igw = new InternetGateway(this, 'igw', {
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.tags.project}-igw`
      }
    });

    this.gatewayId = igw.id;
  }
}

// NAT Gateway Construct
export class NatGatewayConstruct extends Construct {
  public readonly natGatewayId: string;

  constructor(scope: Construct, id: string, props: {
    subnetId: string;
    tags: TagConfig;
  }) {
    super(scope, id);

    const eip = new Eip(this, 'eip', {
      domain: 'vpc',
      tags: {
        ...props.tags,
        Name: `${props.tags.project}-nat-eip`
      }
    });

    const natGw = new NatGateway(this, 'nat-gw', {
      allocationId: eip.id,
      subnetId: props.subnetId,
      tags: {
        ...props.tags,
        Name: `${props.tags.project}-nat-gateway`
      }
    });

    this.natGatewayId = natGw.id;
  }
}

// Route Table Construct
export class RouteTableConstruct extends Construct {
  public readonly routeTableId: string;

  constructor(scope: Construct, id: string, props: {
    vpcId: string;
    gatewayId?: string;
    natGatewayId?: string;
    isPublic: boolean;
    subnetIds: string[];
    tags: TagConfig;
  }) {
    super(scope, id);

    const routeTable = new RouteTable(this, 'route-table', {
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.tags.project}-${props.isPublic ? 'public' : 'private'}-rt`
      }
    });

    if (props.isPublic && props.gatewayId) {
      new Route(this, 'route', {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: props.gatewayId
      });
    } else if (!props.isPublic && props.natGatewayId) {
      new Route(this, 'route', {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: props.natGatewayId
      });
    }

    props.subnetIds.forEach((subnetId, index) => {
      new RouteTableAssociation(this, `association-${index}`, {
        subnetId: subnetId,
        routeTableId: routeTable.id
      });
    });

    this.routeTableId = routeTable.id;
  }
}

// Security Group Construct
export class SecurityGroupConstruct extends Construct {
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: {
    name: string;
    description: string;
    vpcId: string;
    ingressRules: Array<{
      fromPort: number;
      toPort: number;
      protocol: string;
      cidrBlocks?: string[];
      sourceSecurityGroupId?: string;
      description: string;
    }>;
    tags: TagConfig;
  }) {
    super(scope, id);

    const sg = new SecurityGroup(this, 'sg', {
      name: props.name,
      description: props.description,
      vpcId: props.vpcId,
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic'
      }],
      tags: props.tags
    });

    props.ingressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `ingress-${index}`, {
        type: 'ingress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.sourceSecurityGroupId,
        description: rule.description,
        securityGroupId: sg.id
      });
    });

    this.securityGroupId = sg.id;
  }
}

// IAM Role Construct
export class IamRoleConstruct extends Construct {
  public readonly roleArn: string;
  public readonly roleName: string;
  public readonly instanceProfileName: string;

  constructor(scope: Construct, id: string, props: {
    name: string;
    service: string;
    managedPolicies?: string[];
    inlinePolicies?: Array<{
      name: string;
      policy: any;
    }>;
    tags: TagConfig;
  }) {
    super(scope, id);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: props.service
        }
      }]
    });

    const role = new IamRole(this, 'role', {
      name: props.name,
      assumeRolePolicy: assumeRolePolicy,
      tags: props.tags
    });

    if (props.managedPolicies) {
      props.managedPolicies.forEach((policyArn, index) => {
        new IamRolePolicyAttachment(this, `policy-attachment-${index}`, {
          role: role.name,
          policyArn: policyArn
        });
      });
    }

    if (props.inlinePolicies) {
      props.inlinePolicies.forEach((policy, index) => {
        new IamRolePolicy(this, `inline-policy-${index}`, {
          name: policy.name,
          role: role.id,
          policy: JSON.stringify(policy.policy)
        });
      });
    }

    if (props.service === 'ec2.amazonaws.com') {
      const profile = new IamInstanceProfile(this, 'instance-profile', {
        name: `${props.name}-profile`,
        role: role.name
      });
      this.instanceProfileName = profile.name;
    } else {
      this.instanceProfileName = '';
    }

    this.roleArn = role.arn;
    this.roleName = role.name;
  }
}

// Application Load Balancer Construct
export class ApplicationLoadBalancerConstruct extends Construct {
  public readonly dnsName: string;
  public readonly targetGroupArn: string;

  constructor(scope: Construct, id: string, props: {
    name: string;
    subnetIds: string[];
    securityGroupIds: string[];
    tags: TagConfig;
  }) {
    super(scope, id);

    const logGroup = new CloudwatchLogGroup(this, 'alb-logs', {
      name: `/aws/alb/${props.name}`,
      retentionInDays: 7,
      tags: props.tags
    });

    const alb = new Alb(this, 'alb', {
      name: props.name,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: props.securityGroupIds,
      subnets: props.subnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      accessLogs: {
        enabled: false
      },
      tags: props.tags
    });

    const targetGroup = new AlbTargetGroup(this, 'target-group', {
      name: `${props.name}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: Fn.element(Fn.split('-', Fn.element(props.subnetIds, 0)), 0),
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200',
        path: '/',
        port: '80',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2
      },
      tags: props.tags
    });

    new AlbListener(this, 'listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: targetGroup.arn
      }],
      tags: props.tags
    });

    this.dnsName = alb.dnsName;
    this.targetGroupArn = targetGroup.arn;
  }
}

// Auto Scaling Group Construct
export class AutoScalingGroupConstruct extends Construct {
  public readonly asgName: string;

  constructor(scope: Construct, id: string, props: {
    name: string;
    vpcZoneIdentifiers: string[];
    targetGroupArns: string[];
    minSize: number;
    maxSize: number;
    desiredCapacity: number;
    healthCheckType: string;
    healthCheckGracePeriod: number;
    instanceType: string;
    keyName?: string;
    iamInstanceProfile: string;
    securityGroups: string[];
    userData: string;
    tags: Array<{
      key: string;
      value: string;
      propagateAtLaunch: boolean;
    }>;
  }) {
    super(scope, id);

    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2']
        },
        {
          name: 'virtualization-type',
          values: ['hvm']
        }
      ],
      owners: ['amazon']
    });

    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${props.name}-lt`,
      imageId: ami.id,
      instanceType: props.instanceType,
      keyName: props.keyName,
      vpcSecurityGroupIds: props.securityGroups,
      iamInstanceProfile: {
        name: props.iamInstanceProfile
      },
      userData: Fn.base64encode(props.userData),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: props.tags.reduce((acc, tag) => ({
          ...acc,
          [tag.key]: tag.value
        }), {})
      }]
    });

    const asg = new AutoscalingGroup(this, 'asg', {
      name: props.name,
      vpcZoneIdentifier: props.vpcZoneIdentifiers,
      targetGroupArns: props.targetGroupArns,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      healthCheckType: props.healthCheckType,
      healthCheckGracePeriod: props.healthCheckGracePeriod,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest'
      },
      tag: props.tags
    });

    this.asgName = asg.name;
  }
}

// SQS Queue Construct
export class SqsQueueConstruct extends Construct {
  public readonly queueUrl: string;
  public readonly queueArn: string;
  public readonly queueName: string;

  constructor(scope: Construct, id: string, props: {
    name: string;
    visibilityTimeout: number;
    messageRetention: number;
    tags: TagConfig;
  }) {
    super(scope, id);

    const queue = new SqsQueue(this, 'queue', {
      name: props.name,
      visibilityTimeoutSeconds: props.visibilityTimeout,
      messageRetentionSeconds: props.messageRetention,
      tags: props.tags
    });

    this.queueUrl = queue.url;
    this.queueArn = queue.arn;
    this.queueName = queue.name;
  }
}

// Lambda Function Construct
export class LambdaFunctionConstruct extends Construct {
  public readonly functionArn: string;

  constructor(scope: Construct, id: string, props: {
    name: string;
    roleArn: string;
    handler: string;
    runtime: string;
    timeout: number;
    memorySize: number;
    environment: { [key: string]: string };
    sqsQueueArn: string;
    code: string;
    tags: TagConfig;
  }) {
    super(scope, id);

    const logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${props.name}`,
      retentionInDays: 7,
      tags: props.tags
    });

    const lambdaFunction = new LambdaFunction(this, 'function', {
      functionName: props.name,
      role: props.roleArn,
      handler: props.handler,
      runtime: props.runtime,
      timeout: props.timeout,
      memorySize: props.memorySize,
      environment: {
        variables: props.environment
      },
      filename: 'lambda.zip',
      tags: props.tags,
      dependsOn: [logGroup]
    });

    // Create inline code deployment
    const fs = require('fs');
    const archiver = require('archiver');
    const output = fs.createWriteStream('lambda.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    archive.append(props.code, { name: 'index.js' });
    archive.finalize();

    new LambdaEventSourceMapping(this, 'event-source-mapping', {
      eventSourceArn: props.sqsQueueArn,
      functionName: lambdaFunction.functionName,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5
    });

    this.functionArn = lambdaFunction.arn;
  }
}

// CloudWatch Alarms Construct
export class CloudWatchAlarmsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: {
    asgName: string;
    alarmPrefix: string;
    cpuThreshold: number;
    evaluationPeriods: number;
    period: number;
    tags: TagConfig;
  }) {
    super(scope, id);

    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: `${props.alarmPrefix}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: props.evaluationPeriods,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: props.period,
      statistic: 'Average',
      threshold: props.cpuThreshold,
      alarmDescription: 'This metric monitors EC2 CPU utilization',
      dimensions: {
        AutoScalingGroupName: props.asgName
      },
      treatMissingData: 'notBreaching',
      tags: props.tags
    });
  }
}

// SSM Parameter Store Construct
export class SsmParametersConstruct extends Construct {
  constructor(scope: Construct, id: string, props: {
    parameters: Array<{
      name: string;
      value: string;
      type: string;
    }>;
    tags: TagConfig;
  }) {
    super(scope, id);

    props.parameters.forEach((param, index) => {
      new SsmParameter(this, `param-${index}`, {
        name: param.name,
        type: param.type,
        value: param.value,
        tags: props.tags
      });
    });
  }
}
```