Getting below errors , can you provide code snippet to fix these erros
```
╷
│ Error: creating RDS DB Instance (tap-stack-postgres-primary): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: e86e72d1-df68-4cae-b4ae-b8f854c47855, api error InvalidParameterCombination: Cannot find version 15.4 for postgres
│ 
│   with aws_db_instance.primary,
│   on tap_stack.tf line 1277, in resource "aws_db_instance" "primary":
│ 1277: resource "aws_db_instance" "primary" {
│ 
╵
╷
│ Error: creating Route53 Hosted Zone (tap-stack.example.com): operation error Route 53: CreateHostedZone, https response error StatusCode: 400, RequestID: 5dfd5492-7a40-49e5-8e67-9c6e60240136, InvalidDomainName: tap-stack.example.com is reserved by AWS!
│ 
│   with aws_route53_zone.main,
│   on tap_stack.tf line 1367, in resource "aws_route53_zone" "main":
│ 1367: resource "aws_route53_zone" "main" {
│ 
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.
```
