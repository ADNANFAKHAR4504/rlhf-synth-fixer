## Setting Up AWS Security for Our App

Hey, we need to create a full AWS security setup using CloudFormation. This is for our app, which is going into the North Virginia region (that's `us-east-1` in AWS speak). We'll be using the default VPC for this, so just grab that ID.

Here's the rundown of what all needs to be in this setup:

- **Security Groups**: The main thing is to make sure our security group for the app only lets in traffic on port 443 (HTTPS).
- **S3 Access**: We need an IAM policy that gives _only read access_ to an S3 bucket.
- **Database Encryption**: For our RDS database, make sure all the data that's just sitting there is encrypted using AWS KMS.
- **S3 Traffic**: Route all access to S3 through a VPC endpoint. We want to keep that traffic off the public internet.
- **Auditing**: Turn on CloudTrail logging so we can audit everything happening in our account.
- **Network Rules**: Set up a Network ACL to block pretty much all incoming and outgoing traffic, except for the stuff that's absolutely essential.
- **Compliance Checks**: Use AWS Config rules to constantly check if our security settings are up to scratch.
- **Threat Detection**: Get GuardDuty running for continuous monitoring of our AWS account for any weird activity.
- **Web Protection**: Implement AWS WAF to protect our applications from common web attacks.
- **Secure Data Transfer**: Make sure all data transfers are encrypted using at least TLS 1.2.
- **App Resilience**: Deploy an Auto Scaling group for our application. This helps it stay online even if things go wrong.
- **Monitoring**: Set up CloudWatch monitoring for all our important resources.
- **Improvements**: Configure Trusted Advisor to regularly look for ways to improve our security.

Remember to make sure all the resource names are unique, maybe add a little random bit to them. And please, no linting errors, and everything has to meet those strict security standards.

What we need back is a CloudFormation template in YAML. It should have all these components correctly set up and integrated. We'll check it to make sure the syntax is good and that it actually does everything we've asked for.
