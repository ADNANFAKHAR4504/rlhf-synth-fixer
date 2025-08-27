import { Fn, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Password } from '@cdktf/provider-random/lib/password';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Provider Registrations ---
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    new RandomProvider(this, 'random');

    // --- Basic Configuration ---
    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const resourceNamePrefix = `webapp-${uniqueSuffix}`;

    const callerIdentity = new DataAwsCallerIdentity(
      this,
      'callerIdentity',
      {}
    );

    // --- Secrets & Parameter Management ---
    const sshAllowedIp = new SsmParameter(this, 'sshAllowedIp', {
      name: `/webapp/ssh-allowed-ip/${uniqueSuffix}`,
      type: 'String',
      value: '1.2.3.4/32', // Placeholder for a real, secure IP range
    });

    // FAULT 1 FIX: Generate a random password and store it in Secrets Manager
    const dbPassword = new Password(this, 'dbPassword', {
      length: 16,
      special: true,
    });

    const dbSecret = new SecretsmanagerSecret(this, 'dbSecret', {
      namePrefix: 'webapp-db-secret-',
    });

    new SecretsmanagerSecretVersion(this, 'dbSecretVersion', {
      secretId: dbSecret.id,
      secretString: dbPassword.result,
    });

    // --- Centralized Logging Bucket ---
    const logBucket = new S3Bucket(this, 'logBucket', {
      bucket: resourceNamePrefix,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logBucketEncryption',
      {
        bucket: logBucket.bucket,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketLifecycleConfiguration(this, 'logBucketLifecycle', {
      bucket: logBucket.bucket,
      rule: [
        {
          id: 'log-retention',
          status: 'Enabled',
          prefix: '', // Apply to all objects
          // PROMPT-3 FIX: expiration is an array of objects
          expiration: [
            {
              days: 90,
            },
          ],
        },
      ],
    });

    // FAULT 3 FIX: Use a single, simplified KMS key
    const kmsKey = new KmsKey(this, 'kmsKey', {
      description: 'KMS key for webapp resources',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${callerIdentity.accountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
    });

    // --- Secure Networking (VPC) ---
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
    });

    const publicSubnet = new Subnet(this, 'publicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
    });

    // Create two private subnets across two AZs for high availability
    const privateSubnetA = new Subnet(this, 'privateSubnetA', {
      vpcId: vpc.id,
      cidrBlock: '10.0.101.0/24',
      availabilityZone: 'us-east-1a',
    });

    const privateSubnetB = new Subnet(this, 'privateSubnetB', {
      vpcId: vpc.id,
      cidrBlock: '10.0.102.0/24',
      availabilityZone: 'us-east-1b',
    });

    const igw = new InternetGateway(this, 'igw', { vpcId: vpc.id });

    const publicRouteTable = new RouteTable(this, 'publicRouteTable', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });

    new RouteTableAssociation(this, 'publicRta', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // --- Database Layer (RDS) ---
    const dbSubnetGroup = new DbSubnetGroup(this, 'dbSubnetGroup', {
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
    });

    const dbSg = new SecurityGroup(this, 'dbSg', { vpcId: vpc.id });

    const dbInstance = new DbInstance(this, 'dbInstance', {
      allocatedStorage: 20,
      engine: 'postgres',
      engineVersion: '15',
      instanceClass: 'db.t3.micro',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSg.id],
      password: dbPassword.result,
      username: 'webappadmin',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7, // Automated backups enabled
    });

    // --- Application Layer (EC2) ---
    const appSg = new SecurityGroup(this, 'appSg', {
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: [sshAllowedIp.value],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });

    new SecurityGroupRule(this, 'dbAccessFromApp', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: dbSg.id,
      sourceSecurityGroupId: appSg.id,
    });

    const ec2Role = new IamRole(this, 'ec2Role', {
      name: resourceNamePrefix,
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

    // FAULT 2 FIX: Scope IAM policy to the specific S3 logging bucket
    const ec2Policy = new IamPolicy(this, 'ec2Policy', {
      name: resourceNamePrefix,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:PutObject'],
            Effect: 'Allow',
            Resource: `${logBucket.arn}/*`, // Tightly scoped resource
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2RoleAttachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(this, 'instanceProfile', {
      name: resourceNamePrefix,
      role: ec2Role.name,
    });

    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    const instance = new Instance(this, 'instance', {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [appSg.id],
      iamInstanceProfile: instanceProfile.name,
      rootBlockDevice: {
        encrypted: true,
        kmsKeyId: kmsKey.arn,
      },
    });

    // --- Monitoring (CloudWatch Alarms) ---
    new CloudwatchMetricAlarm(this, 'cpuAlarm', {
      alarmName: `${resourceNamePrefix}-high-cpu`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      dimensions: { InstanceId: instance.id },
    });

    new CloudwatchMetricAlarm(this, 'dbCpuAlarm', {
      alarmName: `${resourceNamePrefix}-db-high-cpu`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      dimensions: { DBInstanceIdentifier: dbInstance.identifier },
    });
  }
}
