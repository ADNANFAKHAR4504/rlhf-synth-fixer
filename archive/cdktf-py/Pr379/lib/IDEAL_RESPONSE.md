### Ideal Model Behavior for Prompt

The model should:

1. **Update `lib/tap_stack.py`**:
   - Define a VPC with `10.0.0.0/16` using `cdktf_cdktf_provider_aws.vpc.Vpc`.
   - Create two public subnets (`10.0.1.0/24`, `10.0.2.0/24`) and two private subnets (`10.0.3.0/24`, `10.0.4.0/24`).
   - Subnets should span `us-east-1a` and `us-east-1b` dynamically using `aws_region`.
   - Use `cdktf_cdktf_provider_aws.internet_gateway.InternetGateway` to attach an IGW to the VPC.
   - Create `cdktf_cdktf_provider_aws.route_table.RouteTable` with a route (`cdktf_cdktf_provider_aws.route.Route`) to the IGW.
   - Associate public subnets to the public route table only via `RouteTableAssociation`.
   - Use 2-space indentation and `LF` line endings.
   - Prefix all resource names with `tap-<env>-`.

2. **Update `tests/unit/test_tap_stack.py`**:
   - Verify public/private subnets length.
   - Assert subnet CIDRs match expected values.

3. **Update `tests/integration/test_tap_stack.py`**:
   - Use `Testing.synth(stack)` to parse synthesized JSON.
   - Check for presence of `aws_vpc`, `aws_subnet`, and `aws_internet_gateway` resources.

4. **Not Introduce Any**:
   - Nested stacks or modules.
   - Hardcoded values.
   - Incorrect test references.

---

### Acceptance Criteria

- ✅ All resources dynamically generated from kwargs.
- ✅ No hardcoded region.
- ✅ 2 public + 2 private subnets exist.
- ✅ Route to IGW is set and only public subnets use it.
- ✅ Tests pass with default or provided arguments.

- Stack Code:
  """TAP Stack module for CDKTF Python infrastructure."""

from constructs import Construct
from cdktf import TerraformStack, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation

class TapStack(TerraformStack):
  """CDKTF Python stack for TAP infrastructure."""

  def __init__(self, scope: Construct, construct_id: str, **kwargs):
    """Initialize the TAP stack with AWS infrastructure."""
    super().__init__(scope, construct_id)

    environment_suffix = kwargs.get('environment_suffix', 'dev')
    aws_region = kwargs.get('aws_region', 'us-east-1')
    state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
    state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
    default_tags = kwargs.get('default_tags', {})

    AwsProvider(self, "aws",
      region=aws_region,
      default_tags=[default_tags]
    )

    S3Backend(self,
      bucket=state_bucket,
      key=f"{environment_suffix}/{construct_id}.tfstate",
      region=state_bucket_region,
      encrypt=True
    )

    self.add_override("terraform.backend.s3.use_lockfile", True)

    vpc = Vpc(self, "tap_vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_support=True,
      enable_dns_hostnames=True,
      tags={
        "Name": f"iac-task-{environment_suffix}-vpc"
      }
    )

    igw = InternetGateway(self, "tap_igw",
      vpc_id=vpc.id,
      tags={"Name": f"iac-task-{environment_suffix}-igw"}
    )

    azs = [f"{aws_region}a", f"{aws_region}b"]
    public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
    private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]

    self.public_subnets = []
    self.private_subnets = []

    for i in range(2):
      pub = Subnet(self, f"tap_pub_subnet_{i}",
        vpc_id=vpc.id,
        cidr_block=public_subnet_cidrs[i],
        availability_zone=azs[i],
        map_public_ip_on_launch=True,
        tags={"Name": f"iac-task-{environment_suffix}-public-{i+1}"}
      )
      self.public_subnets.append(pub)

      priv = Subnet(self, f"tap_priv_subnet_{i}",
        vpc_id=vpc.id,
        cidr_block=private_subnet_cidrs[i],
        availability_zone=azs[i],
        tags={"Name": f"iac-task-{environment_suffix}-private-{i+1}"}
      )
      self.private_subnets.append(priv)

    rt = RouteTable(self, "tap_public_rt",
      vpc_id=vpc.id,
      tags={"Name": f"iac-task-{environment_suffix}-public-rt"}
    )

    Route(self, "tap_default_route",
      route_table_id=rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=igw.id
    )

    for i, subnet in enumerate(self.public_subnets):
      RouteTableAssociation(self, f"tap_rt_assoc_{i}",
        subnet_id=subnet.id,
        route_table_id=rt.id
      )

