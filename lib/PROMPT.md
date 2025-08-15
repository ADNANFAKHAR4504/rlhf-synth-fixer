# Setting up production infrastructure for our web app

Hey team, we need to get our production AWS environment ready for the new web application. This needs to be rock solid - high availability, locked down security, proper tagging, and something we can deploy reliably every time.

Here's what we're looking at building:

So first off, we need a VPC that spans at least 3 availability zones in us-west-2. The app needs to scale automatically when traffic hits, so we're talking ALB plus an Auto Scaling Group setup. Everything needs to be tagged with Environment = Production (compliance is breathing down our necks about this).

For storage, any S3 buckets we create need server access logging turned on. Security team is pretty adamant about this. We also need to make sure we're only allowing inbound traffic on the ports the application actually uses - probably 443 for HTTPS traffic, but let's make it configurable.

The code needs to work with Terraform 1.1.0 or newer since that's what we're standardizing on. For naming, let's stick with the "base-production" pattern we've been using.

What I'm expecting to get back is a complete Terraform setup that actually works - something that passes validate, plan, and apply without any errors. The usual file structure would be good: main.tf, variables.tf, outputs.tf, versions.tf, plus any modules you think make sense.

A few things to keep in mind while building this out:
- Break things into reusable modules where it makes sense (VPC, ASG, logging, tagging stuff)
- Use the aws_availability_zones data source so we don't have to hardcode AZ names
- ALB should go in public subnets, EC2 instances in private subnets (standard setup)
- For S3 logging, create a dedicated log bucket and hook up aws_s3_bucket_logging for the app buckets
- Security groups should be restrictive - only allow what we actually need
- Default tags should automatically inject Environment = Production
- Include a terraform.tfvars.example file so people know what to set
- Keep variables clean and well-documented

Also throw in a quick README explaining how to actually use this thing - init, plan, apply, the usual workflow.

Once you've got the code ready, just confirm that everything we talked about is actually implemented. We've been burned before by missing requirements, so let's double-check everything works as expected.