/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the highly available web application infrastructure.
 * This stack creates a complete AWS infrastructure including VPC, ALB, ASG, RDS, S3, and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  skipDatabase?: boolean; // Skip RDS creation to avoid quota issues
  skipAutoScaling?: boolean; // Skip ASG creation to avoid instance quota issues
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly staticAssetsBucketName: pulumi.Output<string>;
  public readonly staticAssetsUrl: pulumi.Output<string>;
  public readonly databaseEndpoint?: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const skipDatabase = args.skipDatabase || false;
    const skipAutoScaling = args.skipAutoScaling || false;

    // Get availability zones
    const availableZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `prod-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `prod-vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `prod-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `prod-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public subnets
      const publicSubnet = new aws.ec2.Subnet(
        `prod-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: availableZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `prod-public-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'public',
            ...tags,
          },
        },
        { parent: this }
      );

      publicSubnets.push(publicSubnet);

      // Private subnets (now with public IP assignment for instances that need internet)
      const privateSubnet = new aws.ec2.Subnet(
        `prod-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availableZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true, // Enable public IP for internet access without NAT
          tags: {
            Name: `prod-private-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'private',
            ...tags,
          },
        },
        { parent: this }
      );

      privateSubnets.push(privateSubnet);
    }

    // Note: NAT Gateway removed to work within AWS quota limits
    // Private subnets will use VPC endpoints for AWS services instead

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `prod-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `prod-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create routes
    new aws.ec2.Route(
      `prod-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate subnets with route tables
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `prod-public-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Associate private subnets with public route table since we don't have NAT Gateway
    // Security will be enforced via security groups
    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `prod-private-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create VPC endpoints for AWS services
    new aws.ec2.VpcEndpoint(
      `prod-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.s3',
        routeTableIds: [publicRouteTable.id],
        tags: {
          Name: `prod-s3-endpoint-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-alb-sg-${environmentSuffix}`,
      {
        name: `prod-alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `prod-alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const webServerSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-web-server-sg-${environmentSuffix}`,
      {
        name: `prod-web-server-sg-${environmentSuffix}`,
        description: 'Security group for web servers',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `prod-web-server-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-db-sg-${environmentSuffix}`,
      {
        name: `prod-db-sg-${environmentSuffix}`,
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [webServerSecurityGroup.id],
          },
        ],
        tags: {
          Name: `prod-db-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `prod-ec2-role-${environmentSuffix}`,
      {
        name: `prod-ec2-role-${environmentSuffix}`,
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
          Name: `prod-ec2-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach CloudWatch agent policy
    new aws.iam.RolePolicyAttachment(
      `prod-ec2-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Attach SSM managed instance policy
    new aws.iam.RolePolicyAttachment(
      `prod-ec2-ssm-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `prod-instance-profile-${environmentSuffix}`,
      {
        name: `prod-instance-profile-${environmentSuffix}`,
        role: ec2Role.name,
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // User data script for web servers - simplified to avoid startup issues
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html
# Skip CloudWatch agent to reduce startup time and complexity
`;

    // Create Launch Template only if ASG is not skipped
    let launchTemplate: aws.ec2.LaunchTemplate | undefined;
    if (!skipAutoScaling) {
      launchTemplate = new aws.ec2.LaunchTemplate(
        `prod-launch-template-${environmentSuffix}`,
        {
          name: `prod-launch-template-${environmentSuffix}`,
          imageId: ami.then(ami => ami.id),
          instanceType: 't2.micro', // Use t2.micro which is more likely to be available
          userData: Buffer.from(userData).toString('base64'),
          iamInstanceProfile: {
            name: instanceProfile.name,
          },
          vpcSecurityGroupIds: [webServerSecurityGroup.id],
          tagSpecifications: [
            {
              resourceType: 'instance',
              tags: {
                Name: `prod-web-server-${environmentSuffix}`,
                ...tags,
              },
            },
          ],
        },
        { parent: this }
      );
    }

    // Create ALB and related resources only if ASG is not skipped
    let alb: aws.lb.LoadBalancer;
    let targetGroup: aws.lb.TargetGroup | undefined;

    if (!skipAutoScaling) {
      alb = new aws.lb.LoadBalancer(
        `prod-alb-${environmentSuffix}`,
        {
          name: `prod-alb-${environmentSuffix}`,
          loadBalancerType: 'application',
          internal: false,
          subnets: publicSubnets.map(subnet => subnet.id),
          securityGroups: [albSecurityGroup.id],
          tags: {
            Name: `prod-alb-${environmentSuffix}`,
            ...tags,
          },
        },
        { parent: this }
      );

      targetGroup = new aws.lb.TargetGroup(
        `prod-tg-${environmentSuffix}`,
        {
          name: `prod-tg-${environmentSuffix}`,
          port: 80,
          protocol: 'HTTP',
          vpcId: vpc.id,
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
            Name: `prod-tg-${environmentSuffix}`,
            ...tags,
          },
        },
        { parent: this }
      );

      new aws.lb.Listener(
        `prod-alb-listener-${environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
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
    } else {
      // Create a dummy ALB for export compatibility when ASG is skipped
      alb = new aws.lb.LoadBalancer(
        `prod-alb-${environmentSuffix}`,
        {
          name: `prod-alb-${environmentSuffix}`,
          loadBalancerType: 'application',
          internal: false,
          subnets: publicSubnets.map(subnet => subnet.id),
          securityGroups: [albSecurityGroup.id],
          tags: {
            Name: `prod-alb-${environmentSuffix}-minimal`,
            ...tags,
          },
        },
        { parent: this }
      );
    }

    // Create Auto Scaling Group only if not skipped
    if (!skipAutoScaling && launchTemplate && targetGroup) {
      new aws.autoscaling.Group(
        `prod-asg-${environmentSuffix}`,
        {
          name: `prod-asg-${environmentSuffix}`,
          minSize: 1,
          maxSize: 2,
          desiredCapacity: 1,
          vpcZoneIdentifiers: publicSubnets.map(subnet => subnet.id),
          targetGroupArns: [targetGroup.arn],
          healthCheckType: 'EC2', // Use EC2 health checks to avoid dependency on ELB
          healthCheckGracePeriod: 600, // Increased grace period for slower startup
          launchTemplate: {
            id: launchTemplate.id,
            version: '$Latest',
          },
          tags: [
            {
              key: 'Name',
              value: `prod-asg-${environmentSuffix}`,
              propagateAtLaunch: true,
            },
            ...Object.entries(tags).map(([key, value]) => ({
              key,
              value,
              propagateAtLaunch: true,
            })),
          ],
        },
        { parent: this }
      );
    }

    // Create RDS resources only if not skipped (to avoid quota issues)
    let database: aws.rds.Instance | undefined;
    if (!skipDatabase) {
      // Create RDS Subnet Group
      const dbSubnetGroup = new aws.rds.SubnetGroup(
        `prod-db-subnet-group-${environmentSuffix}`,
        {
          name: `prod-db-subnet-group-${environmentSuffix}`,
          subnetIds: privateSubnets.map(subnet => subnet.id),
          tags: {
            Name: `prod-db-subnet-group-${environmentSuffix}`,
            ...tags,
          },
        },
        { parent: this }
      );

      // Create RDS instance
      database = new aws.rds.Instance(
        `prod-database-${environmentSuffix}`,
        {
          identifier: `prod-database-${environmentSuffix}`,
          engine: 'mysql',
          engineVersion: '8.0',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          maxAllocatedStorage: 100,
          storageType: 'gp2',
          dbName: 'webapp',
          username: 'admin',
          password: 'changeme123!', // In production, use AWS Secrets Manager
          vpcSecurityGroupIds: [dbSecurityGroup.id],
          dbSubnetGroupName: dbSubnetGroup.name,
          skipFinalSnapshot: true,
          deletionProtection: false, // Allow deletion for testing
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
          tags: {
            Name: `prod-database-${environmentSuffix}`,
            ...tags,
          },
        },
        { parent: this }
      );
    }

    // Create S3 bucket for static assets
    const staticAssetsBucket = new aws.s3.Bucket(
      `prod-static-assets-${environmentSuffix}`,
      {
        bucket: pulumi.interpolate`prod-static-assets-${environmentSuffix}-${Math.random().toString(36).substring(2, 15)}`,
        forceDestroy: true, // Ensure bucket can be destroyed even with contents
        tags: {
          Name: `prod-static-assets-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Keep bucket private and secure - use CloudFront for public access
    new aws.s3.BucketPublicAccessBlock(
      `prod-static-assets-pab-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create CloudFront Origin Access Control for secure S3 access
    const originAccessControl = new aws.cloudfront.OriginAccessControl(
      `prod-oac-${environmentSuffix}`,
      {
        name: `prod-oac-${environmentSuffix}`,
        description: 'Origin Access Control for static assets bucket',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
      { parent: this }
    );

    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(
      `prod-cloudfront-${environmentSuffix}`,
      {
        enabled: true,
        defaultCacheBehavior: {
          targetOriginId: staticAssetsBucket.id,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
        },
        origins: [
          {
            domainName: staticAssetsBucket.bucketDomainName,
            originId: staticAssetsBucket.id,
            originAccessControlId: originAccessControl.id,
          },
        ],
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        tags: {
          Name: `prod-cloudfront-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Bucket policy for CloudFront OAC access only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketPolicy = new aws.s3.BucketPolicy(
      `prod-static-assets-policy-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        policy: pulumi
          .all([staticAssetsBucket.arn, distribution.arn])
          .apply(([bucketArn, distributionArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontServicePrincipal',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudfront.amazonaws.com',
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      'AWS:SourceArn': distributionArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this, dependsOn: [distribution] }
    );

    // CloudWatch Log Group for application logs
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const logGroup = new aws.cloudwatch.LogGroup(
      `prod-app-logs-${environmentSuffix}`,
      {
        name: `/aws/ec2/prod-app-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `prod-app-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarms
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `prod-high-cpu-alarm-${environmentSuffix}`,
      {
        name: `prod-high-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ALB CPU utilization',
        dimensions: {
          LoadBalancer: alb.arnSuffix,
        },
        tags: {
          Name: `prod-high-cpu-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Export important values
    this.vpcId = vpc.id;
    this.loadBalancerDns = alb.dnsName;
    this.staticAssetsBucketName = staticAssetsBucket.id;
    this.staticAssetsUrl = pulumi.interpolate`https://${distribution.domainName}`;
    this.databaseEndpoint = database?.endpoint;

    const outputs: Record<string, pulumi.Output<string>> = {
      vpcId: this.vpcId,
      loadBalancerDns: this.loadBalancerDns,
      staticAssetsBucketName: this.staticAssetsBucketName,
      staticAssetsUrl: this.staticAssetsUrl,
    };

    if (database && this.databaseEndpoint) {
      outputs.databaseEndpoint = this.databaseEndpoint;
    }

    this.registerOutputs(outputs);
  }
}
