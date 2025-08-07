I need to create AWS infrastructure for a secure production environment using CDK TypeScript. Here are the requirements:

1. Set up a VPC with two public and two private subnets across two availability zones in us-east-1
2. Deploy bastion hosts in the public subnets for secure access to private resources
3. Configure IAM roles with least privilege access for all components
4. Set up security groups that only allow necessary traffic - bastion should only accept connections from specific IPs, and internal communication should be restricted appropriately
5. All resources need to be tagged with Environment:Production

I want to use some of the newer AWS features if possible. I heard about VPC endpoint security group sharing and AWS Session Manager with VPC endpoints for better security without internet access. Could you help me implement this?

Please provide infrastructure code with one code block per file that I can copy and paste directly.