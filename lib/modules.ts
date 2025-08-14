import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
interface BaseModuleProps {
  name: string;
  environment: string;
  tags?: { [key: string]: string };
}

/**
 * VPC Module: Creates a VPC, public and private subnets, and an Internet Gateway.
 * It automatically spans the VPC across multiple availability zones.
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & { cidrBlock: string }
  ) {
    super(scope, id);

    // const region = new DataAwsRegion(this, 'currentRegion');
    const azs = new DataAwsAvailabilityZones(this, 'availableZones', {
      state: 'available',
    });

    const tags = {
      ...props.tags,
      Name: `${props.name}-vpc`,
      Environment: props.environment,
    };

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      tags: tags,
    });

    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.name}-igw`,
        Environment: props.environment,
      },
    });

    // Create a public route table
    const publicRouteTable = new RouteTable(this, 'publicRouteTable', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.name}-public-rt`,
        Environment: props.environment,
      },
    });

    // Create a public route for the Internet Gateway
    new Route(this, 'publicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Dynamically create subnets for each AZ
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < azs.names.length; i++) {
      const az = azs.names[i];
      const publicCidr = `10.0.${i * 2}.0/24`;
      const privateCidr = `10.0.${i * 2 + 1}.0/24`;

      const publicSubnet = new Subnet(this, `publicSubnet${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: publicCidr,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.name}-public-subnet-${i}`,
          Environment: props.environment,
        },
      });
      this.publicSubnets.push(publicSubnet);

      const privateSubnet = new Subnet(this, `privateSubnet${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: privateCidr,
        availabilityZone: az,
        tags: {
          Name: `${props.name}-private-subnet-${i}`,
          Environment: props.environment,
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Associate public subnets with the public route table
      new RouteTableAssociation(this, `publicSubnetAssociation${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });
    }
  }
}

/**
 * Security Group Module: Creates a security group with configurable ingress and egress rules.
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & {
      vpcId: string;
      ingressRules: {
        fromPort: number;
        toPort: number;
        protocol: string;
        cidrBlocks: string[];
      }[];
      egressRules: {
        fromPort: number;
        toPort: number;
        protocol: string;
        cidrBlocks: string[];
      }[];
    }
  ) {
    super(scope, id);

    const ingress = props.ingressRules.map(rule => ({
      fromPort: rule.fromPort,
      toPort: rule.toPort,
      protocol: rule.protocol,
      cidrBlocks: rule.cidrBlocks,
    }));

    const egress = props.egressRules.map(rule => ({
      fromPort: rule.fromPort,
      toPort: rule.toPort,
      protocol: rule.protocol,
      cidrBlocks: rule.cidrBlocks,
    }));

    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `${props.name}-sg`,
      vpcId: props.vpcId,
      ingress: ingress,
      egress: egress,
      tags: {
        Name: `${props.name}-sg`,
        Environment: props.environment,
      },
    });
  }
}

/**
 * S3 Bucket Module: Creates a simple S3 bucket.
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & { bucketName: string }
  ) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 's3Bucket', {
      bucket: props.bucketName,
      acl: 'private',
      tags: {
        Name: props.bucketName,
        Environment: props.environment,
      },
    });
  }
}

/**
 * Launch Template Module: Creates a launch template for EC2 instances.
 */
export class LaunchTemplateModule extends Construct {
  public readonly launchTemplate: LaunchTemplate;

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & {
      instanceType: string;
      amiId: string;
      keyName: string;
      securityGroupIds: string[];
      userData: string;
    }
  ) {
    super(scope, id);

    this.launchTemplate = new LaunchTemplate(this, 'launchTemplate', {
      namePrefix: `${props.name}-lt-`,
      instanceType: props.instanceType,
      imageId: props.amiId,
      keyName: props.keyName,
      vpcSecurityGroupIds: props.securityGroupIds,
      userData: props.userData,
      tags: {
        Name: `${props.name}-launch-template`,
        Environment: props.environment,
      },
    });
  }
}

/**
 * Auto Scaling Group Module: Creates an Auto Scaling Group using a Launch Template.
 */
export class AutoScalingGroupModule extends Construct {
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(
    scope: Construct,
    id: string,
    props: BaseModuleProps & {
      launchTemplateId: string;
      subnetIds: string[];
      minSize: number;
      maxSize: number;
      desiredCapacity: number;
    }
  ) {
    super(scope, id);

    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${props.name}-asg`,
      launchTemplate: {
        id: props.launchTemplateId,
        version: '$Latest',
      },
      vpcZoneIdentifier: props.subnetIds,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      tag: [
        {
          key: 'Name',
          value: `${props.name}-instance`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: props.environment,
          propagateAtLaunch: true,
        },
      ],
    });
  }
}
