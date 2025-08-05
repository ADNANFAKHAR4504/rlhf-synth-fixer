I need to create AWS CDK TypeScript infrastructure for a multi-tier application deployment in us-east-1. 

Please help me set up:

1. VPC with proper networking - needs at least 2 public subnets and 2 private subnets across different AZs
2. Internet Gateway with the right route tables for public subnet access
3. EC2 Auto Scaling Group that runs in the private subnets and manages at least 2 instances
4. IAM roles and policies so the EC2 instances can securely talk to other AWS services
5. Everything should be implemented as TypeScript CDK stack code

The infrastructure needs to be production-ready and follow AWS best practices. Use Launch Templates for the Auto Scaling Group since they're the modern approach. Make sure to use the latest CDK features like Origin Access Control for any CloudFront if needed, and enable the restrictDefaultSecurityGroup feature flag behavior.

Please provide the complete infrastructure code in separate files that I can deploy.