# Infrastructure Implementation Request for AWS Production Environment

I need help implementing a secure production-grade infrastructure on AWS using CDK with TypeScript. Our company is setting up a new production environment and we need to ensure it follows all best practices for security, scalability, and reliability.

## Current Setup

We have an existing CDK TypeScript project initialized with the following file structure:
- `lib/tap-stack.ts` - Main stack file (currently empty template)
- Standard CDK configuration with aws-cdk-lib v2.204.0
- TypeScript configuration ready

Here's our current `tap-stack.ts` file that needs to be updated:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Need to add all infrastructure here
  }
}
```

## Requirements

Please implement the following infrastructure components in the `lib/tap-stack.ts` file:

### 1. Networking Infrastructure
- Create a VPC with CIDR 10.0.0.0/16 that doesn't overlap with our existing networks
- Set up 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across different availability zones
- Set up 2 private subnets (10.0.10.0/24, 10.0.11.0/24) across different availability zones
- Configure an Internet Gateway and attach it to the public subnets
- Deploy a NAT Gateway in one of the public subnets for private subnet internet access

### 2. Security Configuration
- Create appropriate Network ACLs with proper ingress/egress rules
- Set up Security Groups for:
  - Web tier (allow HTTP/HTTPS from internet)
  - Application tier (allow traffic from web tier)
  - Database tier (allow traffic from application tier)
- Implement IAM roles for EC2 instances to securely access S3 buckets
- Follow principle of least privilege

### 3. Compute Resources
- Deploy EC2 instances in the private subnets
- Enable detailed monitoring for all EC2 instances
- Configure instances with the IAM role for S3 access
- Use Amazon Linux 2 AMI
- Instance type should be configurable via parameters

### 4. Load Balancing
- Create an Application Load Balancer in the public subnets
- Configure target groups for the EC2 instances
- Set up health checks
- Configure listeners for HTTP (redirect to HTTPS) and HTTPS

### 5. Database
- Deploy an RDS MySQL instance in the private subnets
- Configure it for Multi-AZ deployment for high availability
- Set up automated backups with 7-day retention
- Encrypt the database at rest
- Store credentials securely in AWS Secrets Manager

### 6. Storage
- Create S3 buckets for application data
- Enforce server-side encryption (AES-256)
- Enable versioning
- Configure lifecycle policies
- Block public access

### 7. Configuration & Tagging
- All resources must be tagged with 'Environment: Production'
- Use CloudFormation parameters for:
  - Instance types
  - Database size
  - Environment suffix
  - Key pair name for EC2 access
- Output important values like load balancer DNS, bucket names, etc.

### 8. Monitoring
- Enable CloudWatch monitoring for all resources
- Set up basic alarms for:
  - High CPU utilization on EC2 instances
  - Database connection count
  - Load balancer unhealthy targets

## Constraints
- The solution must be production-ready and follow AWS best practices
- All resources must be properly secured
- The infrastructure should be scalable and highly available
- Use CDK L2 constructs where possible for better abstraction
- Ensure all resources are created within the same stack
- The code should be clean, well-commented, and maintainable

## Expected Output
Please provide the complete updated `lib/tap-stack.ts` file that implements all these requirements. The code should be ready to deploy using `npm run cdk:deploy` and should create a fully functional production environment on AWS.

Also, make sure the implementation:
- Uses proper CDK patterns and best practices
- Includes error handling where appropriate
- Has meaningful resource names using the environment suffix
- Exports necessary values as CloudFormation outputs for reference

Can you help me implement this complete infrastructure in the single `lib/tap-stack.ts` file?