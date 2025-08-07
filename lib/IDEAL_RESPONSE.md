<thinking>
Let me analyze this complex architecture and break down the components:

## Architectural Plan

### Core Components:

1. **S3 Cross-Region Replication**: Primary bucket in us-west-2 with CRR to us-east-2
2. **VPC Infrastructure**: New VPCs in both regions with public/private subnets and NAT Gateway
3. **EC2 Auto Scaling**: ASG with Launch Template that mounts S3 as filesystem
4. **Load Balancing**: ALB in each region distributing traffic to EC2 instances
5. **Global DNS**: Route 53 with health checks and failover routing
6. **Security**: IAM roles, security groups with least privilege

### Key Interactions:

- **Scalability**: ASG monitors CPU and scales instances automatically, new instances auto-mount S3
- **Resiliency**: Route 53 health checks monitor ALBs, failover to secondary region on failure
- **Content Sync**: S3 CRR ensures content is available in both regions instantly
- **Live Serving**: S3 Mountpoint allows direct serving from S3 without copying to local storage

### Critical Implementation Details:

- Launch Template user data must install S3 Mountpoint, mount bucket, and start Nginx
- EC2 instances need IAM permissions for S3 access
- ALB in public subnets, EC2 in private subnets with NAT Gateway for internet access
- Security groups must allow proper traffic flow while maintaining security
- Route 53 health checks must target ALB DNS names with failover policy

Let me structure this as multiple CDK constructs for better organization:

1. NetworkingConstruct - VPC, subnets, NAT Gateway
2. S3Construct - Buckets with CRR
3. ComputeConstruct - ASG, Launch Template, ALB
4. Route53Construct - DNS with health checks and failover
5. Main Stack - orchestrates everything
   </thinking>

# Global Web Application with S3 Mountpoint Architecture

## Complete AWS CDK TypeScript Implementation

Here's the complete Infrastructure as Code implementation for the highly available, scalable, auto-healing global web application:

### Project Structure

### Main Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RegionalResourcesStack } from './stacks/regional-resources-stack';
import { S3CRRStack } from './stacks/s3-crr-stack';

const REGIONS = {
  PRIMARY: 'us-west-2',
  SECONDARY: 'us-east-2',
} as const;

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true, // Enable cross-region references
    });

    const environmentSuffix = props.environmentSuffix || 'dev';
    // Create a single domain name for the entire multi-region setup
    const domainName = `${environmentSuffix}.tap-us-east-1.turing229221.com`;
    const zoneId = 'Z058855538KLEC04AGVPY';
    const currentRegion = this.region;
    const isPrimary = currentRegion === REGIONS.PRIMARY;

    // Create S3CRR stack first in PRIMARY region to get replication role
    let replicationRoleArn: string | undefined;
    if (isPrimary) {
      const s3CRRStack = new S3CRRStack(this, 'S3CRR', {
        env: {
          account: this.account,
          region: REGIONS.PRIMARY, // us-west-2
        },
        sourceBucketName: `globalmountpoint-content-${REGIONS.PRIMARY}-${environmentSuffix}`,
        destinationBucketName: `globalmountpoint-content-${REGIONS.SECONDARY}-${environmentSuffix}`,
      });
      replicationRoleArn = s3CRRStack.replicationRole.roleArn;
    }

    // Create regional resources for the current region
    // DNS logic is now handled within RegionalResourcesStack:
    // - Primary region creates hosted zone + primary DNS record
    // - Secondary region creates secondary DNS record using imported hosted zone
    const regionalStack = new RegionalResourcesStack(this, 'Regional', {
      environmentSuffix,
      region: currentRegion,
      isPrimary,
      domainName,
      zoneId,
      secondaryRegion: REGIONS.SECONDARY,
      replicationRoleArn,
      env: {
        account: this.account,
        region: currentRegion,
      },
    });

    // Ensure dependency if S3CRR stack exists
    if (isPrimary) {
      const s3CRRChild = this.node.tryFindChild('S3CRR');
      if (s3CRRChild) {
        regionalStack.node.addDependency(s3CRRChild);
      }
    }
    // Add tags
    cdk.Tags.of(this).add('Stack', 'TapStack');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', currentRegion);
    cdk.Tags.of(this).add('RegionType', isPrimary ? 'primary' : 'secondary');
  }
}
```

### Regional Resource Stack

```typescript
// lib/stacks/regional-resources.ts
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface RegionalResourcesStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  region: string;
  isPrimary: boolean;
  domainName: string;
  zoneId: string;
  secondaryRegion?: string;
  replicationRoleArn?: string;
}

