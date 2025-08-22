I need your help designing a secure AWS infrastructure using CloudFormation in YAML. The goal is to define a VPC architecture that follows best practices and satisfies these requirements:

    1.	The VPC should include both public and private subnets, distributed across two Availability Zones for high availability.
    2.	A NAT Gateway must be configured to allow private subnet instances to access the internet securely.
    3.	An Amazon S3 bucket should be created with mandatory server-side encryption enabled for all objects.
    4.	A security group should be defined to allow inbound SSH access only from the 192.168.1.0/24 range, blocking all other sources.
    5.	The entire solution must be written in YAML format.

Expected Output

A CloudFormation YAML file named secure-infrastructure.yml that provisions the above resources. The template should pass AWS CloudFormation validation and align with AWS security best practices.
