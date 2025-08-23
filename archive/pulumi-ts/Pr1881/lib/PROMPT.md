# Pulumi TapStack Infrastructure Requirements

I want to build a **secure multi-region Pulumi stack** in **TypeScript** with the following:

## General
- Should use `@pulumi/aws` and `@pulumi/pulumi`.
- Define a `TapStack` class extending `pulumi.ComponentResource`.
- Accept `tags` as input for resource tagging.
- Deploy across **3 regions**: `us-east-1`, `us-west-2`, `eu-central-1`.
- All resources should include tags with `Environment: Production` and a `Name`.

## Networking
- Create a **VPC** in each region with CIDR `10.0.0.0/16`.
- Enable DNS support and hostnames.
- Create **2 private subnets** per region (`10.0.1.0/24` and `10.0.2.0/24`).
- Attach an **Internet Gateway** to each VPC.
- Configure a **Route Table** with a default route `0.0.0.0/0` pointing to the IGW.
- Associate subnets with the Route Table.

## Security
- Create a **Security Group** per region with:
  - Ingress: 
    - TCP 443 from within VPC CIDR (`10.0.0.0/16`).
    - TCP 22 only from admin subnet (`10.0.0.0/24`).
  - Egress: allow all outbound traffic.
- Create a **KMS Key** with rotation enabled, deletion window 30 days.
  - Must allow IAM root of the account.
  - Must allow **CloudWatch Logs** service to use it.
  - (No CloudTrail-specific permissions, since CloudTrail is excluded.)
- Create a **KMS Alias** for the key.

## API Gateway
- Create an **IAM Role** for API Gateway with least privilege.
- Attach the policy `AmazonAPIGatewayPushToCloudWatchLogs`.
- Create a **VPC Endpoint** for API Gateway (`execute-api`) restricted to the Security Group and Subnets.
- Create a **Private API Gateway** restricted to the VPC Endpoint.

## Monitoring
- Create a **CloudWatch Log Group** for API Gateway:
  - Name: `/aws/apigateway/<prefix>`
  - Retention: 90 days
  - Encrypted with the KMS Key.

## Storage
- Create an **S3 Bucket** in each region:
  - Name format: `<prefix>-secure-bucket`
  - Force destroy enabled
  - Server-side encryption with KMS key
  - Block all public access
  - Add a bucket policy to enforce **secure transport only (HTTPS)**.

## IAM Policy
- In `us-east-1` only, configure an **Account Password Policy** with:
  - Min length: 14
  - Require symbols, numbers, uppercase, lowercase
  - Prevent reuse of last 5 passwords
  - Max password age: 90 days
  - Hard expiry enabled

## Outputs
- Export all created resources in `registerOutputs`.

## Explicitly Excluded
- **No CloudTrail** resources (Trail, S3 bucket policy for CloudTrail, or KMS permissions for CloudTrail).
