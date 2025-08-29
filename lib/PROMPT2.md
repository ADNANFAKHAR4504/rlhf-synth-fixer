# Help! Terraform Deploy Failed - Need Quick Fixes

Hey team, so I tried deploying our production infrastructure and ran into a few snags. The deployment crashed with multiple errors and I'm not sure how to fix them properly. Could really use some help here since this needs to be working ASAP.

## What Happened

Tried running `terraform apply` on our production setup and it bombed out. Got three main issues that are blocking the deployment:

### Issue #1: S3 Lifecycle Configuration Problem
Getting this warning that's apparently going to become an error soon:

```
Warning: Invalid Attribute Combination
with module.storage.aws_s3_bucket_lifecycle_configuration.main,
on modules/storage/main.tf line 46, in resource "aws_s3_bucket_lifecycle_configuration" "main":
46: resource "aws_s3_bucket_lifecycle_configuration" "main" {

No attribute specified when one (and only one) of
[rule[0].filter,rule[0].prefix] is required

This will be an error in a future version of the provider
```

So apparently our S3 lifecycle config is missing some required attribute. Not sure what exactly needs to be added here.

### Issue #2: EC2 Key Pair Doesn't Exist
Both EC2 instances are failing to create:

```
Error: creating EC2 Instance: operation error EC2: RunInstances, https response error StatusCode: 400, RequestID: 82811efa-1ea3-4b8c-94c8-6dbec8096b7c, api error InvalidKeyPair.NotFound: The key pair 'prod-key-pair' does not exist

with module.compute.aws_instance.web[0],
on modules/compute/main.tf line 126, in resource "aws_instance" "web":
126: resource "aws_instance" "web" {
```

Yeah, so the key pair 'prod-key-pair' doesn't actually exist in AWS. I hardcoded that name as a default but never created the actual key pair. Not sure what the best approach is here - should we create the key pair in Terraform or just reference an existing one?

### Issue #3: RDS Password Validation Failed
The database creation is also failing:

```
Error: creating RDS DB Instance (prod-project-166-database): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 977b38ab-643b-430b-b897-39fa3e7c13e6, api error InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.

with module.database.aws_db_instance.main,
on modules/database/main.tf line 58, in resource "aws_db_instance" "main":
58: resource "aws_db_instance" "main" {
```

So our randomly generated password for RDS contains characters that aren't allowed. The error says no '/', '@', '"', or spaces are allowed, but our random password generator might be including those.

## What I Need Help With

1. **S3 Lifecycle Fix**: How do I properly configure the lifecycle rules to avoid that warning? Do I need to add a filter or prefix? What's the right way to set this up?

2. **Key Pair Strategy**: What's the best practice here? Should I:
   - Create the EC2 key pair resource in Terraform?
   - Make it a variable that users have to provide an existing key pair name?
   - Something else?

3. **RDS Password**: How do I fix the random password generator to only use allowed characters? Need to make sure it's still secure but compliant with AWS requirements.

## Additional Context

This is for our production environment so it needs to be solid. We're using:
- Terraform with AWS provider ~> 5.0
- Modular structure (networking, compute, database, storage, monitoring)
- Random password generation for RDS
- All resources prefixed with 'prod-'

The rest of the infrastructure seems to be working (VPC, subnets, etc.) - it's just these three specific issues blocking us.

Any quick fixes or guidance would be super helpful! Trying to get this deployed before end of day.

Thanks!