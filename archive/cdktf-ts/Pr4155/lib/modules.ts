import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import {
  SecurityGroup,
  SecurityGroupEgress,
  SecurityGroupIngress,
} from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

// Corrected import paths
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
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
  amiId?: string;
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

    // Use provided AMI ID or lookup latest Amazon Linux 2 AMI
    let amiId = config.amiId;
    if (!amiId) {
      const ami = new DataAwsAmi(this, 'amazon-linux-2', {
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
      amiId = ami.id;
    }

    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${config.project}-${config.env}-lt`,
      imageId: amiId,
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
      tags: {
        Name: `${config.project}-${config.env}-${config.name}`,
        Environment: config.env,
        Project: config.project,
      },
    });
  }
}
