We’ve got to put together a secure AWS setup using **CDKTF with TypeScript**. Everything will live in `us-east-1` under an AWS Organizations account. The idea is to keep the design solid on security and compliance, but also simple enough to maintain and expand later. All of this should sit in one monolithic file (no scattered modules) so it’s easier to track for now.

Here’s what I want to make sure gets covered in the build:

- Storage needs to be locked down. That means S3 buckets, EBS volumes, and RDS storage all have encryption at rest enabled by default. No exceptions.
- Anything that runs compute (EC2s and Lambdas) should have IAM roles attached. And those roles shouldn’t be overpowered—just the minimum permissions needed for them to do their job.
- Logs from across AWS services should all flow into one central S3 bucket. That bucket also needs a lifecycle policy so we don’t hoard logs forever.
- For networking, databases have to sit in private subnets only. No direct public access—apps can talk to them, but the outside world can’t.
- SSH access to servers has to be limited to a specific IP range. Absolutely no open 0.0.0.0/0 rules.
- RDS should have automatic backups on and be restorable if something goes wrong.
- CloudWatch should be wired up for the usual key service metrics, with alarms that actually alert when something’s out of line.

The deliverable here is a working **CDKTF + TypeScript codebase** that builds all of this, validates cleanly, and sticks to AWS best practices. Parameter Store or Secrets Manager should be used anywhere we’re dealing with sensitive values like DB creds or IP ranges.

And just to call out the hard rules we can’t skip: encryption across the board (S3, EBS, RDS), IAM roles on all compute, centralized logging with retention, databases only in private subnets, SSH restricted to the right IPs, and backups/restores enabled on RDS.
