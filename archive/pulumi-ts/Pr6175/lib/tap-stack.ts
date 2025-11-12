/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
* tap-stack.ts
*
* This module defines the TapStack class for a multi-region trading application
* failover system with automated cross-region disaster recovery capabilities.
*
* Architecture:
* - Primary region: eu-south-1 (Milan) with 2 instances
* - Standby region: eu-central-1 (Frankfurt) with 1 instance
* - Direct ALB DNS routing (no custom domain)
* - DynamoDB global table for session replication
* - Route53 health checks for monitoring
* - CloudWatch alarms and SNS notifications
*
* Note: Many resources are assigned to variables but not directly referenced.
* This is intentional - Pulumi needs to track these resources for the infrastructure
* graph, even if they're not used in subsequent code.
*/
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
* TapStackArgs defines the input arguments for the TapStack Pulumi component.
*/
export interface TapStackArgs {
  /**
  * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
  * Defaults to 'dev' if not provided.
  */
  environmentSuffix?: string;
  /**
  * Optional default tags to apply to resources.
  */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
* Represents the main Pulumi component resource for the multi-region failover infrastructure.
*
* This component creates a complete cross-region disaster recovery setup including:
* - VPCs with public and private subnets in eu-south-1 and eu-central-1
* - Application Load Balancers with Auto Scaling Groups
* - DynamoDB global table for session replication
* - CloudWatch alarms and SNS notifications
*/
export class TapStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly standbyVpcId: pulumi.Output<string>;
  public readonly primaryAlbDns: pulumi.Output<string>;
  public readonly standbyAlbDns: pulumi.Output<string>;
  public readonly primaryAsgName: pulumi.Output<string>;
  public readonly standbyAsgName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly primarySnsTopicArn: pulumi.Output<string>;
  public readonly standbySnsTopicArn: pulumi.Output<string>;
  public readonly primaryHealthCheckId: pulumi.Output<string>;
  public readonly applicationUrl: pulumi.Output<string>;

  /**
  * Creates a new TapStack component with multi-region failover infrastructure.
  * @param name The logical name of this Pulumi component.
  * @param args Configuration arguments including environment suffix and tags.
  * @param opts Pulumi options.
  */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Changed regions to Milan and Frankfurt
    const primaryRegion = 'eu-south-1';
    const standbyRegion = 'eu-central-1';

