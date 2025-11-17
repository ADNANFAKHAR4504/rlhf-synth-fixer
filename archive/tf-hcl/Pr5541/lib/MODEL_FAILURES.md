# Model Response Failures - Security Group Naming

## Error 1: Security Group Name Prefix Invalid

**Issue**: Security group name_prefix cannot start with "sg-"

**Original Code**:
```
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "sg-vpc-endpoints-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "sg-vpc-endpoints-${var.environmentSuffix}"
  }
}
```

**Error Message**:
```
Error: invalid value for name_prefix (cannot begin with sg-)
```

**Root Cause**:

AWS reserves the "sg-" prefix for auto-generated security group IDs. When creating a security group with name_prefix or name attributes, AWS enforces a constraint that prevents the value from starting with "sg-". The model generated this prefix based on common organizational naming patterns seen in tags and documentation, but failed to understand the distinction between AWS resource naming constraints and human-readable tagging conventions.

**Why This Happened**:

The model confused two different naming contexts. The "sg-" prefix is acceptable in tag names for human identification, but AWS API validation explicitly rejects it in the actual resource name attributes because that prefix is reserved for system-generated security group IDs.

**What the Model Should Learn**:

Name prefixes for security groups must be descriptive but cannot start with "sg-". The pattern "sg-" should only appear in tag values for organizational clarity, not in resource identifiers.

**Fix Applied**:
```
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "sg-vpc-endpoints-${var.environmentSuffix}"
  }
}
```

**Changes Made**:
- Changed name_prefix from "sg-vpc-endpoints-" to "vpc-endpoints-"
- Kept tag Name as "sg-vpc-endpoints-${var.environmentSuffix}" (this is correct usage)

**Impact**:
- Security Risk: None
- Cost: None
- Operational: Deployment blocked until corrected

**Prevention**:

Use descriptive names without "sg-" prefix in name_prefix or name attributes. Valid examples:
- name_prefix = "vpc-endpoints-"
- name_prefix = "web-server-"
- name_prefix = "database-"
- name_prefix = "application-"

The "sg-" prefix can appear in tag names for organizational purposes, but never in the actual resource name attributes.
```