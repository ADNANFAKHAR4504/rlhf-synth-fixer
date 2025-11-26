# Payment Processing VPC Infrastructure

## Business Context

Hey, we're building the foundational network infrastructure for our new payment processing platform that needs to support PCI DSS compliance requirements with strict network segmentation and secure connectivity to our corporate data center. The infrastructure must provide isolated tiers for public-facing services, application processing, and database systems while maintaining high availability across multiple availability zones. We'll use Terraform with HCL to create this production-grade network architecture in eu-central-1.

## Technical Requirements

### VPC Network Foundation

Create a VPC with CIDR block 10.0.0.0/16 enabling both DNS hostnames and DNS support for internal name resolution. Deploy six subnets across three availability zones organized into three tiers—two public subnets (10.0.1.0/24, 10.0.2.0/24) for load balancers and bastion hosts, two private application subnets (10.0.11.0/24, 10.0.12.0/24) for compute workloads, and two private database subnets (10.0.21.0/24, 10.0.22.0/24) for data storage with complete network isolation. Create an Internet Gateway for public subnet internet access and configure separate route tables for each tier ensuring proper traffic flow and security boundaries.

### NAT Instance for Private Internet Access

Deploy a t3.micro EC2 instance using the latest Amazon Linux 2 NAT AMI in the first public subnet with source and destination check explicitly disabled to enable IP forwarding. Attach an Elastic IP for stable public addressing and configure user data to set up iptables NAT rules and enable IP forwarding in the kernel. Create a security group allowing ingress traffic from the private application subnet CIDR ranges (10.0.11.0/24, 10.0.12.0/24) on all ports and egress to 0.0.0.0/0 for internet access. Configure route table entries in the private application subnet route tables to direct all internet-bound traffic (0.0.0.0/0) to the NAT instance's primary network interface with explicit depends_on to ensure the instance is created first.

### Transit Gateway Connectivity

Create a Transit Gateway for hybrid connectivity to the corporate data center and attach it to the VPC with subnet associations across all three availability zones for high availability. Configure a Transit Gateway route table and create a route entry in the VPC's private application route table directing traffic destined for the on-premises network (10.100.0.0/16) to the Transit Gateway attachment with explicit depends_on to ensure the attachment completes before route creation. Enable route propagation to allow dynamic routing between the VPC and corporate network.

### Network Access Control Lists

Implement custom Network ACLs for defense-in-depth security with explicit deny rules for inbound and outbound traffic from the RFC 1918 ranges 192.168.0.0/16 and 172.16.0.0/12 using rule numbers 90 and 95 respectively. Create allow rules for legitimate traffic including inbound HTTP/HTTPS (ports 80, 443) with rule number 100, inbound SSH from corporate network (10.100.0.0/16 port 22) with rule number 110, and critical ephemeral port return traffic (ports 1024-65535) with rule number 120 for stateless communication. Configure outbound rules allowing HTTP/HTTPS, database ports, and ephemeral return traffic while denying the specified private ranges. Associate the NACLs with appropriate subnet tiers ensuring public, private application, and private database subnets have tailored security controls.

### VPC Flow Logs with S3 Storage

Enable VPC Flow Logs capturing ALL traffic (accepted and rejected packets) with maximum aggregation interval for comprehensive network monitoring and security analysis. Create an S3 bucket named "s3-vpc-flow-logs-prod-ACCOUNT_ID" using the AWS account ID for global uniqueness with server-side encryption using AES256 and force_destroy set to true for testing cleanup. Configure a bucket policy allowing the VPC Flow Logs service principal to deliver logs with appropriate permissions for PutObject and GetBucketAcl actions. Create an IAM role for VPC Flow Logs with a trust policy allowing the vpc-flow-logs.amazonaws.com service principal and attach a policy granting S3 write permissions to the specific bucket. Configure the Flow Logs resource to use the IAM role and S3 bucket as the destination with proper depends_on for the role and bucket.

### IAM Roles and Policies

Create an IAM role for the NAT EC2 instance with a trust policy allowing the ec2.amazonaws.com service principal and attach the AmazonSSMManagedInstanceCore managed policy for Systems Manager access enabling secure remote management without SSH. Define an instance profile associating the IAM role for attachment to the NAT instance. Create a separate IAM role for VPC Flow Logs delivery to S3 with least privilege permissions granting only the necessary PutObject action on the specific Flow Logs bucket ARN and path prefix.

