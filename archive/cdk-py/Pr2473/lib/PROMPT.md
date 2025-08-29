**Prompt (for CDK Python code generation):**

> You are an expert AWS CDK (Python) architect. Generate a CDK app that synthesizes a single CloudFormation **JSON** template named **`web_app_template.json`** satisfying **all** requirements below.
>
> **Region:** Hardcode region to **us-east-1** in the app.
> **Folder structure (use exactly these files):**
>
> ```
> root/
> ├── tap.py                     # CDK App entry point
> ├── lib/
> │   └── tap_stack.py           # Stack definition
> └── tests/
>     ├── unit/
>     │   └── test_tap_stack.py  # Unit tests for constructs
>     └── integration/
>         └── test_tap_stack.py  # Tests for outputs/resources
> ```
>
> **Architecture & constraints:**
>
> 1. **VPC** with **2 public** and **2 private** subnets across 2 AZs; NAT enabled so private subnets have egress.
> 2. **Auto Scaling Group** of **t3.micro** instances in **private subnets**; **min=2, max=5, desired=2**; simple UserData to serve HTTP on port 80.
> 3. **Application Load Balancer** (internet-facing) with listeners for **HTTP:80** and **HTTPS:443**.
> 4. **Security groups (least privilege):**
>
>    * ALB SG: allow **80/443** from **any IPv4**; no other inbound.
>    * App/EC2 SG: allow **HTTP(80)** **only from the ALB SG**; allow **SSH(22)** **only from `192.168.1.0/24`**; no public ingress.
>    * RDS SG: allow **PostgreSQL(5432)** **only from the App/EC2 SG**.
> 5. **RDS PostgreSQL** (**db.t2.micro**, engine postgres) deployed in **private subnets**, **publicly\_accessible=false**, encrypted storage, generated secret credentials.
> 6. **IAM**: EC2 instances assume a role with **AmazonSSMManagedInstanceCore** attached.
> 7. **Parameters/Outputs:**
>
>    * Parameter: **CertificateArn** (string) used by ALB **HTTPS** listener.
>    * Outputs: **AlbDnsName**, **DbEndpoint**.
> 8. Everything must synthesize into **one stack**; no nested stacks.
> 9. Use **aws-cdk-lib v2** and **constructs**; consistent, readable naming and tags.
>
> **Testing expectations:**
>
> * Provide unit tests asserting: ASG min/max, ALB created, two listeners (80, 443), RDS engine=postgres and instance class=db.t2.micro, security group rules as specified.
> * Provide a minimal integration test that asserts outputs `AlbDnsName` and `DbEndpoint` exist.
>
> **Developer experience:**
>
> * Include clear comments and docstrings.
> * Include a brief README snippet in comments at the top of `tap.py` explaining how to synthesize:
>
>   * `pip install "aws-cdk-lib>=2,<3" constructs`
>   * `cdk synth > web_app_template.json`
>
> **Deliverables:**
>
> * Fully filled contents for `tap.py`, `lib/tap_stack.py`, `tests/unit/test_tap_stack.py`, `tests/integration/test_tap_stack.py` only.
> * No extra files, no placeholders.
> * Code must pass `cdk synth` without edits.
