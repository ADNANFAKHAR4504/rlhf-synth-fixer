Create a secure and highly available Cloudformation template in YAML that provisions a production-grade AWS infrastructure for a scalable web application. The environment must include compute, storage, and networking components, and comply with strict security and operational best practices.

Requirements:

Tag all resources with Environment=Production.

Use a provided VPC ID for all subnets and networking configurations.

Configure Security Groups to allow SSH access only from a specified IP address.

attach IAM roles with least privilege permissions to all EC2 instances.

enable server-side encryption for all S3 buckets, and ensure no public access is allowed.

Deploy RDS instances in a Multi-AZ configuration with no public accessibility.

Set up Elastic Load Balancers (ELB) with access logging enabled.

Configure CloudWatch alarms to trigger when CPU utilization exceeds 85%.

Create Auto Scaling Groups (ASG) with a minimum of two running EC2 instances.

Define Lambda functions using environment variables for configuration (no hard-coded values.

Use CloudFormation StackSets to provision IAM roles across multiple accounts.

verify that no hard-coded secrets are present in the template.

do not use the default VPC for any resources — all deployments must occur within the provided custom VPC.

Enforce key rotation for all encryption keys (KMS or otherwise).

Ensure no RDS instances are publicly accessible.

Expected Output:
a single YaML CloudFormation template that provisions the described environment. The template must:

- Pass AWS CloudFormation Linter (cfn-lint) validation.
- Fully satisfy all 16 constraints.
- Provide a secure, compliant, and highly available infrastructure setup for production.
- Make sure everything is in a single file