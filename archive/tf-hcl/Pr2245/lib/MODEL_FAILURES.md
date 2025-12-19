*** Flaw 1 ***
nitializing the backend...
╷
│ Error: Invalid provider configuration alias
│ 
│ An alias must be a valid name. A name must start with a letter or underscore and may contain only letters, digits,
│ underscores, and dashes.
╵
╷
│ Error: Failed to read file
│ 
│ The file "backend.conf" could not be read.
╵
╷
│ Error: Terraform encountered problems during initialisation, including problems
│ with the configuration, described below.
│ 
│ The Terraform configuration must be valid before initialization so that
│ Terraform can determine which modules and providers need to be installed.
│ 
│ 
╵
╷
│ Error: Duplicate required providers configuration
│ 
│   on tap_stack.tf line 5, in terraform:
│    5:   required_providers {
│ 
│ A module may have only one required providers configuration. The required providers were previously configured at
│ provider.tf:6,3-21.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 79, in data "aws_availability_zones" "available":
│   79:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 85, in data "aws_ami" "amazon_linux":
│   85:   provider    = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Duplicate provider configuration
│ 
│   on tap_stack.tf line 101:
│  101: provider "aws" {
│ 
│ A default (non-aliased) provider configuration for "aws" was already given at provider.tf:18,1-15. If multiple
│ configurations are required, set the "alias" argument for alternative configurations.
╵
╷
│ Error: Reserved argument name in provider block
│ 
│   on tap_stack.tf line 102, in provider "aws":
│  102:   for_each = toset(var.regions)
│ 
│ The provider argument name "for_each" is reserved for use by Terraform in a future version.
╵
╷
│ Error: Unsuitable value type
│ 
│   on tap_stack.tf line 103, in provider "aws":
│  103:   alias    = "region.${each.key}"
│ 
│ Unsuitable value: value must be known
╵
╷
│ Error: Variables not allowed
│ 
│   on tap_stack.tf line 103, in provider "aws":
│  103:   alias    = "region.${each.key}"
│ 
│ Variables may not be used here.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 110, in resource "aws_vpc" "main":
│  110:   provider             = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 125, in resource "aws_internet_gateway" "main":
│  125:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 144, in resource "aws_subnet" "public":
│  144:   provider                = aws.region[each.value.region]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 167, in resource "aws_subnet" "private":
│  167:   provider          = aws.region[each.value.region]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 182, in resource "aws_route_table" "public":
│  182:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 199, in resource "aws_route_table_association" "public":
│  199:   provider = aws.region[split("-", each.key)[0]]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 208, in resource "aws_security_group" "alb":
│  208:   provider    = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 244, in resource "aws_security_group" "web":
│  244:   provider    = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 280, in resource "aws_security_group" "rds":
│  280:   provider    = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 302, in resource "aws_lb" "main":
│  302:   provider           = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 323, in resource "aws_lb_target_group" "web":
│  323:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 350, in resource "aws_lb_listener" "web":
│  350:   provider          = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 364, in resource "aws_launch_template" "web":
│  364:   provider      = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 392, in resource "aws_autoscaling_group" "web":
│  392:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 427, in resource "aws_autoscaling_policy" "scale_up":
│  427:   provider               = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 437, in resource "aws_autoscaling_policy" "scale_down":
│  437:   provider               = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 448, in resource "aws_cloudwatch_metric_alarm" "cpu_high":
│  448:   provider            = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 467, in resource "aws_cloudwatch_metric_alarm" "cpu_low":
│  467:   provider            = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 487, in resource "aws_db_subnet_group" "main":
│  487:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.
╵
╷
│ Error: Invalid provider configuration reference
│ 
│   on tap_stack.tf line 503, in resource "aws_db_instance" "main":
│  503:   provider = aws.region[each.key]
│ 
│ The provider argument requires a provider type name, optionally followed by a period and then a configuration alias.