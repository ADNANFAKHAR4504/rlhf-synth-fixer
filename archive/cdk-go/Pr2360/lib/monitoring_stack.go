package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type MonitoringStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	Database          awsrds.IDatabaseCluster
	LoadBalancer      awselasticloadbalancingv2.IApplicationLoadBalancer
}

type MonitoringStack struct {
	awscdk.NestedStack
}

func NewMonitoringStack(scope constructs.Construct, id *string, props *MonitoringStackProps) *MonitoringStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// Get environment suffix with fallback
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil && *props.EnvironmentSuffix != "" {
		envSuffix = *props.EnvironmentSuffix
	}

	// SNS Topic for notifications - will be used for alarms later
	_ = awssns.NewTopic(nestedStack, jsii.String("AlertsTopic"), &awssns.TopicProps{
		TopicName:   jsii.String("tap-alerts-" + envSuffix),
		DisplayName: jsii.String("TAP Application Alerts"),
	})

	// CloudWatch Dashboard
	dashboard := awscloudwatch.NewDashboard(nestedStack, jsii.String("ApplicationDashboard"), &awscloudwatch.DashboardProps{
		DashboardName: jsii.String("TAP-" + envSuffix),
	})

	// EC2 Instance Monitoring (replacing EKS monitoring)
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("EC2 Instance CPU Utilization"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace:  jsii.String("AWS/EC2"),
					MetricName: jsii.String("CPUUtilization"),
					Statistic:  jsii.String("Average"),
				}),
			},
		}),
	)

	// Database Monitoring
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("Database Connections"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace:  jsii.String("AWS/RDS"),
					MetricName: jsii.String("DatabaseConnections"),
					DimensionsMap: &map[string]*string{
						"DBClusterIdentifier": props.Database.ClusterIdentifier(),
					},
				}),
			},
		}),
	)

	// Load Balancer Monitoring
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("Load Balancer Request Count"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace:  jsii.String("AWS/ApplicationELB"),
					MetricName: jsii.String("RequestCount"),
					DimensionsMap: &map[string]*string{
						"LoadBalancer": props.LoadBalancer.LoadBalancerArn(),
					},
				}),
			},
		}),
	)

	// CloudWatch Alarms
	awscloudwatch.NewAlarm(nestedStack, jsii.String("HighCPUAlarm"), &awscloudwatch.AlarmProps{
		AlarmName: jsii.String("TAP-HighCPU-" + envSuffix),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/EC2"),
			MetricName: jsii.String("CPUUtilization"),
			Statistic:  jsii.String("Average"),
		}),
		Threshold:          jsii.Number(80),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
	})

	// Lambda function for operational tasks
	operationalLambda := awslambda.NewFunction(nestedStack, jsii.String("OperationalFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String("tap-ops-" + envSuffix),
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("index.handler"),
		Code: awslambda.Code_FromInline(jsii.String(`
import json
import boto3

def handler(event, context):
    """
    Operational tasks handler
    """
    print("Performing operational task:", json.dumps(event))
    
    # Example: Auto-scaling adjustments, log rotation, etc.
    
    return {
        'statusCode': 200,
        'body': json.dumps('Operational task completed')
    }
		`)),
		Description: jsii.String("Lambda function for automated operational tasks"),
		Timeout:     awscdk.Duration_Minutes(jsii.Number(5)),
	})

	// Grant necessary permissions to Lambda
	operationalLambda.Role().AddManagedPolicy(
		awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("CloudWatchLogsFullAccess")),
	)

	return &MonitoringStack{
		NestedStack: nestedStack,
	}
}
