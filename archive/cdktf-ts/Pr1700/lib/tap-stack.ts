import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
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

interface EnvironmentConfig {
  readonly env: 'dev' | 'staging' | 'prod';
  readonly vpcCidr: string;
  readonly instanceType: string;
  readonly createDb: boolean;
  readonly dbInstanceClass?: string;
  readonly tags: { [key: string]: string };
}

// Default configurations for each environment
const allEnvironments: EnvironmentConfig[] = [
  {
    env: 'dev' as const,
    vpcCidr: '10.10.0.0/16',
    instanceType: 't3.micro',
    createDb: true,
    dbInstanceClass: 'db.t3.micro',
    tags: { Environment: 'Development', ManagedBy: 'CDKTF' },
  },
  {
    env: 'staging' as const,
    vpcCidr: '10.20.0.0/16',
    instanceType: 't3.small',
    createDb: true,
    dbInstanceClass: 'db.t3.small',
    tags: { Environment: 'Staging', ManagedBy: 'CDKTF' },
  },
  {
    env: 'prod' as const,
    vpcCidr: '10.30.0.0/16',
    instanceType: 't3.medium',
    createDb: true,
    dbInstanceClass: 'db.t3.medium',
    tags: { Environment: 'Production', ManagedBy: 'CDKTF' },
  },
];

