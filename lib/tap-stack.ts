import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DataAwsElasticBeanstalkSolutionStack } from '@cdktf/provider-aws/lib/data-aws-elastic-beanstalk-solution-stack';
import { ElasticBeanstalkApplication } from '@cdktf/provider-aws/lib/elastic-beanstalk-application';
import { ElasticBeanstalkEnvironment } from '@cdktf/provider-aws/lib/elastic-beanstalk-environment';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketWebsiteConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration';
import { DataAwsLb } from '@cdktf/provider-aws/lib/data-aws-lb';

interface TapStackConfig {
  env: {
    region: string;
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const region = config.env.region;
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // 1. AWS Provider and VPC Setup
    new AwsProvider(this, 'aws', { region });

    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
    });

    const igw = new InternetGateway(this, 'main-igw', { vpcId: vpc.id });

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });

    const publicSubnetA = new Subnet(this, 'public-subnet-a', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
    });

    const publicSubnetB = new Subnet(this, 'public-subnet-b', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
    });

    new RouteTableAssociation(this, 'public-rta-a', {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-b', {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    const privateSubnetA = new Subnet(this, 'private-subnet-a', {
      vpcId: vpc.id,
      cidrBlock: '10.0.101.0/24',
      availabilityZone: `${region}a`,
    });

    const privateSubnetB = new Subnet(this, 'private-subnet-b', {
      vpcId: vpc.id,
      cidrBlock: '10.0.102.0/24',
      availabilityZone: `${region}b`,
    });

    // 2. Security Groups
    const ebSg = new SecurityGroup(this, 'eb-sg', {
      name: `eb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow HTTP traffic to Elastic Beanstalk',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow traffic from Beanstalk to RDS',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [ebSg.id],
        },
      ],
    });

    // 3. IAM Roles (Least Privilege)
    const ebServiceRole = new IamRole(this, 'eb-service-role', {
      name: `eb-service-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'elasticbeanstalk.amazonaws.com' },
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, 'eb-service-policy', {
      role: ebServiceRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService',
    });

    const ebInstanceRole = new IamRole(this, 'eb-instance-role', {
      name: `eb-instance-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, 'eb-instance-policy', {
      role: ebInstanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier',
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'eb-instance-profile',
      {
        name: `eb-instance-profile-${randomSuffix}`,
        role: ebInstanceRole.name,
      }
    );

    // 4. RDS Database (Multi-AZ)
    const dbSubnetGroup = new DbSubnetGroup(this, 'rds-subnet-group', {
      name: `rds-subnet-group-${randomSuffix}`,
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
    });

    new DbInstance(this, 'rds-instance', {
      identifier: `rds-db-${randomSuffix}`,
      allocatedStorage: 20,
      instanceClass: 'db.t3.micro',
      engine: 'postgres',
      engineVersion: '15',
      username: 'adminUSer',
      password: 'MustBeChangedInSecretsManager1',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      multiAz: true,
      skipFinalSnapshot: true,
    });

    // 5. Elastic Beanstalk Application
    const solutionStack = new DataAwsElasticBeanstalkSolutionStack(
      this,
      'node-js-lts-solution-stack',
      {
        mostRecent: true,
        nameRegex: '^64bit Amazon Linux.* running Node.js 22$',
      }
    );

    const app = new ElasticBeanstalkApplication(this, 'beanstalk-app', {
      name: `webapp-${randomSuffix}`,
    });

    const ebEnv = new ElasticBeanstalkEnvironment(this, 'beanstalk-env', {
      name: `webapp-env-${randomSuffix}`,
      application: app.name,
      solutionStackName: solutionStack.name,
      setting: [
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          name: 'IamInstanceProfile',
          value: instanceProfile.name,
        },
        { namespace: 'aws:ec2:vpc', name: 'VPCId', value: vpc.id },
        {
          namespace: 'aws:ec2:vpc',
          name: 'Subnets',
          value: `${publicSubnetA.id},${publicSubnetB.id}`,
        },
        {
          namespace: 'aws:ec2:vpc',
          name: 'ELBSubnets',
          value: `${publicSubnetA.id},${publicSubnetB.id}`,
        },
        {
          namespace: 'aws:ec2:vpc',
          name: 'AssociatePublicIpAddress',
          value: 'true',
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          name: 'ServiceRole',
          value: ebServiceRole.arn,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          name: 'LoadBalancerType',
          value: 'application',
        },
        {
          namespace: 'aws:elasticbeanstalk:healthreporting:system',
          name: 'SystemType',
          value: 'enhanced',
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          name: 'SecurityGroups',
          value: ebSg.id,
        },
      ],
    });

    // 6. Route 53 DNS Failover
    const zone = new Route53Zone(this, 'zone', {
      name: `my-resilient-app-${randomSuffix}.com`,
    });

    const healthCheck = new Route53HealthCheck(this, 'eb-health-check', {
      fqdn: ebEnv.cname,
      port: 80,
      type: 'HTTP',
      failureThreshold: 3,
      requestInterval: 30,
    });

    // Get the ARN of the load balancer created by the Elastic Beanstalk environment
    const albArn = Fn.element(ebEnv.loadBalancers, 0);

    // Use a data source to get the load balancer's details
    const albData = new DataAwsLb(this, 'eb-alb-data', {
      arn: albArn,
    });

    // Create the Route 53 record using the dynamically looked-up data
    new Route53Record(this, 'primary-record', {
      zoneId: zone.zoneId,
      name: `www.${zone.name}`,
      type: 'A',
      alias: {
        name: albData.dnsName,
        zoneId: albData.zoneId,
        evaluateTargetHealth: true,
      },
      failoverRoutingPolicy: { type: 'PRIMARY' },
      setIdentifier: 'primary-eb-environment',
      healthCheckId: healthCheck.id,
    });

    const failoverS3Bucket = new S3Bucket(this, 'failover-bucket', {
      bucket: `failover-bucket-${randomSuffix}`,
    });

    const failoverWebsiteConfig = new S3BucketWebsiteConfiguration(
      this,
      'failover-website',
      {
        bucket: failoverS3Bucket.bucket,
        indexDocument: { suffix: 'index.html' },
      }
    );

    new Route53Record(this, 'secondary-record', {
      zoneId: zone.zoneId,
      name: `www.${zone.name}`,
      type: 'A',
      alias: {
        name: failoverWebsiteConfig.websiteDomain,
        zoneId: failoverS3Bucket.hostedZoneId,
        evaluateTargetHealth: false,
      },
      failoverRoutingPolicy: { type: 'SECONDARY' },
      setIdentifier: 'secondary-failover-s3',
    });

    // 7. CloudWatch Alarms
    const snsTopic = new SnsTopic(this, 'alarm-topic', {
      name: `eb-alarm-topic-${randomSuffix}`,
    });
    new SnsTopicSubscription(this, 'alarm-email-subscription', {
      topicArn: snsTopic.arn,
      protocol: 'email',
      endpoint: 'monitoring-alerts@example.com',
    });

    new CloudwatchMetricAlarm(this, 'eb-health-alarm', {
      alarmName: `eb-unhealthy-env-alarm-${randomSuffix}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'EnvironmentHealth',
      namespace: 'AWS/ElasticBeanstalk',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      dimensions: { EnvironmentName: ebEnv.name },
      alarmActions: [snsTopic.arn],
    });
  }
}
