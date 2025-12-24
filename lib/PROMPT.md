# Functional scope

Produce a single CloudFormation YAML template named CloudEnvStack.yml that provisions a brand-new, production-grade Amazon Aurora MySQL cluster and all supporting resources from scratch. No references to pre-existing subnets, security groups, parameter groups, or topics - declare and create everything required inside this one template with parameters, resources, and outputs. The template must be directly deployable with AWS CLI 2.x.

# Technical requirements

1. Aurora MySQL cluster and topology

The template creates an Aurora MySQL cluster compatible with the organization's current 5.7 family with EngineMode set to provisioned. The cluster has 1 writer and 2 readers using db.r5.2xlarge instances. Instances are spread across 3 AZs in us-east-1 by creating a SubnetGroup with three private subnets in three distinct AZs. A dedicated Security Group allows inbound MySQL traffic only from an application tier security group that the template also creates, with no public access from 0.0.0.0/0. The cluster has Performance Insights enabled with 7-day retention, Aurora Backtrack enabled with 72-hour retention, and automated backups with 7-day retention. The Aurora-specific reader endpoint is exposed in outputs for read traffic distribution.

2. Parameter tuning at cluster level

Create an AWS::RDS::DBClusterParameterGroup for Aurora MySQL with max_connections set to 16000, innodb_buffer_pool_size set to 75% of instance memory, and query_cache_size set to 268435456 bytes for 256MB. Include any supporting parameters needed to make the above valid for the specified Aurora MySQL version. Do not apply parameters that are unsupported - instead, document fallbacks inline with YAML comments and pick the nearest valid equivalents.

3. Secrets and rotation

The master user password is stored in AWS Secrets Manager and randomly generated. Automatic rotation is enabled every 30 days using a rotation Lambda function along with appropriate IAM roles and policies that are all created in this template. The secret is wired into the cluster via MasterUsername and MasterUserPassword using the resolve:secretsmanager syntax. The Lambda function connects to Secrets Manager to retrieve and update credentials, then connects to the Aurora cluster to rotate the password, and finally stores the updated credentials back in Secrets Manager.

4. Monitoring and alerting

Create 5 CloudWatch Alarms with proactive thresholds. CPUUtilization alarm triggers when usage exceeds 80% over 5 minutes for each DB instance. DatabaseConnections alarm triggers when connections exceed 14000 over 5 minutes at the cluster level. ReadLatency alarm triggers when latency exceeds 0.2 seconds at the instance level. WriteLatency alarm triggers when latency exceeds 0.2 seconds at the instance level. AuroraReplicaLagMaximum alarm triggers when replication lag exceeds 1 second at the cluster level. Create an SNS Topic for notifications with an email subscription that uses a parameterized email address. All alarms send notifications to this SNS topic when they trigger.

5. Tagging and naming

Apply these mandatory cost allocation tags to all resources: Environment=Production, Team=Platform, Service=Trading. All logical names and physical identifiers must suffix with the EnvironmentSuffix parameter value as defined in the Constraints section below.

6. Resiliency and safe updates

Use DeletionPolicy: Snapshot and UpdateReplacePolicy: Snapshot on cluster and instances. Structure dependencies and references so updates prefer in-place changes. Where replacement may be required, the policies above protect data. Include optional support for RDS Blue/Green Deployments if available for the chosen engine version by creating the Blue/Green resource gated behind a parameter toggle with sane defaults.

# Constraints and conventions

The file format is pure YAML with no JSON. Use CloudFormation YAML intrinsic functions like !Ref, !Sub, !GetAtt, !If. Define a parameter EnvironmentSuffix with a safe regex and no hard AllowedValues. Use AllowedPattern with the regex pattern for lowercase letters, digits, and hyphens in kebab-case format. Add a ConstraintDescription explaining to use lowercase letters, digits, and hyphens. No hard-coded ARNs or IDs are allowed - every cross-resource reference must use !Ref or !GetAtt. The region defaults to us-east-1 where relevant. Do not hard-code AZ names - discover them with Fn::GetAZs and pick the first three. For security, use no public subnets, block public access to the DB, and apply least-privilege IAM for rotation Lambda and metrics/alarms. Add cluster-level parameters for connection handling as comments plus settings where valid like thread handling while ensuring engine compatibility.

