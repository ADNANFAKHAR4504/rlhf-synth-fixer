Imagine you’re an AWS Solutions Architect and you’ve been asked to build a resilient, highly available infrastructure for a big e-commerce platform in us-west-2. The goal is to make sure everything stays up and running—even if something fails—while keeping things secure and easy to manage.

Here’s what we need: all the main resources (like web servers, databases, and caches) should be spread across multiple availability zones so we don’t have a single point of failure. If something goes wrong, we want automated failover and health checks—think load balancers and smart monitoring.

For the database, use RDS or Aurora with cross-AZ replication to keep our data safe. Networking should be solid: a VPC with both public and private subnets, proper routing, NAT gateways, and security groups that follow least privilege.

We also want Lambda functions that can jump in automatically if CloudWatch or EventBridge spots a problem. IAM roles and policies should be as minimal as possible—just enough for EC2, RDS, ElastiCache, and Lambda to do their jobs.

Finally, make sure the setup supports different environments (like dev), and that it’s easy to deploy and manage. When you’re done, please share the Python AWS CDK code (in app.py) that brings all