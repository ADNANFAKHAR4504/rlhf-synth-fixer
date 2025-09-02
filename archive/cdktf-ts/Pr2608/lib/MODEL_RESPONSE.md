I'll create a comprehensive CDKTF TypeScript project for multi-region AWS deployment with high availability and failover capabilities. Here's the complete solution:

## Project Structure

```
multi-region-aws-cdktf/
├── main.ts
├── package.json
├── tsconfig.json
├── cdktf.json
└── README.md
```

## main.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

// VPC and Networking
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";

// Security
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";

// Compute
import { LaunchTemplate } from "@cdktf/provider-aws/lib/launch-template";
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";
import { AutoscalingPolicy } from "@cdktf/provider-aws/lib/autoscaling-policy";

// Load Balancing
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { AutoscalingAttachment } from "@cdktf/provider-aws/lib/autoscaling-attachment";

// Storage
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketReplication } from "@cdktf/provider-aws/lib/s3-bucket-replication-configuration";

// Monitoring and Notifications
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTopicSubscription } from "@cdktf/provider-aws/lib/sns-topic-subscription";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";

// Parameter Store
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";

// Route 53 for DNS failover
import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { Route53HealthCheck } from "@cdktf/provider-aws/lib/route53-health-check";

interface RegionConfig {
  region: string;
  isPrimary: boolean;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

class MultiRegionStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const regions: RegionConfig[] = [
      {
        region: "us-east-1",
        isPrimary: true,
        vpcCidr: "10.0.0.0/16",
        publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
        privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"]
      },
      {
        region: "eu-west-1",
        isPrimary: false,
        vpcCidr: "10.1.0.0/16",
        publicSubnetCidrs: ["10.1.1.0/24", "10.1.2.0/24"],
        privateSubnetCidrs: ["10.1.10.0/24", "10.1.20.0/24"]
      }
    ];

    // Create providers for each region
    const providers: { [key: string]: AwsProvider } = {};
    regions.forEach(regionConfig => {
      providers[regionConfig.region] = new AwsProvider(this, `aws-${regionConfig.region}`, {
        region: regionConfig.region,
        alias: regionConfig.region
      });
    });

    // Get caller identity for primary region
    const callerIdentity = new DataAwsCallerIdentity(this, "caller-identity", {
      provider: providers["us-east-1"]
    });

    // Create SNS topics for notifications in each region
    const snsTopics: { [key: string]: SnsTopic } = {};
    regions.forEach(regionConfig => {
      snsTopics[regionConfig.region] = new SnsTopic(this, `sns-topic-${regionConfig.region}`, {
        name: `multi-region-notifications-${regionConfig.region}`,
        provider: providers[regionConfig.region]
      });

      // Add email subscription (replace with actual email)
      new SnsTopicSubscription(this, `sns-subscription-${regionConfig.region}`, {
        topicArn: snsTopics[regionConfig.region].arn,
        protocol: "email",
        endpoint: "admin@example.com", // Replace with actual email
        provider: providers[regionConfig.region]
      });
    });

    // Create Parameter Store parameters
    const parameters: { [key: string]: SsmParameter } = {};
    regions.forEach(regionConfig => {
      parameters[`db-password-${regionConfig.region}`] = new SsmParameter(this, `db-password-${regionConfig.region}`, {
        name: "/app/database/password",
        type: "SecureString",
        value: "change-me-in-production", // Should be updated after deployment
        description: "Database password",
        provider: providers[regionConfig.region]
      });

      parameters[`api-key-${regionConfig.region}`] = new SsmParameter(this, `api-key-${regionConfig.region}`, {
        name: "/app/api/key",
        type: "SecureString",
        value: "change-me-in-production", // Should be updated after deployment
        description: "API key for external services",
        provider: providers[regionConfig.region]
      });
    });

    // Create Route 53 hosted zone for DNS failover
    const hostedZone = new Route53Zone(this, "hosted-zone", {
      name: "example.com", // Replace with your domain
      provider: providers["us-east-1"]
    });

    // Regional infrastructure
    const regionalResources: { [key: string]: any } = {};

