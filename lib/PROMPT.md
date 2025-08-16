I need some help scaffolding out a new project with a secure, multi-region AWS baseline using Terraform. The project is called "Nova," and the goal is to build a production-ready, secure foundation that we can build on top of.

For this task, could you generate everything in a **single `./lib/main.tf` file**? That means all the variable declarations (including one for aws regions that the provider file will use), locals, resources, and outputs should all be in that one file. We'll handle the `provider.tf` separately, but you can assume it's already set up with the necessary aliases for the different regions. Also, let's build all the resources directly for now—no external modules, please. For multi-region you'll define all provider aliases in provider.tf and reference them inside main.tf like provider = aws.

Security is the top priority, so everything should follow best practices like the principle of least privilege. Here's a breakdown of what we need:

* **Multi-Region Setup:** We need this to run in two separate AWS regions for disaster recovery (you can use `us-east-1` as the primary and `us-west-2` as the secondary for the example). The two regions need to communicate privately, so let's set up a VPC in each and then connect them with **VPC peering**. Don't forget to update the route tables so the resources can actually talk to each other.

* **Secure Networking:** Inside each VPC, we'll need the standard **public and private subnets**. All our important stuff, like the app servers and database, must live in the private subnets. This means we'll also need **NAT Gateways** in the public subnets so the private resources can get out to the internet for patches and updates. Please lock everything down with tight **Security Groups** and **NACLs**—no `0.0.0.0/0` on sensitive ports.

* **Application & Database:** In each region, please provision one small **EC2 instance** (a `t3.micro` is perfect) and a **Multi-AZ PostgreSQL RDS instance** (also `t3.micro`). Both of these must be placed in the private subnets.

* **Encryption is Key:** This is super important. All data needs to be encrypted at rest. Please create a customer-managed **KMS key** in each region. This key should be used to encrypt the EC2 instance's EBS volume and the RDS database. Also, let's set up a primary **S3 bucket** in the main region that replicates to a backup bucket in the secondary region. Both buckets need to be private and enforce server-side encryption using our new KMS keys (SSE-KMS).

* **IAM Permissions:** Let's create a single, specific **IAM Role** for the EC2 instances. The policy attached to it needs to be locked down tight—only the absolute minimum permissions required. It'll need access for SSM Session Manager (so we can connect without SSH keys), permissions to send logs to CloudWatch, and read-only access to the S3 bucket. Please avoid using wildcards (`*`) on actions or resources where a specific ARN can be used.

* **Logging and Monitoring:** To make sure we have visibility, please enable **VPC Flow Logs** and **CloudTrail** in both regions. All these logs should be sent to a central, secure S3 bucket in the primary region for safekeeping. It would also be great to have a couple of basic **CloudWatch alarms**—one for high CPU on the EC2 instances and another for low free storage space on the RDS instances.

* **Outputs:** Finally, please emit some useful outputs that our CI/CD pipeline and tests can use, like the instance IDs, VPC IDs, and bucket names. Just make sure not to output any secrets.