export class RegionalResourcesStack extends cdk.Stack {
  public readonly contentBucket: s3.Bucket;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly healthCheck: route53.CfnHealthCheck;
  public readonly vpc: ec2.Vpc;
  public readonly hostedZone?: route53.HostedZone;
  public readonly dnsRecord?: route53.CfnRecordSet;

  constructor(
    scope: Construct,
    id: string,
    props: RegionalResourcesStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const regionSuffix = props.isPrimary ? 'primary' : 'secondary';

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1, // Single NAT Gateway as specified
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create S3 bucket for content
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `globalmountpoint-content-${props.region}-${environmentSuffix}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
    });

    // Configure S3 Cross-Region Replication for primary bucket
    if (props.isPrimary && props.replicationRoleArn && props.secondaryRegion) {
      const cfnBucket = this.contentBucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: props.replicationRoleArn,
        rules: [
          {
            id: 'ReplicateToSecondaryRegion',
            destination: {
              bucket: `arn:aws:s3:::globalmountpoint-content-${props.secondaryRegion}-${environmentSuffix}`,
              storageClass: 'STANDARD',
            },
            priority: 1,
            deleteMarkerReplication: {
              status: 'Enabled',
            },
            filter: {
              prefix: '',
            },
            status: 'Enabled',
          },
        ],
      };
    }

    // IAM role for EC2 instances to access S3 (with wildcard resources to avoid circular dependency)
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3MountPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [
                'arn:aws:s3:::globalmountpoint-content-*',
                'arn:aws:s3:::globalmountpoint-content-*/*',
              ],
            }),
          ],
        }),
      },
    });

    // S3 Replication removed for simplification

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(22),
      'Allow SSH from private networks'
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      '',
      '# Install Nginx',
      'yum install -y nginx',
      'amazon-linux-extras install nginx1',
      'systemctl enable nginx',
      '',
      '# Install AWS CLI and required tools',
      'yum install -y awscli fuse',
      '',
      '# Install S3 Mountpoint',
      'wget https://s3.amazonaws.com/mountpoint-s3-release/latest/x86_64/mount-s3.rpm',
      'yum install -y ./mount-s3.rpm',
      '',
      '# Create mountpoint directory',
      'mkdir -p /var/www/html',
      'chown nginx:nginx /var/www/html',
      '',
      '# Mount S3 bucket using S3 Mountpoint',
      `mount-s3 ${this.contentBucket.bucketName} /var/www/html --allow-other --uid=$(id -u nginx) --gid=$(id -g nginx)`,
      '',
      '# Configure Nginx',
      'cat > /etc/nginx/nginx.conf << EOF',
      'user nginx;',
      'worker_processes auto;',
      'error_log /var/log/nginx/error.log;',
      'pid /run/nginx.pid;',
      '',
      'events {',
      '    worker_connections 1024;',
      '}',
      '',
      'http {',
      '    include /etc/nginx/mime.types;',
      '    default_type application/octet-stream;',
      '    sendfile on;',
      '    keepalive_timeout 65;',
      '',
      '    server {',
      '        listen 80;',
      '        server_name _;',
      '        root /var/www/html;',
      '        index index.html index.htm;',
      '',
      '        location /health {',
      '            access_log off;',
      '            return 200 "healthy\\n";',
      '            add_header Content-Type text/plain;',
      '        }',
      '    }',
      '}',
      'EOF',
      '',
      "# Create a default index.html if it doesn't exist",
      'if [ ! -f /var/www/html/index.html ]; then',
      `    echo "<h1>Global Mountpoint Website - ${props.region}</h1>" > /var/www/html/index.html`,
      'fi',
      '',
      '# Start Nginx',
      'systemctl start nginx',
      '',
      '# Add S3 mount to fstab for persistence',
      `echo "${this.contentBucket.bucketName} /var/www/html fuse.mount-s3 _netdev,allow_other,uid=$(id -u nginx),gid=$(id -g nginx) 0 0" >> /etc/fstab`
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      healthCheck: {
        enabled: true,
        path: '/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // ALB Listener
    this.loadBalancer.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      launchTemplate,
      minCapacity: 1,
      maxCapacity: 1, // Initially set to 1 as specified
      desiredCapacity: 1,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Attach ASG to target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // CPU-based scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    // Health check for this region's ALB using proper configuration
    this.healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      type: 'HTTP',
      healthCheckConfig: {
        type: 'HTTP',
        resourcePath: '/health',
        fullyQualifiedDomainName: this.loadBalancer.loadBalancerDnsName,
        requestInterval: 30,
        failureThreshold: 3,
      },
    } as any);

    if (props.isPrimary) {
      // Primary DNS record with failover routing
      this.dnsRecord = new route53.CfnRecordSet(this, 'PrimaryDNSRecord', {
        hostedZoneId: props.zoneId,
        name: props.domainName,
        type: 'A',
        setIdentifier: 'primary',
        failover: 'PRIMARY',
        aliasTarget: {
          dnsName: this.loadBalancer.loadBalancerDnsName,
          hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
        },
        healthCheckId: this.healthCheck.attrHealthCheckId,
      });
    } else {
      // Secondary DNS record with failover routing
      this.dnsRecord = new route53.CfnRecordSet(this, 'SecondaryDNSRecord', {
        hostedZoneId: props.zoneId,
        name: props.domainName,
        type: 'A',
        setIdentifier: 'secondary',
        failover: 'SECONDARY',
        aliasTarget: {
          dnsName: this.loadBalancer.loadBalancerDnsName,
          hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
        },
        healthCheckId: this.healthCheck.attrHealthCheckId,
      });

      new cdk.CfnOutput(this, 'SecondaryDNSCreated', {
        value: 'Secondary DNS record created successfully',
        description: 'DNS failover is now active between regions',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: `Load Balancer DNS name for ${props.region}`,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: this.contentBucket.bucketName,
      description: `S3 Content bucket name for ${props.region}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${props.region}`,
    });

    // DNS-related outputs
    if (props.isPrimary) {
      new cdk.CfnOutput(this, 'WebsiteURL', {
        value: `http://${props.domainName}`,
        description: 'Website URL with DNS failover',
      });

      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: props.zoneId,
        description: 'Hosted Zone ID used for DNS records',
      });
    }

    new cdk.CfnOutput(this, 'RegionType', {
      value: props.isPrimary
        ? 'Primary Region (DNS + Infrastructure)'
        : 'Secondary Region (Infrastructure Only)',
      description: `Region type for ${props.region}`,
    });

    // ALB details for manual secondary DNS record creation
    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: `ALB DNS name for ${props.region} - use for manual DNS record creation`,
    });

    new cdk.CfnOutput(this, 'ALBCanonicalHostedZoneId', {
      value: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
      description: `ALB canonical hosted zone ID for ${props.region} - use for manual DNS record creation`,
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: this.healthCheck.attrHealthCheckId,
      description: `Health check ID for ${props.region} - use for manual DNS record creation`,
    });

    // Regional infrastructure complete

    // Add tags
    cdk.Tags.of(this).add('Stack', 'RegionalResources');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', props.region);
    cdk.Tags.of(this).add('RegionType', regionSuffix);
  }
}
```

### S3 - Cross Region replication

```typescript
// lib/stacks/s3-crr-stack.ts
// stacks/s3-crr-stack.ts
import {
  CfnOutput,
  Stack,
  StackProps,
  Tags,
  aws_iam as iam,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface S3CRRStackProps extends StackProps {
  sourceBucketName: string;
  destinationBucketName: string;
}

export class S3CRRStack extends Stack {
  public readonly replicationRole: iam.Role;

  constructor(scope: Construct, id: string, props: S3CRRStackProps) {
    super(scope, id, props);

    const { sourceBucketName, destinationBucketName } = props;

    this.replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    this.replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
        resources: [`arn:aws:s3:::${sourceBucketName}`],
      })
    );

    this.replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObjectVersion', 's3:GetObjectVersionAcl'],
        resources: [`arn:aws:s3:::${sourceBucketName}/*`],
      })
    );

    this.replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
        resources: [`arn:aws:s3:::${destinationBucketName}/*`],
      })
    );

    const sourceBucket = s3.Bucket.fromBucketName(
      this,
      'SourceBucket',
      sourceBucketName
    );

    sourceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [this.replicationRole],
        actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
        resources: [`arn:aws:s3:::${destinationBucketName}/*`],
      })
    );

    // S3 Cross-Region Replication configuration
    // Since sourceBucket is imported via fromBucketName, we can't access its CfnBucket
    // The replication configuration needs to be applied to the actual bucket resource
    // in the RegionalResourcesStack where the bucket is created

    // Output replication role ARN for reference
    new CfnOutput(this, 'ReplicationRoleArn', {
      value: this.replicationRole.roleArn,
      description: 'IAM Role ARN for S3 Cross-Region Replication',
    });

    new CfnOutput(this, 'SourceBucketName', {
      value: sourceBucketName,
      description: 'Source bucket name for replication setup',
    });

    new CfnOutput(this, 'DestinationBucketName', {
      value: destinationBucketName,
      description: 'Destination bucket name for replication setup',
    });

    new CfnOutput(this, 'ReplicationConfigCommand', {
      value: `aws s3api put-bucket-replication --bucket ${sourceBucketName} --replication-configuration file://replication-config.json`,
      description:
        'AWS CLI command to configure replication (create replication-config.json first)',
    });

    // Add tags
    Tags.of(this).add('Stack', 'S3CRR');
  }
}
```