    regions.forEach(regionConfig => {
      const provider = providers[regionConfig.region];

      // Get availability zones
      const azs = new DataAwsAvailabilityZones(this, `azs-${regionConfig.region}`, {
        state: "available",
        provider: provider
      });

      // Create VPC
      const vpc = new Vpc(this, `vpc-${regionConfig.region}`, {
        cidrBlock: regionConfig.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${regionConfig.region}`,
          Region: regionConfig.region
        },
        provider: provider
      });

      // Internet Gateway
      const igw = new InternetGateway(this, `igw-${regionConfig.region}`, {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${regionConfig.region}`
        },
        provider: provider
      });

      // Public subnets
      const publicSubnets: Subnet[] = [];
      regionConfig.publicSubnetCidrs.forEach((cidr, index) => {
        const subnet = new Subnet(this, `public-subnet-${regionConfig.region}-${index}`, {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: `\${${azs.fqn}.names[${index}]}`,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${regionConfig.region}-${index}`,
            Type: "Public"
          },
          provider: provider
        });
        publicSubnets.push(subnet);
      });

      // NAT Gateways and EIPs
      const natGateways: NatGateway[] = [];
      publicSubnets.forEach((subnet, index) => {
        const eip = new Eip(this, `nat-eip-${regionConfig.region}-${index}`, {
          domain: "vpc",
          tags: {
            Name: `nat-eip-${regionConfig.region}-${index}`
          },
          provider: provider
        });

        const natGw = new NatGateway(this, `nat-gw-${regionConfig.region}-${index}`, {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: {
            Name: `nat-gw-${regionConfig.region}-${index}`
          },
          provider: provider
        });
        natGateways.push(natGw);
      });

      // Private subnets
      const privateSubnets: Subnet[] = [];
      regionConfig.privateSubnetCidrs.forEach((cidr, index) => {
        const subnet = new Subnet(this, `private-subnet-${regionConfig.region}-${index}`, {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: `\${${azs.fqn}.names[${index}]}`,
          tags: {
            Name: `private-subnet-${regionConfig.region}-${index}`,
            Type: "Private"
          },
          provider: provider
        });
        privateSubnets.push(subnet);
      });

      // Route tables
      const publicRouteTable = new RouteTable(this, `public-rt-${regionConfig.region}`, {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${regionConfig.region}`
        },
        provider: provider
      });

      new Route(this, `public-route-${regionConfig.region}`, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
        provider: provider
      });

      // Associate public subnets with public route table
      publicSubnets.forEach((subnet, index) => {
        new RouteTableAssociation(this, `public-rt-assoc-${regionConfig.region}-${index}`, {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
          provider: provider
        });
      });

      // Private route tables (one per AZ for HA)
      privateSubnets.forEach((subnet, index) => {
        const privateRouteTable = new RouteTable(this, `private-rt-${regionConfig.region}-${index}`, {
          vpcId: vpc.id,
          tags: {
            Name: `private-rt-${regionConfig.region}-${index}`
          },
          provider: provider
        });

        new Route(this, `private-route-${regionConfig.region}-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: natGateways[index].id,
          provider: provider
        });

        new RouteTableAssociation(this, `private-rt-assoc-${regionConfig.region}-${index}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
          provider: provider
        });
      });