export class MultiEnvironmentStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    configs: EnvironmentConfig[] = allEnvironments
  ) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    configs.forEach(config => {
      if (!config.vpcCidr.endsWith('/16')) {
        throw new Error(`VPC CIDR for ${config.env} must be a /16 prefix.`);
      }

      const envScope = new Construct(this, `${config.env}-environment`);
      const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

      const vpc = new Vpc(envScope, 'VPC', {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...config.tags, Name: `vpc-${config.env}` },
      });

      const igw = new InternetGateway(envScope, 'IGW', {
        vpcId: vpc.id,
        tags: { ...config.tags, Name: `igw-${config.env}` },
      });
      const publicSubnetA = new Subnet(envScope, 'PublicSubnetA', {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.1.0/24`,
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: { ...config.tags, Name: `public-subnet-a-${config.env}` },
      });
      const publicSubnetB = new Subnet(envScope, 'PublicSubnetB', {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.3.0/24`,
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: { ...config.tags, Name: `public-subnet-b-${config.env}` },
      });
      const privateSubnetA = new Subnet(envScope, 'PrivateSubnetA', {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.2.0/24`,
        availabilityZone: 'us-east-1a',
        tags: { ...config.tags, Name: `private-subnet-a-${config.env}` },
      });
      const privateSubnetB = new Subnet(envScope, 'PrivateSubnetB', {
        vpcId: vpc.id,
        cidrBlock: `${config.vpcCidr.split('.').slice(0, 2).join('.')}.4.0/24`,
        availabilityZone: 'us-east-1b',
        tags: { ...config.tags, Name: `private-subnet-b-${config.env}` },
      });

      const publicRouteTable = new RouteTable(envScope, 'PublicRouteTable', {
        vpcId: vpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      });
      new RouteTableAssociation(envScope, 'PublicRTAssocA', {
        subnetId: publicSubnetA.id,
        routeTableId: publicRouteTable.id,
      });
      new RouteTableAssociation(envScope, 'PublicRTAssocB', {
        subnetId: publicSubnetB.id,
        routeTableId: publicRouteTable.id,
      });

      const eip = new Eip(envScope, 'NatEip', {});
      const natGateway = new NatGateway(envScope, 'NATGateway', {
        allocationId: eip.id,
        subnetId: publicSubnetA.id,
      });
      const privateRouteTable = new RouteTable(envScope, 'PrivateRouteTable', {
        vpcId: vpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
      });
      new RouteTableAssociation(envScope, 'PrivateRTAssocA', {
        subnetId: privateSubnetA.id,
        routeTableId: privateRouteTable.id,
      });
      new RouteTableAssociation(envScope, 'PrivateRTAssocB', {
        subnetId: privateSubnetB.id,
        routeTableId: privateRouteTable.id,
      });

      const albSg = new SecurityGroup(envScope, 'AlbSg', {
        name: `alb-sg-${config.env}-${uniqueSuffix}`,
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
      const webSg = new SecurityGroup(envScope, 'WebSg', {
        name: `web-sg-${config.env}-${uniqueSuffix}`,
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
      const dbSg = new SecurityGroup(envScope, 'DbSg', {
        name: `db-sg-${config.env}-${uniqueSuffix}`,
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

      const bucket = new S3Bucket(envScope, 'DataBucket', {
        bucket: `app-data-${config.env}-879676`.toLowerCase(),
      });
      const s3KmsKey = new KmsKey(envScope, 'S3Key', {
        enableKeyRotation: true,
      });
      new S3BucketServerSideEncryptionConfigurationA(
        envScope,
        'BucketEncryption',
        {
          bucket: bucket.bucket,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: s3KmsKey.keyId,
              },
            },
          ],
        }
      );

      const webServerRole = new IamRole(envScope, 'WebServerRole', {
        name: `web-server-role-${config.env}-${uniqueSuffix}`,
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
      const webServerPolicy = new IamPolicy(envScope, 'WebServerPolicy', {
        name: `web-server-policy-${config.env}-${uniqueSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Effect: 'Allow',
              Resource: [bucket.arn, `${bucket.arn}/*`],
            },
          ],
        }),
      });
      new IamRolePolicyAttachment(envScope, 'RolePolicyAttachment', {
        role: webServerRole.name,
        policyArn: webServerPolicy.arn,
      });
      const instanceProfile = new IamInstanceProfile(
        envScope,
        'InstanceProfile',
        {
          name: `web-server-profile-${config.env}-${uniqueSuffix}`,
          role: webServerRole.name,
        }
      );

      const launchTemplate = new LaunchTemplate(envScope, 'LaunchTemplate', {
        name: `lt-${config.env}-${uniqueSuffix}`,
        imageId: ami.id,
        instanceType: config.instanceType,
        iamInstanceProfile: { name: instanceProfile.name },
        vpcSecurityGroupIds: [webSg.id],
      });
      const asg = new AutoscalingGroup(envScope, 'ASG', {
        name: `asg-${config.env}-${uniqueSuffix}`,
        launchTemplate: { id: launchTemplate.id },
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 1,
        vpcZoneIdentifier: [privateSubnetA.id, privateSubnetB.id],
      });
      const alb = new Lb(envScope, 'ALB', {
        name: `alb-${config.env}-${uniqueSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: [publicSubnetA.id, publicSubnetB.id],
      });
      const targetGroup = new LbTargetGroup(envScope, 'TargetGroup', {
        name: `tg-${config.env}-${uniqueSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
      });
      new LbListener(envScope, 'Listener', {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
      });
      asg.targetGroupArns = [targetGroup.arn];

      if (config.createDb) {
        const dbPasswordSecret = new SecretsmanagerSecret(
          envScope,
          'DbPassword',
          { name: `db-password-${config.env}-${uniqueSuffix}` }
        );
        const dbPasswordVersion = new SecretsmanagerSecretVersion(
          envScope,
          'DbPasswordVersion',
          {
            secretId: dbPasswordSecret.id,
            secretString: `StrongPassword-${uniqueSuffix}`,
          }
        );
        const dbSubnetGroup = new DbSubnetGroup(envScope, 'DbSubnetGroup', {
          name: `db-subnet-group-${config.env}-${uniqueSuffix}`,
          subnetIds: [privateSubnetA.id, privateSubnetB.id],
        });

        const db = new DbInstance(envScope, 'Database', {
          identifier: `appdb-${config.env}-${uniqueSuffix}`,
          instanceClass: config.dbInstanceClass!,
          engine: 'postgres',
          allocatedStorage: 20,
          username: 'dbadmin',
          password: dbPasswordVersion.secretString,
          skipFinalSnapshot: true,
          backupRetentionPeriod: 7,
          vpcSecurityGroupIds: [dbSg.id],
          dbSubnetGroupName: dbSubnetGroup.name,
          tags: { ...config.tags, Name: `db-${config.env}` },
        });
        new TerraformOutput(this, `RdsEndpoint-${config.env}`, {
          value: db.endpoint,
        });
      }

      const highCpuAlarm = new CloudwatchMetricAlarm(envScope, 'HighCpuAlarm', {
        alarmName: `high-cpu-${config.env}-${uniqueSuffix}`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/AutoScaling',
        period: 120,
        statistic: 'Average',
        threshold: 75,
        dimensions: { AutoScalingGroupName: asg.name },
      });

      new TerraformOutput(this, `VpcId-${config.env}`, { value: vpc.id });
      new TerraformOutput(this, `AlbDnsName-${config.env}`, {
        value: alb.dnsName,
      });
      new TerraformOutput(this, `S3BucketName-${config.env}`, {
        value: bucket.bucket,
      });
      new TerraformOutput(this, `WebServerRoleArn-${config.env}`, {
        value: webServerRole.arn,
      });
      new TerraformOutput(this, `HighCpuAlarmName-${config.env}`, {
        value: highCpuAlarm.alarmName,
      });
    });
  }
}
