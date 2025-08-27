# Secure AWS Infrastructure with CDK Java

Hey there! I need some help setting up a secure AWS environment using CDK with Java. This is for a project where security is absolutely critical, so I want to make sure we get everything right.

## What I'm Looking For

I need to build a secure AWS infrastructure that handles the basics but does them really well. Here's what I have in mind:

**Region Setup**: Everything needs to go in `us-west-2` - no exceptions. This is a hard requirement for compliance reasons.

**IAM Security**: I want to be really strict about permissions. The IAM roles should only have the absolute minimum permissions needed - no more, no less. Think of it as "least privilege" taken seriously.

**Network Security**: For SSH access, I only want to allow connections on port 22, and only from a specific IP range that I'll define. No open doors here.

**S3 Security**: The S3 bucket needs to be locked down tight. I want server-side encryption enabled, access logging turned on, and absolutely no public access. This is where we'll store sensitive data.

**Resource Connections**: All the pieces need to work together properly. IAM roles should be attached to EC2 instances, logging buckets should be referenced correctly, that kind of thing.

## The Deliverable

I need a complete CDK application written in Java that I can actually deploy. It should be in a single file to keep things simple, but it needs to be production-ready. The code should compile and deploy without issues using `cdk deploy`.

I also want good comments throughout the code explaining the security choices we made. This isn't just for me - other developers will need to understand why we configured things the way we did.

## Why This Matters

This isn't just a learning exercise. This infrastructure will be handling real data and real users, so security can't be an afterthought. I need to be confident that we've covered all the bases and followed AWS best practices.

The implementation should be straightforward enough that someone else could pick it up and understand what's happening, but secure enough that I'd feel comfortable putting it in front of a security audit.

Can you help me build this out? I want to make sure we get the security configuration right from the start.