/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Vpc,
  SubnetType,
  InstanceType,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  IpAddresses,
} from 'aws-cdk-lib/aws-ec2';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
} from 'aws-cdk-lib/aws-s3';

// Define an interface for the environment-specific configuration
// Export this interface so it can be imported in bin/app.ts
export interface EnvironmentConfig {
  environmentName: string;
  cloudProvider: 'aws' | 'azure';
  awsRegion: string;
  awsVpcCidr: string;
  awsAmi: string;
  awsInstanceType: string;
  awsS3BucketSuffix: string;
  azureLocation: string;
  azureVnetCidr: string;
  azureVmSize: string;
  azureStorageSku: string;
  azureStorageAccountName: string;
}

// Define props for the TapStack
interface TapStackProps extends cdk.StackProps {
  environmentConfig?: EnvironmentConfig;
  environmentSuffix?: string;
}

/**
 * TapStack defines all multi-cloud infrastructure within a single stack file.
 * This approach consolidates all resources into one CloudFormation stack,
 * which can simplify management for very small, tightly coupled applications.
 * For larger or more complex architectures, breaking down into smaller
 * stacks or custom constructs in separate files within 'lib/' is generally
 * recommended for better modularity and reduced blast radius.
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Handle both legacy environmentSuffix and new environmentConfig approaches
    let config: EnvironmentConfig;
    
    if (props.environmentConfig) {
      // Use the provided environmentConfig
      config = props.environmentConfig;
    } else if (props.environmentSuffix) {
      // Create a default config using environmentSuffix (legacy support)
      config = {
        environmentName: props.environmentSuffix,
        cloudProvider: 'aws', // Default to AWS
        awsRegion: process.env.CDK_DEFAULT_REGION || 'us-east-1',
        awsVpcCidr: '10.0.0.0/16',
        awsAmi: 'ami-0c02fb55956c7d316', // Default Amazon Linux 2
        awsInstanceType: 't3.micro',
        awsS3BucketSuffix: 'storage',
        azureLocation: 'East US',
        azureVnetCidr: '10.0.0.0/16',
        azureVmSize: 'Standard_B1s',
        azureStorageSku: 'Standard_LRS',
        azureStorageAccountName: `storage${props.environmentSuffix}`,
      };
    } else {
      throw new Error('Either environmentConfig or environmentSuffix must be provided');
    }

    // Get environment suffix from props, context, or use 'dev' as default
    // The environmentConfig prop now directly provides the necessary details
    const envName = config.environmentName;
    const cloudProvider = config.cloudProvider;

    // Apply consistent tagging across all resources in this stack
    cdk.Tags.of(this).add('Environment', envName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Project', 'MultiCloudInfra');
    cdk.Tags.of(this).add('CloudProvider', cloudProvider);

    // --- Networking Layer ---
    let vpc: Vpc | undefined; // Declare VPC outside so it can be used by EC2
    let ec2SecurityGroup: SecurityGroup | undefined; // Declare SG outside so it can be used by EC2

    if (cloudProvider === 'aws') {
      // AWS VPC
      vpc = new Vpc(this, `${envName}-AWS-VPC`, {
        ipAddresses: IpAddresses.cidr(config.awsVpcCidr),
        maxAzs: 1, // For simplicity as per prompt: single subnet implies single AZ
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'PublicSubnet',
            subnetType: SubnetType.PUBLIC,
          },
        ],
        vpcName: `${envName}-AWS-VPC`, // Explicit name for console
      });

      new cdk.CfnOutput(this, 'AWSVpcId', {
        value: vpc.vpcId,
        description: `AWS VPC ID for ${envName} environment`,
      });
      new cdk.CfnOutput(this, 'AWSVpcCidr', {
        value: vpc.vpcCidrBlock,
        description: `AWS VPC CIDR for ${envName} environment`,
      });

      // Security Group for EC2
      ec2SecurityGroup = new SecurityGroup(this, `${envName}-AWS-EC2-SG`, {
        vpc: vpc,
        description: `Security group for ${envName} AWS EC2 instance`,
        allowAllOutbound: true,
      });
      ec2SecurityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(22),
        'Allow SSH from anywhere'
      ); // For demo, restrict in prod
    } else if (cloudProvider === 'azure') {
      // Azure Virtual Network (Conceptual Placeholder)
      // In a real scenario, this would involve cdktf (CDK for Terraform) or custom resources
      // that interact with Azure APIs/ARM templates.
      new cdk.CfnOutput(this, 'AzureVNetConceptual', {
        value: `Conceptual Azure VNet: Name='${envName}-Azure-VNet', Location='${config.azureLocation}', CIDR='${config.azureVnetCidr}'`,
        description: 'Placeholder for Azure Virtual Network',
      });
    }

    // --- Compute Layer ---
    if (cloudProvider === 'aws' && vpc && ec2SecurityGroup) {
      // Ensure VPC and SG are defined for AWS
      // AWS EC2 Instance
      const ec2Instance = new cdk.aws_ec2.Instance(
        this,
        `${envName}-AWS-EC2-Instance`,
        {
          vpc: vpc,
          instanceType: new InstanceType(config.awsInstanceType),
          // Use Amazon Linux 2023 AMI for simplicity (works with LocalStack)
          machineImage: MachineImage.latestAmazonLinux2023(),
          securityGroup: ec2SecurityGroup,
          vpcSubnets: { subnetType: SubnetType.PUBLIC }, // Deploy in public subnet for simplicity
        }
      );

      new cdk.CfnOutput(this, 'AWSEC2InstanceId', {
        value: ec2Instance.instanceId,
        description: `AWS EC2 Instance ID for ${envName} environment`,
      });
      new cdk.CfnOutput(this, 'AWSEC2PublicIp', {
        value: ec2Instance.instancePublicIp,
        description: `AWS EC2 Public IP for ${envName} environment`,
      });
    } else if (cloudProvider === 'azure') {
      // Azure Virtual Machine (Conceptual Placeholder)
      new cdk.CfnOutput(this, 'AzureVMConceptual', {
        value: `Conceptual Azure VM: Name='${envName}-Azure-VM', Size='${config.azureVmSize}', Location='${config.azureLocation}'`,
        description: 'Placeholder for Azure Virtual Machine',
      });
    }

    // --- Storage Layer ---
    if (cloudProvider === 'aws') {
      // AWS S3 Bucket
      const bucket = new Bucket(this, `${envName}-AWS-S3-Bucket`, {
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL, // Best practice
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo, allow destroy
        autoDeleteObjects: true, // For demo, auto-delete objects on stack deletion
      });

      new cdk.CfnOutput(this, 'AWSS3BucketName', {
        value: bucket.bucketName,
        description: `AWS S3 Bucket Name for ${envName} environment`,
      });
    } else if (cloudProvider === 'azure') {
      // Azure Storage Account (Conceptual Placeholder)
      new cdk.CfnOutput(this, 'AzureStorageConceptual', {
        value: `Conceptual Azure Storage Account: Name='${config.azureStorageAccountName}', SKU='${config.azureStorageSku}', Location='${config.azureLocation}'`,
        description: 'Placeholder for Azure Storage Account',
      });
    }
  }
}
