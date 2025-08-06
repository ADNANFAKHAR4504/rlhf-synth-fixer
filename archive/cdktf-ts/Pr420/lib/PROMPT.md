Here is your CDK for Terraform (CDKTF) prompt, tailored to your project structure using TypeScript:

---

**Prompt:**

> Implement a CDK for Terraform (CDKTF) project using TypeScript that provisions a scalable and secure AWS infrastructure in the `us-west-2` region. The structure of the project should include a `main.ts` file in the root directory to synthesize the app, and a `tapstack.ts` file in the `lib/` folder defining the infrastructure stack. Additionally, include a `test/` folder for unit tests.
>
> The infrastructure must:
>
> * Create a custom VPC with a CIDR block of `10.0.0.0/16`.
> * Define two public subnets in different availability zones within the Oregon (`us-west-2`) region.
> * Create and attach an Internet Gateway to the VPC.
> * Configure public route tables to route outbound traffic via the Internet Gateway.
> * Attach Network ACLs allowing inbound traffic on ports 80 (HTTP) and 443 (HTTPS).
> * Deploy two EC2 instances (Amazon Linux 2, type `t2.micro`), each in a separate public subnet.
> * Use a key pair for SSH access and attach a security group allowing inbound SSH (port 22), HTTP, and HTTPS.
> * Allocate and associate Elastic IPs to both instances.
> * Enable detailed monitoring on EC2 instances.
> * Use data sources to retrieve the latest Amazon Linux 2 AMI.
> * Tag all resources with `Environment = Development`.
> * Use Terraform variables to configure AMI IDs and instance types.
> * Follow the naming convention `dev-resourcetype-name` for all resources.
> * Configure Terraform remote state management using S3 backend.
>
> Make sure the stack defined in `tapstack.ts` cleanly encapsulates all resource definitions. Use constructs, data sources, and resource classes provided by `terraform-cdk` and `@cdktf/provider-aws`. Write corresponding tests under the `test/` directory.
