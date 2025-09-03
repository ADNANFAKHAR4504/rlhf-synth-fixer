We're setting up the AWS infrastructure for a new, scalable web application using CDKTF with TypeScript. The goal is to build a robust, multi-tier environment in us-east-1 that's ready for production traffic. All the code should be in a single, monolithic stack file.

Here's a rundown of what we need:

1. Let's start with a solid VPC that spans at least two Availability Zones for high availability. Inside this VPC, we'll need both public subnets for our web-facing servers and private subnets to protect our backend application logic and database.
2. This tier needs to handle fluctuating traffic gracefully. Set up an Auto Scaling group for our EC2 instances, ensuring we always have a minimum of 2 running, but allowing it to scale up to 5 during peak loads. An Application Load Balancer should be placed in front to distribute incoming requests evenly across these instances.
3. The core application servers must be secure and isolated from the public internet. These instances should be placed exclusively within the private subnets.
4. For our data layer, we'll use an Amazon RDS instance running MySQL. It's critical that this is configured for high availability with Multi-AZ enabled, and please make sure automated backups are switched on from the start.
5. Let's lock down the network with Security Groups. The web tier should only accept inbound HTTP and HTTPS traffic from the internet. The application tier should not be directly accessible from the outside at all.
6. All resource permissions should be managed through IAM roles, strictly following the principle of least privilege. No overly permissive roles, please.
7. We need visibility into the application's health and activity, so configure the setup to ship all application logs to CloudWatch for monitoring and analysis.

The final output should be a clean, working CDKTF TypeScript project that deploys this entire architecture.
