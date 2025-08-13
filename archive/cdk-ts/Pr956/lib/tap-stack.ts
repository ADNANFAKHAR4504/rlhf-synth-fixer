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

    // Create bastion host with Amazon Linux 2023
    this.bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc: this.vpc,
      securityGroup: this.securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create EC2 Instance Connect Endpoint for enhanced security
    const instanceConnectEndpoint = new ec2.CfnInstanceConnectEndpoint(
      this,
      'InstanceConnectEndpoint',
      {
        subnetId: this.vpc.privateSubnets[0].subnetId,
        securityGroupIds: [
          this.createInstanceConnectSecurityGroup().securityGroupId,
        ],
        preserveClientIp: false,
      }
    );

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

    new cdk.CfnOutput(this, 'InstanceConnectEndpointId', {
      value: instanceConnectEndpoint.ref,
      description: 'EC2 Instance Connect Endpoint ID',
    });
  }

  private createInstanceConnectSecurityGroup(): ec2.SecurityGroup {
    const iceSg = new ec2.SecurityGroup(this, 'InstanceConnectEndpointSG', {
      vpc: this.vpc,
      description: 'Security group for EC2 Instance Connect Endpoint',
      allowAllOutbound: false,
    });

    // Allow SSH to private instances
    iceSg.addEgressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'SSH to private instances via Instance Connect'
    );

    return iceSg;
  }

  private addVpcEndpoints(): void {
    // Add VPC endpoints for common AWS services
    this.vpc.addInterfaceEndpoint('S3Endpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.S3,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    this.vpc.addInterfaceEndpoint('EC2Endpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Add gateway endpoint for S3 (more cost-effective for S3 access)
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
