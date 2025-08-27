We’re tasked with building a reliable and scalable AWS infrastructure using AWS CDK with Golang. The goal is to create something that’s secure, highly available, and capable of handling real-world workloads while following AWS best practices. This setup will cover everything—compute, storage, networking, monitoring—you name it. The idea is to ensure the application runs smoothly, even under heavy traffic or unexpected failures.

Here’s the vision: we’ll deploy EC2 instances in auto-scaling groups so they can adjust to demand, scaling between 2 and 10 instances as needed. These instances will have IAM roles with just the right permissions—nothing excessive, just enough to get the job done. And to make things even more efficient, we’ll use Lambda functions to process uploads triggered by S3 events in both regions.

For the database, we’re going with RDS in a multi-AZ setup to ensure high availability. On the networking side, we’ll create VPCs with both public and private subnets in each region. Security is a top priority, so we’ll configure security groups and NACLs to allow only HTTPS traffic from the internet.

Sensitive data? That’ll go into Parameter Store, fully encrypted with AWS KMS. And for monitoring, we’ll use CloudWatch to track metrics, set up alarms for any issues, and create a dashboard to give us a clear view of what’s happening across both regions.

To make sure traffic flows efficiently, we’ll use Route 53 for DNS management, complete with health checks to route requests to healthy resources. And if something goes wrong during a stack update, rollback triggers will help us recover quickly.

Everything will be tagged with `Environment=EnvironementSuffix` for easy tracking, and we’ll export key resource IDs like VPCs and Subnets for use in other stacks. The entire setup will be deployed in `us-west-2` using a single CloudFormation stack.

Let’s make this happen with AWS CDK and Golang. The infrastructure needs to be rock-solid, secure, and ready to handle anything we throw at it.