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

```typescript
// lib/constructs/networking-construct.ts
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  region: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
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
      // Single NAT Gateway for cost optimization
      natGateways: 1,
    });

    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Tag resources
    cdk.Tags.of(this.vpc).add('Name', `GlobalWebApp-VPC-${props.region}`);
  }
}
```

```typescript
// lib/constructs/s3-construct.ts
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface S3ConstructProps {
  isPrimary: boolean;
  region: string;
  replicationDestinationBucket?: s3.IBucket;
}

export class S3Construct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    // Create S3 bucket for website content
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `global-webapp-content-${props.region}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Enable server access logging
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Configure Cross-Region Replication for primary bucket
    if (props.isPrimary && props.replicationDestinationBucket) {
      // Create replication role
      const replicationRole = new cdk.aws_iam.Role(this, 'ReplicationRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('s3.amazonaws.com'),
        inlinePolicies: {
          ReplicationPolicy: new cdk.aws_iam.PolicyDocument({
            statements: [
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: [
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                  's3:GetObjectVersionTagging',
                ],
                resources: [`${this.bucket.bucketArn}/*`],
              }),
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: ['s3:ListBucket'],
                resources: [this.bucket.bucketArn],
              }),
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                resources: [
                  `${props.replicationDestinationBucket.bucketArn}/*`,
                ],
              }),
            ],
          }),
        },
      });

      // Add replication configuration
      const cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateToSecondaryRegion',
            status: 'Enabled',
            prefix: '',
            destination: {
              bucket: props.replicationDestinationBucket.bucketArn,
              storageClass: 'STANDARD',
            },
          },
        ],
      };
    }

    // Tag the bucket
    cdk.Tags.of(this.bucket).add('Name', `GlobalWebApp-Bucket-${props.region}`);
  }
}
```

```typescript
// lib/constructs/compute-construct.ts
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  vpc: ec2.IVpc;
  publicSubnets: ec2.ISubnet[];
  privateSubnets: ec2.ISubnet[];
  bucket: s3.IBucket;
  region: string;
  sshKeyName?: string;
}

export class ComputeConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS traffic from internet
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

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic only from ALB
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Allow SSH access (restrict to your IP range in production)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // In production, replace with specific IP range
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances to access S3',
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
                props.bucket.bucketArn,
                `${props.bucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Create user data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'set -e',
      '',
      '# Update system packages',
      'yum update -y',
      '',
      '# Install required packages',
      'yum install -y nginx fuse',
      '',
      '# Install AWS CLI v2',
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
      'unzip awscliv2.zip',
      './aws/install',
      'rm -rf aws awscliv2.zip',
      '',
      '# Install S3 Mountpoint',
      'wget https://s3.amazonaws.com/mountpoint-s3-release/latest/x86_64/mount-s3.rpm',
      'yum install -y ./mount-s3.rpm',
      'rm -f ./mount-s3.rpm',
      '',
      '# Create mount point directory',
      'mkdir -p /var/www/html',
      'chown nginx:nginx /var/www/html',
      '',
      '# Mount S3 bucket using S3 Mountpoint',
      `mount-s3 ${props.bucket.bucketName} /var/www/html --allow-other --uid $(id -u nginx) --gid $(id -g nginx)`,
      '',
      '# Create a simple index.html if bucket is empty',
      'if [ ! -f /var/www/html/index.html ]; then',
      '  echo "<html><body><h1>Global Web Application</h1><p>Served from S3 in ' +
        props.region +
        '</p></body></html>" > /tmp/index.html',
      `  aws s3 cp /tmp/index.html s3://${props.bucket.bucketName}/index.html`,
      '  rm /tmp/index.html',
      'fi',
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
      '    log_format main \'$remote_addr - $remote_user [$time_local] "$request" \'',
      '                    \'$status $body_bytes_sent "$http_referer" \'',
      '                    \'"$http_user_agent" "$http_x_forwarded_for"\';',
      '',
      '    access_log /var/log/nginx/access.log main;',
      '',
      '    sendfile on;',
      '    tcp_nopush on;',
      '    tcp_nodelay on;',
      '    keepalive_timeout 65;',
      '    types_hash_max_size 2048;',
      '',
      '    include /etc/nginx/mime.types;',
      '    default_type application/octet-stream;',
      '',
      '    server {',
      '        listen 80 default_server;',
      '        listen [::]:80 default_server;',
      '        server_name _;',
      '        root /var/www/html;',
      '',
      '        location / {',
      '            try_files $uri $uri/ /index.html;',
      '        }',
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
      '# Start and enable Nginx',
      'systemctl start nginx',
      'systemctl enable nginx',
      '',
      '# Add S3 mount to fstab for persistence',
      `echo "${props.bucket.bucketName} /var/www/html fuse.mount-s3 _netdev,allow_other,uid=$(id -u nginx),gid=$(id -g nginx) 0 0" >> /etc/fstab`,
      '',
      '# Signal CloudFormation that the instance is ready',
      '/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}'
    );

    // Create Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      userData: userData,
      role: ec2Role,
      keyName: props.sshKeyName,
    });

    // Create Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      vpcSubnets: {
        subnets: props.publicSubnets,
      },
      securityGroup: albSecurityGroup,
    });

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
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

    // Create ALB Listener
    this.alb.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.privateSubnets,
        },
        launchTemplate: launchTemplate,
        minCapacity: 1,
        maxCapacity: 1, // Initially set to 1 as per requirements
        desiredCapacity: 1,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 0,
          pauseTime: cdk.Duration.minutes(5),
        }),
      }
    );

    // Attach ASG to Target Group
    this.autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Create CPU-based scaling policy
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    // Tag resources
    cdk.Tags.of(this.alb).add('Name', `GlobalWebApp-ALB-${props.region}`);
    cdk.Tags.of(this.autoScalingGroup).add(
      'Name',
      `GlobalWebApp-ASG-${props.region}`
    );
  }
}
```

```typescript
// lib/constructs/route53-construct.ts
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface Route53ConstructProps {
  domainName: string;
  primaryAlb: elbv2.IApplicationLoadBalancer;
  secondaryAlb: elbv2.IApplicationLoadBalancer;
  primaryRegion: string;
  secondaryRegion: string;
}

