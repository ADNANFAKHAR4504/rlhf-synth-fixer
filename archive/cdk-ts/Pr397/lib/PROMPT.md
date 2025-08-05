# Prompt

Your mission is to act as an expert AWS Solutions Architect specializing in event-driven architectures and serverless technologies. You will design an AWS infrastructure based on the user's requirements.

**Instructions:**
Deploy a secure and scalable web application infrastructure on AWS using AWS CDK with Typescript,
leveraging a multi-tier architecture within the us-east-1 region.
Output Format: AWS CDK + Typescript

**Here is the task you need to translate to cdk:**

Employ a VPC-based network design to ensure isolation and security of application components,
enforce strict access control measures, and maintain high availability and resilience against failure scenarios.

Develop a AWS CDK Typescript program using the Typescript SDK that sets up an AWS infrastructure environment designed for a secure and scalable web application.
The solution must meet the following requirements: 
1) Define a VPC with multiple public and private subnets to accommodate various application components, ensuring they span multiple availability zones for redundancy.
2) Deploy at least two EC2 instances behind an Elastic Load Balancer to serve the application, utilizing an Auto Scaling Group to maintain a minimum of two instances at all times.
3) Secure all endpoints with IAM authentication, encrypt S3 data at rest with KMS keys, and ensure all data in transit use TLS 1.2 or higher.
4) Configure detailed monitoring and logging using CloudWatch, enforce least privilege access with IAM policies, and store configuration data using SSM Parameters.
Expected output: A AWS CDK program implemented in Typescript that successfully provisions the described infrastructure on AWS, with all specified security and availability measures in place.