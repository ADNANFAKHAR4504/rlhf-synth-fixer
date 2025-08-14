## Foundational AWS cloud environment
You are tasked with setting up a cloud environment using Terraform.Standard AWS best practices for security and scalability should be followed.

Your tasks include: 
- Creating an Amazon RDS MySQL database with automated backup settings, ensuring secure storage of credentials. 
- Provisioning an Amazon EC2 instance using the latest Amazon Linux 2 AMI, placed within a public subnet that allows SSH access securely. 
- All resources should be defined using Terraform 1.0 HCL syntax and should be placed in the 'us-east-2' region. 
- Use Terraform variables to manage sensitive information like database credentials and the EC2 instance type. 
- Store your Terraform state file remotely in an S3 bucket with versioning enabled for state management. Ensure adherence to AWS best practices throughout the deployment.

- Resources must be created in the 'us-east-2' region. 
- Use Terraform 1.0 syntax for all resources. 
- Provision an Amazon RDS MySQL database with automated backups enabled. 
- Create an EC2 instance with the latest Amazon Linux 2 AMI.
- Ensure the EC2 instance is in a public subnet with a security group allowing SSH access from your IP.
- Use Terraform variables for database credentials and instance type.
- Store the Terraform state file in an S3 bucket with versioning enabled.
- Output the configuration as a single `main.tf` file with all the resources above.