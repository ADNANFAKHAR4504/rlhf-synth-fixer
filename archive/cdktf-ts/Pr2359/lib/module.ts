import { Construct } from 'constructs';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsIamPolicy } from '@cdktf/provider-aws/lib/data-aws-iam-policy';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Instance as Ec2Instance } from '@cdktf/provider-aws/lib/instance';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn } from 'cdktf';

// VPC Module (No Changes)
export interface VpcModuleProps {
  name: string;
  cidrBlock: string;
}

export class VpcModule extends Construct {
  public readonly vpcIdOutput: string;
  public readonly publicSubnetIdsOutput: string[];
  public readonly privateSubnetIdsOutput: string[];
  public readonly cidrBlockOutput: string;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);
    const azs = new DataAwsAvailabilityZones(this, 'available-azs');
    const numberOfAzs = 2;
    this.cidrBlockOutput = props.cidrBlock;

    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { Name: props.name },
    });

    const publicSubnets: string[] = [];
    for (let i = 0; i < numberOfAzs; i++) {
      const az = Fn.element(azs.names, i);
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(props.cidrBlock, 8, i),
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { Name: `${props.name}-public-subnet-${i}` },
      });
      publicSubnets.push(subnet.id);
    }
    this.publicSubnetIdsOutput = publicSubnets;

    const privateSubnets: string[] = [];
    for (let i = 0; i < numberOfAzs; i++) {
      const az = Fn.element(azs.names, i);
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(props.cidrBlock, 8, i + numberOfAzs),
        availabilityZone: az,
        tags: { Name: `${props.name}-private-subnet-${i}` },
      });
      privateSubnets.push(subnet.id);
    }
    this.privateSubnetIdsOutput = privateSubnets;

    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: `${props.name}-igw` },
    });

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: { Name: `${props.name}-public-rt` },
    });
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });
    for (let i = 0; i < publicSubnets.length; i++) {
      new RouteTableAssociation(this, `public-rt-assoc-${i}`, {
        subnetId: Fn.element(publicSubnets, i),
        routeTableId: publicRouteTable.id,
      });
    }

    const natGateway = new NatGateway(this, 'nat-gw', {
      allocationId: new Eip(this, 'nat-eip', {
        tags: { Name: `${props.name}-nat-eip` },
      }).id,
      subnetId: Fn.element(publicSubnets, 0),
      tags: { Name: `${props.name}-nat-gw` },
    });

    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: vpc.id,
      tags: { Name: `${props.name}-private-rt` },
    });
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });
    for (let i = 0; i < privateSubnets.length; i++) {
      new RouteTableAssociation(this, `private-rt-assoc-${i}`, {
        subnetId: Fn.element(privateSubnets, i),
        routeTableId: privateRouteTable.id,
      });
    }

    this.vpcIdOutput = vpc.id;
  }
}

// S3 Module (No Changes)
export interface S3ModuleProps {
  bucketName: string;
  logBucketName: string;
}

export class S3Module extends Construct {
  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);
    const logBucket = new S3Bucket(this, 'log-bucket', {
      bucket: props.logBucketName,
      tags: { Name: props.logBucketName, Purpose: 'Logging' },
    });

    const mainBucket = new S3Bucket(this, 'main-bucket', {
      bucket: props.bucketName,
      forceDestroy: true,
      tags: { Name: props.bucketName, Purpose: 'Static Site' },
    });

    new S3BucketPublicAccessBlock(this, 'main-bucket-public-access-block', {
      bucket: mainBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'main-bucket-encryption',
      {
        bucket: mainBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketVersioningA(this, 'main-bucket-versioning', {
      bucket: mainBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketLoggingA(this, 'main-bucket-logging', {
      bucket: mainBucket.id,
      targetBucket: logBucket.id,
      targetPrefix: 'log/',
    });
  }
}

// RDS Module (Modified)
export interface RdsModuleProps {
  name: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  username: string;
  password?: string;
  allocatedStorage: number;
  vpcId: string;
  privateSubnetIds: string[];
  // NEW: Accept the security group ID created in the main stack.
  dbSecurityGroupId: string;
}

export class RdsModule extends Construct {
  public readonly dbInstanceIdOutput: string;
  public readonly dbEndpointOutput: string;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);
    // This module no longer creates its own security group.
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: props.name,
      subnetIds: props.privateSubnetIds,
      tags: { Name: `${props.name}-db-subnet-group` },
    });

    const dbInstance = new DbInstance(this, 'db-instance', {
      identifier: props.name,
      engine: props.engine,
      engineVersion: props.engineVersion,
      instanceClass: props.instanceClass,
      allocatedStorage: props.allocatedStorage,
      username: props.username,
      password: props.password || 'please-change-me',
      dbSubnetGroupName: dbSubnetGroup.name,
      // Use the security group ID passed in from the main stack.
      vpcSecurityGroupIds: [props.dbSecurityGroupId],
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      tags: { Name: props.name },
    });

    this.dbInstanceIdOutput = dbInstance.id;
    this.dbEndpointOutput = dbInstance.endpoint;
  }
}

