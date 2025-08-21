import { Fn, TerraformStack, TerraformOutput } from 'cdktf'; // Import Fn
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
  readonly environment: 'dev' | 'staging' | 'prod' | 'test';
  readonly vpcCidr: string;
  readonly instanceType: string;
  readonly dbInstanceClass: string;
  readonly tags: { [key: string]: string };
}

export interface MultiEnvStackProps {
  readonly environments: TapStackConfig[];
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: MultiEnvStackProps) {
    super(scope, id);

    // FIX: Generate one unique suffix per stack deployment.
    // This suffix is consistent across 'cdktf deploy' runs for the same stack.
    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    for (const config of props.environments) {
      const env = config.environment;
      const envSuffix = `-${env}`;
      const nameSuffix = `${envSuffix}-${uniqueSuffix}`; // Combined suffix for resource names

      // ## NETWORKING ##
      const vpc = new Vpc(this, `VPC${envSuffix}`, {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...config.tags, Name: `vpc${envSuffix}` },
      });
      const publicSubnetA = new Subnet(this, `PublicSubnetA${envSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.1.0/24`,
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: { ...config.tags, Name: `public-subnet-a${envSuffix}` },
      });
      const publicSubnetB = new Subnet(this, `PublicSubnetB${envSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.3.0/24`,
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: { ...config.tags, Name: `public-subnet-b${envSuffix}` },
      });
      const privateSubnetA = new Subnet(this, `PrivateSubnetA${envSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.2.0/24`,
        availabilityZone: 'us-east-1a',
        tags: { ...config.tags, Name: `private-subnet-a${envSuffix}` },
      });
      const privateSubnetB = new Subnet(this, `PrivateSubnetB${envSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.4.0/24`,
        availabilityZone: 'us-east-1b',
        tags: { ...config.tags, Name: `private-subnet-b${envSuffix}` },
      });

      const igw = new InternetGateway(this, `IGW${envSuffix}`, {
        vpcId: vpc.id,
      });
      const publicRouteTable = new RouteTable(
        this,
        `PublicRouteTable${envSuffix}`,
        {
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
        }
      );
      new RouteTableAssociation(this, `PublicRTAssocA${envSuffix}`, {
        subnetId: publicSubnetA.id,
        routeTableId: publicRouteTable.id,
      });
      new RouteTableAssociation(this, `PublicRTAssocB${envSuffix}`, {
        subnetId: publicSubnetB.id,
        routeTableId: publicRouteTable.id,
      });

      const eip = new Eip(this, `NatEip${envSuffix}`, {});
      const natGateway = new NatGateway(this, `NATGateway${envSuffix}`, {
        allocationId: eip.id,
        subnetId: publicSubnetA.id,
      });
      const privateRouteTable = new RouteTable(
        this,
        `PrivateRouteTable${envSuffix}`,
        {
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
        }
      );
      new RouteTableAssociation(this, `PrivateRTAssocA${envSuffix}`, {
        subnetId: privateSubnetA.id,
        routeTableId: privateRouteTable.id,
      });
      new RouteTableAssociation(this, `PrivateRTAssocB${envSuffix}`, {
        subnetId: privateSubnetB.id,
        routeTableId: privateRouteTable.id,
      });

      // ## SECURITY ##
      const albSg = new SecurityGroup(this, `AlbSg${envSuffix}`, {
        name: `alb-sg${nameSuffix}`,
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
      const webSg = new SecurityGroup(this, `WebSg${envSuffix}`, {
        name: `web-sg${nameSuffix}`,
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
      const dbSg = new SecurityGroup(this, `DbSg${envSuffix}`, {
        name: `db-sg${nameSuffix}`,
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

      const nacl = new NetworkAcl(this, `NACL${envSuffix}`, {
        vpcId: vpc.id,
        subnetIds: [
          publicSubnetA.id,
          publicSubnetB.id,
          privateSubnetA.id,
          privateSubnetB.id,
        ],
        tags: { ...config.tags, Name: `nacl${envSuffix}` },
      });
      new NetworkAclRule(this, `AllowInboundHttp${envSuffix}`, {
        networkAclId: nacl.id,
        ruleNumber: 100,
        egress: false,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 80,
        toPort: 80,
      });
      new NetworkAclRule(this, `AllowOutboundAll${envSuffix}`, {
        networkAclId: nacl.id,
        ruleNumber: 100,
        egress: true,
        protocol: '-1',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 0,
        toPort: 0,
      });

      // ## IAM ##
      const webServerRole = new IamRole(this, `WebServerRole${envSuffix}`, {
        name: `web-server-role${nameSuffix}`,
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
      const webServerPolicy = new IamPolicy(
        this,
        `WebServerPolicy${envSuffix}`,
        {
          name: `web-server-policy${nameSuffix}`,
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
        }
      );
      new IamRolePolicyAttachment(this, `RolePolicyAttachment${envSuffix}`, {
        role: webServerRole.name,
        policyArn: webServerPolicy.arn,
      });
      const instanceProfile = new IamInstanceProfile(
        this,
        `InstanceProfile${envSuffix}`,
        { name: `web-server-profile${nameSuffix}`, role: webServerRole.name }
      );

      // ## COMPUTE & LOAD BALANCING ##
      const launchTemplate = new LaunchTemplate(
        this,
        `LaunchTemplate${envSuffix}`,
        {
          name: `lt${nameSuffix}`,
          imageId: ami.id,
          instanceType: config.instanceType,
          iamInstanceProfile: { name: instanceProfile.name },
          vpcSecurityGroupIds: [webSg.id],
        }
      );
      const alb = new Lb(this, `ALB${envSuffix}`, {
        name: `alb${nameSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: [publicSubnetA.id, publicSubnetB.id],
      });
      const targetGroup = new LbTargetGroup(this, `TargetGroup${envSuffix}`, {
        name: `tg${nameSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
      });
      new LbListener(this, `Listener${envSuffix}`, {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
      });
      new AutoscalingGroup(this, `ASG${envSuffix}`, {
        name: `asg${nameSuffix}`,
        launchTemplate: { id: launchTemplate.id },
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 1,
        vpcZoneIdentifier: [privateSubnetA.id, privateSubnetB.id],
        targetGroupArns: [targetGroup.arn],
      });

      // ## DATABASE ##
      const dbKmsKey = new KmsKey(this, `DbKmsKey${envSuffix}`, {
        description: `KMS key for ${env} RDS`,
        enableKeyRotation: true,
      });
      const dbSubnetGroup = new DbSubnetGroup(
        this,
        `DbSubnetGroup${envSuffix}`,
        {
          name: `db-subnet-group${nameSuffix}`,
          subnetIds: [privateSubnetA.id, privateSubnetB.id],
        }
      );
      const db = new DbInstance(this, `Database${envSuffix}`, {
        identifier: `appdb${nameSuffix}`,
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

      // ## OUTPUTS ##
      new TerraformOutput(this, `AlbDnsName${envSuffix}`, {
        value: alb.dnsName,
      });
      new TerraformOutput(this, `RdsEndpoint${envSuffix}`, {
        value: db.endpoint,
      });
    }
  }
}
