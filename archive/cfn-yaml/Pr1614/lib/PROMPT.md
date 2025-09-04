I need you to design a secure AWS infrastructure for a financial application using AWS CloudFormation in YAML. The setup must emphasize high availability, encryption, and strict security controls.

The template should include:
• An Amazon VPC with both public and private subnets, spread across two Availability Zones for fault tolerance.
• Amazon S3 buckets with SSE-S3 or SSE-KMS encryption enabled, and all data transfers must enforce TLS for security in transit.
• At least two EC2 instances, deployed across different Availability Zones. These must use IAM roles for AWS service access (no hardcoded access keys).
• An Auto Scaling Group (ASG) that manages these EC2 instances, ensuring they are placed behind an Elastic Load Balancer (ELB) for scalability and availability.
• IAM policies following the principle of least privilege, strictly controlling access to EC2 and related services.

Expected Output: Provide a CloudFormation YAML template named secure_infrastructure.yaml that can be validated and deployed successfully, while also conforming to AWS security and best practice guidelines.
