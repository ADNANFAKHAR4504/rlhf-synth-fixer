I need to create AWS infrastructure code using CDK TypeScript for a security configuration setup. Here are the requirements:

Create two VPCs named 'ProductionVPC' and 'StagingVPC', each with one public and one private subnet. Set up IAM roles using AWS managed policies for server security with minimum necessary permissions.

All S3 buckets must enforce encryption in transit and at rest using customer-managed AWS KMS keys. Security Groups should limit inbound traffic to specific authorized IP ranges only.

Enable VPC Flow Logs and deliver them to a CloudWatch Logs group. Network ACLs must block all outbound internet traffic for private subnets.

Implement AWS Config rules to monitor configurations for compliance using proactive compliance features. Use VPC Block Public Access for enhanced security control.

Tag all resources with 'Environment' and 'Project' keys for cost reporting. Deploy in us-east-1 region.

Please provide the infrastructure code with one code block per file.