import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bastionHost: ec2.BastionHostLinux;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with specified CIDR and multi-AZ setup
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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
      natGateways: 2, // One NAT Gateway per AZ for high availability
    });

    // Create security group with restricted SSH access
    this.securityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for bastion host with restricted SSH access',
      allowAllOutbound: true,
    });

    // Allow SSH access only from specified IP range
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'SSH access from approved IP range only'
    );

    // Allow HTTPS for management and updates
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS for package updates and management'
    );

    // Create bastion host with Amazon Linux (LocalStack compatible)
    // Use hardcoded AMI ID for LocalStack compatibility (avoids SSM parameter lookups)
    this.bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc: this.vpc,
      securityGroup: this.securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': 'ami-12345678',
        'us-west-2': 'ami-12345678'
      }),
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Note: EC2 Instance Connect Endpoint is not supported in LocalStack Community Edition
    // It has been removed for LocalStack compatibility

    // Create S3 bucket with Block Public Access enabled
    const secureS3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      bucketName: `tap-${environmentSuffix}-secure-bucket-${
        cdk.Stack.of(this).region
      }`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Ensure bucket can be deleted even with objects
    });

    // Add VPC endpoints for enhanced security
    this.addVpcEndpoints();

    // Apply tags to all resources
    this.applyProductionTags();

    // Outputs for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the production environment',
    });

    new cdk.CfnOutput(this, 'BastionHostId', {
      value: this.bastionHost.instanceId,
      description: 'Bastion host instance ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Secure S3 bucket name',
    });

    // Note: InstanceConnectEndpointId output removed (not supported in LocalStack Community)
  }

  private addVpcEndpoints(): void {
    // Note: Interface endpoints for S3 and EC2 removed - not fully supported in LocalStack Community
    // Only Gateway endpoint is used for LocalStack compatibility

    // Add gateway endpoint for S3 (more cost-effective and LocalStack compatible)
    this.vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
  }

  private applyProductionTags(): void {
    const tags = {
      Environment: 'Production',
      Project: 'TAP',
      ManagedBy: 'CDK',
      CreatedBy: 'Infrastructure Team',
      CostCenter: 'Engineering',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