    // Create primary region provider
    const primaryProvider = new aws.Provider(
      `primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    // Create standby region provider
    const standbyProvider = new aws.Provider(
      `standby-provider-${environmentSuffix}`,
      {
        region: standbyRegion,
      },
      { parent: this }
    );

    // Get availability zones for primary region
    const primaryAzs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: primaryProvider }
    );

    // Get availability zones for standby region
    const standbyAzs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: standbyProvider }
    );

    // Get latest Amazon Linux 2 AMI for primary region
    const primaryAmi = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'state', values: ['available'] },
        ],
      },
      { provider: primaryProvider }
    );

    // Get latest Amazon Linux 2 AMI for standby region
    const standbyAmi = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'state', values: ['available'] },
        ],
      },
      { provider: standbyProvider }
    );

    // ============================================
    // PRIMARY REGION INFRASTRUCTURE
    // ============================================

    // Create VPC for primary region
    const primaryVpc = new aws.ec2.Vpc(
      `primary-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `primary-vpc-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create Internet Gateway for primary VPC
    const primaryIgw = new aws.ec2.InternetGateway(
      `primary-igw-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `primary-igw-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create public subnets in primary region
    const primaryPublicSubnet1 = new aws.ec2.Subnet(
      `primary-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: primaryAzs.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `primary-public-subnet-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPublicSubnet2 = new aws.ec2.Subnet(
      `primary-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: primaryAzs.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `primary-public-subnet-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create private subnets in primary region
    const primaryPrivateSubnet1 = new aws.ec2.Subnet(
      `primary-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: primaryAzs.then(azs => azs.names[0]),
        tags: {
          Name: `primary-private-subnet-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPrivateSubnet2 = new aws.ec2.Subnet(
      `primary-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: primaryAzs.then(azs => azs.names[1]),
        tags: {
          Name: `primary-private-subnet-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create Elastic IPs for NAT Gateways in primary region
    const primaryNatEip1 = new aws.ec2.Eip(
      `primary-nat-eip-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `primary-nat-eip-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryNatEip2 = new aws.ec2.Eip(
      `primary-nat-eip-2-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `primary-nat-eip-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create NAT Gateways in primary region
    const primaryNatGw1 = new aws.ec2.NatGateway(
      `primary-nat-gw-1-${environmentSuffix}`,
      {
        allocationId: primaryNatEip1.id,
        subnetId: primaryPublicSubnet1.id,
        tags: {
          Name: `primary-nat-gw-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this, dependsOn: [primaryIgw] }
    );

    const primaryNatGw2 = new aws.ec2.NatGateway(
      `primary-nat-gw-2-${environmentSuffix}`,
      {
        allocationId: primaryNatEip2.id,
        subnetId: primaryPublicSubnet2.id,
        tags: {
          Name: `primary-nat-gw-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this, dependsOn: [primaryIgw] }
    );

    // Create route tables for private subnets in primary region
    const primaryPrivateRouteTable1 = new aws.ec2.RouteTable(
      `primary-private-rt-1-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `primary-private-rt-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPrivateRouteTable2 = new aws.ec2.RouteTable(
      `primary-private-rt-2-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `primary-private-rt-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Add routes to NAT Gateways for private subnets in primary region
    const _primaryPrivateRoute1 = new aws.ec2.Route(
      `primary-private-route-1-${environmentSuffix}`,
      {
        routeTableId: primaryPrivateRouteTable1.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: primaryNatGw1.id,
      },
      { provider: primaryProvider, parent: this }
    );

    const _primaryPrivateRoute2 = new aws.ec2.Route(
      `primary-private-route-2-${environmentSuffix}`,
      {
        routeTableId: primaryPrivateRouteTable2.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: primaryNatGw2.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Associate private subnets with their route tables in primary region
    const _primaryPrivateRtAssoc1 = new aws.ec2.RouteTableAssociation(
      `primary-private-rta-1-${environmentSuffix}`,
      {
        subnetId: primaryPrivateSubnet1.id,
        routeTableId: primaryPrivateRouteTable1.id,
      },
      { provider: primaryProvider, parent: this }
    );

    const _primaryPrivateRtAssoc2 = new aws.ec2.RouteTableAssociation(
      `primary-private-rta-2-${environmentSuffix}`,
      {
        subnetId: primaryPrivateSubnet2.id,
        routeTableId: primaryPrivateRouteTable2.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Create route table for public subnets in primary region
    const primaryPublicRouteTable = new aws.ec2.RouteTable(
      `primary-public-rt-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `primary-public-rt-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Add route to Internet Gateway
    const _primaryPublicRoute = new aws.ec2.Route(
      `primary-public-route-${environmentSuffix}`,
      {
        routeTableId: primaryPublicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: primaryIgw.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Associate public subnets with route table
    const _primaryPublicRtAssoc1 = new aws.ec2.RouteTableAssociation(
      `primary-public-rta-1-${environmentSuffix}`,
      {
        subnetId: primaryPublicSubnet1.id,
        routeTableId: primaryPublicRouteTable.id,
      },
      { provider: primaryProvider, parent: this }
    );

    const _primaryPublicRtAssoc2 = new aws.ec2.RouteTableAssociation(
      `primary-public-rta-2-${environmentSuffix}`,
      {
        subnetId: primaryPublicSubnet2.id,
        routeTableId: primaryPublicRouteTable.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Create security group for ALB in primary region
    const primaryAlbSg = new aws.ec2.SecurityGroup(
      `primary-alb-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `primary-alb-sg-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create security group for instances in primary region
    const primaryInstanceSg = new aws.ec2.SecurityGroup(
      `primary-instance-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [primaryAlbSg.id],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `primary-instance-sg-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `ec2-role-${environmentSuffix}`,
      {
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
        tags: {
          Name: `ec2-role-${environmentSuffix}`,
          Environment: 'Production',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM policy for DynamoDB and CloudWatch access
    const _ec2Policy = new aws.iam.RolePolicy(
      `ec2-policy-${environmentSuffix}`,
      {
        role: ec2Role.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create instance profile
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `ec2-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: {
          Name: `ec2-profile-${environmentSuffix}`,
          Environment: 'Production',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Launch Template for primary region
    const primaryLaunchTemplate = new aws.ec2.LaunchTemplate(
      `primary-lt-${environmentSuffix}`,
      {
        namePrefix: `primary-lt-${environmentSuffix}`,
        imageId: primaryAmi.then(ami => ami.id),
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: ec2InstanceProfile.arn,
        },
        vpcSecurityGroupIds: [primaryInstanceSg.id],
        userData: pulumi
          .output(
            `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "Primary Region (Milan) - Trading Application" > /var/www/html/index.html
`
          )
          .apply(str => Buffer.from(str).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `primary-instance-${environmentSuffix}`,
              Environment: 'Production',
              FailoverRole: 'Primary',
              ...tags,
            },
          },
        ],
        tags: {
          Name: `primary-lt-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create Application Load Balancer for primary region
    const primaryAlb = new aws.lb.LoadBalancer(
      `primary-alb-${environmentSuffix}`,
      {
        loadBalancerType: 'application',
        securityGroups: [primaryAlbSg.id],
        subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
        tags: {
          Name: `primary-alb-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create target group for primary ALB
    const primaryTargetGroup = new aws.lb.TargetGroup(
      `primary-tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: primaryVpc.id,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `primary-tg-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create listener for primary ALB
    const _primaryListener = new aws.lb.Listener(
      `primary-listener-${environmentSuffix}`,
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryTargetGroup.arn,
          },
        ],
        tags: {
          Name: `primary-listener-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create Auto Scaling Group for primary region
    const primaryAsg = new aws.autoscaling.Group(
      `primary-asg-${environmentSuffix}`,
      {
        desiredCapacity: 2,
        maxSize: 4,
        minSize: 1,
        vpcZoneIdentifiers: [
          primaryPrivateSubnet1.id,
          primaryPrivateSubnet2.id,
        ],
        targetGroupArns: [primaryTargetGroup.arn],
        launchTemplate: {
          id: primaryLaunchTemplate.id,
          version: '$Latest',
        },
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        tags: [
          {
            key: 'Name',
            value: `primary-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'Production',
            propagateAtLaunch: true,
          },
          {
            key: 'FailoverRole',
            value: 'Primary',
            propagateAtLaunch: true,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // Create Auto Scaling Policy for primary region
    const _primaryScalingPolicy = new aws.autoscaling.Policy(
      `primary-scaling-policy-${environmentSuffix}`,
      {
        autoscalingGroupName: primaryAsg.name,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          targetValue: 70.0,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Create SNS topic for primary region
    const primarySnsTopic = new aws.sns.Topic(
      `primary-sns-topic-${environmentSuffix}`,
      {
        name: `primary-failover-notifications-${environmentSuffix}`,
        tags: {
          Name: `primary-sns-topic-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ============================================
    // STANDBY REGION INFRASTRUCTURE
    // ============================================

    // Create VPC for standby region
    const standbyVpc = new aws.ec2.Vpc(
      `standby-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `standby-vpc-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create Internet Gateway for standby VPC
    const standbyIgw = new aws.ec2.InternetGateway(
      `standby-igw-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        tags: {
          Name: `standby-igw-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create public subnets in standby region
    const standbyPublicSubnet1 = new aws.ec2.Subnet(
      `standby-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        cidrBlock: '10.1.1.0/24',
        availabilityZone: standbyAzs.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `standby-public-subnet-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    const standbyPublicSubnet2 = new aws.ec2.Subnet(
      `standby-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        cidrBlock: '10.1.2.0/24',
        availabilityZone: standbyAzs.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `standby-public-subnet-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create private subnets in standby region
    const standbyPrivateSubnet1 = new aws.ec2.Subnet(
      `standby-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        cidrBlock: '10.1.11.0/24',
        availabilityZone: standbyAzs.then(azs => azs.names[0]),
        tags: {
          Name: `standby-private-subnet-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    const standbyPrivateSubnet2 = new aws.ec2.Subnet(
      `standby-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        cidrBlock: '10.1.12.0/24',
        availabilityZone: standbyAzs.then(azs => azs.names[1]),
        tags: {
          Name: `standby-private-subnet-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create Elastic IPs for NAT Gateways in standby region
    const standbyNatEip1 = new aws.ec2.Eip(
      `standby-nat-eip-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `standby-nat-eip-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    const standbyNatEip2 = new aws.ec2.Eip(
      `standby-nat-eip-2-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `standby-nat-eip-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create NAT Gateways in standby region
    const standbyNatGw1 = new aws.ec2.NatGateway(
      `standby-nat-gw-1-${environmentSuffix}`,
      {
        allocationId: standbyNatEip1.id,
        subnetId: standbyPublicSubnet1.id,
        tags: {
          Name: `standby-nat-gw-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this, dependsOn: [standbyIgw] }
    );

    const standbyNatGw2 = new aws.ec2.NatGateway(
      `standby-nat-gw-2-${environmentSuffix}`,
      {
        allocationId: standbyNatEip2.id,
        subnetId: standbyPublicSubnet2.id,
        tags: {
          Name: `standby-nat-gw-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this, dependsOn: [standbyIgw] }
    );

    // Create route tables for private subnets in standby region
    const standbyPrivateRouteTable1 = new aws.ec2.RouteTable(
      `standby-private-rt-1-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        tags: {
          Name: `standby-private-rt-1-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    const standbyPrivateRouteTable2 = new aws.ec2.RouteTable(
      `standby-private-rt-2-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        tags: {
          Name: `standby-private-rt-2-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Add routes to NAT Gateways for private subnets in standby region
    const _standbyPrivateRoute1 = new aws.ec2.Route(
      `standby-private-route-1-${environmentSuffix}`,
      {
        routeTableId: standbyPrivateRouteTable1.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: standbyNatGw1.id,
      },
      { provider: standbyProvider, parent: this }
    );

    const _standbyPrivateRoute2 = new aws.ec2.Route(
      `standby-private-route-2-${environmentSuffix}`,
      {
        routeTableId: standbyPrivateRouteTable2.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: standbyNatGw2.id,
      },
      { provider: standbyProvider, parent: this }
    );

    // Associate private subnets with their route tables in standby region
    const _standbyPrivateRtAssoc1 = new aws.ec2.RouteTableAssociation(
      `standby-private-rta-1-${environmentSuffix}`,
      {
        subnetId: standbyPrivateSubnet1.id,
        routeTableId: standbyPrivateRouteTable1.id,
      },
      { provider: standbyProvider, parent: this }
    );

    const _standbyPrivateRtAssoc2 = new aws.ec2.RouteTableAssociation(
      `standby-private-rta-2-${environmentSuffix}`,
      {
        subnetId: standbyPrivateSubnet2.id,
        routeTableId: standbyPrivateRouteTable2.id,
      },
      { provider: standbyProvider, parent: this }
    );

    // Create route table for public subnets in standby region
    const standbyPublicRouteTable = new aws.ec2.RouteTable(
      `standby-public-rt-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        tags: {
          Name: `standby-public-rt-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Add route to Internet Gateway
    const _standbyPublicRoute = new aws.ec2.Route(
      `standby-public-route-${environmentSuffix}`,
      {
        routeTableId: standbyPublicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: standbyIgw.id,
      },
      { provider: standbyProvider, parent: this }
    );

    // Associate public subnets with route table
    const _standbyPublicRtAssoc1 = new aws.ec2.RouteTableAssociation(
      `standby-public-rta-1-${environmentSuffix}`,
      {
        subnetId: standbyPublicSubnet1.id,
        routeTableId: standbyPublicRouteTable.id,
      },
      { provider: standbyProvider, parent: this }
    );

    const _standbyPublicRtAssoc2 = new aws.ec2.RouteTableAssociation(
      `standby-public-rta-2-${environmentSuffix}`,
      {
        subnetId: standbyPublicSubnet2.id,
        routeTableId: standbyPublicRouteTable.id,
      },
      { provider: standbyProvider, parent: this }
    );

    // Create security group for ALB in standby region
    const standbyAlbSg = new aws.ec2.SecurityGroup(
      `standby-alb-sg-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        description: 'Security group for standby ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `standby-alb-sg-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create security group for instances in standby region
    const standbyInstanceSg = new aws.ec2.SecurityGroup(
      `standby-instance-sg-${environmentSuffix}`,
      {
        vpcId: standbyVpc.id,
        description: 'Security group for standby instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [standbyAlbSg.id],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `standby-instance-sg-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create Launch Template for standby region
    const standbyLaunchTemplate = new aws.ec2.LaunchTemplate(
      `standby-lt-${environmentSuffix}`,
      {
        namePrefix: `standby-lt-${environmentSuffix}`,
        imageId: standbyAmi.then(ami => ami.id),
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: ec2InstanceProfile.arn,
        },
        vpcSecurityGroupIds: [standbyInstanceSg.id],
        userData: pulumi
          .output(
            `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "Standby Region (Frankfurt) - Trading Application" > /var/www/html/index.html
`
          )
          .apply(str => Buffer.from(str).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `standby-instance-${environmentSuffix}`,
              Environment: 'Production',
              FailoverRole: 'Standby',
              ...tags,
            },
          },
        ],
        tags: {
          Name: `standby-lt-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create Application Load Balancer for standby region
    const standbyAlb = new aws.lb.LoadBalancer(
      `standby-alb-${environmentSuffix}`,
      {
        loadBalancerType: 'application',
        securityGroups: [standbyAlbSg.id],
        subnets: [standbyPublicSubnet1.id, standbyPublicSubnet2.id],
        tags: {
          Name: `standby-alb-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create target group for standby ALB
    const standbyTargetGroup = new aws.lb.TargetGroup(
      `standby-tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: standbyVpc.id,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `standby-tg-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create listener for standby ALB
    const _standbyListener = new aws.lb.Listener(
      `standby-listener-${environmentSuffix}`,
      {
        loadBalancerArn: standbyAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: standbyTargetGroup.arn,
          },
        ],
        tags: {
          Name: `standby-listener-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create Auto Scaling Group for standby region
    const standbyAsg = new aws.autoscaling.Group(
      `standby-asg-${environmentSuffix}`,
      {
        desiredCapacity: 1,
        maxSize: 4,
        minSize: 1,
        vpcZoneIdentifiers: [
          standbyPrivateSubnet1.id,
          standbyPrivateSubnet2.id,
        ],
        targetGroupArns: [standbyTargetGroup.arn],
        launchTemplate: {
          id: standbyLaunchTemplate.id,
          version: '$Latest',
        },
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        tags: [
          {
            key: 'Name',
            value: `standby-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'Production',
            propagateAtLaunch: true,
          },
          {
            key: 'FailoverRole',
            value: 'Standby',
            propagateAtLaunch: true,
          },
        ],
      },
      { provider: standbyProvider, parent: this }
    );

    // Create Auto Scaling Policy for standby region
    const _standbyScalingPolicy = new aws.autoscaling.Policy(
      `standby-scaling-policy-${environmentSuffix}`,
      {
        autoscalingGroupName: standbyAsg.name,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          targetValue: 70.0,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // Create SNS topic for standby region
    const standbySnsTopic = new aws.sns.Topic(
      `standby-sns-topic-${environmentSuffix}`,
      {
        name: `standby-failover-notifications-${environmentSuffix}`,
        tags: {
          Name: `standby-sns-topic-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Standby',
          ...tags,
        },
      },
      { provider: standbyProvider, parent: this }
    );

    // ============================================
    // DYNAMODB GLOBAL TABLE
    // ============================================

    // Create DynamoDB table in primary region
    const primaryDynamoTable = new aws.dynamodb.Table(
      `trading-sessions-${environmentSuffix}`,
      {
        name: `trading-sessions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'sessionId',
        attributes: [
          {
            name: 'sessionId',
            type: 'S',
          },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        serverSideEncryption: {
          enabled: true,
        },
        replicas: [
          {
            regionName: standbyRegion,
          },
        ],
        tags: {
          Name: `trading-sessions-${environmentSuffix}`,
          Environment: 'Production',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ============================================
    // HEALTH CHECK FOR MONITORING
    // ============================================

    // Create Route 53 health check for primary ALB monitoring
    const primaryHealthCheck = new aws.route53.HealthCheck(
      `primary-health-check-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/',
        fqdn: primaryAlb.dnsName,
        port: 80,
        requestInterval: 10,
        failureThreshold: 3,
        tags: {
          Name: `primary-health-check-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for primary health check
    const _primaryHealthCheckAlarm = new aws.cloudwatch.MetricAlarm(
      `primary-health-alarm-${environmentSuffix}`,
      {
        name: `primary-health-check-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 3,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Alert when primary region health check fails',
        alarmActions: [primarySnsTopic.arn],
        dimensions: {
          HealthCheckId: primaryHealthCheck.id,
        },
        tags: {
          Name: `primary-health-alarm-${environmentSuffix}`,
          Environment: 'Production',
          FailoverRole: 'Primary',
          ...tags,
        },
      },
      { provider: primaryProvider, parent: this }
    );


    // Set public outputs
    this.primaryVpcId = primaryVpc.id;
    this.standbyVpcId = standbyVpc.id;
    this.primaryAlbDns = primaryAlb.dnsName;
    this.standbyAlbDns = standbyAlb.dnsName;
    this.primaryAsgName = primaryAsg.name;
    this.standbyAsgName = standbyAsg.name;
    this.dynamoTableName = primaryDynamoTable.name;
    this.primarySnsTopicArn = primarySnsTopic.arn;
    this.standbySnsTopicArn = standbySnsTopic.arn;
    this.primaryHealthCheckId = primaryHealthCheck.id;
    this.applicationUrl = pulumi.interpolate`http://${primaryAlb.dnsName}`;

    // Register outputs
    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      standbyVpcId: this.standbyVpcId,
      primaryAlbDns: this.primaryAlbDns,
      standbyAlbDns: this.standbyAlbDns,
      primaryAsgName: this.primaryAsgName,
      standbyAsgName: this.standbyAsgName,
      dynamoTableName: this.dynamoTableName,
      primarySnsTopicArn: this.primarySnsTopicArn,
      standbySnsTopicArn: this.standbySnsTopicArn,
      primaryHealthCheckId: this.primaryHealthCheckId,
      applicationUrl: this.applicationUrl,
    });
  }
}
