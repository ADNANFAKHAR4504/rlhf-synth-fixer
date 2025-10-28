Hey there,

I need help setting up infrastructure for our new StreamFlix content delivery API. We're building out a system to serve metadata about movies and TV shows, and need it to handle high-volume requests with low latency.

Here's what we need to build:

We need an API Gateway to handle incoming metadata requests from our users. Behind that, we're planning to run our API service on ECS Fargate so we don't have to manage servers ourselves. For the database, we need a PostgreSQL RDS instance to store all our content catalog information. And to keep response times fast, we want to add Redis caching with ElastiCache in front of the database for frequently accessed content.

A few important requirements - everything needs to be deployed in the eu-west-2 region. We also need multi-AZ configuration for high availability since this will be serving production traffic. The Redis cache must have encryption enabled both at rest and in transit for security compliance.

For the networking side, we'll need the usual VPC setup with public and private subnets across multiple availability zones, NAT gateways for outbound traffic, security groups to control access between components, and an internet gateway.

I saw that AWS recently released ElastiCache Serverless which might be useful here since it auto-scales and has encryption built-in by default. Also noticed they launched enhanced Container Insights for ECS in December 2024 which could help with monitoring our Fargate tasks.

We're using **Pulumi with Python** for this infrastructure. Can you help generate the infrastructure code for all these components? Please provide the complete implementation in separate code blocks for each file that needs to be created.

Thanks!