We are doing this one in Terraform. Single file, named tap_stack.tf. When the model responds, it should return only the code for that file with no explanations or comments.

Target is a multi-region setup that runs in both us-east-1 and us-west-2. Follow the company naming rule using the pattern Service-Environment-Region and tag everything with Environment, Project, and Owner. Use the default VPCs in each region. If peering will not work because the default CIDRs overlap, create the smallest non-overlapping pair just to enable inter-region peering and keep the rest of the plan the same.

What needs to exist: EC2 application layer in both regions behind an Application Load Balancer, with Auto Scaling handling traffic swings. Centralized logging sends data to a single S3 bucket in the primary region with KMS encryption. ALB access logs and app logs flow to that bucket. Networking should include inter-region VPC peering, route tables that allow the two VPCs to talk, and tight security groups that restrict public traffic on 80 and 443 only to the ALBs.

Databases: RDS in the primary region connects with Multi-AZ and encrypted storage. A read replica runs in the secondary region if the engine supports it. DynamoDB tables integrate with point-in-time recovery turned on and cross-region protection via global tables or backup copy policies.

IAM roles and policies must be least-privilege - just what autoscaling, logging, replication, backup, and S3 access need.

Add a variable called environment to flip between staging and production. It should drive names, tags, and any right-sized defaults. Use KMS for at-rest encryption across S3, RDS, and DynamoDB. Providers should be set up for both regions with aliases and used consistently.

Final reminder: the output must be a single valid Terraform configuration in tap_stack.tf, ready to apply with terraform apply. Only the code, no extra text.
