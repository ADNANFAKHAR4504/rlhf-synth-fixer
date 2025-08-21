# CFN-042-Expert-Single

## Scenario Description

Design and deploy a highly secure and scalable web infrastructure using AWS CloudFormation (YAML). This infrastructure should support a high-traffic web application with strict security, scalability, and high availability requirements across multiple AWS regions.

## Requirements

- Use AWS CloudFormation (YAML)
- VPC must span at least 3 Availability Zones
- Define IAM custom roles/policies based on least privilege
- Deploy Amazon RDS (MySQL) with Multi-AZ enabled
- S3 Buckets must:
- Use server-side encryption (SSE)
- Apply bucket policies to control access
- Enable CloudWatch monitoring and alerts
- Use Auto Scaling Groups for EC2 in multiple AZs
- Deploy CloudFront for global content distribution using S3 as origin
- Apply AWS WAF to protect CloudFront
- Create an Application Load Balancer (ALB) to distribute traffic
- Logs should be stored in a dedicated encrypted S3 bucket
- Use AWS KMS to manage encryption keys
- IAM roles should be used in place of static credentials for EC2
- VPC security groups and NACLs must follow AWS best practices

## Turn Instructions

Single-turn generation the model should return the complete CloudFormation YAML file named `secure-web-infrastructure.yaml`.

---