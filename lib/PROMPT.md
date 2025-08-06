You are a Terraform CDK (CDKTF) expert using TypeScript.

Goal: Generate CDKTF TypeScript code for a reproducible AWS infrastructure based on the following requirements. The generated code must be structured cleanly into just two files:

lib/tap-stack.ts — the main stack definition that instantiates and wires up the resources

lib/modules.ts — all resource definitions must be encapsulated modularly here as reusable classes or functions

🌩️ Problem Statement
Set up a basic cloud environment in AWS using Terraform CDK for TypeScript with the following:

☁️ Provider Setup
Use AWS as the provider

Deploy everything in us-east-1

🌐 Networking
Create a VPC with CIDR block 10.0.0.0/16, name: iacProject-vpc

Create 2 public subnets, one in each availability zone (e.g., us-east-1a, us-east-1b), named with iacProject- prefix

Create and attach an Internet Gateway

Create a Route Table:

Associate it with the public subnets

Add route 0.0.0.0/0 through the Internet Gateway

🖥️ Compute
Launch 2 EC2 instances, one in each public subnet:

Use Amazon Linux 2 AMI

Name them with the iacProject- prefix

Each instance should have:

An Elastic IP, allocated and associated

Attached to a Security Group

🔒 Security Group
One SG to be reused for both instances

Allow inbound SSH (22) and HTTP (80) traffic

Restrict access to IP range 203.0.113.0/24

📦 Project Structure
Organize the project as:

pgsql
Copy
Edit
cdktf.json
main.ts
lib/
├── tap-stack.ts      <-- Stack that wires all modules together
└── modules.ts        <-- Resource definitions encapsulated as reusable classes/functions
Prefix all resource names with iacProject-

Do not use Terraform Registry modules or .gen packages

Follow best practices for reusable, typed CDKTF code in TypeScript

Ensure proper separation of responsibilities: resource definitions in modules.ts, orchestration in tap-stack.ts

✅ Output only the full contents of these two files:

lib/tap-stack.ts

lib/modules.ts