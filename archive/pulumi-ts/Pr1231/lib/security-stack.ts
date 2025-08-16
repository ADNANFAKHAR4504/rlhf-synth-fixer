/**
 * security-stack.ts
 *
 * This module defines the SecurityStack class, a Pulumi ComponentResource that creates
 * a secure three-tier web application stack on AWS.
 *
 * It includes VPC with public/private subnets, RDS PostgreSQL, EC2 Auto Scaling Group,
 * Application Load Balancer with WAF, and CloudWatch monitoring with SNS alerts.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * SecurityStackArgs defines the input arguments for the SecurityStack component.
 */
export interface SecurityStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * VPC CIDR block. Defaults to '10.0.0.0/16'
   */
  vpcCidr?: string;

  /**
   * Database instance class. Defaults to 'db.t3.micro'
   */
  dbInstanceClass?: string;

  /**
   * EC2 instance type for Auto Scaling Group. Defaults to 't3.micro'
   */
  instanceType?: string;

  /**
   * AWS region to deploy resources. Defaults to 'us-west-2'
   */
  region?: string;
}

/**
 * SecurityStackOutputs defines the outputs from the SecurityStack component.
 */
export interface SecurityStackOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  albDnsName: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
}

/**
 * SecurityStack creates a secure three-tier web application infrastructure.
 *
 * This component creates:
 * - VPC with public and private subnets across multiple AZs
 * - Security Groups with least privilege access
 * - RDS PostgreSQL with encryption and monitoring
 * - EC2 Auto Scaling Group in private subnets
 * - Application Load Balancer with WAF protection
 * - SNS and CloudWatch monitoring
 */
