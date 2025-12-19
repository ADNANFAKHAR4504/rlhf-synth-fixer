### Compile issues detected in `lib/MODEL_RESPONSE.md`

Below are problems that will cause `terraform validate` (or provider schema validation) to fail. Each item includes a citation to the offending code.

- **Incorrect argument names on `aws_db_instance`**: use `preferred_backup_window` and `preferred_maintenance_window`.

```361:366:lib/MODEL_RESPONSE.md
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  multi_az               = true
```

- Replace with:
  - `preferred_backup_window`
  - `preferred_maintenance_window`

- **Numeric fields provided as strings**: several arguments require numbers but are quoted.

```610:621:lib/MODEL_RESPONSE.md
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  tags = local.common_tags
}
```

- `port` must be a number: `port = 80`.

```745:756:lib/MODEL_RESPONSE.md
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${local.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = []
```

- `evaluation_periods`, `period`, and `threshold` must be numbers (unquoted). The same issue appears in the following alarms:
  - `aws_cloudwatch_metric_alarm.ecs_cpu_high` (lines 766–775)
  - `aws_cloudwatch_metric_alarm.ecs_memory_high` (lines 786–795)
  - `aws_cloudwatch_metric_alarm.rds_cpu_high` (lines 806–815)
  - `aws_cloudwatch_metric_alarm.rds_free_storage_low` (lines 825–835)

- **Unsupported `tags` on `aws_lb_listener`** (with provider constraint `~> 5.0`, listeners typically do not accept `tags`). Remove the `tags` argument from the listener.

```610:621:lib/MODEL_RESPONSE.md
  ...
  tags = local.common_tags
}
```

- (Optional to verify against your exact provider version) **`tags` on `aws_appautoscaling_target` may not be supported**. If validation fails, remove the `tags` argument.

```651:660:lib/MODEL_RESPONSE.md
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = local.common_tags
}
```

---

### Not compile-time, but will fail to work as intended (apply/runtime)

These items usually pass `terraform validate` but are incorrect for ECS Blue/Green and will fail at apply time or during deployment:

- **CodeDeploy ECS Blue/Green requires a target group pair and listener routes.** The deployment group only specifies a single `target_group_info` and no `target_group_pair_info` with prod/test listeners.

```700:741:lib/MODEL_RESPONSE.md
resource "aws_codedeploy_deployment_group" "app" {
  ...
  load_balancer_info {
    target_group_info {
      name = aws_lb_target_group.blue.name
    }
  }
  ...
}
```

- For ECS, use `load_balancer_info { target_group_pair_info { target_group { ... } target_group { ... } prod_traffic_route { listener_arns = [...] } test_traffic_route { listener_arns = [...] } } }`.

- **Invalid deployment config name for ECS**:
  - `deployment_config_name = "CodeDeployDefault.ECSAllAtOnceBlueGreen"` is not a valid managed config. Use one of the supported ECS configs, e.g. `CodeDeployDefault.ECSAllAtOnce`, `CodeDeployDefault.ECSCanary10Percent5Minutes`, or `CodeDeployDefault.ECSLinear10PercentEvery1Minute`.
