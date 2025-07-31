Below is an example of how you might structure a Terraform CDK (CDKTF) project in **Python** to meet the specified requirements. It includes variable-driven configuration, tagging, and outputs.

---

## cdktf.json

```json
{
  "app": "python main.py",
  "language": "python",
  "terraformProviders": [
    "registry.terraform.io/hashicorp/aws@~> 5.0"
  ],
  "codeGeneratorOutput": "imports"
}
```

---

## requirements.txt

```text
cdktf>=0.13.0
constructs>=10.0.0
cdktf-cdktf-provider-aws>=5.0.0
```

---

## main.py

```python
import os
from constructs import Construct
from cdktf import App, TerraformStack, TerraformVariable, TerraformOutput
from imports.aws import AwsProvider, Vpc, Subnet, InternetGateway, RouteTable, RouteTableAssociation, SecurityGroup, SecurityGroupRule, Instance, Tag

class WebAppStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str):
        super().__init__(scope, ns)

        # Providers
        AwsProvider(self, 'Aws', region=TerraformVariable(self, 'aws_region', default='us-east-1').string_value)

        # Variables
        vpc_cidr = TerraformVariable(self, 'vpc_cidr', default='10.0.0.0/16').string_value
        public_subnets = TerraformVariable(self, 'public_subnet_cidrs',
                                          default=["10.0.1.0/24", "10.0.2.0/24"]).list_value
        instance_type = TerraformVariable(self, 'instance_type', default='t3.micro').string_value
        ami_id = TerraformVariable(self, 'ami_id', default='ami-0c94855ba95c71c99').string_value
        allowed_ssh_cidr = TerraformVariable(self, 'allowed_ssh_cidr', default='0.0.0.0/0').string_value
        allowed_http_cidr = TerraformVariable(self, 'allowed_http_cidr', default='0.0.0.0/0').string_value
        environment = TerraformVariable(self, 'environment', default='dev').string_value
        project_name = TerraformVariable(self, 'project_name', default='web-app').string_value

        # Tagging helper
        def tags(name: str):
            return {
                'Name': f"{project_name}-{environment}-{name}",
                'Environment': environment,
                'Project': project_name
            }

        # VPC
        vpc = Vpc(self, 'VPC',
                  cidr_block=vpc_cidr,
                  tags=tags('vpc'))

        # Internet Gateway
        igw = InternetGateway(self, 'IGW',
                              vpc_id=vpc.id,
                              tags=tags('igw'))

        # Route Table
        rt = RouteTable(self, 'PublicRouteTable',
                        vpc_id=vpc.id,
                        tags=tags('public-rt'))
        rt.add_route('DefaultRoute',
                     destination_cidr_block='0.0.0.0/0',
                     gateway_id=igw.id)

        # Public Subnets and Associations
        subnets = []
        for idx, cidr in enumerate(public_subnets):
            az = f"${{data.aws_availability_zones.available.names[{idx}]}}"
            subnet = Subnet(self, f"PublicSubnet{idx+1}",
                            vpc_id=vpc.id,
                            cidr_block=cidr,
                            availability_zone=az,
                            map_public_ip_on_launch=True,
                            tags=tags(f"public-sn-{idx+1}"))
            RouteTableAssociation(self, f"RTA{idx+1}",
                                  subnet_id=subnet.id,
                                  route_table_id=rt.id)
            subnets.append(subnet)

        # Security Group
        sg = SecurityGroup(self, 'WebSg',
                           name=f"{project_name}-{environment}-sg",
                           description='Allow HTTP and SSH',
                           vpc_id=vpc.id,
                           tags=tags('sg'))

        SecurityGroupRule(self, 'SSH',
                          type='ingress',
                          from_port=22,
                          to_port=22,
                          protocol='tcp',
                          cidr_blocks=[allowed_ssh_cidr],
                          security_group_id=sg.id)
        SecurityGroupRule(self, 'HTTP',
                          type='ingress',
                          from_port=80,
                          to_port=80,
                          protocol='tcp',
                          cidr_blocks=[allowed_http_cidr],
                          security_group_id=sg.id)

        # EC2 Instances
        instances = []
        for idx, subnet in enumerate(subnets[:2]):
            inst = Instance(self, f"WebInstance{idx+1}",
                            ami=ami_id,
                            instance_type=instance_type,
                            subnet_id=subnet.id,
                            vpc_security_group_ids=[sg.id],
                            tags=tags(f"instance-{idx+1}"))
            instances.append(inst)

        # Outputs
        TerraformOutput(self, 'vpc_id', value=vpc.id)
        TerraformOutput(self, 'public_subnet_ids', value=[sn.id for sn in subnets])
        TerraformOutput(self, 'instance_public_ips', value=[inst.public_ip for inst in instances])


app = App()
WebAppStack(app, "web-app-stack")
app.synth()
```

---

## Explanation

* **Variable-Driven Configuration**: All CIDRs, AMI, instance types, and environment/project identifiers are exposed as TerraformVariables.
* **Networking**: A VPC with two public subnets, an Internet Gateway, and a public route table are created and linked.
* **Security**: A single Security Group allows SSH and HTTP from the defined CIDR blocks.
* **Compute**: Two EC2 instances are launched into separate subnets with variable-driven AMI and instance types.
* **Tagging**: A helper function ensures consistent `Name`, `Environment`, and `Project` tags across all resources.
* **Outputs**: VPC ID, subnet IDs, and instance public IPs are exposed for easy reference.

With this structure, you can easily extend to multiple regions or environments by overriding variable values.
