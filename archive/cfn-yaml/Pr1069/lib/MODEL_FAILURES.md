# Regenerate the CloudFormation template (model correction prompt)

You previously returned a CloudFormation YAML that does not meet the spec and unit tests. **Regenerate ONE complete YAML** (no prose, **no code fences**) that **exactly** follows these rules.

---

## Goal

Automated failover between **primary** & **standby** EC2 instances using **Route 53** health checks and failover A records.

---

## Use existing Route 53 resources (no hosted zone creation)

- **HostedZoneId** and **RecordName** are provided as parameters and used directly.
- Do **not** create a hosted zone. Do **not** attempt to derive or modify the record name.

---

## Parameters (must exist exactly with these properties)

- `HostedZoneId` — `Type: String`, **Default:** `Z0457876OLTG958Q3IXN`, description like “Existing Route 53 Hosted Zone ID (required)”.
- `RecordName` — `Type: String`, **Default:** `tap-us-east-1.turing229221.com.`, description like “FQDN for failover record (trailing dot ok)”.
- `InstanceType` — `Type: String`, **Default:** `t3.micro`, `AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]`.
- `KeyName` — `Type: String`, **Default:** `cf-task-keypair-TapStackpr104`, description like “Existing EC2 Key Pair name (optional)”.
- `AllowedSSHCidr` — `Type: String`, **Default:** `0.0.0.0/0`.
- `HealthCheckPort` — `Type: Number`, **Default:** `80`, `MinValue: 1`, `MaxValue: 65535`.
- `HealthCheckPath` — `Type: String`, **Default:** `/`.
- `LatestAmiId` — `Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`, **Default:** `/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64`.

---

## Conditions

- Only:
  ```yaml
  HasKeyName: !Not [!Equals [!Ref KeyName, ""]]
  ```

---

## Networking resources

- `VPC` with:
  - `CidrBlock: 10.0.0.0/16`
  - `EnableDnsHostnames: true`
  - `EnableDnsSupport: true`
  - Tags: `Name: !Sub "${AWS::StackName}-VPC"`, `Project: "IaC - AWS Nova Model Breaking"`
- Two public subnets:
  - `PublicSubnet1`: `10.0.1.0/24`, `AvailabilityZone: !Select [0, !GetAZs ""]`, `MapPublicIpOnLaunch: true`
  - `PublicSubnet2`: `10.0.2.0/24`, `AvailabilityZone: !Select [1, !GetAZs ""]`, `MapPublicIpOnLaunch: true`
  - Each with Name/Project tags similar to above.
- `InternetGateway`, `VPCGatewayAttachment`
- `PublicRouteTable` + default `PublicRoute` to IGW
- Route table associations for both subnets

---

## Security Group

- Ingress:
  - TCP 80 from `0.0.0.0/0`
  - TCP 22 from `!Ref AllowedSSHCidr`
- **Egress allow-all**:
  ```yaml
  SecurityGroupEgress:
    - IpProtocol: -1
      CidrIp: 0.0.0.0/0
      Description: Allow all egress
  ```
- Tags include `Name: !Sub "${AWS::StackName}-SecurityGroup"` and `Project`.

> Do **not** set `GroupName` explicitly.

---

## EC2 Instances

- `PrimaryInstance` in `PublicSubnet1`
- `StandbyInstance` in `PublicSubnet2`
- Both:
  - `ImageId: !Ref LatestAmiId`
  - `InstanceType: !Ref InstanceType`
  - `SecurityGroupIds: [!Ref SecurityGroup]`
  - `KeyName: !If [HasKeyName, !Ref KeyName, !Ref "AWS::NoValue"]`
  - **UserData** uses **`dnf`** (Amazon Linux 2023), starts/enables `httpd`, writes an HTML page:
    - Primary: includes `<h1>Primary Instance</h1>`
    - Standby: includes `<h1>Standby Instance</h1>`
    - It’s OK if the page shows the literal `$(curl ...)` (single-quoted heredoc).
  - Tags include `Name`, `Project`, and `Role` (`Primary`/`Standby`).

---

## Elastic IPs (VPC-safe pattern)

- `PrimaryEIP` and `StandbyEIP`:
  - `Domain: vpc`
  - **Do not** set `InstanceId` on these EIP resources.
  - Include Name/Project tags.
- `PrimaryEIPAssociation` / `StandbyEIPAssociation`:
  - `AllocationId: !GetAtt <EIP>.AllocationId`
  - `InstanceId: !Ref <Instance>`

---

## Route 53

- `PrimaryHealthCheck` must use **this schema** (no flat top-level Type/Port/etc):
  ```yaml
  HealthCheckConfig:
    Type: HTTP
    IPAddress: !Ref PrimaryEIP
    Port: !Ref HealthCheckPort
    ResourcePath: !Ref HealthCheckPath
    RequestInterval: 30
    FailureThreshold: 3
  HealthCheckTags:
    - Key: Name
      Value: !Sub "${AWS::StackName}-PrimaryHealthCheck"
    - Key: Project
      Value: "IaC - AWS Nova Model Breaking"
  ```
- `PrimaryRecord` and `StandbyRecord` are `AWS::Route53::RecordSet`:
  - `HostedZoneId: !Ref HostedZoneId`
  - `Name: !Ref RecordName`
  - `Type: A`
  - `TTL: 60`
  - `SetIdentifier: Primary` / `Standby`
  - `Failover: PRIMARY` / `SECONDARY`
  - `ResourceRecords: [!Ref PrimaryEIP]` / `[!Ref StandbyEIP]`
  - **Primary** includes `HealthCheckId: !Ref PrimaryHealthCheck`

---

## Outputs (names must match exactly)

- `PrimaryInstanceId` → `Value: !Ref PrimaryInstance`
- `StandbyInstanceId` → `Value: !Ref StandbyInstance`
- `PrimaryEIPOut` → `Value: !Ref PrimaryEIP`
- `StandbyEIPOut` → `Value: !Ref StandbyEIP`
- `DNSName` → `Value: !Ref RecordName`
- `HealthCheckId` → `Value: !Ref PrimaryHealthCheck`
- `HostedZoneIdOutput` → `Value: !Ref HostedZoneId`
- `VPCId` → `Value: !Ref VPC`

Each output must include:
```yaml
Export:
  Name: !Sub "${AWS::StackName}-<OutputLogicalId>"
```

---

## Linting & style

- Use `!Sub` **only** when interpolating variables; otherwise plain strings.
- Keep `Project: "IaC - AWS Nova Model Breaking"` tag consistent.
- `AWSTemplateFormatVersion: "2010-09-09"` and the exact Description used above.

---

## Return format

**Return only the final YAML** (no explanations, no surrounding code fences, no extra text).
