You are tasked with building a secure, scalable, and modular AWS infrastructure using the AWS Cloud Development Kit (CDK) with Python in the us-east-1 region. The setup will host a high-availability web application. Your CDK project follows this structure:

bash
Copy
Edit
project-root/
├── tap.py # Entry point (equivalent to app.py)
└── lib/
└── tap_stack.py # Stack definition
Requirements:
Programming Language: Python

CDK Tooling: Use AWS CDK (v2 preferred)

Region: us-east-1

Infrastructure Components:
VPC:

Create a VPC with at least two subnets across different Availability Zones.

EC2 Instances:

Use EC2 instances to host your application.

Configure Security Groups to allow only essential traffic (e.g., HTTP/HTTPS from Load Balancer, SSH from limited IP).

Use an IAM role to grant EC2 access to an S3 bucket.

Auto Scaling Group (ASG):

Set up an Auto Scaling Group to dynamically scale based on workload.

Load Balancer:

Deploy an Application Load Balancer (ALB) to distribute incoming traffic to EC2 instances.

RDS Database:

Provision an RDS (PostgreSQL/MySQL) instance inside the VPC.

Ensure EC2 instances can connect to RDS securely.

Secrets Management:

Store sensitive data (e.g., DB credentials) using AWS Secrets Manager.

EC2 instances must retrieve credentials at runtime (or on bootstrap) securely.

Code Structure & Practices:
All resources should be defined modularly within tap_stack.py.

Follow AWS best practices for:

Least privilege IAM policies

Network segmentation

Secure data access

Ensure your CDK application can be tested, deployed, and maintained easily.

Expected Output:
An AWS CDK application (Python) using the structure above that provisions the described infrastructure. All configurations should be clearly modular, and resources reusable. Provide comments and docstrings where appropriate.
