```ts
/**
 * Main TapStack - Orchestrates all infrastructure components
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { IdentityInfrastructure } from './components/identity';
import { NetworkingInfrastructure } from './components/networking';
import { ElasticBeanstalkInfrastructure } from './components/elastic_beanstalk';
import { MonitoringInfrastructure } from './components/monitoring';

export interface TapStackArgs {
  environmentSuffix?: string;
  regions?: string[];
  tags?: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly environmentSuffix: string;
  public readonly regions: string[];
  public readonly tags: Record<string, string>;

  // Infrastructure components
  public readonly identity: IdentityInfrastructure;
  public readonly regionalNetworks: Record<string, NetworkingInfrastructure> =
    {};
  public readonly regionalMonitoring: Record<string, MonitoringInfrastructure> =
    {};
  public readonly regionalElasticBeanstalk: Record<
    string,
    ElasticBeanstalkInfrastructure
  > = {};
  public readonly providers: Record<string, aws.Provider> = {};

  constructor(
    name: string,
    args?: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('nova:TapStack', name, {}, opts);

    // Set default values
    this.environmentSuffix = args?.environmentSuffix || 'prod';
    this.regions = args?.regions || ['us-east-1', 'us-west-1'];
    this.tags = args?.tags || {
      Environment: this.environmentSuffix,
      Project: 'IaC-AWS-Nova-Model-Breaking',
      Application: 'nova-web-app',
      ManagedBy: 'Pulumi',
    };

    console.log('Creating Identity and Access Infrastructure...');

    // Create shared identity infrastructure
    this.identity = new IdentityInfrastructure(
      `${name}-identity`,
      {
        tags: this.tags,
      },
      { parent: this }
    );

    // Create regional infrastructure for each region
    for (const region of this.regions) {
      const isPrimary = region === this.regions[0]; // First region is primary

      console.log(
        `Setting up AWS provider for region: ${region} ${isPrimary ? '(PRIMARY)' : ''}`
      );

      // Create regional AWS provider with explicit typing
      this.providers[region] = new aws.Provider(
        `${name}-provider-${region}`,
        {
          region: region as aws.Region, // Explicitly cast to aws.Region
        },
        { parent: this }
      );

      console.log(`Creating Networking Infrastructure for ${region}...`);

      // Create regional networking
      this.regionalNetworks[region] = new NetworkingInfrastructure(
        `${name}-networking-${region}`,
        {
          region,
          isPrimary,
          environment: this.environmentSuffix,
          tags: this.tags,
        },
        { parent: this, provider: this.providers[region] }
      );

      console.log(`Creating Monitoring Infrastructure for ${region}...`);

      // Create regional monitoring
      this.regionalMonitoring[region] = new MonitoringInfrastructure(
        `${name}-monitoring-${region}`,
        {
          region,
          environment: this.environmentSuffix,
          tags: this.tags,
        },
        { parent: this, provider: this.providers[region] }
      );

      console.log(
        `Creating Elastic Beanstalk Infrastructure for ${region}...`
      );

      // Create regional Elastic Beanstalk
      this.regionalElasticBeanstalk[region] =
        new ElasticBeanstalkInfrastructure(
          `${name}-eb-${region}`,
          {
            region,
            isPrimary,
            environment: this.environmentSuffix,
            environmentSuffix: this.environmentSuffix,
            vpcId: this.regionalNetworks[region].vpcId,
            publicSubnetIds: this.regionalNetworks[region].publicSubnetIds,
            privateSubnetIds: this.regionalNetworks[region].privateSubnetIds,
            albSecurityGroupId:
              this.regionalNetworks[region].albSecurityGroupId,
            ebSecurityGroupId: this.regionalNetworks[region].ebSecurityGroupId,
            ebServiceRoleArn: this.identity.ebServiceRoleArn,
            ebInstanceProfileName: this.identity.ebInstanceProfileName,
            tags: this.tags,
          },
          { parent: this, provider: this.providers[region] }
        );
    }

    // Register outputs
    this.registerOutputs({
      environmentSuffix: this.environmentSuffix,
      regions: this.regions,
      identityArn: this.identity.ebServiceRoleArn,
    });

    console.log(
      `TapStack deployment complete for regions: ${this.regions.join(', ')}`
    );
  }
}
```

