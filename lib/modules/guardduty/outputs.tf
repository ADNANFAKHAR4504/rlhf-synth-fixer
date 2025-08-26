output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.this.id
}

output "guardduty_member_ids" {
  description = "IDs of GuardDuty member accounts"
  value       = [for m in aws_guardduty_member.members : m.id]
}

output "guardduty_destination_id" {
  description = "ID of the GuardDuty publishing destination"
  value       = try(aws_guardduty_publishing_destination.this[0].id, null)
}
