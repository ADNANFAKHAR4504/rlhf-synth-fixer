I need help setting up a robust multi-region web application deployment using AWS CDK in Java. We're planning to deploy a high-traffic e-commerce website that needs to handle seasonal spikes and maintain high availability during regional outages.

Here are the specific requirements:

1. **Multi-region setup**: Deploy the application in us-east-1 (primary) and us-west-2 (secondary) regions. The application should automatically failover to the secondary region if there are issues with the primary.

2. **Auto Scaling**: Set up Auto Scaling groups that can handle traffic increases during peak shopping periods. We typically see 3-5x traffic spikes during sales events.

3. **Load Balancing**: Use Application Load Balancers to distribute traffic evenly across instances in each region. Make sure the load balancers can handle both HTTP and HTTPS traffic with proper SSL termination.

4. **DNS and Failover**: Configure Route 53 with health checks and automatic failover between regions. I want to use the new Route 53 Application Recovery Controller for better coordination during outages.

5. **Global Traffic Management**: Implement AWS Global Accelerator to improve performance for users worldwide and provide static IP addresses that won't change during failovers.

Additional requirements:
- Use t3.medium instances as the baseline with scaling up to c5.large during high traffic
- Enable detailed monitoring and CloudWatch integration
- Implement security best practices including VPC with proper subnet configuration
- Use the latest AWS CDK Java patterns and constructs

Please provide the complete CDK Java infrastructure code that I can deploy directly. I prefer having separate files for different components to keep things organized.