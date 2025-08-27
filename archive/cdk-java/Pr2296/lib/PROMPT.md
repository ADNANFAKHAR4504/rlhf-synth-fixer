# Help Needed: High-Availability Web App on AWS with CDK Java

I'm working on a project that needs to deploy a scalable web application to AWS, and I could really use some guidance. Our team has been tasked with creating a highly available solution that can handle traffic spikes, but I'm relatively new to AWS CDK with Java and want to make sure I'm following best practices.

## What I'm trying to build

I need to create infrastructure for a web application that has these specific requirements from our architecture team:

- The app needs to run across two availability zones in us-east-1 for high availability
- We want an Auto Scaling Group that can scale between 2 and 6 instances based on demand
- Need an Application Load Balancer to distribute traffic properly
- The database should be an RDS instance with Multi-AZ deployment for reliability

## My challenges

I've been reading about AWS CDK Java constructs, but I'm struggling with a few things. First, I want to make sure I'm using the latest features - I saw something about ALB now supporting one-click WAF integration and improved Multi-AZ deployments for RDS that offer faster failover times. Should I be incorporating these newer capabilities?

Also, I'm concerned about deployment time since we're in a startup environment and need to iterate quickly. I've heard some RDS configurations can take forever to deploy, so I want to avoid that if possible.

Our current setup is pretty basic - we have a simple Spring Boot app that connects to a PostgreSQL database. The app doesn't have any special requirements beyond being able to handle variable load and stay up during AWS maintenance or outages.

## Team constraints

We're a small team of three developers, and none of us are AWS experts yet. We're using CDK with Java because that's what our backend team knows best. Cost is definitely a factor for us - we need something that won't break our budget but can still handle growth if we're successful.

I'd really appreciate help with the CDK Java code that defines this infrastructure. I want to make sure I'm setting up the networking correctly, using appropriate instance types, and configuring everything to work together properly. Security is important too - we don't want to accidentally expose anything we shouldn't.

Can you help me create the CDK Java infrastructure code that meets these requirements while following AWS best practices?