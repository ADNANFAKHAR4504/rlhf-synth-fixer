resource "aws_sns_topic" "security_alerts" {
  name = var.topic_name

  tags = merge(
    var.common_tags,
    {
      Name = var.topic_name
    }
  )
}
