## Context
You are an AWS CloudFormation expert tasked with creating secure infrastructure-as-code templates. This exercise focuses on implementing comprehensive security controls for sensitive data storage environments.

Hey there! I need help building a secure CloudFormation template for our company's sensitive data storage. We're getting more serious about security compliance and need something that really locks things down properly.

## What we need

I'm looking for a YAML CloudFormation template that can handle sensitive data storage with all the security bells and whistles. The compliance team has been breathing down our necks about this stuff, so it needs to be bulletproof.

### The security stuff that's non-negotiable:

**Encryption everywhere** - All our S3 buckets need to use AES-256 encryption. I want KMS managing the keys because that seems to be what everyone recommends. Everything should be encrypted at rest - no exceptions.

**IAM that actually makes sense** - I'm tired of seeing overly permissive policies. Let's do this right with least privilege access. Anyone touching sensitive data needs MFA enabled. I want policies that are restrictive but don't break functionality.

**Audit logging** - CloudTrail needs to track every single access to our S3 buckets. The auditors love their paper trails, and frankly, so do I when something goes wrong.

**Keep things private** - Nothing should be publicly accessible unless there's a really good reason. I've seen too many data breaches from misconfigured S3 buckets.

**Cost optimization** - Data that's older than 30 days should automatically move to Glacier. Storage costs add up fast, but we still need to keep everything accessible when needed.

## Technical requirements

- Must be in YAML format (I find it easier to read than JSON)
- Needs to pass CloudFormation validation 
- Should actually deploy without errors when we test it
- Has to work across multiple environments (dev, staging, prod)

## What the template should include

I need the usual CloudFormation sections - parameters for customization, resources for the actual infrastructure, and outputs so we can reference things later. 

For the security implementation, focus on:
- S3 buckets with proper encryption and access controls
- IAM roles and policies (with MFA where it makes sense)
- KMS key setup and management
- CloudTrail configuration for our audit requirements
- Lifecycle policies to manage costs
- Network security configurations

## Some other things to consider

It would be great if this could support cross-region replication for disaster recovery. We haven't had a major outage yet, but better safe than sorry.

Make sure to use good naming conventions and add comments where the security decisions might not be obvious. The next person who has to maintain this (probably me in 6 months) will thank you.

Also, proper resource tagging would be helpful for cost tracking and resource management.

## What success looks like

- Template deploys cleanly without any errors
- All the security requirements are actually implemented (not just checked off)
- Meets our compliance requirements 
- Code is readable and well-documented
- Works across different environments and regions

## Output format

Just give me a standard CloudFormation YAML template starting with the version declaration. Include a good description of what it does. Make sure all the required sections are there and that every security requirement is properly implemented with comments explaining the important decisions.

The template will get tested against AWS CloudFormation validation and deployed to make sure it actually works, so please double-check everything before submitting.