# FedRAMP Data Processing Pipeline (Pulumi Go)

Our federal program office needs a Pulumi (Go) stack that stands up the secure data pipeline described in the master prompt. Re-state the business context in your own words (PII ingestion via API Gateway, streaming through Kinesis, containerized processing on ECS/Fargate, and durable storage in an encrypted PostgreSQL RDS instance). Highlight the FedRAMP Moderate controls we must satisfy: encryption at rest/in transit with customer-managed KMS keys, audited access, least-privilege IAM, and fully private networking for stateful services.

Spell out the minimum infrastructure components you expect the solution to contain, including:
- VPC layout (public subnets for the NAT/Amazon-managed endpoints, private subnets for ECS and RDS, route tables, and a single NAT gateway for egress)
- Security groups and networking rules that keep RDS private and allow only the necessary flows (API Gateway → ECS → RDS)
- KMS key usage patterns (who needs grants, rotation requirements, and log encryption considerations)
- Secret management expectations (Secrets Manager, no inline credentials)
- Observability requirements (CloudWatch logs, API Gateway access logging, ECS Container Insights)

Close with any non-negotiable conventions the Pulumi program must follow (naming tied to `project`/`stack`, destroyable resources for CI/CD, tagging, and unit/integration test expectations). Keep the voice natural, as if you were writing the ticket for an experienced cloud engineer on our team. No boilerplate or AI tells—just the facts we would communicate internally.