export class Route53Construct extends Construct {
  public readonly hostedZone: route53.IHostedZone;
  public readonly domainName: string;

  constructor(scope: Construct, id: string, props: Route53ConstructProps) {
    super(scope, id);

    this.domainName = props.domainName;

    // Create hosted zone (in production, you would typically import an existing one)
    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
    });

    // Create health check for primary ALB
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        type: 'HTTPS_STR_MATCH',
        resourcePath: '/health',
        fullyQualifiedDomainName: props.primaryAlb.loadBalancerDnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        searchString: 'healthy',
        tags: [
          {
            key: 'Name',
            value: `GlobalWebApp-HealthCheck-${props.primaryRegion}`,
          },
        ],
      }
    );

    // Create health check for secondary ALB
    const secondaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'SecondaryHealthCheck',
      {
        type: 'HTTPS_STR_MATCH',
        resourcePath: '/health',
        fullyQualifiedDomainName: props.secondaryAlb.loadBalancerDnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        searchString: 'healthy',
        tags: [
          {
            key: 'Name',
            value: `GlobalWebApp-HealthCheck-${props.secondaryRegion}`,
          },
        ],
      }
    );

    // Create primary DNS record with failover routing
    new route53.ARecord(this, 'PrimaryRecord', {
      zone: this.hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.LoadBalancerTarget(props.primaryAlb)
      ),
      ttl: cdk.Duration.seconds(60),
      setIdentifier: 'primary',
      geoLocation: route53.GeoLocation.country('US'), // You can adjust this based on your needs
      healthCheckId: primaryHealthCheck.attrHealthCheckId,
    });

    // Create secondary DNS record with failover routing
    new route53.ARecord(this, 'SecondaryRecord', {
      zone: this.hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.LoadBalancerTarget(props.secondaryAlb)
      ),
      ttl: cdk.Duration.seconds(60),
      setIdentifier: 'secondary',
      geoLocation: route53.GeoLocation.defaultLocation(),
      healthCheckId: secondaryHealthCheck.attrHealthCheckId,
    });
  }
}
```

```typescript
// lib/global-webapp-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './constructs/networking-construct';
import { S3Construct } from './constructs/s3-construct';
import { ComputeConstruct } from './constructs/compute-construct';
import { Route53Construct } from './constructs/route53-construct';

export interface GlobalWebAppStackProps extends cdk.StackProps {
  isPrimary: boolean;
  region: string;
  domainName: string;
  sshKeyName?: string;
  secondaryRegionBucket?: cdk.aws_s3.IBucket;
  primaryAlb?: cdk.aws_elasticloadbalancingv2.IApplicationLoadBalancer;
  secondaryAlb?: cdk.aws_elasticloadbalancingv2.IApplicationLoadBalancer;
}

