Hey, I need help building a web application infrastructure on AWS. We're looking to create something that can handle production traffic with good reliability.

For the setup, I need a VPC that spans multiple availability zones with proper subnet configuration. The application should run on EC2 instances behind a load balancer, and we need at least 2 instances running at all times through auto scaling. 

The database should be MySQL on RDS with multi-AZ for redundancy. Our instances will need to access S3 for serving static files, so appropriate IAM permissions are required. Everything should be properly tagged for our production environment and cost tracking.

Monitoring and logging through CloudWatch is essential for operational visibility. We want to deploy this in us-east-1 region.

Since we're exploring some of the newer AWS capabilities, it would be good to incorporate EKS Auto Mode for future container workloads and potentially AWS Clean Rooms for any data collaboration needs down the line.

Could you provide the CDK code in JavaScript using .mjs files? We prefer having the infrastructure organized in separate files for easier maintenance.