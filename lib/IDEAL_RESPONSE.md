## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import {
  vpc,
  subnet,
  internetGateway,
  routeTable,
  route,
  routeTableAssociation,
  natGateway,
  eip,
  securityGroup,
  launchTemplate,
  autoscalingGroup,
  lb,
  lbTargetGroup,
  lbListener,
  s3Bucket,
  iamRole,
  iamRolePolicyAttachment,
  iamInstanceProfile,
  route53Zone,
  route53Record,
  cloudwatchLogGroup,
  dataAwsAmi,
} from '@cdktf/provider-aws';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
export interface BaseModuleProps {
  namePrefix: string;
  tags: { [key: string]: string };
}

export interface VpcModuleProps extends BaseModuleProps {
  cidrBlock: string;
  availabilityZones: string[];
}

export class VpcModule extends Construct {
  public readonly vpc: vpc.Vpc;
  public readonly publicSubnets: subnet.Subnet[];
  public readonly privateSubnets: subnet.Subnet[];
  public readonly internetGateway: internetGateway.InternetGateway;
  public readonly natGateway: natGateway.NatGateway;
  public readonly natEip: eip.Eip;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new vpc.Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.namePrefix}vpc`,
        ...props.tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.namePrefix}igw`,
        ...props.tags,
      },
    });

    // Create public subnets
    this.publicSubnets = props.availabilityZones.map((az, index) => {
      return new subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.namePrefix}public-subnet-${index + 1}`,
          Type: 'Public',
          ...props.tags,
        },
      });
    });

    // Create private subnets
    this.privateSubnets = props.availabilityZones.map((az, index) => {
      return new subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `${props.namePrefix}private-subnet-${index + 1}`,
          Type: 'Private',
          ...props.tags,
        },
      });
    });

    // Create EIP for NAT Gateway
    this.natEip = new eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${props.namePrefix}nat-eip`,
        ...props.tags,
      },
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new natGateway.NatGateway(this, 'nat-gateway', {
      allocationId: this.natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `${props.namePrefix}nat-gateway`,
        ...props.tags,
      },
    });

    // Create route table for public subnets
    const publicRouteTable = new routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.namePrefix}public-rt`,
        ...props.tags,
      },
    });

    // Route to Internet Gateway
    new route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Create route table for private subnets
    const privateRouteTable = new routeTable.RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.namePrefix}private-rt`,
        ...props.tags,
      },
    });

    // Route to NAT Gateway
    new route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

export interface S3ModuleProps extends BaseModuleProps {
  bucketName: string;
}

export class S3Module extends Construct {
  public readonly bucket: s3Bucket.S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    this.bucket = new s3Bucket.S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      tags: props.tags,
    });
  }
}

export interface RdsModuleProps extends BaseModuleProps {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
}

export class RdsModule extends Construct {
  public readonly subnetGroup: DbSubnetGroup;
  public readonly instance: DbInstance;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    this.subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `${props.namePrefix}db-subnet-group`,
      subnetIds: props.subnetIds,
      tags: {
        Name: `${props.namePrefix}db-subnet-group`,
        ...props.tags,
      },
    });

    this.instance = new DbInstance(this, 'instance', {
      identifier: `${props.namePrefix}database`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: 'myappdb',
      username: 'admin',
      password: 'changeme123!',
      vpcSecurityGroupIds: props.securityGroupIds,
      dbSubnetGroupName: this.subnetGroup.name,
      skipFinalSnapshot: true,
      tags: {
        Name: `${props.namePrefix}database`,
        ...props.tags,
      },
    });
  }
}

export interface Ec2ModuleProps extends BaseModuleProps {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  iamInstanceProfile: string;
}

