# Model Failures

## 1. Reliance on Custom `data` Module

**Issue:** The model's response depends on a custom `./modules/data` module to fetch information like availability zones, AWS partition, account ID, and the ELB service account ID. The ideal response, however, uses standard Terraform `data` sources (`aws_availability_zones`, `aws_partition`, `aws_caller_identity`, `aws_elb_service_account`) directly in the root module.

**Why it's a failure:** Relying on a custom module for standard data fetching makes the code less portable and harder to understand. The ideal response is more self-contained and follows a more common Terraform pattern.

**Example from Model Response:**
```hcl
resource "aws_subnet" "public" {
  count = 2
  # ...
  availability_zone       = module.data.availability_zones[count.index]
  # ...
}
```

**Example from Ideal Response:**
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "public" {
  count = 2
  # ...
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  # ...
}
```

## 2. Inconsistent and Unpredictable Resource Naming

**Issue:** The model's response uses the `random_string` resource to generate unique suffixes for several key resources, including the ALB, RDS instance, IAM roles, and instance profiles. The ideal response uses deterministic names based on the project name and environment.

**Why it's a failure:** While random suffixes guarantee uniqueness, they make resource names unpredictable, which can complicate scripting, monitoring, and manual inspection. The ideal response's naming convention is more predictable and easier to work with.

**Example from Model Response:**
```hcl
resource "aws_db_instance" "main" {
  identifier             = "${local.name_prefix}-database-${random_string.suffix.result}"
  # ...
}
```

**Example from Ideal Response:**
```hcl
resource "aws_db_instance" "main" {
  identifier             = "${local.name_prefix}-database"
  # ...
}
```

## 3. Embedded User Data Script

**Issue:** The model's response embeds a multi-line user data script directly within the `aws_launch_template` resource using a heredoc string. The ideal response separates the script into its own file and uses the `templatefile` function to load it.

**Why it's a failure:** Embedding scripts directly in HCL makes the code harder to read, maintain, and test. The `templatefile` approach is cleaner and promotes better separation of concerns.

**Example from Model Response:**
```hcl
resource "aws_launch_template" "app" {
  # ...
  user_data = base64encode(<<-EOF
#!/bin/bash
# ...
EOF
  )
}
```

**Example from Ideal Response:**
```hcl
resource "aws_launch_template" "app" {
  # ...
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = module.monitoring.ec2_log_group_name
    region         = var.region
  }))
}
