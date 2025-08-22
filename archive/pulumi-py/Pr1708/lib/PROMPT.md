# AWS Infrastructure Setup with Pulumi

I need a Python script that sets up AWS infrastructure using Pulumi. This should be a single file that I can run with `pulumi up`.

## What I need:

### AWS Setup

- Support for multiple regions (I might want to deploy to different regions later)
- A VPC in each region with proper networking

### Network Requirements

- VPC with DNS enabled
- 2 public subnets and 2 private subnets
- Spread across at least 2 availability zones
- Internet gateway for public subnets
- NAT gateway for private subnets (so private instances can reach internet)
- Route tables configured properly
- Security groups with tight rules - only allow what's necessary

### Resource Management

- Tag everything consistently for cost tracking
- Include Environment, Team, and Project tags
- Use Pulumi config instead of hardcoding values

### Technical Details

- Private subnets shouldn't auto-assign public IPs
- One NAT gateway per region is fine for now (can optimize costs later)
- Export VPC IDs, subnet IDs, and security group IDs
- Make sure outputs work well with automated testing

### Code Requirements

- Single Python file, no external dependencies beyond Pulumi packages
- Good comments explaining what each section does
- Ready to run immediately
- All AWS resources in one file

The script should be production-ready and follow AWS best practices for security and cost managements.
