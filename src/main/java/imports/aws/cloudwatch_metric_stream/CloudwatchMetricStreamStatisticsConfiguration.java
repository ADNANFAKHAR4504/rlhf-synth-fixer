package imports.aws.cloudwatch_metric_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.291Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchMetricStream.CloudwatchMetricStreamStatisticsConfiguration")
@software.amazon.jsii.Jsii.Proxy(CloudwatchMetricStreamStatisticsConfiguration.Jsii$Proxy.class)
public interface CloudwatchMetricStreamStatisticsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#additional_statistics CloudwatchMetricStream#additional_statistics}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdditionalStatistics();

    /**
     * include_metric block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_metric CloudwatchMetricStream#include_metric}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getIncludeMetric();

    /**
     * @return a {@link Builder} of {@link CloudwatchMetricStreamStatisticsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchMetricStreamStatisticsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchMetricStreamStatisticsConfiguration> {
        java.util.List<java.lang.String> additionalStatistics;
        java.lang.Object includeMetric;

        /**
         * Sets the value of {@link CloudwatchMetricStreamStatisticsConfiguration#getAdditionalStatistics}
         * @param additionalStatistics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#additional_statistics CloudwatchMetricStream#additional_statistics}. This parameter is required.
         * @return {@code this}
         */
        public Builder additionalStatistics(java.util.List<java.lang.String> additionalStatistics) {
            this.additionalStatistics = additionalStatistics;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamStatisticsConfiguration#getIncludeMetric}
         * @param includeMetric include_metric block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_metric CloudwatchMetricStream#include_metric}
         * @return {@code this}
         */
        public Builder includeMetric(com.hashicorp.cdktf.IResolvable includeMetric) {
            this.includeMetric = includeMetric;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamStatisticsConfiguration#getIncludeMetric}
         * @param includeMetric include_metric block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_metric CloudwatchMetricStream#include_metric}
         * @return {@code this}
         */
        public Builder includeMetric(java.util.List<? extends imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamStatisticsConfigurationIncludeMetric> includeMetric) {
            this.includeMetric = includeMetric;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchMetricStreamStatisticsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchMetricStreamStatisticsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchMetricStreamStatisticsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchMetricStreamStatisticsConfiguration {
        private final java.util.List<java.lang.String> additionalStatistics;
        private final java.lang.Object includeMetric;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.additionalStatistics = software.amazon.jsii.Kernel.get(this, "additionalStatistics", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.includeMetric = software.amazon.jsii.Kernel.get(this, "includeMetric", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.additionalStatistics = java.util.Objects.requireNonNull(builder.additionalStatistics, "additionalStatistics is required");
            this.includeMetric = java.util.Objects.requireNonNull(builder.includeMetric, "includeMetric is required");
        }

        @Override
        public final java.util.List<java.lang.String> getAdditionalStatistics() {
            return this.additionalStatistics;
        }

        @Override
        public final java.lang.Object getIncludeMetric() {
            return this.includeMetric;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("additionalStatistics", om.valueToTree(this.getAdditionalStatistics()));
            data.set("includeMetric", om.valueToTree(this.getIncludeMetric()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchMetricStream.CloudwatchMetricStreamStatisticsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchMetricStreamStatisticsConfiguration.Jsii$Proxy that = (CloudwatchMetricStreamStatisticsConfiguration.Jsii$Proxy) o;

            if (!additionalStatistics.equals(that.additionalStatistics)) return false;
            return this.includeMetric.equals(that.includeMetric);
        }

        @Override
        public final int hashCode() {
            int result = this.additionalStatistics.hashCode();
            result = 31 * result + (this.includeMetric.hashCode());
            return result;
        }
    }
}
