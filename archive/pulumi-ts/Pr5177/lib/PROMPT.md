Hi there! I work at a law firm and we're dealing with a pretty big challenge. We handle around 10,000 documents every single day - contracts, case files, legal briefs, you name it. Right now our document storage is kind of a mess and we really need to get our act together, especially with all the compliance requirements we have to meet.

Here's what we're thinking: we need a cloud storage solution that can handle all these documents but also keep track of different versions (lawyers are always making revisions!). The tricky part is we have to keep everything for at least 90 days due to legal requirements, and after that we can probably archive or delete older versions to save on costs.

Security is huge for us - we're dealing with sensitive client information, so everything needs to be encrypted. Our compliance team also wants detailed logs of who accessed what and when. And of course, we need some way to monitor if the system is working properly and alert us if anything goes wrong.

I've heard Pulumi with TypeScript might be a good fit for this kind of infrastructure setup.
From what I can gather, we'd probably need:
- S3 for storage with versioning enabled 
- Some kind of lifecycle policies to automatically handle the 90-day thing without me having to babysit it
- KMS for encryption 
- CloudTrail for audit logs 
- CloudWatch for monitoring and alerts
- IAM roles to control access

