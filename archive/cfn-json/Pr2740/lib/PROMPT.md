# VPC Configuration

Create one VPC with:

* At least two subnets across different Availability Zones (AZs).
* Both public and private subnets.
* Attach an Internet Gateway to the VPC.
* Create a NAT Gateway in one of the public subnets.
* Configure appropriate route tables:

  * Public subnets route through the Internet Gateway.
  * Private subnets route through the NAT Gateway.

# Compute Resources

* Provision EC2 instances in each private subnet to serve as the application tier.
* Place instances behind an Auto Scaling Group with:

  * Desired capacity: 2 instances.
* Use an Elastic Load Balancer (ELB) to:

  * Distribute HTTP and HTTPS traffic to the instances.
  * Restrict instance access to only allow traffic from the ELB (via security groups).
* Enable detailed monitoring on all EC2 instances.
* Use IAM roles and policies for secure instance permission management.
* Use AWS Systems Manager (SSM) to manage EC2 configurations without SSH access.

# Storage and Logging

* Create an S3 bucket to store application logs.
* Ensure appropriate bucket policies for secure log access and error logging.
* Enable VPC Flow Logs and store logs in the same or separate S3 bucket.
* Ensure all EBS volumes and RDS storage are encrypted at rest using AWS KMS.
* Ensure automated RDS snapshots for backup purposes.

# Database

* Deploy an RDS MySQL instance in a private subnet.
* RDS should be:

  * Encrypted at rest using KMS.
  * Included in automated snapshot schedules.

# Monitoring and Tagging

* Create a CloudWatch Dashboard to monitor key metrics of deployed infrastructure.
* Apply a consistent Name tag to all AWS resources for easy identification.

# Validation

* The entire infrastructure must be defined using one CloudFormation JSON template.
* The template must validate successfully using AWS CloudFormation Linter (cfn-lint) without errors.

# Security and Best Practices

* Implement IAM roles with least privilege.
* Disallow direct SSH access; use SSM for management.
* Use security groups and NACLs appropriately to restrict access.
* Follow AWS naming conventions and best practices for maintainability.