1. Medium Issues - There was AWS limit for the number of VPC which could be created in a particular region and the only way to go forward is to get rid of some of the VPC.

```

╷
│ Error: creating EC2 VPC: operation error EC2: CreateVpc, https response error StatusCode: 400, RequestID: ce9b751b-79e6-4fdc-81eb-e1db4419e017, api error VpcLimitExceeded: The maximum number of VPCs has been reached.
│ 
│   with aws_vpc.us_west_2,
│   on tap_stack.tf line 446, in resource "aws_vpc" "us_west_2":
│  446: resource "aws_vpc" "us_west_2" {
│ 
╵
Error: Terraform exited with code 1.

```
