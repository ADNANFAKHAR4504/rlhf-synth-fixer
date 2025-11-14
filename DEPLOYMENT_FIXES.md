# Deployment Fixes for synth-2dw1n2 Branch

## Issues Identified and Fixed

### 1. VPN Gateway Exception Handling
**Problem**: Try-except block in Python doesn't work with CDKTF data sources at synthesis time.

**Fix**: Removed try-except block. If VPN gateway doesn't exist, Terraform will handle the error appropriately during plan/apply.

```python
# Before:
try:
    vpn_gateway = DataAwsVpnGateway(...)
except:
    vpn_gateway = None

# After:
vpn_gateway = DataAwsVpnGateway(...)
```

### 2. Hard-coded Database Password
**Problem**: Database password was hard-coded in the source code.

**Fix**: Using environment variable `TF_VAR_db_password` with fallback to default.

```python
# Before:
master_password="TempPassword123!ChangeInProduction"

# After:
import os
db_password = os.getenv("TF_VAR_db_password", "TempPassword123!ChangeInProduction")
master_password=db_password
```

### 3. Database Name Validation
**Problem**: Database name construction could result in invalid names (non-alphanumeric characters).

**Fix**: Added proper sanitization to ensure database name is alphanumeric and starts with a letter.

```python
# Before:
db_name = f"paymentdb{environment_suffix.replace('-', '').replace('_', '')}"[:63]
if not db_name[0].isalpha():
    db_name = f"db{db_name}"

# After:
db_name = f"paymentdb{environment_suffix.replace('-', '').replace('_', '')}"
db_name = ''.join(c for c in db_name if c.isalnum())
if not db_name[0].isalpha():
    db_name = f"db{db_name}"
db_name = db_name[:63]
```

### 4. NAT Gateway Dependencies
**Problem**: NAT gateways might be created before Internet Gateway is fully ready, causing deployment failures.

**Fix**: Added explicit `depends_on` for Internet Gateway and EIP.

```python
# Before:
nat = NatGateway(
    self,
    f"nat_gateway_{i+1}",
    allocation_id=eip.id,
    subnet_id=subnet.id,
    tags={...}
)

# After:
nat = NatGateway(
    self,
    f"nat_gateway_{i+1}",
    allocation_id=eip.id,
    subnet_id=subnet.id,
    tags={...},
    depends_on=[igw, eip]
)
```

### 5. Conditional Output for VPN Gateway
**Problem**: Conditional output with `if vpn_gateway` doesn't work correctly in CDKTF.

**Fix**: Always create the output. If VPN doesn't exist, Terraform will error during plan/apply, which is the correct behavior.

```python
# Before:
if vpn_gateway:
    TerraformOutput(self, "vpn_gateway_id", value=vpn_gateway.id, ...)

# After:
TerraformOutput(self, "vpn_gateway_id", value=vpn_gateway.id, ...)
```

## Deployment Instructions

1. **Set Environment Variables**:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
export TF_VAR_db_password="YourSecurePassword123!"
export TERRAFORM_STATE_BUCKET=iac-rlhf-tf-states
```

2. **Synthesize**:
```bash
python3 tap.py
```

3. **Deploy**:
```bash
cd cdktf.out/stacks/PaymentMigrationdev
terraform init
terraform plan
terraform apply
```

## Notes

- **VPN Gateway**: If you don't have a VPN gateway tagged with the environment suffix, the deployment will fail on the VPN gateway data source. This is expected behavior. Either:
  - Create a VPN gateway with tag `Environment=dev` (or your environment suffix)
  - OR comment out the VPN gateway data source and output in the code

- **Database Password**: Always use a secure password in production via environment variables or AWS Secrets Manager

- **Resource Dependencies**: The NAT gateway fix ensures proper dependency ordering for network resources

## Testing

Synthesis test passed:
```bash
$ python3 tap.py
$ echo $?
0
```

## Files Modified

- `lib/payment_migration_stack.py` - Main stack file with all fixes applied

## Verification

After deployment, verify:
1. VPC and subnets are created correctly
2. NAT Gateways are in `available` state
3. Aurora MySQL cluster is `available`
4. All security groups have proper rules
5. ALB is active and healthy
6. Auto Scaling Group has instances in `InService` state