export class SecurityStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  // Additional outputs for integration testing
  public readonly albArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly wafWebAclArn: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;

  /**
   * Creates a new SecurityStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: SecurityStackArgs, opts?: ResourceOptions) {
    super('tap:security:SecurityStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';
    const dbInstanceClass = args.dbInstanceClass || 'db.t3.micro';
    const instanceType = args.instanceType || 't3.micro';

    // Get availability zones for the specified region
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: opts?.provider }
    );

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `secure-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `secure-vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `secure-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `secure-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create NAT Gateway EIP
    const natEip = new aws.ec2.Eip(
      `secure-nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `secure-nat-eip-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this, dependsOn: [igw] }
    );

    // Create public subnets (2 AZs for high availability)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `secure-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `secure-public-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'Public',
            ...tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `secure-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            Name: `secure-private-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'Private',
            ...tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Create NAT Gateway in first public subnet
    const natGateway = new aws.ec2.NatGateway(
      `secure-nat-gateway-${environmentSuffix}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          Name: `secure-nat-gateway-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this, dependsOn: [igw] }
    );

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `secure-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: {
          Name: `secure-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `secure-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          Name: `secure-private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Associate route tables with subnets
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `secure-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `secure-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Security Groups
    // ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        name: `alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Application Security Group
    const appSecurityGroup = new aws.ec2.SecurityGroup(
      `app-sg-${environmentSuffix}`,
      {
        name: `app-sg-${environmentSuffix}`,
        description: 'Security group for application servers',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow application traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `app-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Database Security Group
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        name: `db-sg-${environmentSuffix}`,
        description: 'Security group for RDS PostgreSQL database',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [appSecurityGroup.id],
            description: 'Allow PostgreSQL traffic from application servers',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `db-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create RDS Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `secure-db-subnet-group-${environmentSuffix}`,
      {
        name: `secure-db-subnet-group-${environmentSuffix}`,
        subnetIds: privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `secure-db-subnet-group-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance
    const rdsInstance = new aws.rds.Instance(
      `secure-postgres-${environmentSuffix}`,
      {
        identifier: `secure-postgres-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15',
        instanceClass: dbInstanceClass,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,
        dbName: 'secureapp',
        username: 'postgres',
        password: pulumi.secret('SecurePassword123!'),
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: false, //kept intentional for deletion afrer PR is merged
        skipFinalSnapshot: true, //kept intentional for deletion afrer PR is merged
        finalSnapshotIdentifier: `secure-postgres-final-snapshot-${environmentSuffix}`,
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: {
          Name: `secure-postgres-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
    const amiId = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
        ],
      },
      { provider: opts?.provider }
    );

    // Create Launch Template for Auto Scaling Group
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `secure-launch-template-${environmentSuffix}`,
      {
        name: `secure-launch-template-${environmentSuffix}`,
        imageId: amiId.then(ami => ami.id),
        instanceType: instanceType,
        vpcSecurityGroupIds: [appSecurityGroup.id],
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure Web Application</h1>" > /var/www/html/index.html
      `
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `secure-instance-${environmentSuffix}`,
              ...tags,
            },
          },
        ],
        tags: {
          Name: `secure-launch-template-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `secure-asg-${environmentSuffix}`,
      {
        name: `secure-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [], // Will be updated after ALB target group creation
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `secure-asg-${environmentSuffix}`,
            propagateAtLaunch: false,
          },
          ...Object.entries(tags).map(([key, value]) => ({
            key,
            value: value.toString(),
            propagateAtLaunch: false,
          })),
        ],
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const applicationLoadBalancer = new aws.lb.LoadBalancer(
      `secure-alb-${environmentSuffix}`,
      {
        name: `secure-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        internal: false,
        subnets: publicSubnets.map(subnet => subnet.id),
        securityGroups: [albSecurityGroup.id],
        enableDeletionProtection: false,
        tags: {
          Name: `secure-alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `secure-tg-${environmentSuffix}`,
      {
        name: `secure-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `secure-tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Update Auto Scaling Group with Target Group
    new aws.autoscaling.Attachment(
      `secure-asg-attachment-${environmentSuffix}`,
      {
        autoscalingGroupName: autoScalingGroup.name,
        lbTargetGroupArn: targetGroup.arn,
      },
      { parent: this }
    );

    // Create ALB Listener
    new aws.lb.Listener(
      `secure-listener-${environmentSuffix}`,
      {
        loadBalancerArn: applicationLoadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Create WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl(
      `secure-waf-${environmentSuffix}`,
      {
        name: `secure-waf-${environmentSuffix}`,
        description: 'WAF for secure web application',
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'secureWebACL',
        },
        tags: {
          Name: `secure-waf-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `secure-waf-association-${environmentSuffix}`,
      {
        resourceArn: applicationLoadBalancer.arn,
        webAclArn: webAcl.arn,
      },
      { parent: this }
    );

    // Create SNS Topic for alerts
    const snsTopic = new aws.sns.Topic(
      `secure-alerts-${environmentSuffix}`,
      {
        name: `secure-alerts-${environmentSuffix}`,
        displayName: 'Secure Application Alerts',
        tags: {
          Name: `secure-alerts-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Alarm for RDS CPU Utilization
    new aws.cloudwatch.MetricAlarm(
      `secure-rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `secure-rds-cpu-alarm-${environmentSuffix}`,
        alarmDescription: 'Monitor RDS CPU utilization',
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 80,
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        alarmActions: [snsTopic.arn],
        okActions: [snsTopic.arn],
        treatMissingData: 'breaching',
        tags: {
          Name: `secure-rds-cpu-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.all(publicSubnets.map(subnet => subnet.id));
    this.privateSubnetIds = pulumi.all(privateSubnets.map(subnet => subnet.id));
    this.albDnsName = applicationLoadBalancer.dnsName;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.snsTopicArn = snsTopic.arn;
    // Additional outputs for integration testing
    this.albArn = applicationLoadBalancer.arn;
    this.targetGroupArn = targetGroup.arn;
    this.autoScalingGroupName = autoScalingGroup.name;
    this.launchTemplateId = launchTemplate.id;
    this.wafWebAclArn = webAcl.arn;
    this.dbSecurityGroupId = dbSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.albSecurityGroupId = albSecurityGroup.id;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albDnsName: this.albDnsName,
      rdsEndpoint: this.rdsEndpoint,
      snsTopicArn: this.snsTopicArn,
      // Additional outputs for integration testing
      albArn: this.albArn,
      targetGroupArn: this.targetGroupArn,
      autoScalingGroupName: this.autoScalingGroupName,
      launchTemplateId: this.launchTemplateId,
      wafWebAclArn: this.wafWebAclArn,
      dbSecurityGroupId: this.dbSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      albSecurityGroupId: this.albSecurityGroupId,
    });
  }
}
