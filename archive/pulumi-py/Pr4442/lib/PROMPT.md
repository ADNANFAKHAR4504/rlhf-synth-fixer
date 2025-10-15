Please develop a scalable, secure web application environment using Pulumi with Python, according to the following detailed requirements:

- Use Pulumi Python code to define and manage all AWS resources, replacing raw CloudFormation JSON or standalone boto3 scripts.
- Deploy all resources in the us-west-2 AWS region.
- Create EC2 instances launched using the latest Amazon Linux 2 AMI, with instance types parameterized for flexibility.
- Configure IAM roles for EC2 instances strictly adhering to the principle of least privilege.
- Implement an Auto Scaling group with load balancing to handle traffic efficiently and ensure high availability across two or three Availability Zones.
- Set up health checks for the EC2 instances to monitor and maintain application health.
- Provision an encrypted S3 bucket (using SSE-S3) to store application logs, with lifecycle rules to automatically delete logs after 30 days.
- Apply AWS best practices for resource tagging consistently across all created resources.
- Design the Pulumi Python templates to be modular, reusable, and well-documented to simplify maintenance and upgrades.
- Ensure the entire stack is deployable consistently and reliably using infrastructure-as-code principles within the Pulumi framework.

Keep your code clean and accurate.
