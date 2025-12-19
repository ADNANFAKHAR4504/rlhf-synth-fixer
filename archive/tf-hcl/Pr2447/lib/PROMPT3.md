╷
│ Error: Self-referential block
│ 
│   on tap_stack.tf line 186, in resource "aws_s3_bucket" "logs":
│  186:     target_bucket = aws_s3_bucket.logs.id
│ 
│ Configuration for aws_s3_bucket.logs may not refer to itself.