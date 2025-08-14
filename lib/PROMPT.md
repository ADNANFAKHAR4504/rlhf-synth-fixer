Need to set up a production AWS environment with Terraform. We're looking at a standard web app infrastructure setup - the usual suspects: VPC, EC2 instances, load balancer, S3 storage, security groups.

This needs to be solid prod-level stuff, so we're talking us-east-1 region (client requirement), everything prefixed with "prod-" for naming consistency.

What we need:
- Use Terraform v0.12+ (nothing older)
- Everything goes in us-east-1, no exceptions
- Naming convention: "prod-" prefix on all resources
- Tag everything with Environment = Production
- Split configs properly - variables.tf for inputs, main.tf for the actual infrastructure
- S3 buckets need versioning enabled (learned this the hard way before)
- Load balancer should handle both HTTP and HTTPS
- High availability setup - spread across multiple AZs in us-east-1

Basically need main.tf and variables.tf files that will actually deploy without issues and follow all the naming/tagging rules. Should be bulletproof for production use.
