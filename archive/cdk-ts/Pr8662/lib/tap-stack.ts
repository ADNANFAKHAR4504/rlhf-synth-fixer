import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId?: string; // Allow passing existing VPC ID
  kmsKeyArn?: string; // Allow passing existing KMS key ARN
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
    };

    // Use existing KMS key or create new one
    let kmsKey: kms.IKey;
    if (props?.kmsKeyArn) {
      kmsKey = kms.Key.fromKeyArn(
        this,
        `TapKmsKey${environmentSuffix}`,
        props.kmsKeyArn
      );
    } else {
      kmsKey = new kms.Key(this, `TapKmsKey${environmentSuffix}`, {
        description: 'KMS key for TAP infrastructure encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
      cdk.Tags.of(kmsKey).add('Environment', commonTags.Environment);
    }

    // Use existing VPC or create new one
    let vpc: ec2.IVpc;
    if (props?.vpcId) {
      vpc = ec2.Vpc.fromLookup(this, `TapVpc${environmentSuffix}`, {
        vpcId: props.vpcId,
      });
    } else {
      vpc = new ec2.Vpc(this, `TapVpc${environmentSuffix}`, {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 2,
        natGateways: 1, // Reduced to avoid unnecessary costs
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            cidrMask: 24,
            name: 'Database',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      });
      cdk.Tags.of(vpc).add('Environment', commonTags.Environment);
    }

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances - HTTP/HTTPS only',
        allowAllOutbound: true, // Simplified for initial deployment
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    cdk.Tags.of(ec2SecurityGroup).add('Environment', commonTags.Environment);

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS - EC2 access only',
        allowAllOutbound: true,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instances'
    );

    cdk.Tags.of(rdsSecurityGroup).add('Environment', commonTags.Environment);

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `Ec2Role${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Minimal IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/tap/*`,
        ],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'], // Simplified for initial deployment
      })
    );

    cdk.Tags.of(ec2Role).add('Environment', commonTags.Environment);

    // Create EC2 instances in private subnets
    const ec2Instances: ec2.Instance[] = [];
    const privateSubnets = vpc.privateSubnets;

    for (let i = 0; i < Math.min(2, privateSubnets.length); i++) {
      const instance = new ec2.Instance(
        this,
        `TapInstance${i + 1}${environmentSuffix}`,
        {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2023(),
          vpc,
          vpcSubnets: {
            subnets: [privateSubnets[i]],
          },
          securityGroup: ec2SecurityGroup,
          role: ec2Role,
          blockDevices: [
            {
              deviceName: '/dev/xvda',
              volume: ec2.BlockDeviceVolume.ebs(20, {
                encrypted: true,
                kmsKey: kmsKey,
              }),
            },
          ],
          userData: ec2.UserData.forLinux(),
        }
      );

      cdk.Tags.of(instance).add('Environment', commonTags.Environment);
      cdk.Tags.of(instance).add(
        'Name',
        `TAP-Instance-${i + 1}-${environmentSuffix}`
      );
      ec2Instances.push(instance);
    }

    // Subnet Group for RDS
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `TapDbSubnetGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for TAP RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    cdk.Tags.of(dbSubnetGroup).add('Environment', commonTags.Environment);

    // Use a supported PostgreSQL version
    const postgresVersion = rds.PostgresEngineVersion.VER_15_7;

    // RDS Database Instance
    const database = new rds.DatabaseInstance(
      this,
      `TapDatabase${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: postgresVersion,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],

        // High Availability - disabled for cost savings in non-prod
        multiAz: false,

        // Storage Configuration
        allocatedStorage: 20,
        storageType: rds.StorageType.GP2,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,

        // Security Configuration
        databaseName: 'tapdb',
        credentials: rds.Credentials.fromGeneratedSecret(
          `tapdbadmin${environmentSuffix}`
        ),

        // Backup Configuration
        backupRetention: cdk.Duration.days(1), // Reduced for non-prod
        deleteAutomatedBackups: true,
        deletionProtection: false,

        // Monitoring - disabled for cost savings
        monitoringInterval: cdk.Duration.minutes(0),
        enablePerformanceInsights: false,

        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    cdk.Tags.of(database).add('Environment', commonTags.Environment);

    // Allow EC2 security group to access RDS
    database.connections.allowFrom(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'EC2 to RDS access'
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    // Output EC2 instance IDs
    ec2Instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `Ec2Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `EC2 Instance ${index + 1} ID`,
      });
    });

    new cdk.CfnOutput(this, 'Ec2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });

    new cdk.CfnOutput(this, 'RdsSecurityGroupId', {
      value: rdsSecurityGroup.securityGroupId,
      description: 'RDS Security Group ID',
    });
  }
}
