## 1. modules.ts

```typescript
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
```

## 2. tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// ? Import your stacks here
import { InfrastructureModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            ManagedBy: 'CDKTF',
            Project: 'tap-infrastructure',
            Environment: environmentSuffix,
          },
        },
      ],
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get the latest Amazon Linux 2 AMI
    const latestAmi = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // ? Add your stack instantiations here
    const infrastructureConfig = {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24', // 254 available IPs for public resources
      privateSubnetCidr: '10.0.2.0/24', // 254 available IPs for private resources
      instanceType: 't3.micro', // Cost-effective for development, scale up for production
      asgDesiredCapacity: 2, // Balanced between availability and cost
      domainName: `${environmentSuffix}.tap-infrastructure.com`, //  Environment-specific domain
      projectName: 'tap-infrastructure',
      environment: environmentSuffix, //  Use environmentSuffix for consistency
      region: awsRegion,
      amiId: latestAmi.id, // Pass the AMI ID to the module
    };

    // === DEPLOY INFRASTRUCTURE ===
    const infrastructure = new InfrastructureModule(
      this,
      'infrastructure',
      infrastructureConfig
    );

    // === OUTPUTS ===
    // Essential outputs for integration with other systems and debugging

    //  AMI Information - useful for tracking what AMI was used
    new TerraformOutput(this, 'ami-id', {
      value: latestAmi.id,
      description: 'ID of the dynamically selected Amazon Linux 2 AMI',
    });

    new TerraformOutput(this, 'ami-name', {
      value: latestAmi.name,
      description: 'Name of the dynamically selected Amazon Linux 2 AMI',
    });

    new TerraformOutput(this, 'ami-creation-date', {
      value: latestAmi.creationDate,
      description: 'Creation date of the selected AMI',
    });

    // Network outputs - useful for connecting additional resources
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the main VPC',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: infrastructure.publicSubnet.id,
      description: 'ID of the public subnet',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: infrastructure.privateSubnet.id,
      description: 'ID of the private subnet',
    });

    // Compute outputs - for monitoring and management
    new TerraformOutput(this, 'ec2-instance-id', {
      value: infrastructure.ec2Instance.id,
      description: 'ID of the EC2 instance in public subnet',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: infrastructure.ec2Instance.publicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new TerraformOutput(this, 'asg-name', {
      value: infrastructure.asg.name,
      description: 'Name of the Auto Scaling Group',
    });

    // Storage outputs - for application configuration
    new TerraformOutput(this, 's3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the S3 bucket for application data',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: infrastructure.s3Bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    //  DNS outputs - for the newly created hosted zone
    new TerraformOutput(this, 'route53-zone-id', {
      value: infrastructure.route53Zone.zoneId,
      description: 'Zone ID of the newly created Route 53 hosted zone',
    });

    new TerraformOutput(this, 'route53-name-servers', {
      value: infrastructure.route53Zone.nameServers,
      description:
        'Name servers for the newly created Route 53 hosted zone - configure these with your domain registrar',
    });

    new TerraformOutput(this, 'route53-zone-arn', {
      value: infrastructure.route53Zone.arn,
      description: 'ARN of the Route 53 hosted zone',
    });

    // Monitoring outputs - for alerting system integration
    new TerraformOutput(this, 'cloudwatch-alarm-arn', {
      value: infrastructure.cloudwatchAlarm.arn,
      description: 'ARN of the CloudWatch CPU utilization alarm',
    });

    // Security outputs - for audit and compliance
    new TerraformOutput(this, 'vpc-cidr', {
      value: infrastructureConfig.vpcCidr,
      description: 'CIDR block of the VPC',
    });

    //  Domain configuration output
    new TerraformOutput(this, 'domain-name', {
      value: infrastructureConfig.domainName,
      description: 'Domain name configured for this environment',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```