### Route Tables and Traffic Flow

Create three distinct route tables for the public tier, private application tier, and private database tier with specific routing configurations. The public route table directs internet traffic (0.0.0.0/0) to the Internet Gateway and corporate network traffic (10.100.0.0/16) to the Transit Gateway attachment. The private application route table routes internet traffic (0.0.0.0/0) to the NAT instance network interface and corporate traffic (10.100.0.0/16) to the Transit Gateway with explicit depends_on for both the NAT instance and TGW attachment. The private database route table includes only the corporate network route to the Transit Gateway with no internet access ensuring complete isolation. Associate each route table with its corresponding subnet tier.

### Resource Tagging Strategy

Apply consistent tags to all resources including Environment with value "Production" and Project with value "PaymentPlatform" for cost allocation, compliance tracking, and resource organization. Use Terraform's default_tags in the provider configuration to automatically apply these tags to all resources eliminating repetitive tag blocks and ensuring consistency across the infrastructure.

## Provider Configuration

Configure Terraform version 1.5 or higher with AWS provider version constrained to 5.x using the pessimistic version operator (~> 5.0) to ensure compatibility with the latest stable features. Deploy all resources to the eu-central-1 region with default_tags applying Environment and Project tags automatically to all created resources. Define variables for environment designation (default "prod"), VPC CIDR block (default "10.0.0.0/16"), and availability zones for reusability across different deployments.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources such as "vpc-payment-prod", "subnet-public-1-prod", "nat-instance-prod", "tgw-corporate-prod". The S3 bucket for VPC Flow Logs uses the pattern "s3-vpc-flow-logs-prod-ACCOUNT_ID" retrieved using data.aws_caller_identity.current to ensure global uniqueness without random string generation that would cause integration test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for retrieving the AWS account ID, data.aws_region.current for the region name, data.aws_availability_zones.available for dynamically selecting availability zones, and data.aws_ami.nat for finding the latest Amazon Linux 2 NAT AMI. Do not reference existing infrastructure using data sources like data.aws_vpc or data.aws_subnet—create all resources fresh within this Terraform configuration to ensure isolated and reproducible deployments.

## File Organization

Structure the configuration with lib/provider.tf containing Terraform and provider version constraints, AWS provider configuration with default_tags for Environment and Project, and variable definitions for environment, VPC CIDR, and availability zones. The lib/main.tf file contains all data sources (caller identity, region, availability zones, NAT AMI), VPC and subnet resources, Internet Gateway, NAT instance with security group and Elastic IP, Transit Gateway and attachment, Network ACLs with custom rules, route tables with routes, VPC Flow Logs with S3 bucket and IAM role, and comprehensive outputs with minimum 35-40 total providing resource identifiers, ARNs, and groupings for integration testing and infrastructure composition.

## Cleanup Configuration

Set force_destroy to true on the S3 VPC Flow Logs bucket to allow deletion even with log files present, configure the NAT instance with disable_api_termination set to false to enable automated destruction, and ensure the Transit Gateway attachment can be deleted cleanly. All other resources (VPC, subnets, route tables, security groups, Network ACLs, IAM roles) delete automatically once dependencies are removed ensuring complete terraform destroy success for testing and development workflows.

## Integration Testing Outputs

Provide comprehensive outputs grouped by infrastructure component including the VPC ID and CIDR block, subnet IDs organized by tier (public_subnet_ids as a list, private_app_subnet_ids as a list, private_db_subnet_ids as a list), NAT instance ID and public IP address, Transit Gateway ID and attachment ID, route table IDs for each tier, Network ACL IDs, security group IDs, S3 bucket name and ARN for Flow Logs, VPC Flow Logs ID, and IAM role ARNs for both the NAT instance and Flow Logs service. Mark the NAT instance public IP as sensitive and provide descriptions for all outputs explaining their purpose and usage in downstream infrastructure components. Tests require minimum 35-40 outputs with proper descriptions for comprehensive validation of network architecture, routing configuration, security controls, and monitoring setup.