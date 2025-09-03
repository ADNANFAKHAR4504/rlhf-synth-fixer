I need help building a production-ready infrastructure setup on AWS that can handle high traffic and stay resilient during failures. Our team is migrating our existing application to the cloud and we need something rock-solid in the us-west-2 region.

Here's what I'm trying to achieve - we need a complete high-availability setup that won't go down when things go wrong. The infrastructure should include:

I need a VPC that spans multiple availability zones with subnets properly distributed for fault tolerance. Our database needs to be an RDS instance with automatic failover capabilities and encrypted backups - we can't afford any data loss during outages.

For the application layer, we need an Application Load Balancer that can handle automatic scaling and has proper failover DNS configuration. Behind that ALB, there should be EC2 instances with health checks configured so the load balancer can route traffic away from unhealthy instances automatically.

We also need secure storage with an S3 bucket that only accepts HTTPS traffic and blocks any unauthorized access through proper bucket policies. Security is crucial for us.

For monitoring, I want CloudWatch alarms connected to the RDS instance status so we get notified immediately if something goes wrong with the database. I'd also like to take advantage of some of the newer AWS monitoring features - I've heard about CloudWatch Network Performance Monitoring and Database Insights for Aurora, which might help us get better visibility into our infrastructure performance.

Everything needs to be tagged with "environment:production" for our resource management system.

Finally, I need to export the ALB DNS name and other key resource identifiers so we can integrate with our DNS service and run integration tests against the deployment.

Cost and deployment time are considerations for our team - we need this to deploy reasonably quickly without breaking the budget, but reliability is the top priority.

Can you help me create the infrastructure code for this setup? I need it in a format where each component goes in its own code block so I can copy and implement the files easily.