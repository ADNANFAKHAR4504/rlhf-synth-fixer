# Model Failures Analysis

## Primary Failures (Comparison Between MODEL_RESPONSE and IDEAL_RESPONSE)


### 1. Missing or Invalid EC2 Key Pair
**Model Response Issues:**
The model accepted `KeyName` as a parameter but did not clarify the need for it to exist beforehand, which could lead to deployment failure.

**Ideal Response Implementation:**
The final template retains `KeyName` as a required parameter and includes an improved explanation that the key pair must exist.
The assumption of a pre-created key pair is now clearly documented and validated by CloudFormation via `AWS::EC2::KeyPair::KeyName`.

### 2. Invalid SSH CIDR Block and Poor Parameter Naming
**Model Response Issues:**
The parameter was called `AllowedSSHLocation`, which is non-standard.
It lacked validation, allowing users to enter malformed IPs like `500.1.1.1/32`.

**Ideal Response Implementation:**
The parameter has been renamed to `SshCidrBlock`, aligning with AWS naming conventions.
A CIDR pattern validation regex was added:

### 3. Public Subnet Lacks Internet Access
**Model Response Issues:**
The public subnet had no `MapPublicIpOnLaunch` or route table properly configured, causing internet access failure despite having an Internet Gateway.

**Ideal Response Implementation:**
**`MapPublicIpOnLaunch: true`** is correctly set on the `PublicSubnet`. The public route table now includes a valid route to the IGW and is associated properly with the public subnet.

### 4. Internet Gateway Attachment Failure
**Model Response Issues:**
No `DependsOn` on `InternetGatewayAttachment`, which could cause race conditions for resources relying on IGW (like NAT Gateway or public route).

**Ideal Response Implementation:**
**`DependsOn: InternetGatewayAttachment`** has been explicitly added to:
* `PublicRoute`
* `NatGatewayEIP`
* `NatGateway`
This ensures resources wait until the IGW is fully attached.

---

### 5. Missing Outputs Section
**Model Response Issues:**
The initial template had no `Outputs`, making it hard to retrieve instance info or resource IDs post-deployment.

**Ideal Response Implementation:**
The updated template includes detailed outputs for:
* `VPCId`
* `PublicSubnetId`
* `PrivateSubnetId`
* `PublicInstanceId`
* `PrivateInstanceId`
* `PublicInstancePublicIP`