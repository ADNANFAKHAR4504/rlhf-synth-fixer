package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.cloudwatch.Dashboard;
import com.pulumi.aws.cloudwatch.DashboardArgs;
import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Objects;

public class ObservabilityDashboard extends ComponentResource {
    private final Output<String> dashboardUrl;

    public static class ObservabilityDashboardArgs {
        private Output<String> stackSetId;
        private List<String> regions;

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final ObservabilityDashboardArgs args = new ObservabilityDashboardArgs();

            public Builder stackSetId(Output<String> stackSetId) {
                args.stackSetId = stackSetId;
                return this;
            }

            public Builder regions(List<String> regions) {
                args.regions = regions;
                return this;
            }

            public ObservabilityDashboardArgs build() {
                return args;
            }
        }
    }

    public ObservabilityDashboard(String name, ObservabilityDashboardArgs args, Provider provider) {
        super("custom:aws:ObservabilityDashboard", name, ComponentResourceOptions.builder()
                .provider(provider)
                .build());

        // Create log group for application logs
        var logGroup = new LogGroup("web-app-logs", LogGroupArgs.builder()
                .name("/aws/web-application/logs")
                .retentionInDays(30)
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Create CloudWatch dashboard
        var dashboard = new Dashboard("web-app-dashboard", DashboardArgs.builder()
                .dashboardName("WebApplication-MultiRegion-Dashboard")
                .dashboardBody(createDashboardBody(args.regions))
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        this.dashboardUrl = Output.tuple(
                provider.region(),
                dashboard.dashboardArn(),
                dashboard.dashboardName()
        ).applyValue(values -> {
            assert Objects.requireNonNull(values.t1).isPresent();
            var region = values.t1;
            var dashboardName = (values.t3 != null && !values.t3.isEmpty()) ? values.t3 : "";

            return String.format(
                    "https://console.aws.amazon.com/cloudwatch/home?region=%s#dashboards:name=%s",
                    region, dashboardName
            );
        });
    }

    private String createDashboardBody(List<String> regions) {
        StringBuilder widgets = new StringBuilder();
        widgets.append("\"widgets\": [");

        // Add widgets for each region
        for (int i = 0; i < regions.size(); i++) {
            String region = regions.get(i);
            if (i > 0) widgets.append(",");

            widgets.append(String.format("""
                    {
                        "type": "metric",
                        "x": %d,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/multi-region-web-app-alb"],
                                [".", "TargetResponseTime", ".", "."],
                                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "multi-region-web-app-asg"]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "%s",
                            "title": "Application Metrics - %s"
                        }
                    }
                    """, (i % 2) * 12, region, region));
        }

        widgets.append("]");

        return String.format("""
                {
                    %s
                }
                """, widgets.toString());
    }

    public Output<String> getDashboardUrl() {
        return dashboardUrl;
    }
}