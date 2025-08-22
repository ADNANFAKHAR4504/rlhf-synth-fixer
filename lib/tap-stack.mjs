/**
 * tap-stack.mjs
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * Implements a highly available and scalable web application infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod'). Defaults to 'dev' if not provided.
 * @property {Object<string, string>} [tags] - Optional default tags to apply to resources.
 */

/**
 * Represents the main Pulumi component resource for the TAP project.
 * Implements a highly available and scalable web application infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {
      Environment: environmentSuffix,
      Project: 'TapStack',
      ManagedBy: 'Pulumi'
    };

    // Get available AZs in us-west-2
    const availableAzs = aws.getAvailabilityZones({
      state: 'available',
    });

    // VPC Configuration
    const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `tap-vpc-${environmentSuffix}` },
    }, { parent: this });

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...tags, Name: `tap-igw-${environmentSuffix}` },
    }, { parent: this });

    // Public Subnets (across 2 AZs for HA)
    const publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`tap-public-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availableAzs.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `tap-public-subnet-${i + 1}-${environmentSuffix}`, Type: 'Public' },
      }, { parent: this });
      publicSubnets.push(subnet);
    }

    // Private Subnets (across 2 AZs for HA)
    const privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`tap-private-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availableAzs.then(azs => azs.names[i]),
        tags: { ...tags, Name: `tap-private-subnet-${i + 1}-${environmentSuffix}`, Type: 'Private' },
      }, { parent: this });
      privateSubnets.push(subnet);
    }

    // NAT Gateways (one per AZ for HA)
    const natGateways = [];
    for (let i = 0; i < 2; i++) {
      const eip = new aws.ec2.Eip(`tap-nat-eip-${i + 1}-${environmentSuffix}`, {
        domain: 'vpc',
        tags: { ...tags, Name: `tap-nat-eip-${i + 1}-${environmentSuffix}` },
      }, { parent: this });

      const natGw = new aws.ec2.NatGateway(`tap-nat-gateway-${i + 1}-${environmentSuffix}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: { ...tags, Name: `tap-nat-gateway-${i + 1}-${environmentSuffix}` },
      }, { parent: this, dependsOn: [igw] });
      
      natGateways.push(natGw);
    }

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...tags, Name: `tap-public-rt-${environmentSuffix}` },
    }, { parent: this });

    new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`tap-public-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Private route tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`tap-private-rt-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        tags: { ...tags, Name: `tap-private-rt-${i + 1}-${environmentSuffix}` },
      }, { parent: this });

      new aws.ec2.Route(`tap-private-route-${i + 1}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`tap-private-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Security Groups
    const albSg = new aws.ec2.SecurityGroup(`tap-alb-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for Application Load Balancer',
      ingress: [
        { fromPort: 80, toPort: 80, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
        { fromPort: 443, toPort: 443, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags, Name: `tap-alb-sg-${environmentSuffix}` },
    }, { parent: this });

    const webSg = new aws.ec2.SecurityGroup(`tap-web-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for web servers',
      ingress: [
        { fromPort: 80, toPort: 80, protocol: 'tcp', securityGroups: [albSg.id] },
        { fromPort: 22, toPort: 22, protocol: 'tcp', cidrBlocks: ['10.0.0.0/16'] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags, Name: `tap-web-sg-${environmentSuffix}` },
    }, { parent: this });

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
        }],
      }),
      tags,
    }, { parent: this });

    // IAM Policy for S3 access
    const s3Policy = new aws.iam.RolePolicy(`tap-s3-policy-${environmentSuffix}`, {
      role: ec2Role.id,
      policy: pulumi.output(pulumi.all([]).apply(() => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          Resource: [
            `arn:aws:s3:::tap-static-assets-${environmentSuffix}`,
            `arn:aws:s3:::tap-static-assets-${environmentSuffix}/*`,
          ],
        }],
      }))),
    }, { parent: this });

    // Attach AWS managed policies
    new aws.iam.RolePolicyAttachment(`tap-ssm-policy-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`tap-cloudwatch-policy-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    }, { parent: this });

    const instanceProfile = new aws.iam.InstanceProfile(`tap-instance-profile-${environmentSuffix}`, {
      role: ec2Role.name,
      tags,
    }, { parent: this });

    // S3 Bucket for static assets (kept private)
    const staticBucket = new aws.s3.Bucket(`tap-static-assets-${environmentSuffix}`, {
      bucket: `tap-static-assets-${environmentSuffix}-${Date.now()}`,
      tags,
    }, { parent: this });

    // S3 Bucket public access block (keep bucket private)
    new aws.s3.BucketPublicAccessBlock(`tap-static-pab-${environmentSuffix}`, {
      bucket: staticBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // CloudFront Origin Access Control
    const originAccessControl = new aws.cloudfront.OriginAccessControl(`tap-oac-${environmentSuffix}`, {
      name: `tap-oac-${environmentSuffix}`,
      description: "Origin Access Control for TAP static assets",
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4",
    }, { parent: this });

    // CloudFront Distribution for static content delivery
    const distribution = new aws.cloudfront.Distribution(`tap-cdn-${environmentSuffix}`, {
      origins: [{
        domainName: staticBucket.bucketDomainName,
        originId: "S3Origin",
        originAccessControlId: originAccessControl.id,
      }],
      enabled: true,
      defaultRootObject: "index.html",
      defaultCacheBehavior: {
        targetOriginId: "S3Origin",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        forwardedValues: {
          queryString: false,
          cookies: { forward: "none" },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
        compress: true,
      },
      customErrorResponses: [{
        errorCode: 404,
        responseCode: 404,
        responsePagePath: "/error.html",
        errorCachingMinTtl: 300,
      }],
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      tags: { ...tags, Purpose: 'StaticContentDelivery' },
    }, { parent: this });

    // S3 Bucket policy to allow CloudFront access only
    new aws.s3.BucketPolicy(`tap-static-policy-${environmentSuffix}`, {
      bucket: staticBucket.id,
      policy: pulumi.all([staticBucket.arn, distribution.arn]).apply(([bucketArn, distributionArn]) => 
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com'
            },
            Action: 's3:GetObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': distributionArn
              }
            }
          }]
        })
      ),
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI (most compatible)
    const amiId = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*'] },
        { name: 'architecture', values: ['x86_64'] },
        { name: 'virtualization-type', values: ['hvm'] },
        { name: 'state', values: ['available'] },
        { name: 'root-device-type', values: ['ebs'] },
      ],
    });

    // Launch Template with user data
    const launchTemplate = new aws.ec2.LaunchTemplate(`tap-launch-template-${environmentSuffix}`, {
      namePrefix: `tap-template-${environmentSuffix}-`,
      imageId: amiId.then(ami => ami.id),
      instanceType: 't3.micro',
      iamInstanceProfile: { name: instanceProfile.name },
      vpcSecurityGroupIds: [webSg.id],
      userData: Buffer.from(`#!/bin/bash
yum update -y -q
yum install -y httpd -q
systemctl start httpd
systemctl enable httpd

echo '<!DOCTYPE html><html><body><h1>TAP Web App</h1><p>Status: Running</p></body></html>' > /var/www/html/index.html
systemctl restart httpd
`).toString('base64'),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: { ...tags, Name: `tap-web-instance-${environmentSuffix}` },
      }],
      tags,
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`tap-alb-${environmentSuffix}`, {
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSg.id],
      tags: { ...tags, Name: `tap-alb-${environmentSuffix}` },
    }, { parent: this });

    // ALB Target Group
    const targetGroup = new aws.lb.TargetGroup(`tap-tg-${environmentSuffix}`, {
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 15, // Check every 15 seconds instead of 30
        matcher: '200',
        path: '/',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 3,
      },
      tags: { ...tags, Name: `tap-tg-${environmentSuffix}` },
    }, { parent: this });

    // ALB Listener
    new aws.lb.Listener(`tap-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: '80',
      protocol: 'HTTP',
      defaultActions: [{
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      }],
      tags,
    }, { parent: this });

    // Auto Scaling Group - Pro approach: Start without target groups
    const asg = new aws.autoscaling.Group(`tap-asg-${environmentSuffix}`, {
      vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
      healthCheckType: 'EC2', // Use EC2 health checks only
      healthCheckGracePeriod: 180, // 3 minutes is enough for EC2 checks
      minSize: 1,
      maxSize: 10,
      desiredCapacity: 1,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tags: Object.entries({ ...tags, Name: `tap-asg-${environmentSuffix}` }).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    }, { 
      parent: this,
      dependsOn: [...natGateways],  // Just wait for NAT Gateways
      customTimeouts: {
        create: "8m",   // Reduced timeout for EC2 health checks
        update: "8m"
      }
    });

    // Attach target group after ASG is healthy
    new aws.autoscaling.Attachment(`tap-asg-attachment-${environmentSuffix}`, {
      autoscalingGroupName: asg.name,
      lbTargetGroupArn: targetGroup.arn,
    }, { 
      parent: this,
      dependsOn: [asg, targetGroup] // Wait for both ASG and target group
    });

    // Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscaling.Policy(`tap-scale-up-${environmentSuffix}`, {
      scalingAdjustment: 2,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      policyType: 'SimpleScaling',
    }, { parent: this });

    const scaleDownPolicy = new aws.autoscaling.Policy(`tap-scale-down-${environmentSuffix}`, {
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      policyType: 'SimpleScaling',
    }, { parent: this });

    // CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(`tap-high-cpu-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [scaleUpPolicy.arn],
      dimensions: {
        AutoScalingGroupName: asg.name,
      },
      tags,
    }, { parent: this });

    new aws.cloudwatch.MetricAlarm(`tap-low-cpu-${environmentSuffix}`, {
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 20,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [scaleDownPolicy.arn],
      dimensions: {
        AutoScalingGroupName: asg.name,
      },
      tags,
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      vpcId: vpc.id,
      publicSubnetIds: pulumi.all(publicSubnets.map(subnet => subnet.id)),
      privateSubnetIds: pulumi.all(privateSubnets.map(subnet => subnet.id)),
      albDnsName: alb.dnsName,
      albZoneId: alb.zoneId,
      staticBucketName: staticBucket.id,
      cloudfrontDomainName: distribution.domainName,
      cloudfrontDistributionId: distribution.id,
      asgName: asg.name,
    });

    // Export outputs for external access
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.staticBucketName = staticBucket.id;
    this.cloudfrontDomainName = distribution.domainName;
    this.cloudfrontDistributionId = distribution.id;
  }
}

