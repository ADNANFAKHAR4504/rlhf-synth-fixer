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
  zoneId?: string; // Optional for LocalStack compatibility
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
              actions: ['s3:ListBucket'],
              resources: [this.contentBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: [`${this.contentBucket.bucketArn}/*`],
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

    // Restrict SSH access to VPC CIDR only (more secure than 10.0.0.0/8)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC CIDR only'
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'set -e',
      'exec > >(tee /var/log/user-data.log) 2>&1',
      '',
      '# Update system packages',
      'yum update -y',
      '',
      '# Install required packages',
      'yum install -y nginx fuse awscli',
      'systemctl enable nginx',
      '',
      '# Install S3 Mountpoint',
      'wget https://s3.amazonaws.com/mountpoint-s3-release/latest/x86_64/mount-s3.rpm -O /tmp/mount-s3.rpm',
      'yum install -y /tmp/mount-s3.rpm',
      'rm -f /tmp/mount-s3.rpm',
      '',
      '# Create mountpoint directory',
      'mkdir -p /var/www/html',
      'chown nginx:nginx /var/www/html',
      '',
      '# Validate S3 bucket exists before mounting',
      `aws s3 ls s3://${this.contentBucket.bucketName}/ || echo "Warning: S3 bucket may not exist yet"`,
      '',
      '# Mount S3 bucket using S3 Mountpoint with error handling',
      `mount-s3 ${this.contentBucket.bucketName} /var/www/html --allow-other --uid=$(id -u nginx) --gid=$(id -g nginx) || {`,
      '  echo "Failed to mount S3 bucket, creating fallback content"',
      '  echo "<h1>Service Starting</h1><p>Content loading...</p>" > /var/www/html/index.html',
      '  chown nginx:nginx /var/www/html/index.html',
      '}',
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

    // Create LaunchConfiguration using L1 construct for LocalStack compatibility
    const launchConfig = new autoscaling.CfnLaunchConfiguration(
      this,
      'LaunchConfig',
      {
        imageId: ec2.MachineImage.latestAmazonLinux2().getImage(this).imageId,
        instanceType: 't3.micro',
        iamInstanceProfile: ec2Role.roleName,
        securityGroups: [ec2SecurityGroup.securityGroupId],
        userData: cdk.Fn.base64(userData.render()),
      }
    );

    // Auto Scaling Group using LaunchConfiguration for LocalStack compatibility
    const cfnAutoScalingGroup = new autoscaling.CfnAutoScalingGroup(
      this,
      'ASG',
      {
        minSize: '1',
        maxSize: '1',
        desiredCapacity: '1',
        launchConfigurationName: launchConfig.ref,
        vpcZoneIdentifier: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
        targetGroupArns: [targetGroup.targetGroupArn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        tags: [
          {
            key: 'Name',
            value: `TapStack-${environmentSuffix}-ASG`,
            propagateAtLaunch: true,
          },
        ],
      }
    );

    // CPU-based scaling policy using L1 construct
    new autoscaling.CfnScalingPolicy(this, 'CPUScalingPolicy', {
      autoScalingGroupName: cfnAutoScalingGroup.ref,
      policyType: 'TargetTrackingScaling',
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ASGAverageCPUUtilization',
        },
        targetValue: 70,
      },
    });

    // Health check and DNS records - only create if zoneId is provided (not LocalStack)
    if (props.zoneId) {
      // Health check for this region's ALB using proper configuration
      this.healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: this.loadBalancer.loadBalancerDnsName,
          requestInterval: 30,
          failureThreshold: 3,
        },
      });

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

    // DNS-related outputs - only if zoneId is provided
    if (props.zoneId) {
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

      // ALB details for manual secondary DNS record creation
      new cdk.CfnOutput(this, 'ALBDNSName', {
        value: this.loadBalancer.loadBalancerDnsName,
        description: `ALB DNS name for ${props.region} - use for manual DNS record creation`,
      });

      new cdk.CfnOutput(this, 'ALBCanonicalHostedZoneId', {
        value: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
        description: `ALB canonical hosted zone ID for ${props.region} - use for manual DNS record creation`,
      });

      if (this.healthCheck) {
        new cdk.CfnOutput(this, 'HealthCheckId', {
          value: this.healthCheck.attrHealthCheckId,
          description: `Health check ID for ${props.region} - use for manual DNS record creation`,
        });
      }
    }

    new cdk.CfnOutput(this, 'RegionType', {
      value: props.isPrimary
        ? 'Primary Region (DNS + Infrastructure)'
        : 'Secondary Region (Infrastructure Only)',
      description: `Region type for ${props.region}`,
    });

    // Regional infrastructure complete

    // Add tags
    cdk.Tags.of(this).add('Stack', 'RegionalResources');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', props.region);
    cdk.Tags.of(this).add('RegionType', regionSuffix);
  }
}
