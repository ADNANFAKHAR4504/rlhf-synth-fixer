## Hey, need help with a CloudFormation template

I'm working on a CloudFormation template for our company's data storage, and I want to make sure we're doing the security stuff right. We've had some issues before with S3 buckets being too open, and my manager wants me to create something more secure.

## What I need to build

Basically, I need a YAML CloudFormation template that sets up secure storage for sensitive data. Nothing too fancy, but it needs to check all the security boxes so we don't get in trouble with compliance.

## The requirements I have to meet

**Storage security:**
- All S3 buckets need encryption turned on (AES-256)
- Use KMS for managing the encryption keys
- Make sure nothing is accidentally public

**Access control:**
- IAM roles that only give people the permissions they actually need
- Anyone handling sensitive data needs to use MFA
- Keep policies tight but not so tight they break things

**Monitoring:**
- CloudTrail should log when people access our S3 buckets
- Need this for audits and to see what's happening

**Cost savings:**
- Move old data (30+ days) to Glacier automatically
- Still need to be able to get to it when needed

## What I'm looking for

Just a straightforward CloudFormation template in YAML that:
- Actually works when I deploy it
- Has the basic sections (parameters, resources, outputs)
- Includes comments so I can understand what's happening
- Can be used in different environments (dev, test, prod)

I'm not looking for anything overly complex - just want to get the security right and make sure it's maintainable. The template will get tested before we use it for real, so it needs to actually deploy without errors.

## A few other things

If you could add some comments explaining why certain security settings are important, that would be great. I might need to explain this to others later.

Also, good resource names and maybe some tags for tracking costs would be helpful.

Thanks! Just want to make sure we're building something secure that won't cause problems down the road.