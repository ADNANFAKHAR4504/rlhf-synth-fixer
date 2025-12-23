# CDK Infrastructure Diagnosis Task

I have a multi-tier web application infrastructure built with AWS CDK TypeScript that fails to deploy. The architecture consists of:

- **Network Layer**: VPC with public, private, and isolated subnets across 2 AZs, with VPC peering to an existing VPC (10.0.0.0/16)
- **Compute Layer**: EC2 instances in an Auto Scaling Group (2-6 instances) behind an Application Load Balancer with HTTPS termination
- **Database Layer**: RDS PostgreSQL in isolated subnets with KMS encryption
- **Storage Layer**: S3 bucket for static content served through CloudFront CDN with Origin Access Control
- **Security Layer**: KMS keys for encryption, IAM roles with least privilege, SNS topic for CloudWatch alerts

The infrastructure uses nested stacks for modularity. When I run `cdk deploy`, I get multiple errors and the deployment fails.

Here is my current CDK code structure:

**Main Stack (tap-stack.ts)** orchestrates nested stacks:
- NetworkStack -> SecurityStack -> StorageStack -> DatabaseStack -> ComputeStack

**Key Issues I'm Seeing:**
1. CloudFormation reports "Invalid VPC peering connection" errors
2. Load balancer listener fails with certificate ARN not found
3. TypeScript compilation errors about deprecated properties
4. Auto Scaling policies have configuration errors
5. Stack deletion fails due to resource protection settings

Please review and fix all the issues in my CDK infrastructure code. The infrastructure should:
1. Deploy successfully to us-east-1 region
2. Use proper nested stack architecture
3. Have all security best practices (encryption, least privilege IAM, SSL enforcement)
4. Support clean stack deletion for testing environments
5. Include CloudWatch monitoring with SNS alerting

Fix all TypeScript errors, deprecated API usage, and configuration issues while maintaining the security requirements.