# Deliverable

Return only the complete CloudEnvStack.yml contents, starting at the first line of YAML. Do not include explanations outside YAML. The template must include:

Metadata section with cfn-lint regional config.

Parameters section including EnvironmentSuffix, AlarmEmail, VPC CIDR, DB name, username, backup and backtrack windows, with sane defaults and the regex constraint described above.

Mappings and Conditions sections as needed for AZ selection and optional Blue/Green toggle.

Resources section containing:
- VPC, three private subnets across three AZs, route tables, and VPC endpoint set minimally required for Secrets Manager and CloudWatch using Interface endpoints
- Security Groups for DB and application tier
- RDS Subnet Group
- DB Cluster Parameter Group with required settings from Technical requirements
- Secrets Manager secret connected to rotation Lambda with IAM roles and policies plus rotation schedule set to 30 days
- Aurora DB Cluster with backtrack, backups, Performance Insights, and KMS encryption enabled
- Three DB Instances with 1 writer and 2 readers of class db.r5.2xlarge, spread across the three subnets and AZs
- SNS Topic connected to Email Subscription for alarm notifications
- Five CloudWatch Alarms for CPU, connections, read latency, write latency, and replica lag with correct Dimensions for cluster and instances
- Optional AWS::RDS::BlueGreenDeployment governed by a parameter toggle with default off and documented with YAML comments

Outputs section with all outputs Export-ready, including:
- ClusterArn, ClusterIdentifier, WriterEndpoint, ReaderEndpoint, EngineVersion
- DBInstanceArns as list or individual entries, SubnetGroupName
- SecretArn, RotationEnabled
- SnsTopicArn
- AlarmArns for each of the five alarms
- SecurityGroupIds for DB and App, VpcId, PrivateSubnetIds

# Implementation notes

Every Name or identifier property that allows a string must include the EnvironmentSuffix via !Sub. Alarms must reference the correct RDS Aurora metrics namespaces and dimensions. For instances use AWS/RDS namespace with DBInstanceIdentifier dimension. For cluster-level metrics use AWS/RDS namespace with DBClusterIdentifier dimension. For parameters that may be engine-incompatible like query_cache_size or innodb_buffer_pool_size, include guardrails. Prefer valid Aurora-specific parameters. If an exact parameter is not supported, include a commented rationale and set the closest valid alternative while keeping the requested intent for high-throughput OLTP. Use KMS encryption for the cluster and the Secrets Manager secret by creating a CMK in the template with least-privilege key policy. Ensure the reader endpoint is exported from the cluster outputs as the standard Aurora reader endpoint, and document the DNS in a YAML comment. Ensure zero-downtime posture via snapshot policies and instance distribution so readers continue serving while writer updates occur.

# Quality gates

Pass cfn-lint with region us-east-1. No hardcoded AZ names - use Fn::GetAZs. No hard AllowedValues for EnvironmentSuffix - enforce the regex constraint instead. All inter-resource references via !Ref and !GetAtt with no opaque strings. All resources carry the tags Environment=Production, Team=Platform, Service=Trading. Include DeletionPolicy and UpdateReplacePolicy where data loss is possible at minimum on cluster, instances, secrets, and KMS key.

# Outputs list

Provide Outputs for ClusterArn, ClusterIdentifier, WriterEndpoint, ReaderEndpoint, EngineVersion, DBInstanceWriterArn, DBInstanceReader1Arn, DBInstanceReader2Arn, SecretArn, RotationScheduleArn, SnsTopicArn, AlarmCpuArn, AlarmConnectionsArn, AlarmReadLatencyArn, AlarmWriteLatencyArn, AlarmReplicaLagArn, VpcId, DbSecurityGroupId, AppSecurityGroupId, DbSubnetGroupName, PrivateSubnetIds.

# Style and formatting

Use human-authored tone with no conversational opening. Clear YAML comments explaining any unavoidable engine or version nuances. Consistent indentation with 2 spaces, kebab-case for names, and !Sub for string interpolation with EnvironmentSuffix.

Return only the CloudEnvStack.yml CloudFormation YAML, nothing else.
