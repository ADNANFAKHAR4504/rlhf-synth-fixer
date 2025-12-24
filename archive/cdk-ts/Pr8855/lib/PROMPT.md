Build me infrastructure for a global website that scales automatically and fails over to a secondary region during outages. The key pattern is serving content directly from S3 by mounting an S3 bucket as a file system on web servers.

## What I Need

Set up a multi-region web application with these components:

**Content Flow**
- Admin uploads website files to a primary S3 bucket in us-west-2
- S3 Cross-Region Replication copies content to a secondary bucket in us-east-2 automatically

**Web Server Setup**
- Auto Scaling Groups manage EC2 instances in each region
- When instances launch, they install the S3 Mountpoint client, mount the regional S3 bucket to /var/www/html, and start Nginx to serve content from that mount

**Traffic Handling**
- Application Load Balancer in each region distributes traffic to instances
- ASG scales based on CPU - launches new instances when load increases

**Failover**
- Route 53 monitors ALB health in each region
- If us-west-2 ALB becomes unhealthy, traffic routes to us-east-2 automatically

## Technical Requirements

Use AWS CDK with TypeScript

Regions: us-west-2 as primary, us-east-2 as secondary

Each region needs a new VPC with two public subnets and two private subnets, plus a single NAT Gateway

ASG should start with max capacity of 1 but include CPU-based scaling policy

## Key Implementation Details

**Launch Template User Data**
This is critical - the boot script must install Nginx, install S3 Mountpoint client, and mount the S3 bucket. Make sure it handles errors gracefully.

**ALB and ASG Integration**
Put ALB in public subnets and EC2 instances in private subnets. Create a Target Group for the ASG and wire up the ALB listener to forward to it.

**Networking**
Private subnet route tables need a default route through the NAT Gateway so instances can download packages during setup.

**Route 53 DNS Failover**
Health checks should target ALB DNS names. Use Failover Routing Policy for the DNS records.

**Scaling Policy**
Add a TargetTrackingScalingPolicy on the ASG - scale out when average CPU goes above 70%.

## Security

**IAM Role for EC2**
Create an Instance Profile with least-privilege permissions - only s3:GetObject and s3:ListBucket on the specific regional bucket.

**Security Groups**
- ALB SG: Allow inbound HTTP/HTTPS from internet
- EC2 SG: Allow port 80 only from ALB Security Group. Allow SSH from VPC CIDR only - not from the internet.

## Output

Generate complete TypeScript CDK code with clear comments, especially for the user data script. Export the Route 53 domain name using CfnOutput.
