Design and implement an AWS infrastructure for a fintech payment processing application using CDK for Terraform in Java.

Requirements:
The solution should deploy a containerized microservices application on ECS Fargate with high availability across multiple Availability Zones. 
Ensure dynamic service discovery, automatic scaling, and blue-green deployment support. 
Integrate an Application Load Balancer for traffic management and enable comprehensive monitoring through CloudWatch and Container Insights. 

Design:
The solution should follow a modular structure by organizing all reusable infrastructure definitions within a construct package.
Avoid hardcoded values and use modern Java records to manage configuration settings cleanly and type-safely.