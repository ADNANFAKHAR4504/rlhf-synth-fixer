# Model Response Failures Compared to Ideal Response

## Parameter Defaults and Types
- `ProjectName` is missing a default value in MODEL_RESPONSE.md.
- `InstanceType` default is `t3.micro` in MODEL_RESPONSE.md but `t2.micro` in IDEAL_RESPONSE.md.
- `AMI` parameter is present in MODEL_RESPONSE.md but not in IDEAL_RESPONSE.md (and is not used in resources).
- `MODEL_RESPONSE.md` is missing the `Region` tag in VPC resources.


## Resource Coverage
- Many resources are omitted in MODEL_RESPONSE.md (marked as "omitted for brevity"), including:
  - Subnets
  - Internet Gateways
  - NAT Gateways
  - Route Tables and Associations
  - EC2 Instances
  - RDS Instances
  - DB Subnet Groups
- Only VPCs and two security groups are defined in MODEL_RESPONSE.md.

## AMI Usage
- The AMI value from the mapping is not used in any EC2 instance in MODEL_RESPONSE.md (and EC2 instances are missing).

## Region Tagging
- The `Region` tag is missing from VPC resources in MODEL_RESPONSE.md.

## Outputs
- Outputs are present and correct in both files.

## CloudFormation Errors
- `An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameter AMI should either have input value or default value`
- `An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [ProjectName] must have values`

## Other Notes
- Region values are not used in resources.
- EC2InstanceR2 values were added for both regions in the ideal, but are missing in the model.
- AMI values are not used in the model; they are used in the ideal.
- DB2 variables were defined but not used in the model; they are used in the ideal with an RDS instance.
