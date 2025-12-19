Create a single TypeScript file using the AWS CDK that defines a complete AWS CloudFormation stack for a production-ready cloud environment. The stack must meet the following requirements:

    1.	VPC & Networking
    •	Create a new VPC in the us-east-1 region with two public and two private subnets across different availability zones.
    •	Attach an Internet Gateway and configure routing so all public subnets send outbound traffic through it.
    •	Deploy two NAT Gateways, one in each public subnet, and configure private subnets to route outbound traffic through the NAT Gateways.
    2.	Compute
    •	Deploy an EC2 Auto Scaling Group across the private subnets.
    •	Instances should use a predefined instance type and be attached to an IAM role granting S3 read-only access.
    3.	Load Balancing
    •	Provision an Application Load Balancer (ALB) in the public subnets that distributes traffic to the EC2 Auto Scaling Group.
    •	Enable HTTPS on the ALB using a certificate provisioned in AWS Certificate Manager (ACM).
    4.	Database
    •	Create an RDS PostgreSQL instance in the private subnets with automated backups enabled.
    5.	Tagging & Compliance
    •	Apply consistent tags to all resources (for example: Environment: Production).
    •	Ensure the stack is compliant with AWS best practices and cost tracking conventions.

Constraints:
• Use AWS CDK with TypeScript to define all resources.
• The output must be a single TypeScript file that can be deployed with cdk deploy without modification.
• The deployment should pass integration tests verifying resource correctness, networking, IAM permissions, and security best practices.
