## Let's Build a Super Secure AWS Logging Setup with Terraform!

---

### What We're Trying to Do

Hey! So, we need to whip up some Terraform code to create a really secure place on AWS for all our logs. Think of it like a digital safe for our important security records.

---

### The Stuff We'll Be Using

Your Terraform setup should cover these things:

- **S3 Bucket for Logs**: We need an AWS S3 bucket that's just for storing logs. It's gotta be super secure, meaning logs are encrypted both when they're moving and when they're just sitting there.
- **IAM Roles**: We'll set up IAM roles and policies to make sure only the necessary folks (or services) can get to this S3 log bucket. It's all about "least privilege."
- **Preventing Overwrites**: Your Terraform code needs to be smart enough to check if that S3 bucket already exists. We don't want to accidentally erase old logs!
- **Versioning Everything**: We need to turn on versioning for all our resources. This way, if we make a mistake or need to go back to an older setup, it's easy.
- **Alerting System**: Set up something like AWS CloudWatch to yell at us (with alerts, of course) if anyone tries to sneak into our logs without permission.
- **MFA for Writers**: Anyone who can _write_ logs to this S3 bucket (like IAM users) needs to use multi-factor authentication (MFA). No simple passwords here!

---

### Quick Rules to Follow

Just a few quick things to remember while you're building this:

- Use an S3 bucket for logs, and make sure those logs are encrypted everywhere.
- Give IAM roles only the minimum access they need to the S3 bucket.
- Your Terraform code should check if the bucket exists so we don't overwrite anything.
- Turn on versioning for everything.
- Set up CloudWatch or something similar to alert us about bad access attempts.
- MFA is a must for anyone writing to that log bucket.

### Where This Fits In

Just so you know, this whole setup is for the `us-east-1` AWS region. We're also trying to follow all the AWS best practices for security and compliance. And for names, everything should start with `corpSec-`.

---

### What We Need from You

Just give us a complete Terraform config file (`.tf` file). It should work perfectly, run without errors, and actually set up everything we talked about when we apply it.

My directory structure is this

├── main.tf
├── MODEL_FAILURES.md
├── MODEL_RESPONSE.md
├── outputs.tf
├── PROMPT.md
├── provider.tf

What should be the contents of main.tf, provider.tf, and outputs.tf
