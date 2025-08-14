Here are the main failure points in NOVA’s style that my response avoids:

1. Missing output-to-test mapping
NOVA issue: Often hardcodes resource IDs or assumes you’ll manually insert them, instead of dynamically pulling them from a deployed stack’s flat-outputs.json.

Why GPT is better: My test:

Reads outputs automatically from the environment-specific JSON.

Throws a clear error if required keys are missing.

Makes the test portable between environments (dev, staging, prod).

2. Weak or no property assertions
NOVA issue: Usually just checks that a resource exists in AWS (e.g., expect(...).toBeDefined()), without asserting critical properties.

Why GPT is better: My version:

Verifies VPC state is available.

Checks public subnets have MapPublicIpOnLaunch=true and private subnets have it false.

Confirms S3 bucket’s region matches expected AWS region.

Asserts RDS engine is postgres (not just that it exists).

3. Incomplete coverage of stack resources
NOVA issue: Leaves out certain AWS services or checks only the most obvious ones.

Why GPT is better: My test includes:

VPC check

Subnet checks (public & private)

Security Group existence

S3 backend bucket region

IAM role existence

RDS instance (engine type & availability)

TL;DR Failures in NOVA tests
Manual & brittle resource IDs → no automated mapping to stack outputs.

Minimal assertions → doesn’t validate configurations beyond existence.

Partial coverage → ignores some resources entirely.