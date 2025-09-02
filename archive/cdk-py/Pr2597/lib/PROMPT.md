Hey there! I need your help with setting up a web application infrastructure using AWS CDK and Python. The goal is to create a scalable and highly-available setup that adheres to some specific requirements. Let me walk you through what I have in mind.

First, we’ll need to define a VPC with the CIDR block `10.0.0.0/16`. Inside this VPC, we’ll create two public subnets, each in a different availability zone. To provide internet access, we’ll attach an Internet Gateway to the VPC. For security, we’ll set up a security group that allows inbound HTTP and HTTPS traffic.

The application itself will run on an Auto Scaling Group with at least two `t3.micro` EC2 instances to ensure high availability. To distribute traffic evenly, we’ll use a Classic Load Balancer. For managing the domain name of the application, we’ll configure Route 53.

We’ll also need a DynamoDB table for session management. It should have a primary key called `SessionId` and a read/write capacity of 5. For static resources, we’ll create an S3 bucket with public access and versioning enabled. We’ll also set up a lifecycle rule to retain past versions for at least 90 days. To enhance content delivery, we’ll configure a CloudFront distribution with the S3 bucket as the origin. And of course, we’ll use a free SSL/TLS certificate from AWS Certificate Manager to enable HTTPS for CloudFront.

IAM roles will be necessary to ensure secure interactions between the EC2 instances, S3, and DynamoDB. Finally, we’ll integrate CloudWatch for monitoring and logging across all resources. The entire stack should be deployable in the `us-west-2` region, and it’s important that we follow AWS best practices for security, reliability, and performance. Also, when we tear down the stack, it shouldn’t leave any residual resources behind.

Does this sound doable? Let’s make it happen with AWS CDK and Python!