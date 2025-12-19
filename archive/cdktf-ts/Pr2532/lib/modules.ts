import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Fn } from 'cdktf';

export interface InfrastructureModuleProps {
  readonly vpcCidr: string;
  readonly publicSubnetCidr: string;
  readonly privateSubnetCidr: string;
  readonly instanceType: string;
  readonly asgDesiredCapacity: number;
  readonly domainName: string;
  readonly projectName: string;
  readonly environment: string;
  readonly region?: string;
  readonly amiId: string; // Make this required since we're passing it from the stack
}

export class InfrastructureModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly ec2Instance: Instance;
  public readonly s3Bucket: S3Bucket;
  public readonly asg: AutoscalingGroup;
  public readonly route53Zone: Route53Zone;
  public readonly cloudwatchAlarm: CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, props: InfrastructureModuleProps) {
    super(scope, id);

    // Common tags for all resources
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      ManagedBy: 'terraform',
      Owner: 'infrastructure-team',
    };

    // Get available availability zones
    const availabilityZones = new DataAwsAvailabilityZones(
      this,
      'available-azs',
      {
        state: 'available',
      }
    );

    // Use Fn.element to get specific AZs from the list
    const availabilityZone1 = Fn.element(availabilityZones.names, 0);
    const availabilityZone2 = Fn.element(availabilityZones.names, 1);

    // === VPC SETUP ===
    this.vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-vpc`,
      },
    });

    // Internet Gateway
    const internetGateway = new InternetGateway(this, 'internet-gateway', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-igw`,
      },
    });

    // === SUBNET CONFIGURATION ===
    this.publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.publicSubnetCidr,
      availabilityZone: availabilityZone1,
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-public-subnet`,
        Type: 'Public',
      },
    });

    this.privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.privateSubnetCidr,
      availabilityZone: availabilityZone2,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-private-subnet`,
        Type: 'Private',
      },
    });

    // === NAT GATEWAY SETUP ===
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...commonTags,
        Name: `${props.projectName}-nat-eip`,
      },
    });

    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-nat-gateway`,
      },
    });

    // === ROUTING CONFIGURATION ===
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    new RouteTableAssociation(this, 'public-route-association', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-private-rt`,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    new RouteTableAssociation(this, 'private-route-association', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // === SECURITY GROUPS ===
    const publicSecurityGroup = new SecurityGroup(this, 'public-sg', {
      name: `${props.projectName}-public-sg`,
      description: 'Security group for public subnet resources',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP access from internet',
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'SSH access for administration',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${props.projectName}-public-sg`,
      },
    });

    const privateSecurityGroup = new SecurityGroup(this, 'private-sg', {
      name: `${props.projectName}-private-sg`,
      description: 'Security group for private subnet resources',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: 'tcp',
          securityGroups: [publicSecurityGroup.id],
          description: 'All TCP traffic from public subnet',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${props.projectName}-private-sg`,
      },
    });

    // === S3 BUCKET ===
    const timestamp = Date.now().toString();
    const bucketName =
      `${props.projectName}-app-data-${props.environment}-${timestamp}`.toLowerCase();

    this.s3Bucket = new S3Bucket(this, 'app-bucket', {
      bucket: bucketName,
      tags: commonTags,
    });

    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // === IAM ROLE FOR EC2 ===
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `${props.projectName}-ec2-role`,
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
      tags: commonTags,
    });

    new IamRolePolicy(this, 'ec2-s3-policy', {
      name: `${props.projectName}-s3-readonly-policy`,
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
            Resource: [
              `arn:aws:s3:::${bucketName}`,
              `arn:aws:s3:::${bucketName}/*`,
            ],
          },
        ],
      }),
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.projectName}-instance-profile`,
        role: ec2Role.name,
      }
    );

    // === EC2 INSTANCE ===
    this.ec2Instance = new Instance(this, 'web-instance', {
      ami: props.amiId, // Use the passed AMI ID
      instanceType: props.instanceType,
      subnetId: this.publicSubnet.id,
      vpcSecurityGroupIds: [publicSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Hello from ${props.projectName}</h1>" > /var/www/html/index.html
        echo "<p>Instance Type: ${props.instanceType}</p>" >> /var/www/html/index.html
        echo "<p>Environment: ${props.environment}</p>" >> /var/www/html/index.html
      `
      ).toString('base64'),
      tags: {
        ...commonTags,
        Name: `${props.projectName}-web-instance`,
      },
    });

    // === LAUNCH TEMPLATE FOR ASG ===
    const launchTemplate = new LaunchTemplate(this, 'asg-launch-template', {
      name: `${props.projectName}-launch-template`,
      imageId: props.amiId, // Use the passed AMI ID
      instanceType: props.instanceType,
      vpcSecurityGroupIds: [privateSecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>ASG Instance from ${props.projectName}</h1>" > /var/www/html/index.html
        echo "<p>Instance Type: ${props.instanceType}</p>" >> /var/www/html/index.html
        echo "<p>Environment: ${props.environment}</p>" >> /var/www/html/index.html
      `
      ).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...commonTags,
            Name: `${props.projectName}-asg-instance`,
          },
        },
      ],
    });

    // === AUTO SCALING GROUP ===
    this.asg = new AutoscalingGroup(this, 'app-asg', {
      name: `${props.projectName}-asg`,
      vpcZoneIdentifier: [this.privateSubnet.id],
      desiredCapacity: props.asgDesiredCapacity,
      minSize: 1,
      maxSize: 5,
      healthCheckType: 'EC2',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${props.projectName}-asg`,
          propagateAtLaunch: true,
        },
        {
          key: 'Project',
          value: props.projectName,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: props.environment,
          propagateAtLaunch: true,
        },
      ],
    });

    // === CLOUDWATCH ALARM ===
    this.cloudwatchAlarm = new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: `${props.projectName}-high-cpu-utilization`,
      alarmDescription: 'Alarm when CPU exceeds 80%',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        AutoScalingGroupName: this.asg.name,
      },
      tags: commonTags,
    });

    // === ROUTE 53 HOSTED ZONE ===
    this.route53Zone = new Route53Zone(this, 'hosted-zone', {
      name: props.domainName,
      comment: `Hosted zone for ${props.projectName} - ${props.environment}`,
      forceDestroy: true,
      tags: {
        ...commonTags,
        Name: `${props.projectName}-hosted-zone`,
        Domain: props.domainName,
      },
    });
  }
}
