Our team keeps manually clicking through AWS console to set up environments and it's becoming a nightmare. Everyone does it slightly different and we keep running into weird config issues when things don't match between dev/staging/prod.

I need a CloudFormation template that gives us a standard setup we can reuse. The requirements from the team are pretty straightforward:

Network setup:
- VPC with 10.0.0.0/16 CIDR in us-east-1
- Two public subnets in different AZs
- Two private subnets in different AZs  
- Internet gateway for public access
- NAT gateway so private subnets can reach internet

Compute and security:
- EC2 instances in private subnets
- Latest Amazon Linux 2 AMI
- Security groups allowing SSH only from our office IP
- Route tables configured so private subnets can get updates through NAT

Everything needs ProjectX prefix for tagging and clear naming so people can tell what's what.

Template should actually deploy without errors and have comments explaining what each resource does. Our team isn't AWS experts so keep it maintainable rather than overly complex.

Need the full YAML template, explanation of design choices, useful outputs, and any deployment gotchas to watch out for.