You are an expert Terraform engineer. Produce a single standalone Terraform file (main.tf) that implements the full AWS infrastructure described below using HCL (no modules, no external files). Respond only with the complete contents of that single Terraform file and nothing else (no explanations or extra text). The file must be ready to save as main.tf and used with terraform init / terraform apply.

High-level requirements (must be implemented exactly):

Provider: AWS, region us-east-1.

VPC: CIDR 10.0.0.0/16. Create exactly 2 public subnets and 2 private subnets across two availability zones in us-east-1 (e.g., us-east-1a and us-east-1b).

Internet Gateway attached to the VPC. Public subnets must route to the Internet Gateway.

NAT Gateway in each availability zone for private subnet internet access. Allocate Elastic IPs for each NAT Gateway. Private subnets must route via their AZ NAT Gateway.

ECS Cluster using Fargate. Ensure task definitions / example service use Fargate. All ECS tasks must have minimum CPU 256 and minimum memory 512 MiB.

Create an IAM role for ECS task execution and attach the managed policy AmazonECSTaskExecutionRolePolicy. Create any additional minimal IAM role/policy attachments required for ECS to run.

S3 buckets (at least one) with Block Public Access enabled, versioning enabled, and server-side encryption using SSE-S3.

DynamoDB table with provisioned capacity at least 5 read capacity units and 5 write capacity units.

All resources created must have the tag Environment = "Production". Apply tags where applicable (VPC, subnets, NAT, IGW, ECS cluster, DynamoDB, S3, IAM roles where possible).

Constraints & implementation details:

Use Terraform HCL syntax; include a required_providers block and set required_version (choose a modern Terraform version, e.g., >= 1.4.0).

Put everything in one file (main.tf). Do not create modules or separate files. Hard-code us-east-1 as the provider region.

Do not rely on data sources that fetch dynamic AZ names outside the 2 AZs; explicitly create resources in two AZs (us-east-1a and us-east-1b) so the output is deterministic. (If the provider complains about unavailable AZ names in a particular account, it's acceptable that user adjusts AZ names later.)

Create two route tables: one public (with route to IGW) and one private per AZ or a private route table that routes to that AZ's NAT Gateway — ensure private subnets in each AZ route to the NAT Gateway in the same AZ.

For NAT Gateways, allocate aws_eip resources and ensure they are associated with the NAT Gateway.

For ECS: create an aws_ecs_cluster, an example task definition (Fargate) with CPU 256 and memory 512, an IAM task execution role with AmazonECSTaskExecutionRolePolicy, and an example aws_ecs_service integrated with an application load balancer is optional but acceptable if included inline. If an ALB is included, ensure proper security groups.

For S3: enforce block_public_acls, block_public_policy, ignore_public_acls, and restrict_public_buckets. Enable versioning and server_side_encryption_configuration with SSE-S3.

For DynamoDB: use aws_dynamodb_table with billing_mode = "PROVISIONED" and specify read_capacity = 5 and write_capacity = 5.

Ensure all resources that support tags include: Environment = "Production".

Outputs and validation:

Include a few output blocks showing: VPC ID, public subnet IDs, private subnet IDs, ECS cluster name, S3 bucket name(s), and DynamoDB table name.

At the bottom of the file include a null_resource (optional) with local-exec provisioner that prints commands to validate the configuration (for example: terraform validate and terraform plan). This is only for convenience and should not perform remote changes.

Style & safety:

Keep variable usage minimal; the file should be runnable immediately (no variable input required). Hard-code names and values required by the constraints.

Add comments in the HCL file explaining each major block (brief lines only).

Ensure the template is secure by default (no public S3, minimum privileges for IAM roles consistent with ECS task execution, use SSE-S3).

Final instruction: produce a single Terraform file (main.tf) implementing everything above, complete and syntactically correct. Output only the file content.