export class Ec2Module extends Construct {
  public readonly launchTemplate: launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: autoscalingGroup.AutoscalingGroup;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new dataAwsAmi.DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    this.launchTemplate = new launchTemplate.LaunchTemplate(
      this,
      'launch-template',
      {
        name: `${props.namePrefix}launch-template`,
        imageId: ami.id,
        instanceType: 't3.micro',
        vpcSecurityGroupIds: props.securityGroupIds,
        iamInstanceProfile: {
          name: props.iamInstanceProfile,
        },
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${props.namePrefix}!</h1>" > /var/www/html/index.html
      `
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${props.namePrefix}instance`,
              ...props.tags,
            },
          },
        ],
      }
    );

    this.autoScalingGroup = new autoscalingGroup.AutoscalingGroup(this, 'asg', {
      name: `${props.namePrefix}asg`,
      vpcZoneIdentifier: props.subnetIds,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 3,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${props.namePrefix}asg`,
          propagateAtLaunch: false,
        },
        ...Object.entries(props.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: false,
        })),
      ],
    });
  }
}

export interface AlbModuleProps extends BaseModuleProps {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
}

export class AlbModule extends Construct {
  public readonly loadBalancer: lb.Lb;
  public readonly targetGroup: lbTargetGroup.LbTargetGroup;
  public readonly listener: lbListener.LbListener;

  constructor(scope: Construct, id: string, props: AlbModuleProps) {
    super(scope, id);

    this.loadBalancer = new lb.Lb(this, 'alb', {
      name: `${props.namePrefix}alb`,
      loadBalancerType: 'application',
      subnets: props.subnetIds,
      securityGroups: props.securityGroupIds,
      tags: {
        Name: `${props.namePrefix}alb`,
        ...props.tags,
      },
    });

    this.targetGroup = new lbTargetGroup.LbTargetGroup(this, 'target-group', {
      name: `${props.namePrefix}tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
      },
      tags: {
        Name: `${props.namePrefix}target-group`,
        ...props.tags,
      },
    });

    this.listener = new lbListener.LbListener(this, 'listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

export interface Route53ModuleProps extends BaseModuleProps {
  domainName: string;
  albDnsName: string;
  albZoneId: string;
}

export class Route53Module extends Construct {
  public readonly hostedZone: route53Zone.Route53Zone;
  public readonly record: route53Record.Route53Record;

  constructor(scope: Construct, id: string, props: Route53ModuleProps) {
    super(scope, id);

    this.hostedZone = new route53Zone.Route53Zone(this, 'hosted-zone', {
      name: props.domainName,
      tags: {
        Name: `${props.namePrefix}hosted-zone`,
        ...props.tags,
      },
    });

    this.record = new route53Record.Route53Record(this, 'record', {
      zoneId: this.hostedZone.zoneId,
      name: props.domainName,
      type: 'A',
      alias: {
        name: props.albDnsName,
        zoneId: props.albZoneId,
        evaluateTargetHealth: true,
      },
    });
  }
}

export interface CloudWatchModuleProps extends BaseModuleProps {
  logGroupName: string;
}

export class CloudWatchModule extends Construct {
  public readonly logGroup: cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: CloudWatchModuleProps) {
    super(scope, id);

    this.logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'log-group',
      {
        name: props.logGroupName,
        retentionInDays: 14,
        tags: {
          Name: `${props.namePrefix}log-group`,
          ...props.tags,
        },
      }
    );
  }
}

export interface IamModuleProps extends BaseModuleProps {
  s3BucketArn: string;
}

export class IamModule extends Construct {
  public readonly ec2Role: iamRole.IamRole;
  public readonly instanceProfile: iamInstanceProfile.IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    this.ec2Role = new iamRole.IamRole(this, 'ec2-role', {
      name: `${props.namePrefix}ec2-role`,
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
      inlinePolicy: [
        {
          name: 'S3ReadOnlyAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: [props.s3BucketArn, `${props.s3BucketArn}/*`],
              },
            ],
          }),
        },
      ],
      tags: {
        Name: `${props.namePrefix}ec2-role`,
        ...props.tags,
      },
    });

    // Attach SSM managed instance core policy
    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'ssm-policy', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    this.instanceProfile = new iamInstanceProfile.IamInstanceProfile(
      this,
      'instance-profile',
      {
        name: `${props.namePrefix}instance-profile`,
        role: this.ec2Role.name,
      }
    );
  }
}

export interface SecurityGroupModuleProps extends BaseModuleProps {
  vpcId: string;
}

