I need help building a containerized web application infrastructure on AWS using Pulumi with Python that supports blue-green deployments. Here's what I'm trying to set up:

1. Set up an ECS cluster with Fargate launch type that spans three availability zones for high availability.

2. Configure an Application Load Balancer with path-based routing and health checks so traffic gets directed properly and unhealthy containers get caught.

3. Create two ECS services - one for blue and one for green - each with their own target groups. This is the foundation of the blue-green deployment strategy.

4. Deploy an RDS Aurora PostgreSQL cluster with encrypted storage and automated backups. The database needs to be production-ready from day one.

5. Implement weighted target group routing to enable gradual traffic shifting between blue and green environments. I want to be able to move traffic over slowly, not all at once.

6. Configure CloudWatch Container Insights for ECS monitoring and alerting. I need to see what's happening with the containers and get notified when things go wrong.

7. Set up IAM roles with least privilege access for ECS tasks and services. Nothing should have more permissions than it absolutely needs.

8. Create separate security groups for the ALB, ECS tasks, and RDS with minimal required ports open. Each layer should be isolated and only expose what's necessary.

9. Enable ECS service auto-scaling based on CPU and memory utilization so the application can handle traffic spikes without manual intervention.

10. Configure environment-specific parameters using Pulumi config so I can easily manage different settings for dev, staging, and production.

What I'm looking for is a fully functional blue-green deployment setup where I can gradually shift traffic between environments using the ALB's weighted routing. The whole thing needs to support zero-downtime deployments and have automatic rollback capabilities if something goes wrong during a deployment. Give me a complete Pulumi Python program that makes this happen.