# Infrastructure Requirements for Web App

We're building out a new web application and need some solid infrastructure behind it. Here's what we're thinking for the CloudFormation setup.

## What we need

Building a production web app that can handle real traffic. Need something reliable that won't fall over when we actually launch this thing.

The plan is to use CloudFormation YAML since that's what the rest of the team knows. Should be something we can actually deploy without too much headache.

## Regional stuff

Everything goes in us-west-2 - that's where our other infrastructure lives anyway so makes sense to keep it all together.

## Network architecture

For networking we want:
- New VPC (don't want to mess with the existing one)
- Both public and private subnets - web stuff in private for security
- NAT gateways so private subnets can still get out to the internet for updates and whatnot
- Load balancer sitting in front of everything so users never hit the servers directly

## Database requirements  

Database needs to be solid:
- RDS instance with encryption turned on (compliance requirement, can't negotiate on this one)
- Should probably be MySQL since that's what the app is built for
- Multi-AZ would be good for availability

## S3 and permissions

Need an S3 bucket for storing application assets, logs, maybe some user uploads later.

For permissions - use IAM roles for everything. No hardcoded keys anywhere, learned that lesson the hard way on the last project. Keep it least privilege, only give access to what's actually needed.

## Security considerations

Security is important:
- Encryption at rest for database
- Security groups that actually make sense
- No unnecessary ports open
- Follow the usual AWS security best practices

## Documentation

Please add comments in the CloudFormation template so we can understand what's going on 6 months from now when something breaks at 2am. Explain not just what each resource does but why we made certain configuration choices.

## What we want

Single CloudFormation YAML file that:
- Validates properly (no syntax errors or missing references)
- Actually deploys without errors
- Sets up everything we need for the web app
- Can be torn down cleanly for testing

This is going to be our production infrastructure so it needs to work reliably. We'll be running multiple environments (dev, staging, prod) so keep that in mind.