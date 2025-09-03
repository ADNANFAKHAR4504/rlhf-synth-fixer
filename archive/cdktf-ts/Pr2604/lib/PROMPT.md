We need to build out a CDKTF (TypeScript) project that deploys a highly available and scalable web application on AWS. The target region is us-east-1, and the design has to run across at least two Availability Zones so it can stay up even if one zone goes down and all code should be in a main file.

The core requirements are:

- The application should sit behind an Elastic Load Balancer so traffic is spread evenly across all running instances.
- The system should be able to handle at least 100,000 requests per minute, so auto-scaling has to be in place to grow and shrink capacity based on demand.
- Every resource created needs to be tagged with environment: production so cost tracking and reporting stay consistent.
- Databases must be encrypted at rest to protect sensitive application data.
- Networking rules should be strict: users can only reach the application through the load balancer. No direct public access to EC2s or databases.
- IAM roles should follow least privilege, giving services only the permissions they absolutely need.
- Logging should be turned on everywhere — EC2, Load Balancer, RDS, Auto Scaling — and all of it should go to CloudWatch for auditing and monitoring.
- Daily backups must be configured for the database layer, with retention set for at least 30 days.

The output should be a working CDKTF (TypeScript) codebase that sets up this entire stack. It needs to deploy cleanly, validate without errors, and meet all the availability, security, and scaling goals listed above.
