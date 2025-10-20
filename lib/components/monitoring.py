import pulumi
import pulumi_aws as aws
from pulumi import Output
import json

class MonitoringStack:
    def __init__(self, name: str,
                 cluster_name: Output[str],
                 blue_service_name: Output[str],
                 green_service_name: Output[str],
                 alb_arn: Output[str],
                 environment: str,
                 alert_email: str = None):
        self.name = name
        self.environment = environment
        self.alert_email = alert_email
        
        # SNS Topic for alerts
        self.sns_topic = aws.sns.Topic(
            f"{name}-alerts",
            display_name=f"{name} ECS Alerts",
            tags={"Name": f"{name}-alerts", "Environment": self.environment}
        )
        
        # Email subscription (replace with your email)
        if self.alert_email:
            aws.sns.TopicSubscription(
                f"{name}-email-subscription",
                topic=self.sns_topic.arn,
                protocol="email",
                endpoint=self.alert_email
            )
        
        # CloudWatch Dashboard
        self._create_dashboard(cluster_name, blue_service_name, 
                              green_service_name, alb_arn)
        
        # Create alarms for Blue deployment
        self._create_service_alarms("blue", cluster_name, blue_service_name)
        
        # Create alarms for Green deployment
        self._create_service_alarms("green", cluster_name, green_service_name)
        
        # ALB alarms
        self._create_alb_alarms(alb_arn)
    
    def _create_dashboard(self, cluster_name: Output[str], 
                         blue_service: Output[str],
                         green_service: Output[str],
                         alb_arn: Output[str]):
        """Create CloudWatch Dashboard"""
        
        dashboard_body = Output.all(
            cluster_name, blue_service, green_service, alb_arn
        ).apply(lambda args: self._generate_dashboard_json(
            args[0], args[1], args[2], args[3]
        ))
        
        aws.cloudwatch.Dashboard(
            f"{self.name}-dashboard",
            dashboard_name=f"{self.name}-ecs-dashboard",
            dashboard_body=dashboard_body
        )
    
    def _generate_dashboard_json(self, cluster: str, blue: str, 
                                green: str, alb: str):
        """Generate dashboard JSON configuration"""
        region = aws.get_region().name
        
        # Extract ALB name from ARN for metrics
        # Handle None or invalid ARN gracefully for testing
        if alb and isinstance(alb, str) and "/" in alb:
            alb_name = alb.split("/", 1)[1]
        else:
            alb_name = alb if alb else "mock-alb"
        
        # Handle None values for service/cluster names (for testing with minimal mocks)
        cluster_name = cluster if cluster else "mock-cluster"
        blue_name = blue if blue else "mock-blue-service"
        green_name = green if green else "mock-green-service"
        
        return json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "CPUUtilization", 
                             "ServiceName", blue_name, "ClusterName", cluster_name,
                             {"label": "Blue CPU"}],
                            [".", ".", "ServiceName", green_name, ".", ".",
                             {"label": "Green CPU"}],
                            [".", "MemoryUtilization", 
                             "ServiceName", blue_name, "ClusterName", cluster_name,
                             {"label": "Blue Memory"}],
                            [".", ".", "ServiceName", green_name, ".", ".",
                             {"label": "Green Memory"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "ECS Service Utilization",
                        "yAxis": {"left": {"min": 0, "max": 100}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime",
                             "LoadBalancer", alb_name],
                            [".", "RequestCount", ".", "."],
                            [".", "HTTPCode_Target_2XX_Count", ".", "."],
                            [".", "HTTPCode_Target_5XX_Count", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": region,
                        "title": "ALB Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "DesiredTaskCount", 
                             "ServiceName", blue_name, "ClusterName", cluster_name],
                            [".", "RunningTaskCount", ".", ".", ".", "."],
                            [".", "DesiredTaskCount", 
                             "ServiceName", green_name, "ClusterName", cluster_name],
                            [".", "RunningTaskCount", ".", ".", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "Task Count"
                    }
                }
            ]
        })
    
    def _create_service_alarms(self, deployment_type: str, 
                              cluster_name: Output[str],
                              service_name: Output[str]):
        """Create CloudWatch alarms for ECS service"""
        
        # High CPU alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-{deployment_type}-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            dimensions={
                "ClusterName": cluster_name,
                "ServiceName": service_name
            },
            alarm_description=f"Triggers when {deployment_type} CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching"
        )
        
        # High Memory alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-{deployment_type}-high-memory",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=85,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            dimensions={
                "ClusterName": cluster_name,
                "ServiceName": service_name
            },
            alarm_description=f"Triggers when {deployment_type} memory exceeds 85%",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching"
        )
        
        # Running task count alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-{deployment_type}-low-tasks",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            threshold=1,
            metric_name="RunningTaskCount",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            dimensions={
                "ClusterName": cluster_name,
                "ServiceName": service_name
            },
            alarm_description=f"Triggers when {deployment_type} has less than 1 running task",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="breaching"
        )
    
    def _create_alb_alarms(self, alb_arn: Output[str]):
        """Create CloudWatch alarms for ALB"""
        
        # Extract ALB name from ARN
        # Handle None or invalid ARN gracefully for testing
        def extract_alb_name(arn):
            if arn and isinstance(arn, str) and "/" in arn:
                return arn.split("/", 1)[1]
            return arn if arn else "mock-alb"
        
        alb_name = alb_arn.apply(extract_alb_name)
        
        # High latency alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-alb-high-latency",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=1.0,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            dimensions={
                "LoadBalancer": alb_name
            },
            alarm_description="Triggers when ALB response time exceeds 1 second",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching"
        )
        
        # High 5xx errors alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-alb-high-5xx",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=10,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            dimensions={
                "LoadBalancer": alb_name
            },
            alarm_description="Triggers when ALB 5xx errors exceed 10 in 5 minutes",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching"
        )
