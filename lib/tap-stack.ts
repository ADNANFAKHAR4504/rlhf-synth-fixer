import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

export interface TapStackConfig {
  readonly environment: 'dev' | 'test' | 'prod';
  readonly vpcCidr: string;
  readonly instanceType: string;
  readonly dbInstanceClass: string;
  readonly tags: { [key: string]: string };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    const vpc = new Vpc(this, 'VPC', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...config.tags, Name: `vpc-${config.environment}` },
    });

    const igw = new InternetGateway(this, 'IGW', {
      vpcId: vpc.id,
      tags: { ...config.tags, Name: `igw-${config.environment}` },
    });
    const publicSubnetA = new Subnet(this, 'PublicSubnetA', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.1.0/24`,
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: { ...config.tags, Name: `public-subnet-a-${config.environment}` },
    });
    const publicSubnetB = new Subnet(this, 'PublicSubnetB', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.3.0/24`,
      availabilityZone: 'us-east-1b',
      mapPublicIpOnLaunch: true,
      tags: { ...config.tags, Name: `public-subnet-b-${config.environment}` },
    });
    const privateSubnetA = new Subnet(this, 'PrivateSubnetA', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.2.0/24`,
      availabilityZone: 'us-east-1a',
      tags: { ...config.tags, Name: `private-subnet-a-${config.environment}` },
    });
    const privateSubnetB = new Subnet(this, 'PrivateSubnetB', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.4.0/24`,
      availabilityZone: 'us-east-1b',
      tags: { ...config.tags, Name: `private-subnet-b-${config.environment}` },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });
    new RouteTableAssociation(this, 'PublicRTAssocA', {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });
    new RouteTableAssociation(this, 'PublicRTAssocB', {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    const eip = new Eip(this, 'NatEip', {});
    const natGateway = new NatGateway(this, 'NATGateway', {
      allocationId: eip.id,
      subnetId: publicSubnetA.id,
    });
    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
    });
    new RouteTableAssociation(this, 'PrivateRTAssocA', {
      subnetId: privateSubnetA.id,
      routeTableId: privateRouteTable.id,
    });
    new RouteTableAssociation(this, 'PrivateRTAssocB', {
      subnetId: privateSubnetB.id,
      routeTableId: privateRouteTable.id,
    });

    const albSg = new SecurityGroup(this, 'AlbSg', {
      name: `alb-sg-${config.environment}-${uniqueSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });
    const webSg = new SecurityGroup(this, 'WebSg', {
      name: `web-sg-${config.environment}-${uniqueSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });
    const dbSg = new SecurityGroup(this, 'DbSg', {
      name: `db-sg-${config.environment}-${uniqueSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [webSg.id],
        },
      ],
    });

    const nacl = new NetworkAcl(this, 'NACL', {
      vpcId: vpc.id,
      subnetIds: [
        publicSubnetA.id,
        publicSubnetB.id,
        privateSubnetA.id,
        privateSubnetB.id,
      ],
      tags: { ...config.tags, Name: `nacl-${config.environment}` },
    });
    new NetworkAclRule(this, 'AllowInboundHttp', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      egress: false,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });
    new NetworkAclRule(this, 'AllowOutboundAll', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      egress: true,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 0,
      toPort: 0,
    });

    const webServerRole = new IamRole(this, 'WebServerRole', {
      name: `web-server-role-${config.environment}-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });
    const webServerPolicy = new IamPolicy(this, 'WebServerPolicy', {
      name: `web-server-policy-${config.environment}-${uniqueSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              's3:GetObject',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, 'RolePolicyAttachment', {
      role: webServerRole.name,
      policyArn: webServerPolicy.arn,
    });
    const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
      name: `web-server-profile-${config.environment}-${uniqueSuffix}`,
      role: webServerRole.name,
    });

    const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      name: `lt-${config.environment}-${uniqueSuffix}`,
      imageId: ami.id,
      instanceType: config.instanceType,
      iamInstanceProfile: { name: instanceProfile.name },
      vpcSecurityGroupIds: [webSg.id],
    });
    const asg = new AutoscalingGroup(this, 'ASG', {
      name: `asg-${config.environment}-${uniqueSuffix}`,
      launchTemplate: { id: launchTemplate.id },
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      vpcZoneIdentifier: [privateSubnetA.id, privateSubnetB.id],
    });
    const alb = new Lb(this, 'ALB', {
      name: `alb-${config.environment}-${uniqueSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: [publicSubnetA.id, publicSubnetB.id],
    });
    const targetGroup = new LbTargetGroup(this, 'TargetGroup', {
      name: `tg-${config.environment}-${uniqueSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
    });
    new LbListener(this, 'Listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
    });
    asg.targetGroupArns = [targetGroup.arn];

    const dbKmsKey = new KmsKey(this, 'DbKmsKey', {
      description: `KMS key for ${config.environment} RDS`,
      enableKeyRotation: true,
    });
    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `db-subnet-group-${config.environment}-${uniqueSuffix}`,
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
    });
    const db = new DbInstance(this, 'Database', {
      identifier: `appdb-${config.environment}-${uniqueSuffix}`,
      instanceClass: config.dbInstanceClass,
      engine: 'postgres',
      allocatedStorage: 20,
      username: 'dbadmin',
      password: 'use-secrets-manager-in-production',
      skipFinalSnapshot: true,
      backupRetentionPeriod: 7,
      vpcSecurityGroupIds: [dbSg.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      storageEncrypted: true,
      kmsKeyId: dbKmsKey.arn,
    });

    new TerraformOutput(this, 'AlbDnsName', { value: alb.dnsName });
    new TerraformOutput(this, 'RdsEndpoint', { value: db.endpoint });
  }
}
