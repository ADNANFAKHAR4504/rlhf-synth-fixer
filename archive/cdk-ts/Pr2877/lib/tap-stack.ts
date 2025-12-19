import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        ...props?.env,
        region: 'us-west-2', // Target migration region
      },
    });

    // Add stack-level tags for cost management and identification
    cdk.Tags.of(this).add('Project', 'IaC - AWS Nova Model Breaking');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('MigratedFrom', 'us-west-1');
    cdk.Tags.of(this).add(
      'MigrationDate',
      new Date().toISOString().split('T')[0]
    );

    // VPC Configuration - Preserving exact CIDR block
    const vpc = new ec2.Vpc(this, 'MainVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Override default subnet CIDRs to match requirements
    const publicSubnets = vpc.publicSubnets;
    const privateSubnets = vpc.privateSubnets;

    // Tag subnets for identification
    publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `PublicSubnet-${index + 1}`);
      cdk.Tags.of(subnet).add('Type', 'Public');
    });

    privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `PrivateSubnet-${index + 1}`);
      cdk.Tags.of(subnet).add('Type', 'Private');
    });

    // Security Group: Web Tier
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web tier - migrated from us-west-1',
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access for administration'
    );

    cdk.Tags.of(webSecurityGroup).add('Name', 'WebSecurityGroup');
    cdk.Tags.of(webSecurityGroup).add('Tier', 'Web');

    // Security Group: Application Tier
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description:
        'Security group for application tier - migrated from us-west-1',
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier on port 8080'
    );

    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8443),
      'Allow secure traffic from web tier on port 8443'
    );

    appSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC for administration'
    );

    cdk.Tags.of(appSecurityGroup).add('Name', 'AppSecurityGroup');
    cdk.Tags.of(appSecurityGroup).add('Tier', 'Application');

    // Security Group: Database Tier
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description:
          'Security group for database tier - migrated from us-west-1',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from application tier'
    );

    // Allow outbound traffic for updates and patches
    dbSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    dbSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for updates'
    );

    cdk.Tags.of(dbSecurityGroup).add('Name', 'DatabaseSecurityGroup');
    cdk.Tags.of(dbSecurityGroup).add('Tier', 'Database');

    // RDS Subnet Group for private subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      description: 'Subnet group for RDS MySQL - migrated from us-west-1',
    });

    cdk.Tags.of(dbSubnetGroup).add('Name', 'DatabaseSubnetGroup');

    // RDS Parameter Group for MySQL optimization
    const dbParameterGroup = new rds.ParameterGroup(
      this,
      'MySQLParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_35,
        }),
        description: 'Parameter group for MySQL 8.0 - migrated from us-west-1',
        parameters: {
          innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
          max_connections: '1000',
          slow_query_log: '1',
          long_query_time: '2',
          general_log: '1',
        },
      }
    );

    cdk.Tags.of(dbParameterGroup).add('Name', 'MySQLParameterGroup');

    // RDS MySQL Instance
    const rdsInstance = new rds.DatabaseInstance(this, 'MySQLDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_42,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        excludeCharacters: '"@/\\\'',
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      parameterGroup: dbParameterGroup,
      databaseName: 'maindb',
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: true,
      storageEncrypted: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      monitoringInterval: cdk.Duration.seconds(60),
      cloudwatchLogsExports: ['error', 'general'],
    });

    cdk.Tags.of(rdsInstance).add('Name', 'MySQLDatabase');
    cdk.Tags.of(rdsInstance).add('Engine', 'MySQL');
    cdk.Tags.of(rdsInstance).add('Environment', 'Production');

    // S3 Bucket with proper configuration
    const s3Bucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `nova-app-bucket-${this.region}-${this.account}-1757338868443`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          enabled: true,
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    cdk.Tags.of(s3Bucket).add('Name', 'ApplicationBucket');
    cdk.Tags.of(s3Bucket).add('Purpose', 'Application Storage');

    // Deploy test object to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployTestObject', {
      sources: [
        s3deploy.Source.data(
          'test-object.txt',
          'This is a test object deployed during migration from us-west-1 to us-west-2'
        ),
      ],
      destinationBucket: s3Bucket,
      destinationKeyPrefix: 'test/',
      retainOnDelete: false,
    });

    // Output important resource information
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID in us-west-2',
      exportName: 'MainVPCId',
    });

    new cdk.CfnOutput(this, 'VPCCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: 'MainVPCCidr',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: 'PublicSubnetIds',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: 'PrivateSubnetIds',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS MySQL Endpoint',
      exportName: 'DatabaseEndpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: rdsInstance.instanceEndpoint.port.toString(),
      description: 'RDS MySQL Port',
      exportName: 'DatabasePort',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: 'ApplicationBucketName',
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: s3Bucket.bucketArn,
      description: 'S3 Bucket ARN',
      exportName: 'ApplicationBucketArn',
    });

    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: webSecurityGroup.securityGroupId,
      description: 'Web Security Group ID',
      exportName: 'WebSecurityGroupId',
    });

    new cdk.CfnOutput(this, 'AppSecurityGroupId', {
      value: appSecurityGroup.securityGroupId,
      description: 'Application Security Group ID',
      exportName: 'AppSecurityGroupId',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: dbSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
      exportName: 'DatabaseSecurityGroupId',
    });

    new cdk.CfnOutput(this, 'RegionMigrated', {
      value: this.region,
      description: 'Target migration region',
      exportName: 'TargetRegion',
    });
  }
}
