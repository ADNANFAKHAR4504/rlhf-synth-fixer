You are tasked to set up a cloud environment using AWS CloudFormation. The requirements are as follows:

1. Create a Virtual Private Cloud (VPC) in the us-east-1 region.
2. The VPC should have two public subnets and two private subnets spread across two availability zones.
3. Deploy separate stacks for production and development environments in separate AWS accounts.
4. Provision EC2 instances within the private subnets in each environment.
5. Configure an Application Load Balancer (ALB) to manage the traffic distribution to the EC2 instances, ensuring the ALB is deployed in the public subnets.
6. Ensure the configuration adheres to best security practices, including appropriate security groups and network ACLs.

Expected Output:
Develop a CloudFormation YAML template that satisfies the above conditions. Deploying the stack should be straightforward, creating the entire described infrastructure automatically. The solution should be validated using AWS CloudFormation service with successful outputs for both environments.

Note: This task has been transformed from CloudFormation YAML to AWS CDK with JavaScript ES modules to follow the platform enforcement requirements.

Additional Requirements:
- Use AWS CDK v2 with JavaScript ES modules (.mjs files)
- Follow modular design patterns for reusability
- Implement proper security groups with least privilege access
- Include CloudFormation outputs for key resources
- Support environment-specific configurations