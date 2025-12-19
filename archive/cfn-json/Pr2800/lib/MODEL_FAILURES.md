Observations

Stack status: ROLLBACK_COMPLETE

CloudFormation Events indicate one or more resources failed to create, triggering a rollback of the entire stack.

Example error message(s) (as seen in the CloudFormation console):

(Insert specific error here, e.g., "Resource creation failed: NAT Gateway creation failed - Elastic IP not available" or "Route Table Association failed - Subnet ID not found")

Possible Causes

Dependency ordering issues, such as:

Attempting to associate route tables before corresponding subnets or gateways exist

NAT Gateway creation before the Elastic IP is allocated or attached

Parameter mismatches or missing values (e.g., missing AZ mappings)

Resource availability:

No Elastic IPs available in the region

AZs specified are not available in the current region

IAM permission issues:

Insufficient privileges to create network components like NAT Gateway or Elastic IPs

Timeouts or AWS service limits