export class SecurityGroupModule extends Construct {
  public readonly albSecurityGroup: securityGroup.SecurityGroup;
  public readonly ec2SecurityGroup: securityGroup.SecurityGroup;
  public readonly rdsSecurityGroup: securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupModuleProps) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new securityGroup.SecurityGroup(this, 'alb-sg', {
      name: `${props.namePrefix}alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${props.namePrefix}alb-sg`,
        ...props.tags,
      },
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new securityGroup.SecurityGroup(this, 'ec2-sg', {
      name: `${props.namePrefix}ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [this.albSecurityGroup.id],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${props.namePrefix}ec2-sg`,
        ...props.tags,
      },
    });

    // RDS Security Group
    this.rdsSecurityGroup = new securityGroup.SecurityGroup(this, 'rds-sg', {
      name: `${props.namePrefix}rds-sg`,
      description: 'Security group for RDS database',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [this.ec2SecurityGroup.id],
        },
      ],
      tags: {
        Name: `${props.namePrefix}rds-sg`,
        ...props.tags,
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript

import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { AutoscalingAttachment } from '@cdktf/provider-aws/lib/autoscaling-attachment';
import {
  VpcModule,
  S3Module,
  Ec2Module,
  AlbModule,
  Route53Module,
  CloudWatchModule,
  IamModule,
  SecurityGroupModule,
} from '../lib/modules';
import { TerraformOutput } from 'cdktf';
import { Fn } from 'cdktf';

// ? Import your stacks here
// import { MyStack } from './my-stack';

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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Common configuration
    const namePrefix = 'MyApp-';
    const projectTags = {
      Project: 'MyApp',
    };

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with public and private subnets across 3 AZs
    const vpcModule = new VpcModule(this, 'vpc', {
      namePrefix,
      tags: projectTags,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [
        Fn.element(azs.names, 0),
        Fn.element(azs.names, 1),
        Fn.element(azs.names, 2),
      ],
    });

    // Create S3 bucket
    const s3Module = new S3Module(this, 's3', {
      namePrefix,
      tags: projectTags,
      bucketName: `${namePrefix.toLowerCase()}app-bucket-${Date.now()}`,
    });

    // Create Security Groups
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-groups',
      {
        namePrefix,
        tags: projectTags,
        vpcId: vpcModule.vpc.id,
      }
    );

    // Create IAM roles and instance profile
    const iamModule = new IamModule(this, 'iam', {
      namePrefix,
      tags: projectTags,
      s3BucketArn: s3Module.bucket.arn,
    });

    // Create RDS database
    // const rdsModule = new RdsModule(this, 'rds', {
    //   namePrefix,
    //   tags: projectTags,
    //   vpcId: vpcModule.vpc.id,
    //   subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
    //   securityGroupIds: [securityGroupModule.rdsSecurityGroup.id],
    // });

    // Create Application Load Balancer
    const albModule = new AlbModule(this, 'alb', {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.albSecurityGroup.id],
    });

    // Create EC2 instances with Auto Scaling
    const ec2Module = new Ec2Module(this, 'ec2', {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.ec2SecurityGroup.id],
      iamInstanceProfile: iamModule.instanceProfile.name,
    });

    // Attach Auto Scaling Group to Load Balancer Target Group
    new AutoscalingAttachment(this, 'asg-attachment', {
      autoscalingGroupName: ec2Module.autoScalingGroup.id,
      lbTargetGroupArn: albModule.targetGroup.arn,
    });

    // Create Route53 hosted zone and record
    const route53Module = new Route53Module(this, 'route53', {
      namePrefix,
      tags: projectTags,
      domainName: 'myapp-demo.local',
      albDnsName: albModule.loadBalancer.dnsName,
      albZoneId: albModule.loadBalancer.zoneId,
    });

    // Create CloudWatch log group
    const cloudWatchModule = new CloudWatchModule(this, 'cloudwatch', {
      namePrefix,
      tags: projectTags,
      logGroupName: `${namePrefix}application-logs`,
    });

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment

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
    // VPC Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'alb-security-group-id', {
      value: securityGroupModule.albSecurityGroup.id,
      description: 'ID of the ALB Security Group',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityGroupModule.ec2SecurityGroup.id,
      description: 'ID of the EC2 Security Group',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityGroupModule.rdsSecurityGroup.id,
      description: 'ID of the RDS Security Group',
    });

    // IAM Outputs
    new TerraformOutput(this, 'instance-profile-name', {
      value: iamModule.instanceProfile.name,
      description: 'Name of the EC2 Instance Profile',
    });
    // ALB Outputs
    new TerraformOutput(this, 'load-balancer-dns', {
      value: albModule.loadBalancer.dnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new TerraformOutput(this, 'load-balancer-zone-id', {
      value: albModule.loadBalancer.zoneId,
      description: 'Zone ID of the Application Load Balancer',
    });

    new TerraformOutput(this, 'load-balancer-arn', {
      value: albModule.loadBalancer.arn,
      description: 'ARN of the Application Load Balancer',
    });

    new TerraformOutput(this, 'target-group-arn', {
      value: albModule.targetGroup.arn,
      description: 'ARN of the Target Group',
    });

    // EC2 Auto Scaling Outputs
    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: ec2Module.autoScalingGroup.name,
      description: 'Name of the Auto Scaling Group',
    });

    new TerraformOutput(this, 'launch-template-id', {
      value: ec2Module.launchTemplate.id,
      description: 'ID of the Launch Template',
    });

    // Route53 Outputs
    new TerraformOutput(this, 'hosted-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'ID of the Route53 Hosted Zone',
    });

    new TerraformOutput(this, 'domain-name', {
      value: route53Module.record.name,
      description: 'Domain name configured in Route53',
    });

    // CloudWatch Outputs
    new TerraformOutput(this, 'log-group-name', {
      value: cloudWatchModule.logGroup.name,
      description: 'Name of the CloudWatch Log Group',
    });

    new TerraformOutput(this, 'log-group-arn', {
      value: cloudWatchModule.logGroup.arn,
      description: 'ARN of the CloudWatch Log Group',
    });

    // Availability Zones Output
    new TerraformOutput(this, 'availability-zones', {
      value: [
        Fn.element(azs.names, 0),
        Fn.element(azs.names, 1),
        Fn.element(azs.names, 2),
      ],
      description: 'Availability zones used for the infrastructure',
    });
  }
}
```