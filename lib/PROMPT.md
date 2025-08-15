Infrastructure as Code Setup: AWS Resources

Overview
In this task, we are tasked with building infrastructure using CDKTF (Cloud Development Kit for Terraform) for AWS. The goal is to create a modular and secure environment while following best practices. 

Constraints to Keep in Mind:
- Use CDKTF constructs for all resources.
- Code should be modular and reusable to ensure scalability.
- Sensitive data and configuration should be managed using environment variables.
- Follow consistent naming conventions for all resources and apply proper tagging.
- Include comments explaining the rationale behind key sections in the code for future maintainability.

What the Environment Will Look Like:
- Cloud Provider : The target provider will be AWS
-  Resources Needed : The main resources that need to be set up include [e.g., VPC, EC2, S3, IAM roles, Security Groups].
-  Region and Availability Zones : The setup will target [us-east-1, e.g., us-west-2], ensuring proper AZ distribution for fault tolerance.
-  Security : Define IAM roles for secure access to resources, and configure security groups to control inbound and outbound traffic.
-  Output : The final output should include resource identifiers and connection details (e.g., VPC ID, EC2 Instance Public IP, Security Group ID).

Key Requirements:
-  Modularity : Ensure that the code is modular so that it can be easily extended or modified for future needs.
-  Environment Variables : For all sensitive data (e.g., keys, passwords), use environment variables to maintain security.
-  Naming and Tagging : Follow a clear naming convention and include relevant tags for resource tracking and management.

By the end of this, we should have a fully functional, secure, and scalable infrastructure setup. 
 
