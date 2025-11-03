```ts
import { Construct } from 'constructs';
import {
  TerraformStack,
  TerraformOutput,
  Fn,
  AssetType,
  TerraformAsset,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import * as path from 'path';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Configuration ---
    const config = {
      region: 'us-east-1', // Based on specified AZs
      app_config: {
        healthcheck_endpoint: '/health',
        min_healthy_instances: 2,
        max_retry_attempts: 3,
        recovery_timeout_seconds: 300,
      },
      infrastructure_config: {
        vpc_cidr: '10.0.0.0/16',
        // Use specified AZs directly
        availability_zones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        instance_types: ['t3.medium'],
      },
    };
    // Add environmentSuffix for multi-environment support
    const environmentSuffix = 'prod'; // Or pass as a constructor/config argument
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const tags = {
      Project: 'MultiAzRecovery',
      Environment: environmentSuffix,
      ManagedBy: 'CDKTF',
    };

    // --- Provider ---
    const provider = new AwsProvider(this, 'aws', {
      region: config.region,
    });

    // --- Networking ---
    const vpc = new Vpc(this, 'vpc', {
      provider: provider,
      cidrBlock: config.infrastructure_config.vpc_cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `vpc-${environmentSuffix}-${randomSuffix}` },
    });

    const igw = new InternetGateway(this, 'igw', {
      provider: provider,
      vpcId: vpc.id,
      tags: { ...tags, Name: `igw-${environmentSuffix}-${randomSuffix}` },
    });

    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    // Create subnets and NAT gateways across specified AZs
    config.infrastructure_config.availability_zones.forEach((az, index) => {
      const azSuffix = az.slice(-1); // e.g., 'a', 'b', 'c'

      // Public Subnet
      const publicSubnet = new Subnet(this, `public-subnet-${azSuffix}`, {
        provider: provider,
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(
          config.infrastructure_config.vpc_cidr,
          8,
          index * 2
        ), // e.g., 10.0.0.0/24, 10.0.2.0/24
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `public-${azSuffix}-${environmentSuffix}-${randomSuffix}`,
        },
      });
      publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new Subnet(this, `private-subnet-${azSuffix}`, {
        provider: provider,
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(
          config.infrastructure_config.vpc_cidr,
          8,
          index * 2 + 1
        ), // e.g., 10.0.1.0/24, 10.0.3.0/24
        availabilityZone: az,
        tags: {
          ...tags,
          Name: `private-${azSuffix}-${environmentSuffix}-${randomSuffix}`,
        },
      });
      privateSubnets.push(privateSubnet);

      // NAT Gateway (one per AZ for HA)
      const eip = new Eip(this, `nat-eip-${azSuffix}`, {
        provider: provider,
        tags: {
          ...tags,
          Name: `nat-eip-${azSuffix}-${environmentSuffix}-${randomSuffix}`,
        },
      });
      const natGw = new NatGateway(this, `nat-gw-${azSuffix}`, {
        provider: provider,
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...tags,
          Name: `nat-gw-${azSuffix}-${environmentSuffix}-${randomSuffix}`,
        },
        dependsOn: [igw],
      });
      natGateways.push(natGw);

      // Private Route Table for this AZ
      const privateRt = new RouteTable(this, `private-rt-${azSuffix}`, {
        provider: provider,
        vpcId: vpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGw.id }],
        tags: {
          ...tags,
          Name: `private-rt-${azSuffix}-${environmentSuffix}-${randomSuffix}`,
        },
      });
      new RouteTableAssociation(this, `private-rta-${azSuffix}`, {
        provider: provider,
        subnetId: privateSubnet.id,
        routeTableId: privateRt.id,
      });
    });

    // Public Route Table (shared)
    const publicRt = new RouteTable(this, 'public-rt', {
      provider: provider,
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...tags, Name: `public-rt-${environmentSuffix}-${randomSuffix}` },
    });
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        provider: provider,
        subnetId: subnet.id,
        routeTableId: publicRt.id,
      });
    });

    // --- Security ---
    const albSg = new SecurityGroup(this, 'alb-sg', {
      provider: provider,
      name: `alb-sg-${environmentSuffix}-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ], // HTTP for simplicity
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags, Name: `alb-sg-${environmentSuffix}-${randomSuffix}` },
    });

    const asgSg = new SecurityGroup(this, 'asg-sg', {
      provider: provider,
      name: `asg-sg-${environmentSuffix}-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ], // Allow outbound via NAT
      tags: { ...tags, Name: `asg-sg-${environmentSuffix}-${randomSuffix}` },
    });

    // --- Compute (ASG) ---
    const ami = new DataAwsAmi(this, 'ami', {
      provider: provider,
      mostRecent: true,
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
      owners: ['amazon'],
    });

    const ec2Role = new IamRole(this, 'ec2-role', {
      provider: provider,
      name: `ec2-role-${environmentSuffix}-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      ], // Basic SSM agent
      tags: { ...tags },
    });

    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      provider: provider,
      name: `instance-profile-${environmentSuffix}-${randomSuffix}`,
      role: ec2Role.name,
    });

    // Basic UserData to install a web server for health checks
    // --- FIX: Changed internal double quotes to single quotes ---
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd stress
systemctl enable httpd
systemctl start httpd
echo '<html><body><h1>OK</h1><a href='/health'>Health Check</a></body></html>' > /var/www/html/index.html
echo 'OK' > /var/www/html/health
# Simulate potential CPU load for testing alarms
# nohup stress --cpu 1 --timeout 600s &
`;

    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      provider: provider,
      name: `lt-${randomSuffix}`,
      imageId: ami.id,
      instanceType: config.infrastructure_config.instance_types[0], // Use first specified type
      userData: Fn.base64encode(userData),
      iamInstanceProfile: { name: instanceProfile.name },
      networkInterfaces: [
        { securityGroups: [asgSg.id], associatePublicIpAddress: 'false' },
      ],
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...tags,
            Name: `app-instance-${environmentSuffix}-${randomSuffix}`,
          },
        },
      ],
      tags: { ...tags },
    });

    const asg = new AutoscalingGroup(this, 'asg', {
      provider: provider,
      name: `asg-${environmentSuffix}-${randomSuffix}`,
      minSize: config.app_config.min_healthy_instances, // Start with minimum healthy
      maxSize: config.app_config.min_healthy_instances + 2, // Allow some buffer
      desiredCapacity: config.app_config.min_healthy_instances,
      vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id), // Span across all private subnets/AZs
      launchTemplate: { id: launchTemplate.id, version: '$Latest' },
      healthCheckType: 'ELB',
      healthCheckGracePeriod: config.app_config.recovery_timeout_seconds, // Use configured timeout
      tag: [
        {
          key: 'Name',
          value: `asg-${environmentSuffix}-${randomSuffix}`,
          propagateAtLaunch: true,
        },
        ...Object.entries(tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],
      // Consider adding update policies (e.g., rolling update) for production
    });

    // --- Load Balancer (ALB) ---
    const alb = new Lb(this, 'alb', {
      provider: provider,
      name: `alb-${environmentSuffix}-${randomSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: publicSubnets.map(subnet => subnet.id),
      tags: { ...tags, Name: `alb-${environmentSuffix}-${randomSuffix}` },
    });

    const targetGroup = new LbTargetGroup(this, 'target-group', {
      provider: provider,
      name: `tg-${environmentSuffix}-${randomSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: config.app_config.healthcheck_endpoint,
        protocol: 'HTTP',
        port: 'traffic-port',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 10,
        matcher: '200',
      },
      tags: { ...tags, Name: `tg-${environmentSuffix}-${randomSuffix}` },
    });

    // Attach ASG to Target Group
    asg.targetGroupArns = [targetGroup.arn];

    new LbListener(this, 'listener', {
      provider: provider,
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
      tags: { ...tags },
    });

    // --- State (DynamoDB) ---
    const dynamoTable = new DynamodbTable(this, 'dynamodb-state', {
      provider: provider,
      name: `app-state-${environmentSuffix}-${randomSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'stateKey',
      attribute: [{ name: 'stateKey', type: 'S' }],
      tags: { ...tags, Name: `dynamodb-${environmentSuffix}-${randomSuffix}` },
    });

    // --- Monitoring (CloudWatch Alarm) ---
    // Alarm triggers if the number of healthy hosts drops below the minimum required
    const unhealthyHostAlarm = new CloudwatchMetricAlarm(
      this,
      'unhealthy-host-alarm',
      {
        provider: provider,
        alarmName: `unhealthy-host-alarm-${environmentSuffix}-${randomSuffix}`,
        alarmDescription:
          'Triggers recovery when healthy hosts drop below minimum',
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: config.app_config.max_retry_attempts, // Use configured retries
        threshold: config.app_config.min_healthy_instances,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        statistic: 'Minimum', // Check minimum healthy over the period
        period: 60, // Check every minute
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
        treatMissingData: 'breaching', // If metric is missing, assume unhealthy
        tags: { ...tags },
        // Alarm actions are set by EventBridge rule below
      }
    );

    // --- Recovery Automation (EventBridge + Lambda) ---
    const lambdaRole = new IamRole(this, 'lambda-role', {
      provider: provider,
      name: `recovery-lambda-role-${environmentSuffix}-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: { ...tags },
    });

    // Lambda Policy
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      provider: provider,
      name: `recovery-lambda-policy-${environmentSuffix}-${randomSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'logs:CreateLogGroup',
            Resource: `arn:aws:logs:${config.region}:*:*`,
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `arn:aws:logs:${config.region}:*:log-group:/aws/lambda/*:*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
            ],
            Resource: dynamoTable.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'autoscaling:DescribeAutoScalingGroups',
              'ec2:DescribeInstances',
              'ec2:TerminateInstances',
            ],
            Resource: '*',
          }, // Scope down in prod
          { Effect: 'Allow', Action: 'events:PutEvents', Resource: '*' }, // Allow putting events back to EventBridge if needed
        ],
      }),
      tags: { ...tags },
    });
    new IamRolePolicyAttachment(this, 'lambda-policy-attach', {
      provider: provider,
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });
    // Attach basic execution role for VPC access if needed (add VPC config to Lambda later if necessary)
    new IamRolePolicyAttachment(this, 'lambda-vpc-attach', {
      provider: provider,
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Lambda Function Asset
    const lambdaAsset = new TerraformAsset(this, 'lambda-asset', {
      path: path.resolve(__dirname, '../lambda'), // Expects a 'lambda' folder next to 'lib'
      type: AssetType.ARCHIVE,
    });

    const recoveryLambda = new LambdaFunction(this, 'recovery-lambda', {
      provider: provider,
      functionName: `recovery-lambda-${environmentSuffix}-${randomSuffix}`,
      role: lambdaRole.arn,
      handler: 'recovery.lambda_handler', // Assumes recovery.py with lambda_handler function
      runtime: 'python3.9',
      timeout: config.app_config.recovery_timeout_seconds, // Use configured timeout
      memorySize: 128,
      filename: lambdaAsset.path, // Use the zipped asset path
      sourceCodeHash: lambdaAsset.assetHash,
      environment: {
        variables: {
          DYNAMODB_TABLE: dynamoTable.name,
          ASG_NAME: asg.name,
          REGION: config.region,
          MIN_HEALTHY: String(config.app_config.min_healthy_instances),
        },
      },
      tags: { ...tags },
    });

    // EventBridge Rule to trigger Lambda from CloudWatch Alarm
    const eventRule = new CloudwatchEventRule(this, 'event-rule', {
      provider: provider,
      name: `alarm-trigger-rule-${environmentSuffix}-${randomSuffix}`,
      description: 'Triggers recovery Lambda when unhealthy host alarm fires',
      eventPattern: JSON.stringify({
        source: ['aws.cloudwatch'],
        'detail-type': ['CloudWatch Alarm State Change'],
        resources: [unhealthyHostAlarm.arn],
        detail: {
          state: {
            value: ['ALARM'],
          },
        },
      }),
      tags: { ...tags },
    });

    // EventBridge Target (Lambda)
    new CloudwatchEventTarget(this, 'event-target', {
      provider: provider,
      rule: eventRule.name,
      arn: recoveryLambda.arn,
    });

    // Lambda Permission for EventBridge to invoke it
    new LambdaPermission(this, 'lambda-permission', {
      provider: provider,
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: recoveryLambda.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.arn,
    });

    // --- Outputs ---
    new TerraformOutput(this, 'AlbDnsName', {
      value: alb.dnsName,
      description: 'DNS name of the Application Load Balancer',
    });
    new TerraformOutput(this, 'AsgName', {
      value: asg.name,
      description: 'Name of the Auto Scaling Group',
    });
    new TerraformOutput(this, 'DynamoDbTableName', {
      value: dynamoTable.name,
      description: 'Name of the DynamoDB table for state',
    });
    new TerraformOutput(this, 'RecoveryLambdaArn', {
      value: recoveryLambda.arn,
      description: 'ARN of the recovery Lambda function',
    });
    new TerraformOutput(this, 'CloudWatchAlarmName', {
      value: unhealthyHostAlarm.alarmName,
      description: 'Name of the CloudWatch alarm triggering recovery',
    });
  }
}
```
