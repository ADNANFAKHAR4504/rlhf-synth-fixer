Create an AWS CloudFormation template in JSON for a production cloud environment.

Here are the requirements for the setup:

VPC and Networking: Create a VPC with public and private subnets spanning two Availability Zones. This setup ensures high availability and proper network isolation for your resources.

EC2 Instances: Launch an EC2 instance in the public subnet. Make sure SSH access is limited to a specific known IP address (you can use a placeholder like 203.0.113.0/32). Tag this EC2 instance with 'Environment' set to 'Production'.

Database: Set up an RDS MySQL database instance in the private subnet with automatic minor version upgrades enabled. Enable daily backups of the RDS instance with backups retained for 7 days. The RDS instance should not be publicly accessible.

Monitoring: Set up a CloudWatch alarm to monitor the EC2 instance CPU utilization, triggering when it exceeds 80%.

Security: Configure Security Groups following the least privilege principle. The EC2 security group should allow SSH traffic on port 22 only from your specific IP address. Create an RDS security group that allows MySQL traffic on port 3306 exclusively from the EC2 security group. Make sure database credentials are managed securely without hardcoding them in the template.

Template Features: Use the logical ID naming convention 'MyResourceTypeName' for all CloudFormation resources. Use parameters for configurable values like EC2 instance type and RDS instance type. Add an Outputs section to the template to display the VPC ID, Public Subnet IDs, and the EC2 Instance ID after deployment.

Please ensure the final JSON template is valid and would pass standard AWS CloudFormation validation tests.
