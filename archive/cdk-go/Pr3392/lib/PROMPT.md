
Using AWS CDK with Go, create a secure infrastructure for a critical web application.
Deploy all resources to the us-east-1 region. Please focus on security best practices throughout the stack.
Here are the requirements:

1. VPC and Networking:
Set up a new VPC.
Include a VPC endpoint for DynamoDB to ensure private access.

2. IAM Roles and Policies:
Follow the principle of least privilege. Do not use wildcard(*) permissions in any IAM policies.
Create a unique and narrowly scoped IAM role for each Lambda function.

3. Security Groups:
All security groups must have a clear Description.
Ingress rules should be restricted to specific IP addresses, not open to the world(0.0.0.0/0).
Egress rules must also be restricted to only necessary outbound traffic.

4. Data Security:
Provision an RDS database instance.
Encrypt the RDS instance using a customer-managed KMS key that you create as part of the stack.
Create an S3 bucket for logging that blocks all public access.

5. Traffic Protection:
Deploy an Application Load Balancer (ALB) protected by a Web Application Firewall (WAF)
      using a managed rule set like AWSManagedRulesCommonRuleSet.

6. Resource Management:
Apply tags to all resources. At a minimum, every resource must have an Environment tag
      (e.g., 'production') and an Owner tag.

After generating the code, please add a final step to synthesize the stack using cdk synth
to validate that the Go code compiles into a valid CloudFormation template.
