# Model Failures 

- **Hard-coded database configuration** – The stack pins the RDS instance class, storage size, username, and password, violating the requirement to parameterize and supply these securely at deploy time.
- **Lambda packaging not parameterized** – The Lambda handler is inlined in the stack, ignoring the `lambdaCodePath` input that should let teams package their own artifact.
- **Resource naming convention broken** – Subnets and related network resources keep generic names like `PublicSubnet` and `PrivateSubnet`, instead of using the required `app-purpose-environment-stringSuffix` format.
- **Missing environment tags on network constructs** – Subnets (and the NAT gateway they imply) are created without the mandated `'Environment':'Development'` tag, so tagging compliance is incomplete.
- **Configuration hardwired in app entry point** – The CDK app hard-codes stack inputs such as suffix, VPC CIDR, Lambda settings, and RDS sizing rather than exposing them as deploy-time parameters.
- **Overly broad S3 permissions** – The Lambda IAM role attaches the global `AmazonS3ReadOnlyAccess` policy, granting account-wide S3 read access instead of scoping permissions to the specific trigger bucket.
