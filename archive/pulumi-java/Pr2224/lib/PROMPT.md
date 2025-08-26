## Building a Super Secure App with Pulumi Java

Hey, we need your help to build a really secure AWS environment for one of our financial services apps. We're going to use Pulumi with Java for this. The main goal is to make sure everything is safe and follows all our compliance rules.

We're putting all this infrastructure in the `us-east-1` region. It'll include things like IAM roles, CloudTrail, KMS, a VPC, `t3.micro` EC2 instances, and CloudWatch for monitoring and alarms.

Here's the detailed list of what we need:

- **Region:** Everything should be deployed in the `us-east-1` region.
- **Encryption:** All data that's just sitting there (at rest) needs to be encrypted using **AWS KMS keys**.
- **Access Control:** Use **IAM roles** for all access. Absolutely no root credentials should be used.
- **Network Isolation:** Set up a **Virtual Private Cloud (VPC)** and put our application in a private subnet within it. This keeps it isolated.
- **EC2 Instances:** Launch **`t3.micro` EC2 instances** inside this VPC.
- **S3 Read-Only:** Attach an IAM policy to these EC2 instances that gives them _only read-only access_ to a specific S3 bucket.
- **Secure Communications:** Make sure all network traffic uses **SSL/TLS** to keep data safe while it's moving.
- **Detailed Monitoring:** Turn on **detailed monitoring** for all our EC2 instances.
- **CPU Alerts:** Set up **CloudWatch alarms** to watch CPU utilization. If the CPU goes above 70%, it should send a notification to an SNS topic.
- **API Logging:** Get **CloudTrail logging** running to record every API call made in our AWS account.

When you're naming resources, please make sure they're unique. Maybe add a little bit of randomness to the names to help with that. Also, ensure your code doesn't have any linting errors and that it follows all our security standards.

What we need back is the working Pulumi Java code that sets all this up.

my directory looks like this
└── src
└── main
└── java
└── app
└── Main.java
and in the project root Pulumi.yaml
