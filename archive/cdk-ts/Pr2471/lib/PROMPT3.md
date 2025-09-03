The CDK synth command is failing because it cannot find the VPC with ID 'vpc-123abc'. This is a placeholder VPC ID that doesn't exist in the actual AWS account.

The error shows that CDK is trying to look up the VPC but can't find it. We're also getting warnings about missing route table IDs for the placeholder subnets 'subnet-123' and 'subnet-456'.

Since this is meant to be a configurable stack that uses existing VPC infrastructure, we need to either:

Use actual VPC and subnet IDs that exist in the target AWS account ex.. default vpc


The stack is trying to use `ec2.Vpc.fromLookup()` which requires the VPC to actually exist, but we're using placeholder values.
