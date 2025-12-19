Design a production-ready Terraform configuration in HCL that deploys a scalable web application environment on AWS.

Infrastructure Requirements

VPC and Networking
Create a VPC spanning two Availability Zones (AZs).
Include both public and private subnets in each AZ.

Compute (EC2 and Auto Scaling)
Launch EC2 instances in the public subnets.
Configure an Auto Scaling Group (ASG) to manage instances across AZs for scalability and high availability.

Load Balancer
Create an Application Load Balancer (ALB) that handles HTTP and HTTPS traffic.
Enable access logging for the ALB (to an S3 bucket or CloudWatch Logs).

Database Layer (RDS)
Deploy an RDS MySQL database in the private subnets.
Set up read replicas for high availability and improved performance.

Security
Define Security Groups that enforce the principle of least privilege.
Allow only necessary ports.

Ensure isolation between public and private subnets.
Tagging and Management
Apply consistent resource tags for cost tracking and environment identification.

Validation and Readiness
The configuration should be fully functional, secure, and production-ready.
It should pass validation for correct resource creation and configuration.

Important Constraints:
Use only Terraform HCL syntax.
All code must be in a single main.tf file.
Do not create separate files such as variables.tf, outputs.tf, backend.tf, or tfvars.
The output should represent a deployable, production-grade infrastructure.
All resources must be deployed in the us-west-2 region.