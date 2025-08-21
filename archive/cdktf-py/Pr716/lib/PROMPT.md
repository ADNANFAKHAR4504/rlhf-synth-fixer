You are an expert cloud infrastructure engineer and Terraform developer. Your task is to design and deploy a production-grade AWS cloud environment using Terraform written in Python (e.g., via CDK for Terraform (CDKTF)). The solution must be secure, modular in logical structure, and scalable but all code must be written in a single Python file.
Infrastructure Requirements
Modular Resource Structure (Logical)
Although everything is implemented in a single Python file, organize the logic using classes, functions, or clear code sections to simulate Terraform's modular structure.
Follow clean architecture principles: define clear boundaries for VPC, networking, compute, IAM, etc.
Networking Configuration
Create a VPC named prod-vpc with CIDR block 10.0.0.0/16.
Define three subnets in different availability zones:
At least one public subnet for internet-facing components.
At least one private subnet for backend resources.
Set up an Internet Gateway and route table(s) for public subnet(s).
Provision a NAT Gateway and private route tables for internet access from private subnets.
Compute Resources (Highly Available)
Deploy an Auto Scaling Group (ASG) of EC2 instances using a launch template or launch configuration.
Place the ASG behind an Elastic Load Balancer (ELB) for traffic distribution and fault tolerance.
Configure health checks and multi-AZ deployment.
IAM Configuration
Apply principle of least privilege when creating IAM roles and policies.
Assign only required permissions to each service (EC2, ASG, etc.).
Terraform State Management
Configure Terraform Cloud or a remote backend (e.g., S3 + DynamoDB lock table) for storing and locking state.
Ensure safe concurrent deployments and collaboration support.
Security Best Practices
Use Security Groups and Network ACLs to control traffic at the subnet and instance level.
Only allow explicitly required ports and IP ranges.
Avoid exposing internal services publicly.
Validation, Formatting, and Documentation
Ensure the Terraform code passes both terraform validate and terraform fmt (via cdktf synth where applicable).
Provide a comprehensive README.md file including:
Description of architecture and components
Deployment instructions
Overview of assumptions and decisions
Guidance on replicating or scaling the environment
Include example variable definitions and config templates (terraform.tfvars.example, etc.).
Constraints
All Terraform CDK logic must be implemented in a single Python file, without breaking it into multiple module files.
Despite being a single file, the code should be clean, maintainable, and logically modular using idiomatic Python (e.g., classes or function separation).
You may use helper classes or data structures within the file to organize the logic, but no separate files or modules are allowed.
Expected Output
A single Python file containing the complete CDKTF configuration for the infrastructure described above.
A README.md with:
Detailed explanation of the architecture
Setup and deployment instructions
Environment replication steps
Notes on assumptions and limitations
All Terraform code must:
Be syntactically valid and well-formatted (terraform fmt)
Pass Terraform/CDK validation (cdktf synth, terraform validate)
Code must be production-grade, scalable, and adhere to AWS security and infrastructure best practices.