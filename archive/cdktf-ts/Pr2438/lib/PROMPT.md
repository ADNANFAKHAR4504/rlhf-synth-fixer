We need to put together a CDKTF + Typescript template that provisions a highly available web application environment in AWS. The setup should be resilient and be created in us-east-1 region us-east-1, and once written, the template should work without needing manual edits.

Here’s what the build needs to include:

- Use AWS Elastic Beanstalk to deploy the application layer.
- Configure Route 53 with failover routing to manage DNS.
- The database tier must run on Amazon RDS with Multi-AZ enabled for high availability.
- Build everything inside a VPC that has both public and private subnets.
- Apply IAM roles and policies with strict least-privilege permissions so that each resource only has access to what it needs.
- Set up CloudWatch alarms to track application health and trigger notifications or scaling actions when thresholds are reached.
- Make sure the code passes validation and can be launched directly.

Expected output is a single CDKTF + Typescript main file that provisions the above environment. It should deploy cleanly in a region, configure the DNS failover, ensure database resilience, and enforce proper security and monitoring practices.
