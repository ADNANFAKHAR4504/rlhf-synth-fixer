Hey team,

Here are my notes for the new AWS environment we're building with the Go CDK. The main goal is to create a solid, production-ready template for our basic cloud infrastructure. Let's make sure it's well-structured and follows best practices, especially on the security front.

**What we're building:**

We're setting up a standard AWS environment in `us-east-1`. It'll have the usual components: a custom VPC, public and private subnets, a secure database, a compute instance, and the necessary monitoring and storage. The plan is to define everything in a single CDK Go template to keep it all manageable.

**Infrastructure Details:**

1.  **VPC Setup:**
    - Let's use the CIDR block `10.0.0.0/16` for the new VPC.
    - We'll need two public and two private subnets, spread across a couple of Availability Zones for high availability.
    - We'll need an Internet Gateway attached to the VPC for internet access.
    - A NAT Gateway should be placed in a public subnet so instances in the private subnets can get out to the internet for things like updates.

2.  **Database:**
    - We're going with a highly available RDS for MySQL instance.
    - It should be in the private subnets, so it's not exposed to the internet.
    - Let's enable Multi-AZ deployment for automatic failover.
    - We should also set up a CloudWatch Alarm to watch the CPU utilization. If it goes over 75% for too long, we want to know about it.

3.  **Compute:**
    - We'll launch an EC2 instance in a public subnet to act as a web server or bastion host.
    - This instance needs an IAM role with read-only access (`s3:GetObject`) to our S3 bucket.

4.  **Storage:**
    - We need an S3 bucket for assets and logs.
    - The bucket policy should lock it down so it's only accessible from within our VPC.
    - Let's turn on server access logging to keep track of all requests.

**Security and Connectivity:**

This part is super important.

- **EC2 to RDS:** The RDS security group should only allow MySQL traffic (port 3306) from the EC2 instance's security group. Nothing else should be able to talk to the database.
- **Public Access:** The EC2 instance's security group needs to allow HTTP (80) and HTTPS (443) from anywhere (`0.0.0.0/0`). For SSH (22), let's restrict it to a specific IP that we can pass in as a parameter.
- **VPC Endpoints:** Let's use a VPC Gateway Endpoint for S3. This way, the EC2 instance can access the S3 bucket without going over the public internet.

**General Guidelines:**

- **Tagging:** Let's tag everything with `Environment: Production` and `Project: CDKSetup` for tracking.
- **Parameters:** We should use CDK parameters for things like the SSH IP, instance types, and database credentials. No hardcoding.
- **Naming:** A consistent naming convention would be great. Something like `cf-vpc`, `cf-rds-sg`, etc.
- **Final Code:** The end result should be a clean, well-commented, and ready-to-deploy CDK Go template.

Let me know if you have any thoughts on this.
