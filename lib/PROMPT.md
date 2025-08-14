# Secure Web Application Infrastructure Requirements

I need help building a secure CloudFormation template for our production web application. After some previous security incidents, management is really focused on getting this infrastructure deployment right from day one. The security team has given me a pretty detailed list of requirements that we need to meet.

## Project Overview

We're deploying a web application that needs to be both scalable and secure. The application will run on EC2 instances, but security has made it clear that these instances cannot be directly accessible from the internet. All traffic must flow through a load balancer, and we can only accept HTTPS connections.

## Security Requirements

The security team has been very specific about what they need to see in this deployment:

For data protection, all static content goes into S3 buckets with AES-256 encryption enabled. Public buckets are absolutely not allowed - we learned that lesson during our last security audit. The EC2 instances themselves must be placed in private subnets without any public IP addresses.

From an access control perspective, we need IAM roles that follow the principle of least privilege. No more broad permissions that give access to everything. Security groups should be configured to only allow HTTPS traffic on port 443, and only from our approved IP ranges. They also want MFA requirements implemented for sensitive resource access.

For monitoring and compliance, we need CloudTrail configured to log all API activity. The compliance team requires this for their audits. We also need AWS Config running for continuous monitoring of resource configurations. Automated backups to a separate region are required for disaster recovery purposes. CloudWatch alarms should alert us when CPU utilization gets too high.

Additional protection requirements include AWS Shield for DDoS protection (we had an incident last year) and an Application Load Balancer to distribute traffic across multiple instances.

## Deployment Specifications

The entire infrastructure needs to be deployed in the us-west-2 region across two availability zones. All resources must be tagged with 'Environment:Production' for cost tracking and resource management.

## Template Requirements

I need a complete CloudFormation template written in YAML format that meets these criteria:

The template must deploy successfully without errors. I've spent too much time debugging broken templates in the past. It should follow AWS best practices so we don't get flagged during the next security review. The code needs to be maintainable since other team members will need to work with it. The template must pass validation using AWS CloudFormation Designer.

The template should include proper parameter definitions with validation, clear resource naming conventions, and useful outputs that we can reference in other systems.

## Additional Considerations

It would be helpful if the template includes comments explaining the security configurations. I need to present this to the architecture review board, and they always have detailed questions about our security implementation.

The template absolutely must follow the principle of least privilege for all IAM policies. We've been called out before for overly permissive policies during compliance audits.

Given the tight timeline, I want to make sure we get the security aspects correct upfront rather than having to fix issues after deployment.
