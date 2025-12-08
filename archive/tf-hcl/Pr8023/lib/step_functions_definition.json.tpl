{
  "Comment": "TAP Maintenance Workflow",
  "StartAt": "EscalationPrimary",
  "States": {
    "EscalationPrimary": {
      "Type": "Task",
      "Resource": "${escalation_primary_arn}",
      "Next": "EscalationBackup",
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "Next": "EscalationBackup"
        }
      ]
    },
    "EscalationBackup": {
      "Type": "Task",
      "Resource": "${escalation_backup_arn}",
      "Next": "PublishEscalation"
    },
    "PublishEscalation": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "${sns_escalation_arn}",
        "Message": {
          "default": "Escalation processed for maintenance request",
          "table": "${dynamodb_table_name}"
        }
      },
      "End": true
    }
  }
}
