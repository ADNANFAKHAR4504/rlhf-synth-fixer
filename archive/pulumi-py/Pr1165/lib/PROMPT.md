Using Pulumi's Python SDK Design and implement a secure infrastructure that satisfies the following requirements:

- VPC Setup 
   - Create VPCs in both us-east-1 and us-west-2 regions with /16 CIDR blocks.  
   - Split each VPC into public and private subnets with /24 CIDR blocks.  

- Networking 
   - Deploy and configure Internet Gateways for public subnets.  
   - Deploy and configure NAT Gateways for private subnet internet access.  

- Security 
   - Apply security group rules allowing only necessary inbound/outbound traffic.  
   - Ensure all resources are encrypted at rest using AWS-managed keys.  
   - Implement S3 bucket policies to allow only encrypted connections.  
   - Configure IAM roles with least privilege policies.

- Monitoring 
   - Enable CloudTrail in both regions for auditing.

- Automation 
   - Set up a CI/CD pipeline using AWS CodePipeline to deploy the infrastructure.  
   - Include automated tests to validate configurations across environments.  

- Tagging  
   - Tag all resources with Environment, Owner, and Project according to company policy.

- Entry Point
  - Provide the implementation in a main.py file.