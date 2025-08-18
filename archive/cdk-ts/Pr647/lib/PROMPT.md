I need to create AWS infrastructure using CDK TypeScript for a scalable cloud environment. Here's what I need:

- VPC with at least 2 public subnets and 1 private subnet using CDK VPC constructs
- Auto Scaling group in the private subnet with an Application Load Balancer in front using CDK Auto Scaling and ELBv2 constructs  
- Security groups that restrict EC2 access to specific IP ranges using CDK EC2 security group constructs
- Proper CDK bootstrapping configured for S3 asset storage
- Use at least one construct from the AWS CDK Construct Library
- Deploy to us-west-2 region
- All resources should use 'cdk-' prefix for naming
- Include AWS VPC Lattice for service networking if possible
- Consider using AWS Infrastructure Composer patterns for best practices

The infrastructure should pass cdk synth and cdk deploy validation. Please provide the infrastructure code with one code block per file.