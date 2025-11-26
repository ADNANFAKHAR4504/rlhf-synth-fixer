We need an event routing, message loss, and configuration audit for our AWS EventBridge environment (280 rules, 12 custom buses, 45M events/day) in `us-east-1`.  
Please create a Python 3.12 script named **analyze_eventbridge.py** using **Boto3** to analyze EventBridge rules, custom buses, DLQ coverage, CloudWatch metrics, and resource configuration.

**Your script must do all of the following:**

1. **Disabled Rules:** Find EventBridge rules DISABLED for >30 days (potentially unused/forgotten automations).
2. **No Dead Letter Queue:** Flag rules with no DLQ defined—raises permanent event loss risk on failure.
3. **Unmonitored DLQs:** Find rules whose DLQs contain events but lack CloudWatch alarms for arrival.
4. **Overly Broad Event Patterns:** Rules with event patterns matching ALL events (e.g. `source: '*'`), causing excessive invocations.
5. **Failed Invocations:** Any rule with target invocation failure rate >5% (using CloudWatch metrics, 7-day window)—surface as integration or config errors.
6. **Single Target:** Critical event rules with only one target—flag for lack of redundancy.
7. **No Input Transformation:** Rules passing entire events to targets instead of using input transformers.
8. **Excessive Rules:** Event buses with >100 rules—recommend consolidation.
9. **Archive Disabled:** Identify custom event buses missing enabled archiving for event replay.
10. **No Cross-Region Replication:** Buses lacking cross-region event routing for DR.
11. **Missing Resource Policies:** Event buses without policies restricting publishing to authorized accounts.
12. **Unused Event Buses:** Custom buses with zero events received in last 60 days.
13. **No Encryption:** Buses handling sensitive data but no KMS encryption on archives.
14. **Inefficient Retry Policy:** Rules using default retry settings (185 attempts over 24h) for time-sensitive events—recommend tuning.
15. **Missing Tags:** Rules and buses missing tags for `Environment`, `Application`, `Owner`.
16. **Lambda Target Throttling:** Rules targeting Lambda functions approaching concurrency limits—identify systematic failure risk.
17. **SQS FIFO Target Issues:** Rules targeting SQS FIFO queues without `MessageGroupId`—causes delivery failure.

**Filters and exclusions:**
- Only rules with >10 invocations/day (CloudWatch metrics required).
- Exclude rules or event buses tagged `ExcludeFromAnalysis: true` (case-insensitive).
- Ignore any rules or buses with `test-` or `dev-` prefix.

**Outputs must include:**

- **Console:** Print event routing health per rule and bus—failure rates, DLQ status, and risk assessment.
- **eventbridge_analysis.json:** Structured by:
    - `event_buses`: List with bus config, tags, encryption, resource policies, archive config, usage stats.
    - `rules`: List with rule config, enabled state, event pattern, tags, DLQ setup, targets, input transformer, invocations, failures, retry policy, Lambda/SQS settings.
    - `dlq_analysis`: DLQ status per relevant rule, message depth, alarm setup need, recent event counts.
    - `event_pattern_analysis`: Detailed patterns, breadth/precision, recommended refinements.
    - `summary`: Aggregate stats (rules audited, buses audited, total daily events, failed invocations, loss risk, DLQ coverage gap, consolidation recommendations).
- **event_routing_topology.html:** Visualization covering buses, rules, and connections to targets (Lambda/SQS/SNS).
- **dlq_monitoring_setup.sh:** Shell script to create CloudWatch alarms for all DLQs in need.
- **event_pattern_optimization.json:** Refined event patterns for improved accuracy+efficiency.

**Additional specs:**

- Must surface permanent event loss risks, DLQ gaps, retry/buffering problems, tag/governance gaps, redundant/failing integrations.
- Use CloudWatch metrics for per-rule invocation/failure stats and for DLQ depth/arrival.
- For rules/buses with missing or misconfigured resource policies/tags/encryption, always provide practical remediation.
- All actionable recommendations must be defect-specific and prioritized.
- Outputs (JSON, HTML, shell script) must be formatted exactly as described.

**Environment:**

- AWS us-east-1, EventBridge, Lambda, SQS, SNS, KMS, CloudWatch
- Python 3.12, Boto3, visual/charting libraries for HTML topology visualization

_Do not omit, reinterpret, or modify any requirement, exclusion, or output structure given above. Generate all deliverables as specified._