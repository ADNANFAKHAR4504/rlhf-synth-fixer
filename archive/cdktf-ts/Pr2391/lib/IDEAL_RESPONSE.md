## lib/module.ts

```typescript 
import { Construct } from 'constructs';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsIamPolicy } from '@cdktf/provider-aws/lib/data-aws-iam-policy';
import { DataAwsRoute53Zone } from '@cdktf/provider-aws/lib/data-aws-route53-zone';
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
    const zone = new DataAwsRoute53Zone(this, 'main-zone', {
      name: `${props.zoneName}.`,
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

```
## lib/tap-stack.ts

```typescript

import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  CloudwatchModule,
  Ec2Module,
  IamModule,
  RdsModule,
  S3Module,
  VpcModule,
} from './module';

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

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const vpc = new VpcModule(this, 'main-vpc', {
      name: `fullstack-app-${environmentSuffix}`,
      cidrBlock: '10.0.0.0/16',
    });

    new S3Module(this, 's3-buckets', {
      bucketName: `fullstack-app-bucket-${environmentSuffix}`,
      logBucketName: `fullstack-app-log-bucket-${environmentSuffix}`,
    });

    const iam = new IamModule(this, 'ec2-iam-role', {
      name: `ec2-role-${environmentSuffix}`,
    });

    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      description: 'Allow all inbound HTTP/S traffic',
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `alb-sg-${environmentSuffix}` },
    });

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `db-sg-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      description: 'Allow inbound traffic to RDS from EC2 instances',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `db-sg-${environmentSuffix}` },
    });

    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `ec2-sg-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      description: 'Allow inbound HTTP traffic from ALB',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `ec2-sg-${environmentSuffix}` },
    });

    new SecurityGroupRule(this, 'ec2-ingress-rule', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, 'db-ingress-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: ec2SecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
    });

    const ami = new DataAwsAmi(this, 'ubuntu-ami', {
      mostRecent: true,
      owners: ['099720109477'],
      filter: [
        {
          name: 'name',
          values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
        },
      ],
    });

    const ec2 = new Ec2Module(this, 'ec2-instance', {
      name: `web-server-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      subnetId: vpc.privateSubnetIdsOutput[0],
      instanceType: 't3.micro',
      ami: ami.id,
      keyName: 'turing-key',
      instanceProfileName: iam.instanceProfileName,
      ec2SecurityGroupId: ec2SecurityGroup.id,
    });
    // Configuration parameters
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    const rds = new RdsModule(this, 'db-instance', {
      name: `mysql-db-${environmentSuffix}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      username: 'admin',
      password: dbPasswordSecret.secretString,
      vpcId: vpc.vpcIdOutput,
      privateSubnetIds: vpc.privateSubnetIdsOutput,
      dbSecurityGroupId: dbSecurityGroup.id,
    });

    new CloudwatchModule(this, 'alarms', {
      instanceId: ec2.instanceIdOutput,
      dbInstanceId: rds.dbInstanceIdOutput,
    });
  }
}
```