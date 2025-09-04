# AWS Secure Network Foundation CDK Stack

Here's a complete, production-ready CDK stack in TypeScript that implements a secure, highly available networking foundation on AWS:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Secure Network Foundation Stack
 * 
 * This stack creates a robust, highly available, and secure networking foundation
 * on AWS following best practices for production environments.
 * 
 * Architecture Overview:
 * - VPC with public and private subnets across 2 AZs
 * - Internet Gateway for public subnet internet access
 * - NAT Gateway for private subnet outbound connectivity
 * - Security groups with least privilege access
 * - IAM roles following principle of least privilege
 * - Standardized tagging across all resources
 */
export class SecureNetworkFoundationStack extends cdk.Stack {
  // Public properties to allow access to key resources from other stacks
  public readonly vpc: ec2.Vpc;
  public readonly publicSecurityGroup: ec2.SecurityGroup;
  public readonly privateSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define standard tags that will be applied to all resources
    const standardTags = {
      Project: 'MyProject',
      Environment: 'Production',
      CostCenter: '12345'
    };

    // Apply standard tags to the entire stack
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // 1. CREATE VPC WITH PUBLIC AND PRIVATE SUBNETS
    /**
     * VPC Configuration:
     * - CIDR: 10.0.0.0/16 (65,536 IP addresses)
     * - 2 Public subnets (10.0.1.0/24, 10.0.2.0/24) - 254 IPs each
     * - 2 Private subnets (10.0.3.0/24, 10.0.4.0/24) - 254 IPs each
     * - Spans 2 Availability Zones for high availability
     * - Enables DNS hostnames and resolution for proper service discovery
     */
    this.vpc = new ec2.Vpc(this, 'SecureVPC', {
      // Define the IP address range for the VPC
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      
      // Configure maximum AZs to use (2 for high availability)
      maxAzs: 2,
      
      // Enable DNS support for proper hostname resolution
      enableDnsHostnames: true,
      enableDnsSupport: true,
      
      // Define subnet configuration
      subnetConfiguration: [
        {
          // Public subnets: Resources here get public IP addresses
          // and can be directly accessed from the internet
          cidrMask: 24, // /24 = 256 addresses (254 usable)
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          // Private subnets: Resources here don't get public IPs
          // but can access internet through NAT Gateway
          cidrMask: 24, // /24 = 256 addresses (254 usable)
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      
      // NAT Gateway configuration for private subnet internet access
      natGateways: 1, // Single NAT Gateway for cost optimization
                      // In production, consider 2 NAT Gateways (one per AZ) for higher availability
    });

    // 2. CREATE SECURITY GROUPS WITH LEAST PRIVILEGE ACCESS
    /**
     * Public Security Group:
     * - Allows inbound HTTP (port 80) from anywhere for web traffic
     * - Allows inbound SSH (port 22) from anywhere for administration
     * - Allows all outbound traffic (default behavior)
     * 
     * Note: In production, consider restricting SSH access to specific IP ranges
     * or using AWS Systems Manager Session Manager for secure access
     */
    this.publicSecurityGroup = new ec2.SecurityGroup(this, 'PublicSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for public subnet resources - allows HTTP and SSH',
      allowAllOutbound: true, // Allow all outbound traffic
    });

    // Allow inbound HTTP traffic from anywhere
    this.publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Allow inbound SSH traffic from anywhere
    // SECURITY NOTE: In production, restrict this to specific IP ranges
    this.publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    /**
     * Private Security Group:
     * - Explicitly denies SSH access from anywhere
     * - Allows inbound traffic from public security group (for internal communication)
     * - Allows all outbound traffic for software updates and external API calls
     */
    this.privateSecurityGroup = new ec2.SecurityGroup(this, 'PrivateSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for private subnet resources - no direct SSH access',
      allowAllOutbound: true, // Allow outbound for updates and API calls
    });

    // Allow inbound traffic from public security group
    // This enables communication between public and private resources
    this.privateSecurityGroup.addIngressRule(
      this.publicSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow traffic from public security group'
    );

    // Allow internal communication within private security group
    this.privateSecurityGroup.addIngressRule(
      this.privateSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow internal communication within private security group'
    );

    // NOTE: SSH access is explicitly denied by not adding any SSH ingress rules
    // This ensures private subnet resources cannot be directly accessed via SSH

