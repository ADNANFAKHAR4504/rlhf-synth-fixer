"""
CloudWatch Alarms infrastructure module.

Creates CloudWatch alarms for key thresholds with proper error rate calculations
using metric math expressions.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig
from .sns_topics import SNSTopicsStack


class AlarmsStack:
    """
    CloudWatch Alarms stack for monitoring key metrics.
    
    Creates alarms for:
    - Error rates (using metric math for percentage calculation)
    - API latency
    - Database connection failures
    - Composite alarms for system degradation
    """
    
    def __init__(
        self,
        config: ObservabilityConfig,
        provider_manager: AWSProviderManager,
        sns_stack: SNSTopicsStack
    ):
        """
        Initialize the Alarms stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
            sns_stack: SNS topics stack
        """
        self.config = config
        self.provider_manager = provider_manager
        self.sns_stack = sns_stack
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        
        # Create alarms
        self._create_error_rate_alarm()
        self._create_api_latency_alarm()
        self._create_db_connection_failures_alarm()
        self._create_transaction_anomaly_alarm()
        self._create_composite_alarms()
    
    def _create_error_rate_alarm(self) -> None:
        """
        Create error rate alarm using metric math to calculate percentage.
        
        This addresses model failure #1 and #2 by using metric math to compute
        error rate as (ErrorCount / TransactionVolume) * 100.
        """
        self.alarms['error_rate'] = aws.cloudwatch.MetricAlarm(
            'alarm-error-rate',
            name=self.config.get_resource_name('high-error-rate'),
            alarm_description=f'Error rate exceeds {self.config.error_rate_threshold}%',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            threshold=self.config.error_rate_threshold,
            treat_missing_data='notBreaching',
            alarm_actions=[self.sns_stack.get_topic_arn('critical')],
            ok_actions=[self.sns_stack.get_topic_arn('info')],
            # Use metric math to calculate error rate percentage
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='m1',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='ErrorCount',
                        namespace=self.config.metric_namespace,
                        period=60,
                        stat='Sum'
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='m2',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='TransactionVolume',
                        namespace=self.config.metric_namespace,
                        period=60,
                        stat='Sum'
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='e1',
                    expression='(m1 / m2) * 100',
                    label='Error Rate %',
                    return_data=True
                )
            ],
            tags=self.config.get_tags_for_resource(
                'Alarm',
                Severity='Critical',
                Component='ErrorRate'
            ),
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_api_latency_alarm(self) -> None:
        """Create API latency alarm for >500ms threshold."""
        self.alarms['api_latency'] = aws.cloudwatch.MetricAlarm(
            'alarm-api-latency',
            name=self.config.get_resource_name('api-high-latency'),
            alarm_description=f'API latency exceeds {self.config.api_latency_threshold}ms',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=3,
            metric_name='APILatency',
            namespace=self.config.metric_namespace,
            period=60,
            extended_statistic='p99',
            threshold=self.config.api_latency_threshold,
            treat_missing_data='notBreaching',
            alarm_actions=[self.sns_stack.get_topic_arn('warning')],
            ok_actions=[self.sns_stack.get_topic_arn('info')],
            tags=self.config.get_tags_for_resource(
                'Alarm',
                Severity='Warning',
                Component='APILatency'
            ),
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_db_connection_failures_alarm(self) -> None:
        """Create database connection failures alarm."""
        self.alarms['db_connections'] = aws.cloudwatch.MetricAlarm(
            'alarm-db-connections',
            name=self.config.get_resource_name('db-connection-failures'),
            alarm_description=f'Database connection failures exceed {self.config.db_connection_failure_threshold}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ConnectionFailures',
            namespace=self.config.metric_namespace,
            period=300,
            statistic='Sum',
            threshold=self.config.db_connection_failure_threshold,
            treat_missing_data='notBreaching',
            alarm_actions=[self.sns_stack.get_topic_arn('critical')],
            ok_actions=[self.sns_stack.get_topic_arn('info')],
            tags=self.config.get_tags_for_resource(
                'Alarm',
                Severity='Critical',
                Component='Database'
            ),
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_transaction_anomaly_alarm(self) -> None:
        """
        Create transaction volume anomaly detection alarm.
        
        Uses ANOMALY_DETECTION_BAND expression in metric math to detect
        unusual transaction patterns. No separate anomaly detector resource needed.
        """
        self.alarms['transaction_anomaly'] = aws.cloudwatch.MetricAlarm(
            'alarm-transaction-anomaly',
            name=self.config.get_resource_name('transaction-anomaly'),
            alarm_description='Unusual transaction volume detected',
            comparison_operator='LessThanLowerOrGreaterThanUpperThreshold',
            evaluation_periods=2,
            threshold_metric_id='ad1',
            treat_missing_data='notBreaching',
            alarm_actions=[self.sns_stack.get_topic_arn('warning')],
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='m1',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='TransactionVolume',
                        namespace=self.config.metric_namespace,
                        period=300,
                        stat='Sum'
                    ),
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='ad1',
                    expression='ANOMALY_DETECTION_BAND(m1, 2)',
                    label='TransactionVolume (expected)',
                    return_data=True
                )
            ],
            tags=self.config.get_tags_for_resource(
                'Alarm',
                Severity='Warning',
                Component='TransactionMonitoring'
            ),
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_composite_alarms(self) -> None:
        """Create composite alarms to reduce false positives."""
        # System degradation composite alarm
        Output.all(
            self.alarms['error_rate'].name,
            self.alarms['api_latency'].name,
            self.alarms['db_connections'].name
        ).apply(lambda names: aws.cloudwatch.CompositeAlarm(
            'composite-alarm-system-degradation',
            alarm_name=self.config.get_resource_name('system-degradation'),
            alarm_description='Multiple system components showing degradation',
            alarm_rule=f"(ALARM({names[0]}) OR ALARM({names[1]})) AND ALARM({names[2]})",
            actions_enabled=True,
            alarm_actions=[self.sns_stack.get_topic_arn('critical')],
            ok_actions=[self.sns_stack.get_topic_arn('info')],
            tags=self.config.get_tags_for_resource(
                'CompositeAlarm',
                Severity='Critical',
                Type='Composite'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[
                    self.alarms['error_rate'],
                    self.alarms['api_latency'],
                    self.alarms['db_connections']
                ]
            )
        ))
        
        # Performance degradation composite alarm
        Output.all(
            self.alarms['api_latency'].name,
            self.alarms['transaction_anomaly'].name
        ).apply(lambda names: aws.cloudwatch.CompositeAlarm(
            'composite-alarm-performance',
            alarm_name=self.config.get_resource_name('performance-degradation'),
            alarm_description='System performance degradation detected',
            alarm_rule=f"ALARM({names[0]}) AND ALARM({names[1]})",
            actions_enabled=True,
            alarm_actions=[self.sns_stack.get_topic_arn('warning')],
            tags=self.config.get_tags_for_resource(
                'CompositeAlarm',
                Severity='Warning',
                Type='Composite'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[
                    self.alarms['api_latency'],
                    self.alarms['transaction_anomaly']
                ]
            )
        ))
    
    def get_alarm(self, name: str) -> aws.cloudwatch.MetricAlarm:
        """
        Get an alarm by name.
        
        Args:
            name: Alarm name key
            
        Returns:
            CloudWatch Metric Alarm
        """
        return self.alarms.get(name)
    
    def get_alarm_name(self, name: str) -> Output[str]:
        """
        Get an alarm name as Output.
        
        Args:
            name: Alarm name key
            
        Returns:
            Alarm name as Output
        """
        alarm = self.alarms.get(name)
        return alarm.name if alarm else Output.from_input('')