      // Security Groups
      const albSecurityGroup = new SecurityGroup(this, `alb-sg-${regionConfig.region}`, {
        name: `alb-sg-${regionConfig.region}`,
        description: "Security group for Application Load Balancer",
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTP"
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTPS"
          }
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            description: "All outbound traffic"
          }
        ],
        tags: {
          Name: `alb-sg-${regionConfig.region}`
        },
        provider: provider
      });

      const ec2SecurityGroup = new SecurityGroup(this, `ec2-sg-${regionConfig.region}`, {
        name: `ec2-sg-${regionConfig.region}`,
        description: "Security group for EC2 instances",
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: "tcp",
            securityGroups: [albSecurityGroup.id],
            description: "HTTP from ALB"
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: "tcp",
            cidrBlocks: [regionConfig.vpcCidr],
            description: "SSH from VPC"
          }
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            description: "All outbound traffic"
          }
        ],
        tags: {
          Name: `ec2-sg-${regionConfig.region}`
        },
        provider: provider
      });

      // IAM Role for EC2 instances
      const ec2Role = new IamRole(this, `ec2-role-${regionConfig.region}`, {
        name: `ec2-role-${regionConfig.region}`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "ec2.amazonaws.com"
              }
            }
          ]
        }),
        provider: provider
      });

      // IAM Policy for EC2 instances
      new IamRolePolicy(this, `ec2-policy-${regionConfig.region}`, {
        name: `ec2-policy-${regionConfig.region}`,
        role: ec2Role.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
              ],
              Resource: [
                `arn:aws:ssm:${regionConfig.region}:${callerIdentity.accountId}:parameter/app/*`
              ]
            },
            {
              Effect: "Allow",
              Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
              ],
              Resource: [
                `arn:aws:logs:${regionConfig.region}:${callerIdentity.accountId}:log-group:/aws/ec2/*`
              ]
            },
            {
              Effect: "Allow",
              Action: [
                "cloudwatch:PutMetricData"
              ],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
              ],
              Resource: [
                `arn:aws:s3:::app-data-${regionConfig.region}-*/*`
              ]
            }
          ]
        }),
        provider: provider
      });

      const instanceProfile = new IamInstanceProfile(this, `ec2-instance-profile-${regionConfig.region}`, {
        name: `ec2-instance-profile-${regionConfig.region}`,
        role: ec2Role.name,
        provider: provider
      });

      // CloudWatch Log Group
      const logGroup = new CloudwatchLogGroup(this, `log-group-${regionConfig.region}`, {
        name: `/aws/ec2/app-${regionConfig.region}`,
        retentionInDays: 14,
        provider: provider
      });

      // Launch Template
      const launchTemplate = new LaunchTemplate(this, `launch-template-${regionConfig.region}`, {
        name: `launch-template-${regionConfig.region}`,
        imageId: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (update as needed)
        instanceType: "t3.micro",
        keyName: "my-key-pair", // Replace with your key pair name
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name
        },
        userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd awslogs
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${regionConfig.region}</h1>" > /var/www/html/index.html

# Configure CloudWatch agent
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = ${logGroup.name}
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S

[/var/log/httpd/access_log]
file = /var/log/httpd/access_log
log_group_name = ${logGroup.name}
log_stream_name = {instance_id}/httpd-access
datetime_format = [%d/%b/%Y:%H:%M:%S
EOF

sed -i 's/region = us-east-1/region = ${regionConfig.region}/' /etc/awslogs/awscli.conf
systemctl start awslogsd
systemctl enable awslogsd
`).toString('base64'),
        tagSpecifications: [
          {
            resourceType: "instance",
            tags: {
              Name: `app-instance-${regionConfig.region}`,
              Region: regionConfig.region
            }
          }
        ],
        provider: provider
      });

      // Application Load Balancer
      const alb = new Lb(this, `alb-${regionConfig.region}`, {
        name: `alb-${regionConfig.region}`,
        loadBalancerType: "application",
        internal: false,
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${regionConfig.region}`,
          Region: regionConfig.region
        },
        provider: provider
      });

      // Target Group
      const targetGroup = new LbTargetGroup(this, `tg-${regionConfig.region}`, {
        name: `tg-${regionConfig.region}`,
        port: 80,
        protocol: "HTTP",
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: "/",
          matcher: "200",
          port: "traffic-port",
          protocol: "HTTP"
        },
        tags: {
          Name: `tg-${regionConfig.region}`
        },
        provider: provider
      });

      // ALB Listener
      new LbListener(this, `alb-listener-${regionConfig.region}`, {
        loadBalancerArn: alb.arn,
        port: "80",
        protocol: "HTTP",
        defaultAction: [
          {
            type: "forward",
            targetGroupArn: targetGroup.arn
          }
        ],
        provider: provider
      });

      // Auto Scaling Group
      const asg = new AutoscalingGroup(this, `asg-${regionConfig.region}`, {
        name: `asg-${regionConfig.region}`,
        vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: "ELB",
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: "$Latest"
        },
        tag: [
          {
            key: "Name",
            value: `asg-instance-${regionConfig.region}`,
            propagateAtLaunch: true
          },
          {
            key: "Region",
            value: regionConfig.region,
            propagateAtLaunch: true
          }
        ],
        provider: provider
      });

      // Auto Scaling Policies
      const scaleUpPolicy = new AutoscalingPolicy(this, `scale-up-policy-${regionConfig.region}`, {
        name: `scale-up-policy-${regionConfig.region}`,
        scalingAdjustment: 1,
        adjustmentType: "ChangeInCapacity",
        cooldown: 300,
        autoscalingGroupName: asg.name,
        provider: provider
      });

      const scaleDownPolicy = new AutoscalingPolicy(this, `scale-down-policy-${regionConfig.region}`, {
        name: `scale-down-policy-${regionConfig.region}`,
        scalingAdjustment: -1,
        adjustmentType: "ChangeInCapacity",
        cooldown: 300,
        autoscalingGroupName: asg.name,
        provider: provider
      });

      // CloudWatch Alarms
      new CloudwatchMetricAlarm(this, `cpu-high-alarm-${regionConfig.region}`, {
        alarmName: `cpu-high-alarm-${regionConfig.region}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: "2",
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: "120",
        statistic: "Average",
        threshold: "70",
        alarmDescription: "This metric monitors ec2 cpu utilization",
        alarmActions: [scaleUpPolicy.arn, snsTopics[regionConfig.region].arn],
        dimensions: {
          AutoScalingGroupName: asg.name
        },
        provider: provider
      });

      new CloudwatchMetricAlarm(this, `cpu-low-alarm-${regionConfig.region}`, {
        alarmName: `cpu-low-alarm-${regionConfig.region}`,
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: "2",
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: "120",
        statistic: "Average",
        threshold: "30",
        alarmDescription: "This metric monitors ec2 cpu utilization",
        alarmActions: [scaleDownPolicy.arn],
        dimensions: {
          AutoScalingGroupName: asg.name
        },
        provider: provider
      });

      // Health Check for Route 53
      const healthCheck = new Route53HealthCheck(this, `health-check-${regionConfig.region}`, {
        fqdn: alb.dnsName,
        port: 80,
        type: "HTTP",
        resourcePath: "/",
        failureThreshold: "3",
        requestInterval: "30",
        tags: {
          Name: `health-check-${regionConfig.region}`
        },
        provider: providers["us-east-1"] // Health checks must be created in us-east-1
      });

      // Store regional resources for cross-region references
      regionalResources[regionConfig.region] = {
        vpc,
        alb,
        healthCheck,
        targetGroup,
        asg,
        logGroup,
        snsTopics: snsTopics[regionConfig.region]
      };
    });

    // Create S3 buckets with cross-region replication
    const primaryBucket = new S3Bucket(this, "primary-bucket", {
      bucket: `app-data-primary-${callerIdentity.accountId}`,
      provider: providers["us-east-1"]
    });

    const replicaBucket = new S3Bucket(this, "replica-bucket", {
      bucket: `app-data-replica-${callerIdentity.accountId}`,
      provider: providers["eu-west-1"]
    });

    // Enable versioning on both buckets
    new S3BucketVersioning(this, "primary-bucket-versioning", {
      bucket: primaryBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      },
      provider: providers["us-east-1"]
    });

    new S3BucketVersioning(this, "replica-bucket-versioning", {
      bucket: replicaBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      },
      provider: providers["eu-west-1"]
    });

    // Enable encryption
    new S3BucketEncryption(this, "primary-bucket-encryption", {
      bucket: primaryBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          }
        }
      ],
      provider: providers["us-east-1"]
    });

    new S3BucketEncryption(this, "replica-bucket-encryption", {
      bucket: replicaBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          }
        }
      ],
      provider: providers["eu-west-1"]
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, "primary-bucket-pab", {
      bucket: primaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: providers["us-east-1"]
    });

    new S3BucketPublicAccessBlock(this, "replica-bucket-pab", {
      bucket: replicaBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: providers["eu-west-1"]
    });

    // IAM role for S3 replication
    const replicationRole = new IamRole(this, "replication-role", {
      name: "s3-replication-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "s3.amazonaws.com"
            }
          }
        ]
      }),
      provider: providers["us-east-1"]
    });

    new IamRolePolicy(this, "replication-policy", {
      name: "s3-replication-policy",
      role: replicationRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl"
            ],
            Resource: [
              `${primaryBucket.arn}/*`
            ]
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ListBucket"
            ],
            Resource: [
              primaryBucket.arn
            ]
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ReplicateObject",
              "s3:ReplicateDelete"
            ],
            Resource: [
              `${replicaBucket.arn}/*`
            ]
          }
        ]
      }),
      provider: providers["us-east-1"]
    });

    // S3 Cross-Region Replication
    new S3BucketReplication(this, "bucket-replication", {
      role: replicationRole.arn,
      bucket: primaryBucket.id,
      rule: [
        {
          id: "replicate-to-eu-west-1",
          status: "Enabled",
          destination: {
            bucket: replicaBucket.arn,
            storageClass: "STANDARD_IA"
          }
        }
      ],
      dependsOn: [replicationRole],
      provider: providers["us-east-1"]
    });

    // Route 53 DNS records with failover routing
    new Route53Record(this, "primary-dns-record", {
      zoneId: hostedZone.zoneId,
      name: "app.example.com", // Replace with your subdomain
      type: "A",
      setIdentifier: "primary",
      failoverRoutingPolicy: {
        type: "PRIMARY"
      },
      healthCheckId: regionalResources["us-east-1"].healthCheck.id,
      alias: {
        name: regionalResources["us-east-1"].alb.dnsName,
        zoneId: regionalResources["us-east-1"].alb.zoneId,
        evaluateTargetHealth: true
      },
      provider: providers["us-east-1"]
    });

    new Route53Record(this, "secondary-dns-record", {
      zoneId: hostedZone.zoneId,
      name: "app.example.com", // Replace with your subdomain
      type: "A",
      setIdentifier: "secondary",
      failoverRoutingPolicy: {
        type: "SECONDARY"
      },
      alias: {
        name: regionalResources["eu-west-1"].alb.
```