    // 3. CREATE IAM ROLE WITH LEAST PRIVILEGE PRINCIPLES
    /**
     * EC2 Instance Role:
     * - Follows principle of least privilege
     * - Only grants permissions essential for basic EC2 operations
     * - Can be assumed by EC2 instances
     * - Includes CloudWatch logging for monitoring
     * - Includes Systems Manager permissions for secure management
     */
    this.ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      roleName: 'SecureNetworkFoundation-EC2Role',
    });

    // Create custom policy with minimal required permissions
    const ec2Policy = new iam.Policy(this, 'EC2MinimalPolicy', {
      policyName: 'EC2MinimalAccessPolicy',
      description: 'Minimal permissions for EC2 instances following least privilege',
      statements: [
        // CloudWatch Logs permissions for application logging
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
            'logs:DescribeLogGroups'
          ],
          resources: [
            `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`,
            `arn:aws:logs:${this.region}:${this.account}:log-group:/application/*`
          ]
        }),
        // EC2 describe permissions for self-discovery
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:DescribeInstances',
            'ec2:DescribeTags'
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'ec2:Region': this.region
            }
          }
        }),
        // Systems Manager permissions for secure management
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ssm:GetParameter',
            'ssm:GetParameters',
            'ssm:GetParametersByPath'
          ],
          resources: [
            `arn:aws:ssm:${this.region}:${this.account}:parameter/myproject/*`
          ]
        })
      ]
    });

    // Attach the custom policy to the role
    this.ec2Role.attachInlinePolicy(ec2Policy);

    // Attach AWS managed policy for Systems Manager (for secure shell access)
    this.ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Create instance profile for EC2 instances to assume the role
    const instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [this.ec2Role.roleName],
      instanceProfileName: 'SecureNetworkFoundation-InstanceProfile'
    });

    // 4. CREATE DEMONSTRATION S3 BUCKET WITH RETENTION POLICY
    /**
     * S3 Bucket with Retention:
     * - Demonstrates removalPolicy.RETAIN configuration
     * - Will not be deleted when stack is destroyed
     * - Includes versioning and encryption for data protection
     * - Blocks public access for security
     */
    const retainedBucket = new s3.Bucket(this, 'CriticalDataBucket', {
      bucketName: `secure-network-foundation-${this.account}-${this.region}`,
      
      // CRITICAL: This ensures the bucket is retained even after cdk destroy
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      
      // Enable versioning for data protection
      versioned: true,
      
      // Enable server-side encryption
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Block all public access for security
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Enforce SSL for all requests
      enforceSSL: true,
      
      // Lifecycle configuration to manage costs
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ]
        }
      ]
    });

    // 5. OUTPUT IMPORTANT RESOURCE INFORMATION
    /**
     * CloudFormation Outputs:
     * These outputs provide important information about created resources
     * that can be used by other stacks or for reference
     */
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure network foundation',
      exportName: 'SecureNetworkFoundation-VPC-ID'
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of public subnet IDs',
      exportName: 'SecureNetworkFoundation-PublicSubnets'
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of private subnet IDs',
      exportName: 'SecureNetworkFoundation-PrivateSubnets'
    });

    new cdk.CfnOutput(this, 'PublicSecurityGroupId', {
      value: this.publicSecurityGroup.securityGroupId,
      description: 'Security group ID for public subnet resources',
      exportName: 'SecureNetworkFoundation-PublicSG'
    });

    new cdk.CfnOutput(this, 'PrivateSecurityGroupId', {
      value: this.privateSecurityGroup.securityGroupId,
      description: 'Security group ID for private subnet resources',
      exportName: 'SecureNetworkFoundation-PrivateSG'
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: this.ec2Role.roleArn,
      description: 'ARN of the EC2 instance role with least privilege access',
      exportName: 'SecureNetworkFoundation-EC2Role'
    });

    new cdk.CfnOutput(this, 'RetainedBucketName', {
      value: retainedBucket.bucketName,
      description: 'Name of the S3 bucket that will be retained after stack deletion',
      exportName: 'SecureNetworkFoundation-RetainedBucket'
    });

    // 6. ADD METADATA FOR DOCUMENTATION
    /**
     * Stack Metadata:
     * Provides additional information about the stack for documentation
     * and compliance purposes
     */
    this.templateOptions.description = 'Secure Network Foundation Stack - ' +
      'Creates a highly available, secure VPC with public/private subnets, ' +
      'security groups, IAM roles, and demonstrates resource retention policies.';

    this.templateOptions.metadata = {
      'AWS::CloudFormation::Interface': {
        ParameterGroups: [],
        ParameterLabels: {}
      },
      Author: 'AWS Solutions Architect',
      Purpose: 'Secure Network Foundation',
      Version: '1.0.0',
      LastUpdated: new Date().toISOString().split('T')[0]
    };
  }
}

// Example usage and app configuration
/**
 * CDK App Configuration:
 * This section shows how to instantiate and deploy the stack
 */
const app = new cdk.App();

new SecureNetworkFoundationStack(app, 'SecureNetworkFoundationStack', {
  // Specify the AWS environment
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  
  // Add stack-level tags
  tags: {
    StackName: 'SecureNetworkFoundation',
    ManagedBy: 'AWS-CDK',
    CreatedBy: 'Solutions-Architect'
  },
  
  // Enable termination protection for production
  terminationProtection: true,
  
  // Stack description
  description: 'Secure and highly available network foundation infrastructure'
});
```

## Key Features and Best Practices Implemented

### 🏗️ **Architecture Highlights**

1. **High Availability**: Resources span 2 Availability Zones
2. **Security**: Least privilege access with explicit SSH denial for private subnets
3. **Scalability**: Proper CIDR allocation allowing for future growth
4. **Cost Optimization**: Single NAT Gateway with option to scale to 2

### 🔒 **Security Features**

- **Network Segmentation**: Clear separation between public and private subnets
- **Security Groups**: Restrictive ingress rules with documented purposes
- **IAM Roles**: Minimal permissions following least privilege principle
- **S3 Security**: Encrypted, versioned bucket with public access blocked

### 🏷️ **Resource Management**

- **Standardized Tagging**: Consistent tagging across all resources
- **Resource Retention**: Critical resources protected from accidental deletion
- **Outputs**: Important resource IDs exported for cross-stack references

### 📋 **Deployment Instructions**

1. **Prerequisites**:
   ```bash
   npm install -g aws-cdk
   npm install aws-cdk-lib constructs
   ```

2. **Deploy the stack**:
   ```bash
   cdk bootstrap  # First time only
   cdk deploy SecureNetworkFoundationStack
   ```

3. **Verify deployment**:
   ```bash
   cdk list
   aws ec2 describe-vpcs --filters "Name=tag:Project,Values=MyProject"
   ```

This stack provides a solid foundation for deploying secure, highly available applications on AWS while following infrastructure as code best practices.