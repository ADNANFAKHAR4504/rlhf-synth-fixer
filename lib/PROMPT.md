As an AWS Solutions Architect, your goal is to design and deploy a robust disaster recovery setup in AWS (specifically in us-west-2). The infrastructure should be highly available, secure, and ready to handle failures automatically.

Here’s what we’re looking for:

- Everything should run across multiple AZs so we don’t have a single point of failure.
- Security is key: IAM roles and policies should be tightly scoped (least privilege), and all data should be encrypted at rest using KMS.
- If something goes wrong during deployment, the system should roll back changes automatically.
- We need a solid backup plan: critical data should be regularly backed up to S3, with lifecycle rules and encryption.
- If a service or resource fails, Lambda should kick in and restore it without manual intervention.
- Monitoring matters: set up CloudWatch alarms for things like CPU, memory, and service health, and build a dashboard so we can see everything at a glance.
- For global users, traffic should be routed securely using CloudFront.
- Logging and auditing should be thorough—every service (CloudFront, S3, Lambda, CloudWatch) needs to be covered, and audit logs should go to an encrypted S3 bucket that’s locked down.

When you’re done, please provide a Python AWS CDK project (in app.py) that’s ready to deploy. The code should reflect all these requirements in a practical, real