## Hey, need help with a CloudFormation template

I'm working on a CloudFormation template for our company's data storage, and I want to make sure we're doing the security stuff right. We've had some issues before with S3 buckets being too open, and my manager wants me to create something more secure.

## What I need to build

Basically, I need a YAML CloudFormation template that sets up secure storage for sensitive data. Nothing too fancy, but it needs to check all the security boxes so we don't get in trouble with compliance.

## The requirements I have to meet

**Storage security:**
- S3 buckets encrypted with customer-managed KMS keys that automatically rotate every year
- KMS key policies integrated with IAM roles to control who can decrypt the data
- Block all public access at the bucket level - no exceptions

**Access control:**
- IAM roles granting only specific S3 actions like GetObject and PutObject - no wildcards
- Policies requiring MFA authentication before users can access sensitive S3 buckets
- IAM roles connected to the KMS keys so encrypted data can actually be read

**Monitoring:**
- CloudTrail logging all S3 data events and writing to a separate audit bucket
- CloudTrail integrated with KMS so the audit logs themselves are encrypted
- Need audit trail for compliance reviews and incident investigation

**Cost savings:**
- Lifecycle policies transitioning S3 objects to Glacier after 30 days
- Lifecycle rules that preserve encryption during transition to cheaper storage
- Old data stays encrypted in Glacier and accessible with same IAM permissions

## What I'm looking for

Just a straightforward CloudFormation template in YAML that:
- Actually works when I deploy it
- Has parameters for environment names and resources with outputs for stack references
- Includes comments so I can understand what's happening
- Can be deployed across dev, test, and prod with different parameter values

I'm not looking for anything overly complex - just want to get the security right and make sure it's maintainable. The template will get tested before we use it for real, so it needs to actually deploy without errors.

## Service integration specifics

What I really need to understand is how these pieces connect:
- How the KMS key grants decrypt permissions to the IAM role
- How S3 bucket policies enforce the MFA requirement when IAM roles try to access objects
- How CloudTrail sends its logs to S3 while using a different KMS key for audit separation
- How lifecycle policies move data between storage classes without breaking encryption

## A few other things

If you could add some comments explaining why certain security settings are important, that would be great. I might need to explain this to others later.

Also, good resource names and maybe some tags for tracking costs would be helpful.

Thanks! Just want to make sure we're building something secure that won't cause problems down the road.