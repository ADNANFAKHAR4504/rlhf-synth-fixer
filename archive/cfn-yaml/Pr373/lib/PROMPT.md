You are an expert cloud infrastructure engineer. Your task is to create a secure, scalable, and cost-effective web application environment on AWS using a CloudFormation template in YAML format. The entire infrastructure must be deployed in the `us-east-1` region.

The solution must meet the following detailed requirements and constraints:

**Security & Networking:**

- Create a Virtual Private Cloud (VPC) for the environment.
- Limit all network traffic to EC2 instances to the HTTPS protocol only (port 443).
- Ensure that Amazon RDS instances are not publicly accessible.
- All sensitive data stored in Amazon S3 and RDS must be encrypted using AWS Key Management Service (KMS).
- Use IAM Roles with granular policies to restrict access to S3 buckets, following the principle of least privilege.
- Establish VPC Peering to connect this new infrastructure with an existing VPC that has a CIDR block of `10.0.0.0/16`.

**Scalability & Performance:**

- Implement an Auto Scaling Group for EC2 instances to ensure the application can handle varying loads efficiently.
- Utilize Amazon CloudFront as a Content Delivery Network (CDN) with a dedicated Amazon S3 bucket acting as the origin for static content.

**Monitoring & Management:**

- Set up Amazon CloudWatch alarms to monitor critical metrics:
  - EC2 instance CPU utilisation.
  - RDS burst balance.
- Tag all resources with a key `Environment` and a value that reflects the environment name, as well as a key `Owner` with the appropriate owner's name, for cost allocation and management.

**Instructions for the output:**

- Generate a complete and fully deployable CloudFormation template in YAML format.
- The template should define all the necessary AWS resources to satisfy every requirement listed above.
- Use clear and descriptive resource names and comments where appropriate.
- The final output should be the YAML template itself, without any additional conversational text or explanations.
