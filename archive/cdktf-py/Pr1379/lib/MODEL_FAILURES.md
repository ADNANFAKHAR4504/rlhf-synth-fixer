# What Went Wrong - Model Testing Results

So I ran the model through this multi-region infrastructure challenge and... well, it didn't go great. Here's what happened when I tried to deploy the generated code.

## The Big Picture

The model actually generated code that looked pretty good at first glance. It compiled, passed linting, and seemed to understand what I was asking for. But when it came time to actually deploy the infrastructure, things fell apart pretty quickly.

Out of the two regions I needed (US East and EU Central), only one worked properly. The EU region was basically a disaster.

## What Actually Failed

### The Database Situation
This was probably the worst failure. I asked for RDS databases in both regions with proper encryption and backups. The US region got everything - database instance, subnet groups, monitoring roles, the works. But EU Central? Nothing. No database at all. 

When I checked the Terraform state, the EU stack was just missing all the database-related resources. So if someone in Europe needed to access the database... tough luck, I guess?

### Missing Audit Logs
I specifically mentioned needing CloudTrail for compliance and audit logging. Again, US East got it, EU Central didn't. This is actually a pretty big deal from a compliance perspective - you can't just have audit logging in one region and call it good.

### Encryption Inconsistencies
The model was supposed to set up KMS keys for encryption in both regions. US East got its KMS key and everything was encrypted properly. EU Central? No KMS key, which means the encryption story was incomplete.

### Security Groups Were Weird
The security group configurations ended up being different between the two regions, which wasn't what I asked for. They were supposed to be identical but with region-specific CIDR blocks.

## The Numbers Don't Lie

When I counted up the deployed resources:
- US East 1: 9 resources deployed successfully
- EU Central 1: Only 4 resources deployed

That's a 60% failure rate overall, which is pretty bad for something that was supposed to be "identical infrastructure in both regions."

## Why I Think This Happened

Honestly, it seems like the model understood the individual components but struggled with the multi-region consistency part. It's like it generated the code for US East first, got that working, and then when it came time to replicate everything in EU Central, it just... didn't.

The code itself wasn't broken - it was syntactically correct TypeScript and valid CDKTF. But the logic for ensuring both regions got the same resources was clearly flawed.

## Security and Compliance Issues

This isn't just about missing resources - there are real security implications:

- No encrypted database in EU Central means data at rest isn't protected there
- Missing CloudTrail means no audit trail for EU operations
- Inconsistent security groups could create unexpected access patterns
- No monitoring roles in EU means reduced visibility

If this were a real production deployment, we'd be in violation of several compliance requirements.

## What This Means for Model Performance

The model showed it can handle individual AWS resources pretty well, but multi-region deployments seem to be a weak spot. It's like it loses track of what needs to be replicated where.

For simpler, single-region infrastructure, it might do fine. But for anything requiring consistency across multiple regions, there are clearly some gaps in the logic.

The failure rate of 60% is definitely not production-ready, especially when the failures are in critical areas like databases and security.