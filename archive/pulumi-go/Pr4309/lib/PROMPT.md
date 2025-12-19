# FedRAMP Data Pipeline – Pulumi Go Build Brief

We’re standing up the production-grade Pulumi Go stack for the FedRAMP Moderate data pipeline project. Please capture the work request in plain language for the engineering channel:

1. Start with a short recap of the mission: PII enters through API Gateway, flows across Kinesis, gets processed on ECS Fargate, and lands in an encrypted PostgreSQL RDS instance. Call out the compliance bar (FedRAMP Moderate) so nobody misses the security context.
2. List the infrastructure building blocks we expect to see in the stack. At a minimum cover networking (VPC, subnets, NAT), security groups, the customer-managed KMS key, Secrets Manager usage, observability/logging expectations, and the IAM roles that glue everything together.
3. Close with the handful of “don’t break these” conventions we already agreed on: naming based on Pulumi project/stack, tagging requirements, destroy behaviour for non-prod, and the expectation that unit + integration tests ship with the change.

Write this the way we normally brief senior engineers—direct, specific, and free of AI-sounding filler.
