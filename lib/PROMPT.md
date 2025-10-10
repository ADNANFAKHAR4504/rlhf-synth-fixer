Create a complex AWS CloudFormation template in JSON format named main-template.json to set up a robust and migratable environment.

The template must meet the following high-level requirements:

1.VPC Setup: Create a fully distributed Virtual Private Cloud (VPC) with at least two public and two private subnets spanning multiple Availability Zones for high availability.
2.Network Access: Provision EC2 instances in the private subnet and set up a NAT Gateway in the public subnet to allow outbound internet access from the private instances.
3.Security & Access Management (IAM): Implement secure and extensive IAM Roles and Policies that strictly follow the principle of least privilege. Do not hard-code any Amazon Resource Names (ARN); use Parameters for dynamic ARN referencing.
4.Monitoring & Notification:
  Enable detailed monitoring for all EC2 instances.
  Create CloudWatch Alarms for key metrics of all critical resources.
  Integrate SNS Topics to publish stack events (creation, update, deletion) and ensure they have the proper permissions configured.
5.Data Security: Ensure data at rest is encrypted for all storage services used (if any are implicitly or explicitly deployed, like S3 or an RDS instance).
6.Migratability: The stack must be designed to support migration between at least two different AWS regions without any changes to the template file itself. This implies using region-agnostic resource types and conditional logic or parameters where necessary.

Expected Output:

The final JSON template should:
* Pass a basic validation test, specifically cfn-lint, to verify its structure and compliance with AWS best practices.
* Export critical outputs (e.g., VPC ID, Public Subnet IDs, SNS Topic ARN) that are needed for integrating with other CloudFormation stacks.
* Be ready for deployment to any AWS region.