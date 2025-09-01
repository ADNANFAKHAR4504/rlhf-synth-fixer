# CI/CD Pipeline Setup - Terraform on AWS

Alright, so we're finally moving our deployment process to something more automated. Been doing manual deployments for way too long and it's driving everyone crazy. Management wants us to use Terraform (not CloudFormation - apparently that's the new hotness) to set up a proper CI/CD pipeline on AWS.

## The Problem

Right now our deployment process is... well, let's just say it involves a lot of SSH-ing into servers and crossing fingers. We've got a web app that needs proper automated deployment from GitHub all the way to production. Nothing too fancy, but it needs to be solid.

## What We Need

Looking for Terraform configs to set up a full CI/CD pipeline. Here's what the team has agreed on:

### Pipeline Setup

We're thinking CodePipeline for orchestration since we're already on AWS anyway. Need it to:
- Pull from our GitHub repo when someone pushes to main
- Run through the usual stages - grab code, build it, test it, deploy it
- Use CodeBuild for the testing part (we've got a decent test suite that actually catches bugs sometimes)

### Security Stuff (Because Compliance...)

Our security team is pretty strict about this stuff:
- IAM roles need to be locked down - nothing with * permissions please
- KMS encryption wherever possible (they're paranoid about data leaks)
- Secrets Manager for all the API keys and DB passwords we have floating around
- Parameter Store for config values that aren't super sensitive
- Oh, and we definitely need manual approval before anything hits production. Learned that one the hard way...

### Monitoring (So We Know When Things Break)

- CloudTrail for audit logs (compliance again)
- CloudWatch for actual monitoring - need to know when builds fail
- SNS notifications would be nice - maybe send to our Slack somehow?

### Other Requirements

- Multiple devs might push at the same time, so the pipeline needs to handle that gracefully
- Try to keep costs reasonable - we're not made of money here
- Elastic Beanstalk for deployment (it's what we know, don't judge)
- Quick rollback capability - when things go wrong at 3am, we need to fix it fast

### Where to Deploy

- us-east-1 (yeah yeah, everyone uses it, but our other stuff is there)
- Naming: prefix pipeline stuff with `ci-pipeline-` and Beanstalk envs with `beanstalk-env-`

## What I Need From You

Basically, working Terraform files that I can `terraform apply` and have this whole thing just work. Would be great if you could:

1. Split things into logical files (main.tf, iam.tf, etc.) - easier to review in PRs
2. Make it production-ready - we're going live with this
3. Add comments explaining the tricky parts
4. Use variables where it makes sense so we can reuse this for other projects

## Project Info

This is part of our "IaC - AWS Nova Model Breaking" initiative (don't ask about the name, some exec came up with it). We're expecting decent traffic once this goes live - nothing crazy, but enough that downtime would be noticed.

If you could explain why you're making certain choices (especially around security and costs), that'd be awesome. Also, some basic commands or steps to test that everything's working would really help - I'm not a Terraform expert yet.

Let me know if anything's unclear. Really need to get this working soon - the manual deployments are killing us!