// EC2 Module (No Changes)
export interface Ec2ModuleProps {
  name: string;
  vpcId: string;
  subnetId: string;
  instanceType: string;
  ami: string;
  keyName: string;
  instanceProfileName: string;
  ec2SecurityGroupId: string;
}

export class Ec2Module extends Construct {
  public readonly instanceIdOutput: string;
  public readonly targetGroupArnOutput: string;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);
    const ec2Instance = new Ec2Instance(this, 'ec2-instance', {
      ami: props.ami,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [props.ec2SecurityGroupId],
      keyName: props.keyName,
      associatePublicIpAddress: false,
      iamInstanceProfile: props.instanceProfileName,
      tags: { Name: props.name },
    });

    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${props.name}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        path: '/',
        protocol: 'HTTP',
      },
      tags: { Name: `${props.name}-tg` },
    });

    new LbTargetGroupAttachment(this, 'target-group-attachment', {
      targetGroupArn: targetGroup.arn,
      targetId: ec2Instance.id,
      port: 80,
    });

    this.instanceIdOutput = ec2Instance.id;
    this.targetGroupArnOutput = targetGroup.arn;
  }
}

// ALB Module (No Changes)
export interface AlbModuleProps {
  name: string;
  vpcId: string;
  publicSubnetIds: string[];
  targetGroupArn: string;
  albSecurityGroupId: string;
}

export class AlbModule extends Construct {
  public readonly albDnsNameOutput: string;
  public readonly albZoneIdOutput: string;
  public readonly albSecurityGroupIdOutput: string;

  constructor(scope: Construct, id: string, props: AlbModuleProps) {
    super(scope, id);
    const alb = new Alb(this, 'main-alb', {
      name: props.name,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [props.albSecurityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: true,
      tags: { Name: props.name },
    });

    new LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: props.targetGroupArn,
        },
      ],
    });

    this.albDnsNameOutput = alb.dnsName;
    this.albZoneIdOutput = alb.zoneId;
    this.albSecurityGroupIdOutput = props.albSecurityGroupId;
  }
}

// Route 53 Module (No Changes)
export interface Route53ModuleProps {
  zoneName: string;
  recordName: string;
  albZoneId: string;
  albDnsName: string;
}

export class Route53Module extends Construct {
  constructor(scope: Construct, id: string, props: Route53ModuleProps) {
    super(scope, id);

    // Create the hosted zone instead of looking it up
    const zone = new Route53Zone(this, 'main-zone', {
      name: props.zoneName,
      tags: { Name: `${props.zoneName}-zone` },
    });

    new Route53Record(this, 'alb-dns-record', {
      zoneId: zone.id,
      name: `${props.recordName}.${props.zoneName}`,
      type: 'A',
      alias: {
        name: props.albDnsName,
        zoneId: props.albZoneId,
        evaluateTargetHealth: true,
      },
    });
  }
}

// CloudWatch Module (No Changes)
export interface CloudwatchModuleProps {
  instanceId: string;
  dbInstanceId: string;
}

export class CloudwatchModule extends Construct {
  constructor(scope: Construct, id: string, props: CloudwatchModuleProps) {
    super(scope, id);
    new CloudwatchMetricAlarm(this, 'ec2-cpu-alarm', {
      alarmName: `${id}-ec2-cpu-high`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        InstanceId: props.instanceId,
      },
      alarmDescription: 'Alarm when EC2 CPU utilization exceeds 80%',
    });

    new CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `${id}-rds-cpu-high`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        DBInstanceIdentifier: props.dbInstanceId,
      },
      alarmDescription: 'Alarm when RDS CPU utilization exceeds 80%',
    });
  }
}

// IAM Module (No Changes)
export interface IamModuleProps {
  name: string;
}

export class IamModule extends Construct {
  public readonly instanceProfileName: string;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: props.name,
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
      tags: { Name: props.name },
    });

    const ssmPolicy = new DataAwsIamPolicy(this, 'ssm-policy', {
      name: 'AmazonSSMManagedInstanceCore',
    });
    new IamRolePolicyAttachment(this, 'ssm-policy-attachment', {
      role: ec2Role.name,
      policyArn: ssmPolicy.arn,
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.name}-profile`,
        role: ec2Role.name,
      }
    );

    this.instanceProfileName = instanceProfile.name;
  }
}
