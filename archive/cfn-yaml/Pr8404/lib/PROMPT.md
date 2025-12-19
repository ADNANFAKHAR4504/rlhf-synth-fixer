# Secure S3 CloudFormation Task

Need a CloudFormation template that creates a secure S3 bucket for our data science team. The bucket needs to work in both dev and prod environments.

## What I need

Build a CloudFormation YAML template with these components:

**Parameters**

- Environment parameter (String) - - only accepts "dev" or "prod"

**Resources to create**

- S3 bucket with dynamic naming: secure-datascience-{AccountId}-{Environment}
- KMS key for encryption (only DataScientistRole can use it)
- VPC endpoint for S3 (gateway type)
- Access logging bucket (only in prod)
- Create new Netwrking infrastructre based on the need (VPC, Subnets , internet Gateways..)

**Security requirements**

- Use the custom KMS key for bucket encryption
- Bucket policy should allow DataScientistRole to get/put objects
- Force all access through the VPC endpoint
- Enable access logging only when Environment=prod

The template should be production ready but also deployable in dev. Make sure all access goes through our private network via the VPC endpoint.

Output should be a single YAML file with good comments explaining each section.
