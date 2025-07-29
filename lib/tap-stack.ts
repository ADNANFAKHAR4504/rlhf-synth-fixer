/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

// Define a configuration interface for environment-specific overrides
interface EnvironmentConfig {
  instanceSize: ec2.InstanceSize;
  vpcCidr: string;
}

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // --- Environment Configuration Strategy ---
    // Read environment-specific configuration from CDK context (cdk.json or --context flag)
    // This makes the stack self-sufficient and removes the hard dependency from props.
    const envConfig: EnvironmentConfig = this.node.tryGetContext(environmentSuffix) || {
      // Provide sensible defaults for a 'dev' environment if no context is found
      instanceSize: ec2.InstanceSize.MICRO,
      vpcCidr: '10.0.0.0/16',
    };
    
    // Convert the instance size string from context into an ec2.InstanceSize object
    const instanceSize = envConfig.instanceSize || ec2.InstanceSize.MICRO;


    // --- Comprehensive Tagging Strategy ---
    // Tags are applied to all resources within this stack for cost tracking and organization.
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'MultiRegionWebApp');

    // --- Reusable VPC Construct ---
    // The VPC is parameterized using the environment-specific configuration.
    const vpc = new ec2.Vpc(this, 'AppVPC', {
      ipAddresses: ec2.IpAddresses.cidr(envConfig.vpcCidr),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-app-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'private-db-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // --- Reusable S3 Bucket for Assets ---
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Useful for non-production environments
    });

    // --- Reusable Database Construct (RDS) ---
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc,
      description: 'Security group for the RDS database',
    });

    const dbInstance = new rds.DatabaseInstance(this, 'AppDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      // Instance size is overridden by the environment configuration
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        instanceSize
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // --- Reusable Application Tier Construct (EC2) ---
    const appSg = new ec2.SecurityGroup(this, 'AppSG', {
      vpc,
      description: 'Security group for the application instances',
    });

    // --- Cross-Stack Dependencies ---
    // This demonstrates how the application tier can securely connect to the database.
    dbSg.addIngressRule(
      appSg,
      ec2.Port.tcp(3306),
      'Allow traffic from application instances'
    );

    const appRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for application EC2 instances',
    });
    // Grant the application role read/write access to the S3 bucket (least privilege).
    assetBucket.grantReadWrite(appRole);

    // In a real application, you would create an Auto Scaling Group here.
    // For simplicity, we create a single EC2 instance to demonstrate the concept.
    new ec2.Instance(this, 'AppInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        instanceSize
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: appSg,
      role: appRole,
    });

    // --- Outputs ---
    // Exporting values that might be needed by other stacks or for manual access.
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the VPC',
    });
    new cdk.CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'Name of the S3 bucket for application assets',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'Endpoint address of the RDS database',
    });
  }
}
