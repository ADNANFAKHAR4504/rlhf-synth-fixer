Create a production-ready CloudFormation YAML template that provisions a scalable, secure, and automated web application infrastructure in the us-east-1 region. The application should be deployed within a VPC containing one public and at least two private subnets to ensure network isolation and high availability.

The infrastructure must include an Application Load Balancer (ALB) configured with an HTTPS listener to handle incoming web traffic securely, routing it to EC2 instances that run as part of an Auto Scaling Group with a minimum of 2 and a maximum of 5 instances. These instances should assume IAM roles for access permissions instead of hardcoded credentials, and they must operate within private subnets.

For data persistence, deploy an RDS instance configured for multi-AZ availability, ensuring durability and automatic failover. Use S3 for static content hosting, enabling versioning and AES-256 encryption for security and compliance. Additionally, integrate CloudFront as a global CDN to enhance content delivery performance and latency optimization.

Store sensitive environment variables securely using Systems Manager Parameter Store, and enforce strict security group rules to allow inbound traffic only on ports 80 and 443 from authorized IP ranges. All AWS services in this setup should have logging enabled for monitoring and auditing purposes.

Finally, automate the entire deployment lifecycle with CodePipeline, connecting source, build, and deployment stages to ensure continuous delivery of application updates. Resource names should follow the <project-name>-<resource-type>-<unique-id> convention, and the final output should be a validated template.yaml file that adheres to AWS best practices and passes CloudFormation Linter checks successfully.