<!-- /lib/components/elastic_beanstalk.ts -->

```ts
/**
 * Elastic Beanstalk Infrastructure Component
 * Handles EB application, environment, and configuration
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {
  ComponentResource,
  ComponentResourceOptions,
  Output,
} from '@pulumi/pulumi';

interface ElasticBeanstalkInfrastructureArgs {
  region: string;
  isPrimary: boolean;
  environment: string;
  environmentSuffix: string;
  vpcId: Output<string>;
  publicSubnetIds: Output<string>[];
  privateSubnetIds: Output<string>[];
  albSecurityGroupId: Output<string>;
  ebSecurityGroupId: Output<string>;
  ebServiceRoleArn: Output<string>;
  ebInstanceProfileName: Output<string>;
  tags: Record<string, string>;
}

export class ElasticBeanstalkInfrastructure extends ComponentResource {
  private readonly region: string;
  private readonly isPrimary: boolean;
  private readonly environment: string;
  private readonly environmentSuffix: string;
  private readonly tags: Record<string, string>;
  private readonly regionSuffix: string;

  public readonly application: aws.elasticbeanstalk.Application;
  public readonly configTemplate: aws.elasticbeanstalk.ConfigurationTemplate;
  public readonly ebEnvironment: aws.elasticbeanstalk.Environment;

  constructor(
    name: string,
    args: ElasticBeanstalkInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:ElasticBeanstalk', name, {}, opts);

    this.region = args.region;
    this.isPrimary = args.isPrimary;
    this.environment = args.environment;
    this.environmentSuffix = args.environmentSuffix;
    this.tags = args.tags;
    this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');

    this.application = this.createApplication();
    this.configTemplate = this.createConfigurationTemplate(args);
    this.ebEnvironment = this.createEnvironment();

    this.registerOutputs({
      applicationName: this.application.name,
      environmentName: this.ebEnvironment.name,
      environmentUrl: this.ebEnvironment.endpointUrl,
      environmentCname: this.ebEnvironment.cname,
    });
  }

  /**
   * Create Elastic Beanstalk Application
   */
  private createApplication(): aws.elasticbeanstalk.Application {
    return new aws.elasticbeanstalk.Application(
      `nova-app-${this.regionSuffix}`,
      {
        name: `nova-app-${this.regionSuffix}`,
        description: `Nova application for ${this.region}`,
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Get the current valid solution stack for Docker (verified 2025-08-19)
   */
  private getSolutionStackName(): string {
    // Using the latest available solution stack as of 2025-08-19
    // Retrieved via: aws elasticbeanstalk list-available-solution-stacks
    return '64bit Amazon Linux 2023 v4.6.3 running Docker';
  }

  /**
   * Create Configuration Template
   */
  private createConfigurationTemplate(
    args: ElasticBeanstalkInfrastructureArgs
  ): aws.elasticbeanstalk.ConfigurationTemplate {
    // Convert subnet arrays to comma-separated strings
    const publicSubnetsString = pulumi
      .all(args.publicSubnetIds)
      .apply(subnets => subnets.join(','));
    const privateSubnetsString = pulumi
      .all(args.privateSubnetIds)
      .apply(subnets => subnets.join(','));

    const solutionStackName = this.getSolutionStackName();
    console.log(
      `Using Elastic Beanstalk solution stack: ${solutionStackName}`
    );

    return new aws.elasticbeanstalk.ConfigurationTemplate(
      `nova-config-${this.regionSuffix}`,
      {
        name: `nova-config-${this.regionSuffix}`,
        application: this.application.name,
        solutionStackName: solutionStackName,
        settings: [
          // VPC Configuration
          {
            namespace: 'aws:ec2:vpc',
            name: 'VPCId',
            value: args.vpcId,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'Subnets',
            value: privateSubnetsString,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'ELBSubnets',
            value: publicSubnetsString,
          },
          // Instance Configuration
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'InstanceType',
            value: 't3.medium',
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'IamInstanceProfile',
            value: args.ebInstanceProfileName,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'SecurityGroups',
            value: args.ebSecurityGroupId,
          },
          // Auto Scaling Configuration
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MinSize',
            value: '2',
          },
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MaxSize',
            value: '10',
          },
          // Load Balancer Configuration
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'EnvironmentType',
            value: 'LoadBalanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'LoadBalancerType',
            value: 'application',
          },
          {
            namespace: 'aws:elbv2:loadbalancer',
            name: 'SecurityGroups',
            value: args.albSecurityGroupId,
          },
          // Service Role
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'ServiceRole',
            value: args.ebServiceRoleArn,
          },
          // Health Check Configuration
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            name: 'SystemType',
            value: 'enhanced',
          },
          // Rolling Updates
          {
            namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
            name: 'RollingUpdateEnabled',
            value: 'true',
          },
          {
            namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
            name: 'MaxBatchSize',
            value: '1',
          },
          {
            namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
            name: 'MinInstancesInService',
            value: '1',
          },
        ],
        // Remove tags from here - not supported in v6.22.0
      },
      { parent: this }
    );
  }

  /**
   * Create Elastic Beanstalk Environment
   */
  private createEnvironment(): aws.elasticbeanstalk.Environment {
    // Use deterministic naming based on environment suffix (no random components)
    const envName = `nova-env-${this.regionSuffix}-${this.environmentSuffix}`;

    console.log(`Creating Elastic Beanstalk environment: ${envName}`);

    return new aws.elasticbeanstalk.Environment(
      `nova-env-${this.regionSuffix}`,
      {
        name: envName,
        application: this.application.name,
        templateName: this.configTemplate.name,
        tier: 'WebServer',
        tags: this.tags,
      },
      { parent: this }
    );
  }

  // Property getters for easy access
  public get applicationName(): Output<string> {
    return this.application.name;
  }

  public get environmentName(): Output<string> {
    return this.ebEnvironment.name;
  }

  public get environmentUrl(): Output<string> {
    return this.ebEnvironment.endpointUrl;
  }

  public get environmentCname(): Output<string> {
    return this.ebEnvironment.cname;
  }
}

```


