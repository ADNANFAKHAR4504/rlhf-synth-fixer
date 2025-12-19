# Building a Secure AWS Web App Infrastructure

Hey there! I need your help creating a rock-solid AWS environment for hosting a web application. Think of this as building a digital fortress - we want it secure, but also practical for real-world use.

## What We're Building

We're setting up an AWS environment using Terraform that can safely host a web application. The goal is to make it secure enough for production use while keeping it maintainable and scalable.

## What I Need From You

### Let's Start with the Basics
Write everything in Terraform HCL - I want to keep this infrastructure as code so we can track changes and deploy consistently across environments. Keep all the resource names unique so that they wont conflict.

### Keep Our Data Safe
Here's where security gets serious:
- Set up KMS encryption for any S3 buckets we create. No plain text data sitting around!
- Make sure everything talks to each other using encrypted connections. If data is moving between services, it needs to be encrypted in transit.

### Lock Down Access (But Don't Go Overboard)
I'm a big believer in "least privilege" - give people and services just enough access to do their job, nothing more:
- Create IAM roles and policies that are tight but functional
- Think about what each component actually needs to access and limit it to just that

### Network Security That Makes Sense
- Set up security groups that only allow HTTPS traffic on port 443
- Block everything else - if we don't need it, we shouldn't allow it

### Keep an Eye on Things
Set up CloudWatch alarms so we know if something fishy is happening:
- Alert on unauthorized access attempts
- Watch for IAM policy violations
- Basically, if someone's trying to do something they shouldn't, we want to know about it

## What I'm Looking For

When you're done, I should have:
- Clean, well-commented Terraform file that any developer can understand
- All the security measures working properly
- Something that would pass a security audit
- Code that's organized and easy to maintain

Think of this as production-ready infrastructure that a real company would use. Security is important, but so is practicality. Make it secure without making it impossible to work with!

Let me know if you have any questions as you work through this!

Things to consider: I already have a provider.tf file so dont include providers block in the stack. Dont use random id's use prefix 274802 for resource names