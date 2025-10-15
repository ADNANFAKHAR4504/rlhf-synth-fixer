Create a production cloud environment using AWS CloudFormation JSON that establishes a secure, highly available infrastructure with proper network isolation, compute resources, database services, and monitoring capabilities.

Network Infrastructure:
Configure a Virtual Private Cloud with public and private subnets spanning two availability zones to ensure high availability and fault tolerance. The VPC should include public subnets for internet-facing resources and private subnets for backend services that require protection from direct internet access. Use dynamic availability zone selection to ensure template portability across different AWS regions.

Compute Layer:
Deploy an EC2 instance in one of the public subnets to serve as the application server. Configure SSH access to the EC2 instance with restrictions limited to a specific known IP address to enhance security. Tag the EC2 instance with an Environment tag set to Production for proper resource identification and cost allocation. Create an IAM instance profile with necessary permissions following the principle of least privilege to enable the EC2 instance to interact with other AWS services securely.

Database Layer:
Provision an RDS MySQL database instance in the private subnet to ensure it is not publicly accessible and protected from direct internet exposure. Enable automatic minor version upgrades on the RDS instance to ensure the database receives security patches and minor feature updates automatically. Configure automated daily backups for the RDS instance with a retention period of 7 days to support point-in-time recovery and disaster recovery requirements. Create a DB subnet group that spans both private subnets across the two availability zones to support Multi-AZ deployment capabilities.

Monitoring:
Implement CloudWatch alarms to monitor the EC2 instance CPU utilization with a threshold set to trigger alerts when usage exceeds 80 percent. Configure appropriate evaluation periods for the CloudWatch alarm to avoid false positives from temporary CPU spikes and ensure reliable alerting.

Security Configuration:
Define security groups following the principle of least privilege to minimize attack surface and control network traffic. Configure the EC2 security group to allow inbound SSH traffic on port 22 exclusively from a specific IP address to prevent unauthorized access. Create an RDS security group that allows inbound MySQL traffic on port 3306 only from the EC2 security group to ensure database access is restricted to the application tier. Manage database credentials securely without hardcoding sensitive information in the template or configuration files.

Template Configuration:
Follow the logical ID naming convention MyResourceTypeName for all CloudFormation resources to maintain consistency and readability throughout the template. Parameterize the template to allow customization of EC2 instance type and RDS instance type at stack creation time to support different environment requirements and cost optimization. Define CloudFormation outputs for the VPC ID, Public Subnet IDs, and EC2 Instance ID to enable cross-stack references and provide visibility into deployed resources.

Requirements:
The template must be valid CloudFormation JSON format and pass AWS CloudFormation validation checks to ensure successful deployment. Follow AWS best practices for security, reliability, and operational excellence throughout the infrastructure design.
