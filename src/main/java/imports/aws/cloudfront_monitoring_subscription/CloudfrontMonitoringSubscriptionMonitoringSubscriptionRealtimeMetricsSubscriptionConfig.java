package imports.aws.cloudfront_monitoring_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontMonitoringSubscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig.Jsii$Proxy.class)
public interface CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_monitoring_subscription#realtime_metrics_subscription_status CloudfrontMonitoringSubscription#realtime_metrics_subscription_status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRealtimeMetricsSubscriptionStatus();

    /**
     * @return a {@link Builder} of {@link CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig> {
        java.lang.String realtimeMetricsSubscriptionStatus;

        /**
         * Sets the value of {@link CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig#getRealtimeMetricsSubscriptionStatus}
         * @param realtimeMetricsSubscriptionStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_monitoring_subscription#realtime_metrics_subscription_status CloudfrontMonitoringSubscription#realtime_metrics_subscription_status}. This parameter is required.
         * @return {@code this}
         */
        public Builder realtimeMetricsSubscriptionStatus(java.lang.String realtimeMetricsSubscriptionStatus) {
            this.realtimeMetricsSubscriptionStatus = realtimeMetricsSubscriptionStatus;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig {
        private final java.lang.String realtimeMetricsSubscriptionStatus;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.realtimeMetricsSubscriptionStatus = software.amazon.jsii.Kernel.get(this, "realtimeMetricsSubscriptionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.realtimeMetricsSubscriptionStatus = java.util.Objects.requireNonNull(builder.realtimeMetricsSubscriptionStatus, "realtimeMetricsSubscriptionStatus is required");
        }

        @Override
        public final java.lang.String getRealtimeMetricsSubscriptionStatus() {
            return this.realtimeMetricsSubscriptionStatus;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("realtimeMetricsSubscriptionStatus", om.valueToTree(this.getRealtimeMetricsSubscriptionStatus()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontMonitoringSubscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig.Jsii$Proxy that = (CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig.Jsii$Proxy) o;

            return this.realtimeMetricsSubscriptionStatus.equals(that.realtimeMetricsSubscriptionStatus);
        }

        @Override
        public final int hashCode() {
            int result = this.realtimeMetricsSubscriptionStatus.hashCode();
            return result;
        }
    }
}
