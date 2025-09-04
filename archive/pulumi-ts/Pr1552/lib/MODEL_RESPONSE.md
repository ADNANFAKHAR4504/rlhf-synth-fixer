# Infrastructure Code Response

I'll help you create a basic cloud environment on AWS using Pulumi TypeScript. This setup will include an EC2 instance and S3 bucket with the specified configurations.

## lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly instanceId: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = {
      Environment: 'Development',
      ...(args.tags || {}),
    };

    // Get the latest Amazon Linux 2 AMI
    const ami = pulumi.output(aws.ec2.getAmi({
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'owner-alias',
          values: ['amazon'],
        },
      ],
      mostRecent: true,
    }));

    // Create IAM role for EC2 to use Systems Manager Session Manager
    const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: tags,
    }, { parent: this });

    // Attach the Systems Manager managed policy for Session Manager
    new aws.iam.RolePolicyAttachment(`tap-ssm-policy-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    }, { parent: this });

    // Create instance profile for the EC2 role
    const instanceProfile = new aws.iam.InstanceProfile(`tap-instance-profile-${environmentSuffix}`, {
      role: ec2Role.name,
      tags: tags,
    }, { parent: this });

    // Create VPC and security group for EC2 instance
    const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `tap-vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create internet gateway
    const igw = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...tags,
        Name: `tap-igw-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create public subnet
    const publicSubnet = new aws.ec2.Subnet(`tap-public-subnet-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        ...tags,
        Name: `tap-public-subnet-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create route table for public subnet
    const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        ...tags,
        Name: `tap-public-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Associate route table with public subnet
    new aws.ec2.RouteTableAssociation(`tap-public-rta-${environmentSuffix}`, {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    // Create security group for EC2 instance
    const securityGroup = new aws.ec2.SecurityGroup(`tap-sg-${environmentSuffix}`, {
      name: `tap-sg-${environmentSuffix}`,
      description: 'Security group for TAP EC2 instance',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'SSH access',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        ...tags,
        Name: `tap-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create EC2 instance
    const instance = new aws.ec2.Instance(`tap-instance-${environmentSuffix}`, {
      ami: ami.id,
      instanceType: 't2.micro',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      tags: {
        ...tags,
        Name: `tap-instance-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create S3 bucket with versioning enabled
    const bucket = new aws.s3.Bucket(`tap-bucket-${environmentSuffix}`, {
      bucket: `tap-bucket-${environmentSuffix}-${Math.random().toString(36).substring(7)}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: tags,
    }, { parent: this });

    // Create EventBridge rule for S3 notifications
    const eventRule = new aws.cloudwatch.EventRule(`tap-s3-event-rule-${environmentSuffix}`, {
      description: 'Capture S3 bucket events',
      eventPattern: JSON.stringify({
        source: ['aws.s3'],
        detail: {
          bucket: {
            name: [bucket.bucket],
          },
        },
      }),
      tags: tags,
    }, { parent: this });

    // Set outputs
    this.bucketName = bucket.bucket;
    this.instanceId = instance.id;

    // Register the outputs of this component
    this.registerOutputs({
      bucketName: this.bucketName,
      instanceId: this.instanceId,
      vpcId: vpc.id,
      securityGroupId: securityGroup.id,
    });
  }
}
```

This infrastructure code creates:

1. **EC2 Instance**: A t2.micro instance using the latest Amazon Linux 2 AMI
2. **S3 Bucket**: With versioning and server-side encryption enabled
3. **VPC and Networking**: Custom VPC with public subnet, internet gateway, and routing
4. **Security Group**: Allowing SSH access (port 22)
5. **IAM Roles**: For Systems Manager Session Manager access
6. **EventBridge**: Rule to monitor S3 bucket changes
7. **Proper Tagging**: All resources tagged with 'Environment: Development'

The infrastructure follows AWS best practices including:
- VPC with proper networking setup
- IAM roles for secure access
- Server-side encryption for S3
- Security groups with specific ingress rules
- Session Manager support for secure EC2 access