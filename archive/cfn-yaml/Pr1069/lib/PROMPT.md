Goal: Produce a single, production-ready CloudFormation template in pure YAML (no JSON, no prose) that implements automated failover between a primary and a standby EC2 instance using Amazon Route 53 health checks.
Project Name: IaC - AWS Nova Model Breaking

Strict requirements:

Create a VPC with two public subnets in different AZs (use !GetAZs and !Select).

Launch two EC2 instances (Amazon Linux), one per subnet: PrimaryInstance and StandbyInstance.

Attach Security Group allowing HTTP (80) from anywhere and SSH (22) from a parameter CIDR.

Allocate and associate one Elastic IP per instance.

Create a Route 53 HealthCheck that checks the primary EIP over HTTP :80 and resource path (parameter, default /).

Create two A records in Route 53 (same name), Failover routing:

PRIMARY points to the primary EIP and references the HealthCheck

SECONDARY points to the standby EIP

Automated failover & failback must occur solely via Route 53 health status.

Parameters must include at least: HostedZoneId, RecordName, InstanceType, KeyName (optional), AllowedSSHCidr, HealthCheckPort (default 80), HealthCheckPath (default /), LatestAmiId as an SSM Parameter of type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> defaulting to /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64.

Add Tags (e.g., Project=IaC - AWS Nova Model Breaking, Role=Primary/Standby).

Include Outputs for instance IDs and EIPs and the full DNS name.

The template must validate with cfn-lint and avoid circular dependencies.

Use UserData to start a simple HTTP server on port 80 (e.g., install httpd and serve a minimal index.html identifying the instance).