export class GlobalWebAppStack extends cdk.Stack {
  public readonly bucket: cdk.aws_s3.IBucket;
  public readonly alb: cdk.aws_elasticloadbalancingv2.IApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: GlobalWebAppStackProps) {
    super(scope, id, props);

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      region: props.region,
    });

    // Create S3 bucket with optional replication
    const s3 = new S3Construct(this, 'S3', {
      isPrimary: props.isPrimary,
      region: props.region,
      replicationDestinationBucket: props.secondaryRegionBucket,
    });

    // Create compute infrastructure
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      publicSubnets: networking.publicSubnets,
      privateSubnets: networking.privateSubnets,
      bucket: s3.bucket,
      region: props.region,
      sshKeyName: props.sshKeyName,
    });

    // Create Route 53 DNS configuration (only in primary region)
    if (props.isPrimary && props.secondaryAlb) {
      const route53 = new Route53Construct(this, 'Route53', {
        domainName: props.domainName,
        primaryAlb: compute.alb,
        secondaryAlb: props.secondaryAlb,
        primaryRegion: 'us-west-2',
        secondaryRegion: 'us-east-2',
      });

      // Output the domain name
      new cdk.CfnOutput(this, 'DomainName', {
        value: route53.domainName,
        description: 'Domain name for the global web application',
        exportName: 'GlobalWebApp-DomainName',
      });

      // Output the hosted zone ID
      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: route53.hostedZone.hostedZoneId,
        description: 'Hosted Zone ID for DNS configuration',
        exportName: 'GlobalWebApp-HostedZoneId',
      });
    }

    // Export values for cross-stack references
    this.bucket = s3.bucket;
    this.alb = compute.alb;

    // Output ALB DNS name
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: compute.alb.loadBalancerDnsName,
      description: `ALB DNS name for ${props.region}`,
      exportName: `GlobalWebApp-ALB-${props.region}`,
    });

    // Output S3 bucket name
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3.bucket.bucketName,
      description: `S3 bucket name for ${props.region}`,
      exportName: `GlobalWebApp-Bucket-${props.region}`,
    });
  }
}
```

```typescript
// lib/global-webapp-app.ts
import * as cdk from 'aws-cdk-lib';
import { GlobalWebAppStack } from './global-webapp-stack';

export class GlobalWebAppApp extends cdk.App {
  constructor() {
    super();

    const domainName = 'example.com'; // Replace with your domain
    const sshKeyName = 'my-key-pair'; // Replace with your EC2 key pair name (optional)

    // Deploy secondary region first (us-east-2)
    const secondaryStack = new GlobalWebAppStack(
      this,
      'GlobalWebApp-Secondary',
      {
        isPrimary: false,
        region: 'us-east-2',
        domainName: domainName,
        sshKeyName: sshKeyName,
        env: {
          region: 'us-east-2',
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
      }
    );

    // Deploy primary region (us-west-2) with references to secondary
    const primaryStack = new GlobalWebAppStack(this, 'GlobalWebApp-Primary', {
      isPrimary: true,
      region: 'us-west-2',
      domainName: domainName,
      sshKeyName: sshKeyName,
      secondaryRegionBucket: secondaryStack.bucket,
      secondaryAlb: secondaryStack.alb,
      env: {
        region: 'us-west-2',
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    // Add dependency to ensure secondary is deployed first
    primaryStack.addDependency(secondaryStack);
  }
}
```

```typescript
// bin/global-webapp.ts
#!/usr/bin/env node
import 'source-map-support/register';
import { GlobalWebAppApp } from '../lib/global-webapp-app';

new GlobalWebAppApp();
```

```json
// package.json
{
  "name": "global-webapp",
  "version": "0.1.0",
  "bin": {
    "global-webapp": "bin/global-webapp.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --all",
    "destroy": "cdk destroy --all"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/global-webapp.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/core:bootstrapQualifier": "hnb659fds",
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:target": "aws-cdk-lib"
  }
}
```

## Key Features Implemented

###  **Architecture Components**

- **Multi-Region VPC**: Custom VPCs in us-west-2 and us-east-2 with public/private subnets
- **S3 Cross-Region Replication**: Automatic content sync between regions
