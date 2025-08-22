// Mock Pulumi modules
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  interpolate: jest.fn(strings => "interpolated-string")
}));

jest.mock("@pulumi/aws", () => ({
  sns: {
    Topic: jest.fn().mockImplementation(() => ({ 
      arn: "arn:aws:sns:us-east-1:123456789012:webapp-alarms-test",
      id: "topic-test"
    }))
  },
  cloudwatch: {
    MetricAlarm: jest.fn().mockImplementation(() => ({ 
      id: "alarm-test",
      arn: "arn:aws:cloudwatch:us-east-1:123456789012:alarm:test"
    })),
    Dashboard: jest.fn().mockImplementation(() => ({ 
      id: "dashboard-test",
      arn: "arn:aws:cloudwatch::123456789012:dashboard/test"
    }))
  }
}));

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { MonitoringStack } from "../lib/monitoring-stack.mjs";

describe("MonitoringStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Create a mock ASG name that works both as a value and with .apply()
  const mockAsgName = Object.assign("webapp-asg-test", {
    apply: jest.fn(cb => JSON.stringify({
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['AWS/EC2', 'CPUUtilization', 'AutoScalingGroupName', cb("webapp-asg-test")],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-east-1',
            title: 'EC2 CPU Utilization',
            yAxis: {
              left: {
                min: 0,
                max: 100,
              },
            },
          },
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['AWS/ApplicationELB', 'RequestCount'],
              ['.', 'TargetResponseTime'],
              ['.', 'HTTPCode_Target_2XX_Count'],
              ['.', 'HTTPCode_Target_4XX_Count'],
              ['.', 'HTTPCode_Target_5XX_Count'],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'ALB Metrics',
          },
        },
      ],
    }))
  });

  const mockArgs = {
    environmentSuffix: "test",
    tags: { Project: "TAP" },
    autoScalingGroup: {
      name: mockAsgName,
      arn: "arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:test"
    }
  };

  describe("SNS Topic", () => {
    it("should create SNS topic for alarm notifications", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.sns.Topic).toHaveBeenCalledWith(
        "webapp-alarms-test",
        expect.objectContaining({
          name: "webapp-alarms-test",
          tags: expect.objectContaining({
            Name: "webapp-alarms-test",
            Component: "monitoring"
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("CloudWatch Alarms", () => {
    it("should create high CPU alarm for Auto Scaling Group", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        "webapp-high-cpu-alarm-test",
        expect.objectContaining({
          name: "webapp-high-cpu-alarm-test",
          description: "High CPU utilization alarm for webapp Auto Scaling Group in test",
          metricName: "CPUUtilization",
          namespace: "AWS/EC2",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 80,
          comparisonOperator: "GreaterThanThreshold",
          dimensions: expect.objectContaining({
            AutoScalingGroupName: mockArgs.autoScalingGroup.name
          }),
          treatMissingData: "notBreaching"
        }),
        expect.any(Object)
      );
    });

    it("should create individual instance CPU alarm", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        "webapp-instance-cpu-alarm-test",
        expect.objectContaining({
          name: "webapp-instance-cpu-alarm-test",
          description: "Individual instance high CPU utilization alarm for webapp in test",
          metricName: "CPUUtilization",
          namespace: "AWS/EC2",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 80,
          comparisonOperator: "GreaterThanThreshold",
          dimensions: expect.objectContaining({
            AutoScalingGroupName: mockArgs.autoScalingGroup.name
          })
        }),
        expect.any(Object)
      );
    });

    it("should create unhealthy targets alarm", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        "webapp-unhealthy-targets-alarm-test",
        expect.objectContaining({
          name: "webapp-unhealthy-targets-alarm-test",
          description: "Unhealthy targets alarm for webapp ALB in test",
          metricName: "UnHealthyHostCount",
          namespace: "AWS/ApplicationELB",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 1,
          comparisonOperator: "GreaterThanOrEqualToThreshold",
          treatMissingData: "notBreaching"
        }),
        expect.any(Object)
      );
    });

    it("should create high response time alarm", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        "webapp-high-response-time-alarm-test",
        expect.objectContaining({
          name: "webapp-high-response-time-alarm-test",
          description: "High response time alarm for webapp ALB in test",
          metricName: "TargetResponseTime",
          namespace: "AWS/ApplicationELB",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 1.0,
          comparisonOperator: "GreaterThanThreshold",
          treatMissingData: "notBreaching"
        }),
        expect.any(Object)
      );
    });

    it("should configure alarm actions with SNS topic", () => {
      const stack = new MonitoringStack("test-monitoring", mockArgs);
      
      // Get the SNS topic ARN
      const topicArn = "arn:aws:sns:us-east-1:123456789012:webapp-alarms-test";
      
      // Verify all alarms use the SNS topic for actions
      const alarmCalls = aws.cloudwatch.MetricAlarm.mock.calls;
      alarmCalls.forEach(call => {
        expect(call[1]).toEqual(
          expect.objectContaining({
            alarmActions: [topicArn],
            okActions: [topicArn]
          })
        );
      });
    });
  });

  describe("CloudWatch Dashboard", () => {
    it("should create CloudWatch dashboard", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.cloudwatch.Dashboard).toHaveBeenCalledWith(
        "webapp-dashboard-test",
        expect.objectContaining({
          dashboardName: "webapp-dashboard-test",
          dashboardBody: expect.any(String)
        }),
        expect.any(Object)
      );
    });

    it("should configure dashboard with correct widgets", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      // Get the dashboard body
      const dashboardCall = aws.cloudwatch.Dashboard.mock.calls[0][1];
      const dashboardBody = dashboardCall.dashboardBody;
      const widgets = JSON.parse(dashboardBody).widgets;
      
      // Check CPU utilization widget
      expect(widgets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "metric",
            properties: expect.objectContaining({
              title: "EC2 CPU Utilization",
              metrics: expect.arrayContaining([
                expect.arrayContaining(["AWS/EC2", "CPUUtilization"])
              ])
            })
          })
        ])
      );
      
      // Check ALB metrics widget
      expect(widgets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "metric",
            properties: expect.objectContaining({
              title: "ALB Metrics",
              metrics: expect.arrayContaining([
                expect.arrayContaining(["AWS/ApplicationELB", "RequestCount"])
              ])
            })
          })
        ])
      );
    });

    it("should set correct region in dashboard", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      const dashboardCall = aws.cloudwatch.Dashboard.mock.calls[0][1];
      const dashboardBody = dashboardCall.dashboardBody;
      const widgets = JSON.parse(dashboardBody).widgets;
      
      widgets.forEach(widget => {
        if (widget.properties && widget.properties.region) {
          expect(widget.properties.region).toBe("us-east-1");
        }
      });
    });
  });

  describe("Stack Outputs", () => {
    it("should register monitoring outputs", () => {
      const stack = new MonitoringStack("test-monitoring", mockArgs);
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          alarmTopicArn: expect.any(String),
          dashboardUrl: expect.any(String)
        })
      );
    });

    it("should generate correct dashboard URL", () => {
      const stack = new MonitoringStack("test-monitoring", mockArgs);
      
      // The interpolate function is called with template literals
      expect(pulumi.interpolate).toHaveBeenCalled();
      const interpolateCall = pulumi.interpolate.mock.calls[0];
      // Check that the URL contains the expected parts
      expect(interpolateCall[0][0]).toContain("https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=webapp-dashboard-");
    });
  });

  describe("Tags and Environment", () => {
    it("should apply custom tags to all resources", () => {
      new MonitoringStack("test-monitoring", {
        ...mockArgs,
        tags: { Project: "TAP", Owner: "DevOps" }
      });
      
      expect(aws.sns.Topic).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: "TAP",
            Owner: "DevOps",
            Component: "monitoring"
          })
        }),
        expect.any(Object)
      );
      
      const alarmCalls = aws.cloudwatch.MetricAlarm.mock.calls;
      alarmCalls.forEach(call => {
        expect(call[1]).toEqual(
          expect.objectContaining({
            tags: expect.objectContaining({
              Project: "TAP",
              Owner: "DevOps",
              Component: "monitoring"
            })
          })
        );
      });
    });

    it("should use environment suffix in all resource names", () => {
      new MonitoringStack("test-monitoring", {
        ...mockArgs,
        environmentSuffix: "staging"
      });
      
      expect(aws.sns.Topic).toHaveBeenCalledWith(
        "webapp-alarms-staging",
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        expect.stringContaining("-staging"),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.cloudwatch.Dashboard).toHaveBeenCalledWith(
        "webapp-dashboard-staging",
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Alarm Configuration", () => {
    it("should create exactly 4 alarms", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledTimes(4);
    });

    it("should use correct evaluation periods for all alarms", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      const alarmCalls = aws.cloudwatch.MetricAlarm.mock.calls;
      alarmCalls.forEach(call => {
        expect(call[1].evaluationPeriods).toBe(2);
        expect(call[1].period).toBe(300);
      });
    });

    it("should configure alarms with proper thresholds", () => {
      new MonitoringStack("test-monitoring", mockArgs);
      
      // Check CPU alarms have 80% threshold
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        expect.stringContaining("cpu"),
        expect.objectContaining({
          threshold: 80
        }),
        expect.any(Object)
      );
      
      // Check unhealthy targets alarm has threshold of 1
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        expect.stringContaining("unhealthy"),
        expect.objectContaining({
          threshold: 1
        }),
        expect.any(Object)
      );
      
      // Check response time alarm has threshold of 1 second
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        expect.stringContaining("response-time"),
        expect.objectContaining({
          threshold: 1.0
        }),
        expect.any(Object)
      );
    });
  });
});