<!-- /lib/components/identity.ts -->
```ts
/**
 * Identity and Access Management Infrastructure Component
 * Handles IAM roles, policies, and instance profiles for AWS Elastic Beanstalk
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

interface IdentityInfrastructureArgs {
  tags: Record<string, string>;
}

export class IdentityInfrastructure extends ComponentResource {
  private readonly tags: Record<string, string>;
  private readonly stack: string;

  public readonly ebServiceRole: aws.iam.Role;
  public readonly ebInstanceRole: aws.iam.Role;
  public readonly ebInstancePolicy: aws.iam.RolePolicy;
  public readonly ebInstanceProfile: aws.iam.InstanceProfile;
  public readonly autoscalingRole: aws.iam.Role;
  public readonly autoscalingPolicy: aws.iam.RolePolicy;

  constructor(
    name: string,
    args: IdentityInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:Identity', name, {}, opts);

    this.tags = args.tags;
    this.stack = pulumi.getStack();

    this.ebServiceRole = this.createEbServiceRole();
    this.ebInstanceRole = this.createEbInstanceRole();
    this.ebInstancePolicy = this.createEbInstancePolicy();
    this.ebInstanceProfile = this.createEbInstanceProfile();
    this.autoscalingRole = this.createAutoscalingRole();
    this.autoscalingPolicy = this.createAutoscalingPolicy();

    this.registerOutputs({
      ebServiceRoleArn: this.ebServiceRole.arn,
      ebInstanceRoleArn: this.ebInstanceRole.arn,
      ebInstanceProfileName: this.ebInstanceProfile.name,
      autoscalingRoleArn: this.autoscalingRole.arn,
    });
  }

  /**
   * Create Elastic Beanstalk service role
   */
  private createEbServiceRole(): aws.iam.Role {
    return new aws.iam.Role(
      'eb-service-role',
      {
        name: `nova-eb-service-role-${this.stack}`,
        description: 'Service role for Elastic Beanstalk',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'elasticbeanstalk.amazonaws.com' },
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'sts:ExternalId': 'elasticbeanstalk',
                },
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth',
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy',
          'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService',
        ],
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create EC2 instance role for Elastic Beanstalk instances
   */
  private createEbInstanceRole(): aws.iam.Role {
    return new aws.iam.Role(
      'eb-instance-role',
      {
        name: `nova-eb-instance-role-${this.stack}`,
        description: 'Instance role for Elastic Beanstalk EC2 instances',
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
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier',
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker',
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier',
        ],
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create additional policy for EB instance role
   */
  private createEbInstancePolicy(): aws.iam.RolePolicy {
    return new aws.iam.RolePolicy(
      'eb-instance-additional-policy',
      {
        role: this.ebInstanceRole.id,
        name: `NovaEBInstanceAdditionalPolicy-${this.stack}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'ec2:DescribeInstanceStatus',
                'ec2:DescribeInstances',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              Resource: 'arn:aws:s3:::elasticbeanstalk-*/*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:ListBucket'],
              Resource: 'arn:aws:s3:::elasticbeanstalk-*',
            },
          ],
        }),
      },
      { parent: this }
    );
  }

  /**
   * Create instance profile for Elastic Beanstalk instances
   */
  private createEbInstanceProfile(): aws.iam.InstanceProfile {
    return new aws.iam.InstanceProfile(
      'eb-instance-profile',
      {
        name: `nova-eb-instance-profile-${this.stack}`,
        role: this.ebInstanceRole.name,
      },
      { parent: this }
    );
  }

  /**
   * Create Auto Scaling service role
   */
  private createAutoscalingRole(): aws.iam.Role {
    return new aws.iam.Role(
      'autoscaling-role',
      {
        name: `nova-autoscaling-role-${this.stack}`,
        description: 'Service role for Auto Scaling',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'autoscaling.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AutoScalingNotificationAccessRole',
        ],
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create additional policy for Auto Scaling role
   */
  private createAutoscalingPolicy(): aws.iam.RolePolicy {
    return new aws.iam.RolePolicy(
      'autoscaling-additional-policy',
      {
        role: this.autoscalingRole.id,
        name: `NovaAutoScalingAdditionalPolicy-${this.stack}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeInstanceAttribute',
                'ec2:DescribeKeyPairs',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeSpotInstanceRequests',
                'ec2:DescribeSpotPriceHistory',
                'ec2:DescribeVpcClassicLink',
                'ec2:DescribeVpcs',
                'ec2:CreateTags',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeInstanceHealth',
                'elasticloadbalancing:RegisterInstancesWithLoadBalancer',
                'elasticloadbalancing:DeregisterInstancesFromLoadBalancer',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );
  }

  // Property getters for accessing the resources
  public get ebServiceRoleArn(): pulumi.Output<string> {
    return this.ebServiceRole.arn;
  }

  public get ebInstanceRoleArn(): pulumi.Output<string> {
    return this.ebInstanceRole.arn;
  }

  public get ebInstanceProfileName(): pulumi.Output<string> {
    return this.ebInstanceProfile.name;
  }

  public get autoscalingRoleArn(): pulumi.Output<string> {
    return this.autoscalingRole.arn;
  }
}
```

<!-- /lib/components/monitoring.ts -->
```ts
/**
 * Monitoring Infrastructure Component
 * Handles CloudWatch dashboards, alarms, and SNS notifications
 */

import * as aws from '@pulumi/aws';
import {
  ComponentResource,
  ComponentResourceOptions,
  Output,
} from '@pulumi/pulumi';

interface MonitoringInfrastructureArgs {
  region: string;
  environment: string;
  tags: Record<string, string>;
}

export class MonitoringInfrastructure extends ComponentResource {
  private readonly region: string;
  private readonly environment: string;
  private readonly tags: Record<string, string>;
  private readonly regionSuffix: string;

  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicPolicy: aws.sns.TopicPolicy;
  public readonly dashboard: aws.cloudwatch.Dashboard;

  constructor(
    name: string,
    args: MonitoringInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:Monitoring', name, {}, opts);

    this.region = args.region;
    this.environment = args.environment;
    this.tags = args.tags;
    this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');

    this.snsTopic = this.createSnsTopic();
    this.snsTopicPolicy = this.createSnsTopicPolicy();
    this.dashboard = this.createDashboard();

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      dashboardName: this.dashboard.dashboardName,
    });
  }

  /**
   * Create SNS Topic for alerts
   */
  private createSnsTopic(): aws.sns.Topic {
    return new aws.sns.Topic(
      `nova-alerts-${this.regionSuffix}`,
      {
        name: `nova-alerts-${this.regionSuffix}`,
        displayName: `Nova Alerts - ${this.region}`,
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create SNS Topic Policy
   */
  private createSnsTopicPolicy(): aws.sns.TopicPolicy {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'cloudwatch.amazonaws.com',
          },
          Action: 'sns:Publish',
          Resource: this.snsTopic.arn,
        },
      ],
    };

    return new aws.sns.TopicPolicy(
      `nova-alerts-policy-${this.regionSuffix}`,
      {
        arn: this.snsTopic.arn,
        policy: JSON.stringify(policyDocument),
      },
      { parent: this }
    );
  }

  /**
   * Create CloudWatch Dashboard
   */
  private createDashboard(): aws.cloudwatch.Dashboard {
    const dashboardBody = JSON.stringify({
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['AWS/ApplicationELB', 'RequestCount'],
              ['AWS/ApplicationELB', 'TargetResponseTime'],
              ['AWS/ApplicationELB', 'HTTPCode_Target_5XX_Count'],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'Nova Application Metrics',
            period: 300,
          },
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [['AWS/ElasticBeanstalk', 'EnvironmentHealth']],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'Environment Health',
            period: 300,
          },
        },
      ],
    });

    return new aws.cloudwatch.Dashboard(
      `nova-dashboard-${this.regionSuffix}`,
      {
        dashboardName: `nova-dashboard-${this.regionSuffix}`,
        dashboardBody: dashboardBody,
      },
      { parent: this }
    );
  }

  /**
   * Create CPU High Alarm
   */
  public createCpuAlarm(
    environmentName: Output<string>,
    asgName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-cpu-alarm-${this.regionSuffix}`,
      {
        name: `nova-cpu-high-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          AutoScalingGroupName: asgName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create 5XX Error Alarm
   */
  public createErrorAlarm(
    environmentName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-error-alarm-${this.regionSuffix}`,
      {
        name: `nova-5xx-errors-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'This metric monitors 5XX errors',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: environmentName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create Environment Health Alarm
   */
  public createHealthAlarm(
    environmentName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-health-alarm-${this.regionSuffix}`,
      {
        name: `nova-env-health-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'EnvironmentHealth',
        namespace: 'AWS/ElasticBeanstalk',
        period: 60,
        statistic: 'Average',
        threshold: 15,
        alarmDescription: 'This metric monitors environment health',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          EnvironmentName: environmentName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create Response Time Alarm
   */
  public createResponseTimeAlarm(
    lbFullName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-response-time-alarm-${this.regionSuffix}`,
      {
        name: `nova-response-time-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'This metric monitors response time',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: lbFullName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  // Property getters for easy access
  public get snsTopicArn(): Output<string> {
    return this.snsTopic.arn;
  }

  public get dashboardName(): Output<string> {
    return this.dashboard.dashboardName;
  }
}
```

<!-- /lib/components/networking.ts -->
```ts
/**
 * Networking Infrastructure Component
 * Handles VPC, subnets, security groups, and network-related resources
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

interface NetworkingInfrastructureArgs {
  region: string;
  isPrimary: boolean;
  environment: string;
  tags: Record<string, string>;
}

export class NetworkingInfrastructure extends ComponentResource {
  private readonly region: string;
  private readonly isPrimary: boolean;
  private readonly environment: string;
  private readonly tags: Record<string, string>;
  private readonly regionSuffix: string;
  private readonly provider?: aws.Provider;
  private readonly vpcCidr: string;

  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[] = [];
  public readonly privateSubnets: aws.ec2.Subnet[] = [];
  public readonly natGateways: aws.ec2.NatGateway[] = [];
  public readonly privateRts: aws.ec2.RouteTable[] = [];
  public readonly igw: aws.ec2.InternetGateway;
  public readonly publicRt: aws.ec2.RouteTable;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ebSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: NetworkingInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:Networking', name, {}, opts);

    this.region = args.region;
    this.isPrimary = args.isPrimary;
    this.environment = args.environment;
    this.tags = args.tags;
    this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');

    this.provider = opts?.provider as aws.Provider | undefined;
    this.vpcCidr = args.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16';

    this.vpc = this.createVpc();
    this.igw = this.createInternetGateway();
    this.albSecurityGroup = this.createAlbSecurityGroup();
    this.ebSecurityGroup = this.createEbSecurityGroup();

    // Create subnets and route tables synchronously to avoid readonly issues
    this.createSubnets();
    this.createNatGateways();
    this.publicRt = this.createRouteTablesAndAssociations();

    this.registerOutputs({
      vpcId: this.vpc.id,
      vpcCidr: this.vpc.cidrBlock,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      albSecurityGroupId: this.albSecurityGroup.id,
      ebSecurityGroupId: this.ebSecurityGroup.id,
    });
  }

  /**
   * Create VPC with DNS support
   */
  private createVpc(): aws.ec2.Vpc {
    return new aws.ec2.Vpc(
      `vpc-${this.regionSuffix}`,
      {
        cidrBlock: this.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...this.tags, Name: `nova-vpc-${this.regionSuffix}` },
      },
      { parent: this }
    );
  }

  /**
   * Get availability zones for the region with fallback
   */
  private getAvailabilityZones(): string[] {
    // Region-specific AZ mapping for reliable deployments
    const regionAzMap: Record<string, string[]> = {
      'us-east-1': ['us-east-1a', 'us-east-1b'],
      'us-east-2': ['us-east-2a', 'us-east-2b'],
      'us-west-1': ['us-west-1a', 'us-west-1c'], // us-west-1 doesn't have 'b'
      'us-west-2': ['us-west-2a', 'us-west-2b'],
      'us-gov-east-1': ['us-gov-east-1a', 'us-gov-east-1b'],
      'us-gov-west-1': ['us-gov-west-1a', 'us-gov-west-1b'],
      'eu-west-1': ['eu-west-1a', 'eu-west-1b'],
      'eu-central-1': ['eu-central-1a', 'eu-central-1b'],
      'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b'],
      'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c'],
    };

    const availableAzs = regionAzMap[this.region];
    if (availableAzs) {
      console.log(`Using known AZs for ${this.region}:`, availableAzs);
      return availableAzs;
    }

    // Fallback for unknown regions
    console.log(`Unknown region ${this.region}, using fallback AZs`);
    return [`${this.region}a`, `${this.region}c`];
  }

  /**
   * Create public and private subnets across multiple AZs
   */
  private createSubnets(): void {
    const availableAzs = this.getAvailabilityZones();
    const numAzsToUse = Math.min(2, availableAzs.length);
    const base = this.isPrimary ? 0 : 1;
    const publicBase = 100;
    const privateBase = 120;

    console.log(
      `Creating subnets in ${numAzsToUse} AZs for ${this.region}`
    );

    for (let i = 0; i < numAzsToUse; i++) {
      const azName = availableAzs[i];
      const publicCidr = `10.${base}.${publicBase + i}.0/24`;
      const privateCidr = `10.${base}.${privateBase + i}.0/24`;

      console.log(`Creating subnets in AZ: ${azName}`);

      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${this.regionSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: publicCidr,
          availabilityZone: azName,
          mapPublicIpOnLaunch: true,
          tags: { ...this.tags, Name: `nova-public-${i}-${this.regionSuffix}` },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );
      this.publicSubnets.push(publicSubnet);

      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${this.regionSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: privateCidr,
          availabilityZone: azName,
          tags: {
            ...this.tags,
            Name: `nova-private-${i}-${this.regionSuffix}`,
          },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );
      this.privateSubnets.push(privateSubnet);
    }

    console.log(
      `Created ${this.publicSubnets.length} public and ${this.privateSubnets.length} private subnets`
    );
  }

  /**
   * Create Internet Gateway for public internet access
   */
  private createInternetGateway(): aws.ec2.InternetGateway {
    return new aws.ec2.InternetGateway(
      `igw-${this.regionSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `nova-igw-${this.regionSuffix}` },
      },
      { parent: this, provider: this.provider }
    );
  }

  /**
   * Create NAT Gateways for private subnet internet access
   */
  private createNatGateways(): void {
    console.log(`Creating ${this.publicSubnets.length} NAT Gateways...`);

    // Create one NAT Gateway per public subnet
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const publicSubnet = this.publicSubnets[i];

      const eip = new aws.ec2.Eip(
        `nat-eip-${i}-${this.regionSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...this.tags,
            Name: `nova-nat-eip-${i}-${this.regionSuffix}`,
          },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );

      const natGw = new aws.ec2.NatGateway(
        `nat-gw-${i}-${this.regionSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: { ...this.tags, Name: `nova-nat-gw-${i}-${this.regionSuffix}` },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );
      this.natGateways.push(natGw);
    }

    console.log(`Created ${this.natGateways.length} NAT Gateways`);
  }

  /**
   * Create and configure route tables
   */
  private createRouteTablesAndAssociations(): aws.ec2.RouteTable {
    console.log('Creating route tables and associations...');

    const publicRt = new aws.ec2.RouteTable(
      `public-rt-${this.regionSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.igw.id,
          },
        ],
        tags: { ...this.tags, Name: `nova-public-rt-${this.regionSuffix}` },
      },
      { parent: this, provider: this.provider }
    );

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const subnet = this.publicSubnets[i];
      new aws.ec2.RouteTableAssociation(
        `public-rt-assoc-${i}-${this.regionSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRt.id,
        },
        { parent: this, provider: this.provider }
      );
    }

    // Create private route tables and associations
    for (
      let i = 0;
      i < this.privateSubnets.length && i < this.natGateways.length;
      i++
    ) {
      const subnet = this.privateSubnets[i];
      const natGw = this.natGateways[i];

      const privateRt = new aws.ec2.RouteTable(
        `private-rt-${i}-${this.regionSuffix}`,
        {
          vpcId: this.vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              natGatewayId: natGw.id,
            },
          ],
          tags: {
            ...this.tags,
            Name: `nova-private-rt-${i}-${this.regionSuffix}`,
          },
        },
        { parent: this }
      );
      this.privateRts.push(privateRt);

      new aws.ec2.RouteTableAssociation(
        `private-rt-assoc-${i}-${this.regionSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRt.id,
        },
        { parent: this }
      );
    }

    console.log(
      `Created public route table and ${this.privateRts.length} private route tables`
    );
    return publicRt;
  }

  /**
   * Create security group for Application Load Balancer
   */
  private createAlbSecurityGroup(): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(
      `alb-sg-${this.regionSuffix}`,
      {
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...this.tags, Name: `nova-alb-sg-${this.regionSuffix}` },
      },
      { parent: this }
    );
  }

  /**
   * Create security group for Elastic Beanstalk instances
   */
  private createEbSecurityGroup(): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(
      `eb-sg-${this.regionSuffix}`,
      {
        description: 'Security group for Elastic Beanstalk instances',
        vpcId: this.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [this.albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: [this.vpcCidr],
            description: 'SSH from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...this.tags, Name: `nova-eb-sg-${this.regionSuffix}` },
      },
      { parent: this }
    );
  }

  // Property getters for easy access
  public get vpcId(): pulumi.Output<string> {
    return this.vpc.id;
  }

  public get publicSubnetIds(): pulumi.Output<string>[] {
    return this.publicSubnets.map(subnet => subnet.id);
  }

  public get privateSubnetIds(): pulumi.Output<string>[] {
    return this.privateSubnets.map(subnet => subnet.id);
  }

  public get albSecurityGroupId(): pulumi.Output<string> {
    return this.albSecurityGroup.id;
  }

  public get ebSecurityGroupId(): pulumi.Output<string> {
    return this.ebSecurityGroup.id;
  }
}
```







