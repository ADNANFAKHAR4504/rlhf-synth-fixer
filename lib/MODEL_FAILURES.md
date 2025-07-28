
# ❌ model_failure.md

This file outlines invalid, incomplete, or misconfigured CloudFormation template responses that do **not** meet the expected requirements.

---

## ❌ 1. Missing Required Resources

```yaml
Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
```

- Missing Internet Gateway
- No Subnets or Route Table
- No Tags

---

## ❌ 2. Missing or Incorrect Tags

```yaml
Tags:
  - Key: Name
    Value: ProductionVPC
```

- Does not include:
  - `Environment: Production`
  - `ManagedBy: CloudFormation`

---

## ❌ 3. Public Subnets Without Route Table Association

```yaml
Resources:
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: 10.0.1.0/24
```

- Not associated with any route table
- No `MapPublicIpOnLaunch`
- Missing AZ and tags

---

## ❌ 4. Improper AZ Selection Syntax

```yaml
AvailabilityZone: !Select [0, !GetAZs: us-east-1]
```

- Incorrect usage of `!GetAZs` with colon (`:`)
- Correct syntax:
  ```yaml
  AvailabilityZone: !Select [0, !GetAZs us-east-1]
  ```

---

## ❌ 5. No Internet Access Configured

```yaml
Resources:
  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      DestinationCidrBlock: 0.0.0.0/0
```

- Missing `GatewayId: !Ref IGW`
- No `DependsOn: AttachIGW`

---

## ❌ 6. Invalid or Hardcoded Availability Zones

```yaml
AvailabilityZone: us-east-1a
```

- AZs must be selected dynamically using:
  ```yaml
  AvailabilityZone: !Select [0, !GetAZs us-east-1]
  ```

---

## ❌ 7. Missing MapPublicIpOnLaunch

```yaml
MapPublicIpOnLaunch: false
```

- Public subnets will not be publicly routable

---

## ❌ 8. No SubnetRouteTableAssociation

```yaml
Resources:
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
```

- Subnets are not linked to this route table

---

## ❌ 9. Incomplete or Incorrect Outputs

```yaml
Outputs:
  VPC:
    Value: !Ref ProductionVPC
```

- Output must:
  - Have a `Description`
  - Export the value using:
    ```yaml
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'
    ```

---

## ❌ 10. Poor YAML Formatting or Indentation

```yaml
  PublicSubnetA:
    Type: AWS::EC2::Subnet
        Properties:
            VpcId: !Ref ProductionVPC
```

- Over-indented, causing YAML parse errors

---

## ❌ 11. VPC Missing DNS Configuration

```yaml
EnableDnsSupport: false
EnableDnsHostnames: false
```

- Breaks name resolution and public DNS hostname support

---

## ❌ 12. Incorrect CIDR Blocks

```yaml
CidrBlock: 10.0.0.0/8
```

- Too large or outside expected subnet range
- Required: `10.0.0.0/16` for VPC and `/24` for subnets

---

## ❌ 13. Missing Required Outputs

- Stack must export:
  - VPC ID
  - Subnet IDs
  - Route Table ID
  - IGW ID
  - StackName

---

By preventing these issues, the model ensures that CloudFormation templates are production-ready, secure, and fully deployable without failure.
