We need a resource and cost optimization audit for our microservices containers on AWS in `us-east-1`. Please create a Python 3.12 CLI tool called `analyze_container_resources.py` using **Boto3** and **Pandas** to analyze ECS and EKS utilization and make actionable recommendations.

**Analysis the script must perform:**

1. **ECS Over-Provisioning:** Find ECS tasks with CPU reservation > 2x actual CPU usage _and_ memory reservation > 2x real usage (use CloudWatch Container Insights metrics).
2. **Underutilized EKS Nodes:** Locate EKS nodes with average CPU < 30% and memory < 40% over 14 days (CloudWatch/EC2 metrics).
3. **Missing Auto Scaling:** Find ECS services & EKS deployments _without_ auto-scaling—flag if traffic is variable.
4. **Inefficient Task Placement:** Identify ECS Fargate tasks using <0.5 vCPU & <1GB memory (recommend switching to EC2 launch type).
5. **No Resource Limits:** Flag EKS pods without _both_ CPU and memory limits defined.
6. **Singleton/HA Risks:** ECS services with desired count = 1 and no HA (multi-AZ/tasks) warning.
7. **Old Container Images:** ECS/EKS tasks running container images >90 days old.
8. **No Health Checks:** ECS services with no health checks for LB integration.
9. **Excessive Task Revisions:** ECS services with >50 task definition revisions (possible deployment/config churn).
10. **Spot Instance Opportunity:** EKS node groups with _only_ on-demand backing—suggest enabling spot for savings.
11. **Cluster Overprovisioning:** ECS clusters with >40% unused CPU/memory capacity.
12. **Missing Logging:** Containers without CloudWatch Logs or Fluent Bit aggregation.
13. **No Service Discovery:** ECS services not using ECS Service Discovery when communicating with other services.

**Audit rules/exclusions:**
- **Only analyze services/tasks running >14 days**.
- **Skip any ECS/EKS clusters tagged ExcludeFromAnalysis: true (case-insensitive)**.
- **Ignore services with names starting with `dev-`**.

**Output should include:**
- **Console:** Print top optimization recommendations for ECS/EKS, showing current vs. optimized allocs and cost savings.
- **container_optimization.json**: Capture:
    - `ecs_findings`: `[ {cluster_name, service_name, task_definition, current_cpu, current_memory, recommended_cpu, recommended_memory, monthly_savings} ]`
    - `eks_findings`: `[ {node_group, instance_type, current_utilization, recommended_changes, spot_savings_potential} ]`
    - `summary`: `{total_ecs_services, total_eks_nodes, total_monthly_savings, services_requiring_attention}`
- **rightsizing_plan.csv**: List of implementation steps and new recommended resource configs.
- **resource_utilization_trends.png**: CPU/memory usage histogram/distribution (matplotlib/seaborn).
- All cost savings/estimates must be calculated and shown in report files.

**Environment:**
- AWS us-east-1, ECS, EKS (EC2 & pod APIs), CloudWatch Container Insights, Auto Scaling, Python 3.12+, Boto3, Pandas
- May use matplotlib and seaborn for charting.

**Delivery:**
- Main script as `analyze_container_resources.py` (Python code block)
- Any charting/Jinja2 templates, add inline or as extra blocks

**_No requirement, exclusion, audit, or output structure may be omitted, softened, or changed from the prompt above. Deliverables must follow exactly._**