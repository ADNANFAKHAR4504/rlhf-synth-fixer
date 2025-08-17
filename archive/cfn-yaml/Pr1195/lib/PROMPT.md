You are an AWS CloudFormation expert. Write a complete YAML-format CloudFormation template that deploys a web application with the following specifications:

    1.	Region & Availability
    •	Deploy in the us-west-2 region.
    •	Use multiple Availability Zones for high availability.

    2.	Compute Layer
    •	Use an Auto Scaling Group (ASG) with:
    •	Minimum instances: 2
    •	Maximum instances: 6
    •	Scaling based on average CPU utilization.

    3.	Load Balancer
    •	Use an Application Load Balancer (ALB) configured for HTTPS.
    •	Use an Amazon-issued SSL certificate via AWS Certificate Manager (ACM).
    •	Automatically redirect all HTTP requests to HTTPS.

    4.	Logging & Storage
    •	Store ALB and application logs in an S3 bucket.
    •	Apply lifecycle policies:
    •	Transition logs to Glacier after 30 days.
    •	Delete logs after 365 days.

    5.	Security
    •	All traffic must be restricted to HTTPS only.

    6.	Tagging
    •	Apply the following tags to all resources:
    •	Environment: Production
    •	App: WebApp

    7.	Output
    •	The template should be ready to deploy without modification.
    •	Must pass automated unit tests checking for:
    •	Correct scaling configuration.
    •	Correct load balancing and HTTPS redirection setup.
    •	Correct tagging on all resources.

Expected output:
A YAML CloudFormation template file that, when executed, provisions all the required AWS resources and configurations exactly as described. Include all IAM roles, security groups, policies, listeners, target groups, scaling policies, and lifecycle rules directly in the template.
