**Prompt to generate `TapStack.yml`**

Please write a **single CloudFormation template in YAML** named **`TapStack.yml`** that I can deploy as-is (no external files). This is a **brand-new stack**—do not reference any pre-existing resources. Follow AWS best practices and keep it **StackSet-friendly** (region/account agnostic, no hardcoded AZ names).

### What to build (must-have)

1. **VPC** with CIDR `10.0.0.0/16`.
2. **High availability subnets**: at least **2 public** and **2 private** subnets spread across **different AZs** (use `!GetAZs` + `!Select`).
3. **Internet Gateway** attached to the VPC.
4. **Route tables**:

   * Public RT with `0.0.0.0/0` route to IGW and associated to both public subnets.
   * Private RTs with `0.0.0.0/0` to NAT in their respective AZ, associated to both private subnets.
5. **NAT Gateways** (best practice: one per public subnet) with required EIPs, routing private subnets’ egress.
6. **S3**: create at least one application bucket with:

   * **Block Public Access** (all four settings true),
   * **Bucket encryption** (SSE-S3 or SSE-KMS—choose one and wire it correctly),
   * **Versioning enabled**,
   * **Lifecycle policy**: transition to IA (e.g., 30 days), then to Glacier/Deep Archive (e.g., 90 days), **expire** current objects after 365 days, and set sensible **noncurrent** version cleanup.
7. **IAM for EC2 → S3**:

   * An **IAM Role** for EC2 with **least-privilege** inline policy granting **GetObject/PutObject/ListBucket** *only* on the bucket created above (use `!Sub` ARNs).
   * An **Instance Profile** attached to the role.
8. **EC2 instances (2 total)**: launch **one in each private subnet**.

   * **No public IPs**.
   * **Security Group** allowing inbound **SSH (22)** only from a **parameterized CIDR** (e.g., `AllowedSSHRange`, default something safe like `10.0.0.0/24`, not `0.0.0.0/0`).
   * **Egress** open to necessary destinations via NAT.
   * **IMDSv2 required**, EBS volumes **encrypted**, and a simple **UserData** stub (e.g., update packages, confirm SSM agent is available).
   * Allow passing a **KeyName** parameter (optional) but keep instances in private subnets regardless.
9. **All resources defined in this one file**; use **intrinsic functions** (`!Ref`, `!Sub`, `!GetAtt`, `!Join`, `!Select`, `!GetAZs`, `!If`, `!Equals`) where appropriate.
10. **StackSets readiness**: The template must be suitable as a **StackSet target template** to roll out to **three accounts**. Avoid account-specific assumptions; make parameters obvious so I can feed per-account values via StackSets.

### Parameters (include these with sensible defaults + AllowedPattern/AllowedValues)

* `ProjectName` (default: `TapStack`) – used in names and tags.
* `EnvironmentName` (AllowedValues: `dev`, `staging`, `prod`; default: `prod`).
* `AllowedSSHRange` (CIDR, default e.g. `10.0.0.0/24`).
* `InstanceType` (default: `t3.micro` or similar).
* `KeyName` (optional; allow empty by condition).
* `EnableNatPerAz` (Boolean; default `true`) — if `true`, create a NAT per AZ; if `false`, create a single NAT (still must satisfy egress).
* `S3TransitionDaysIA` (default `30`), `S3TransitionDaysGlacier` (default `90`), `S3ExpireDays` (default `365`).
* (Optional) `KmsKeyArn` if you choose SSE-KMS; if empty, use SSE-S3.

### Naming, tags, and quality bar

* Use a **consistent naming pattern** with `!Sub` like:
  `${ProjectName}-${EnvironmentName}-<component>`
* Add standard **Tags** (Project, Environment, Owner if provided).
* Ensure **cfn-lint clean** (no deprecated properties, correct region-agnostic resource types), and **valid YAML**.
* Do **not** hardcode AZ names or account IDs.
* Default to **least privilege** everywhere and **block public access** on S3.

### Security expectations

* **No 0.0.0.0/0 on SSH**.
* **IMDSv2** enforced for instances.
* **EBS encryption** enabled by default.
* **S3** denies unencrypted/unenforced TLS if you use a bucket policy (fine to include).
* Private subnets must **not assign public IPs**.

### Outputs (make them useful and clearly named)

Output at least:

* `VpcId`, `PublicSubnetIds`, `PrivateSubnetIds`, `InternetGatewayId`, `NatGatewayIds`, `PublicRouteTableIds`, `PrivateRouteTableIds`,
* `InstanceProfileName`, `Ec2RoleArn`,
* `AppBucketName`, `AppBucketArn`,
* `PrivateEc2InstanceIds` (list),
* Region/account helpers if useful (e.g., `${AWS::Region}`, `${AWS::AccountId}`).

### Deliverable format

* **Single file** named **`TapStack.yml`**.
* Self-contained, ready to deploy with `aws cloudformation deploy` or attach to a **StackSet**.
* Include inline comments sparsely (only where it helps).
* No placeholders like “add here later”—please fill in full, working logic.

### Nice to have (keep minimal & optional)

* Simple **VPC Flow Logs** to CloudWatch Logs or S3 (controlled by a Boolean parameter).
* Small example **`Metadata` + `AWS::CloudFormation::Interface`** to group parameters nicely (optional).

**Important**: Please produce only the YAML template content of `TapStack.yml`—no extra prose.