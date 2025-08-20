lib/modules.ts

import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import {
  SecurityGroup,
  SecurityGroupIngress,
  SecurityGroupEgress,
} from '@cdktf/provider-aws/lib/security-group';

// Corrected import paths
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';

import { Fn } from 'cdktf';

/**
 * Interface for VPC module configuration.
 */
export interface VpcConfig {
  /**
   * The CIDR block for the VPC.
   */
  cidrBlock: string;
  /**
   * The environment name (e.g., 'dev', 'qa', 'prod').
   */
  env: string;
  /**
   * The project name for tagging.
   */
  project: string;
  /**
   * Number of availability zones to use.
   */
  azCount?: number;
}

/**
 * A reusable construct for creating a multi-AZ VPC.
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly availabilityZones: string[];

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    const zones = new DataAwsAvailabilityZones(this, 'availability-zones', {
      state: 'available',
    });

    this.availabilityZones = Fn.slice(
      zones.names,
      0,
      config.azCount || 2
    ) as unknown as string[];

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      tags: {
        Name: `${config.project}-${config.env}-vpc`,
        Environment: config.env,
        Project: config.project,
      },
    });

    const internetGateway = new InternetGateway(this, 'internet-gateway', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.project}-${config.env}-igw`,
        Environment: config.env,
        Project: config.project,
      },
    });

    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: internetGateway.id,
        },
      ],
      tags: {
        Name: `${config.project}-${config.env}-public-rt`,
        Environment: config.env,
        Project: config.project,
      },
    });

    this.publicSubnets = [];
    for (let i = 0; i < this.availabilityZones.length; i++) {
      const azToken = Fn.element(zones.names, i);
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: azToken,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.project}-${config.env}-public-subnet-${i}`,
          Environment: config.env,
          Project: config.project,
        },
      });

      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      this.publicSubnets.push(publicSubnet);
    }
  }
}

/**
 * Interface for Security Group module configuration.
 */
export interface SecurityGroupConfig {
  vpcId: string;
  env: string;
  project: string;
  name: string;
  description: string;
  ingressRules: SecurityGroupIngress[];
  egressRules?: SecurityGroupEgress[];
}

/**
 * A reusable construct for creating a Security Group with customizable rules.
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `${config.project}-${config.env}-${config.name}`,
      vpcId: config.vpcId,
      description: config.description,
      ingress: config.ingressRules,
      egress: config.egressRules || [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: {
        Name: `${config.project}-${config.env}-${config.name}`,
        Environment: config.env,
        Project: config.project,
      },
    });
  }
}

/**
 * Interface for Auto Scaling Group module configuration.
 */
export interface AutoScalingGroupConfig {
  /**
   * The environment name (e.g., 'dev', 'qa', 'prod').
   */
  env: string;
  /**
   * The project name for tagging.
   */
  project: string;
  /**
   * The list of subnet IDs for the ASG.
   */
  subnetIds: string[];
  /**
   * The list of security group IDs to attach to instances.
   */
  securityGroupIds: string[];
  /**
   * The AMI ID for the EC2 instance.
   */
  amiId: string;
  /**
   * The EC2 instance type.
   */
  instanceType: string;
  /**
   * The minimum number of instances in the ASG.
   */
  minSize: number;
  /**
   * The maximum number of instances in the ASG.
   */
  maxSize: number;
  /**
   * The desired number of instances in the ASG.
   */
  desiredCapacity: number;
  /**
   * Optional user data script for the instances.
   */
  userData?: string;
}

/**
 * A reusable construct for creating a Launch Template and Auto Scaling Group.
 */
export class AutoScalingModule extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(scope: Construct, id: string, config: AutoScalingGroupConfig) {
    super(scope, id);

    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${config.project}-${config.env}-lt`,
      imageId: config.amiId,
      instanceType: config.instanceType,
      vpcSecurityGroupIds: config.securityGroupIds,
      userData: Fn.base64encode(config.userData || ''),
      tags: {
        Name: `${config.project}-${config.env}-lt`,
        Environment: config.env,
        Project: config.project,
      },
    });

    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${config.project}-${config.env}-asg`,
      vpcZoneIdentifier: config.subnetIds,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${config.project}-${config.env}-instance`,
          propagateAtLaunch: true,
        },
        { key: 'Environment', value: config.env, propagateAtLaunch: true },
        { key: 'Project', value: config.project, propagateAtLaunch: true },
      ],
    });
  }
}

/**
 * Interface for S3 bucket module configuration.
 */
export interface S3BucketConfig {
  env: string;
  project: string;
  name: string;
  acl?: string;
}

/**
 * A reusable construct for creating a secure S3 bucket.
 */
export class S3BucketModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: S3BucketConfig) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `${config.project}-${config.env}-${config.name}`,
      acl: config.acl || 'private',
      tags: {
        Name: `${config.project}-${config.env}-${config.name}`,
        Environment: config.env,
        Project: config.project,
      },
    });
  }
}


tap-stack.ts

import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  VpcModule,
  SecurityGroupModule,
  AutoScalingModule,
  S3BucketModule,
} from './modules';
import { Fn } from 'cdktf';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const project = 'tap';
    const env = environmentSuffix as 'dev' | 'qa' | 'prod';

    // 1. Create a multi-AZ VPC.
    const tapVpc = new VpcModule(this, 'tap-vpc', {
      cidrBlock: '10.0.0.0/16',
      env,
      project,
    });

    // 2. Create a Security Group for the web server.
    const webServerSg = new SecurityGroupModule(this, 'web-server-sg', {
      vpcId: tapVpc.vpc.id,
      env,
      project,
      name: 'web-server',
      description: 'Allows HTTP and SSH access',
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          ipv6CidrBlocks: ['::/0'],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          ipv6CidrBlocks: ['::/0'],
        },
      ],
    });

    // 3. Create an EC2 Auto Scaling Group and Launch Template.
    new AutoScalingModule(this, 'web-asg', {
      env,
      project,
      subnetIds: tapVpc.publicSubnets.map(subnet => subnet.id),
      securityGroupIds: [webServerSg.securityGroup.id],
      amiId: 'ami-04e08e36e17a21b56', // IMPORTANT: Replace with a valid AMI ID for us-west-2.
      instanceType: 't2.micro',
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      userData: Fn.rawString(`#!/bin/bash
                sudo yum update -y
                sudo yum install httpd -y
                sudo systemctl start httpd
                sudo systemctl enable httpd
                echo "<h1>Hello from ${project} ${env}</h1>" > /var/www/html/index.html`),
    });

    // 4. Create a private S3 Bucket for application assets.
    new S3BucketModule(this, 'app-bucket', {
      env,
      project,
      name: 'app-assets',
    });
  }
}
