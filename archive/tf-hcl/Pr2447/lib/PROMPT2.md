Warning: Argument is deprecated
│ 
│   with aws_s3_bucket.logs,
│   on tap_stack.tf line 174, in resource "aws_s3_bucket" "logs":
│  174:   acl    = "private"
│ 
│ acl is deprecated. Use the aws_s3_bucket_acl resource instead.
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 88, in resource "aws_security_group" "default":
│   88:     action      = "deny"
│ 
│ An argument named "action" is not expected here.
╵
╷
│ Error: Missing required argument
│ 
│   with aws_network_acl.main,
│   on tap_stack.tf line 106, in resource "aws_network_acl" "main":
│  106: resource "aws_network_acl" "main" {
│ 
│ The argument "ingress.0.from_port" is required, but no definition was found.
╵
╷
│ Error: Missing required argument
│ 
│   with aws_network_acl.main,
│   on tap_stack.tf line 106, in resource "aws_network_acl" "main":
│  106: resource "aws_network_acl" "main" {
│ 
│ The argument "ingress.0.to_port" is required, but no definition was found.
╵
╷
│ Error: Missing required argument
│ 
│   with aws_network_acl.main,
│   on tap_stack.tf line 106, in resource "aws_network_acl" "main":
│  106: resource "aws_network_acl" "main" {
│ 
│ The argument "egress.0.from_port" is required, but no definition was found.
╵
╷
│ Error: Missing required argument
│ 
│   with aws_network_acl.main,
│   on tap_stack.tf line 106, in resource "aws_network_acl" "main":
│  106: resource "aws_network_acl" "main" {
│ 
│ The argument "egress.0.to_port" is required, but no definition was found.