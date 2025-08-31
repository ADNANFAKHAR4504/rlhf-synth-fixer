package imports.aws.cloudwatch_metric_alarm;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.290Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchMetricAlarm.CloudwatchMetricAlarmMetricQueryMetric")
@software.amazon.jsii.Jsii.Proxy(CloudwatchMetricAlarmMetricQueryMetric.Jsii$Proxy.class)
public interface CloudwatchMetricAlarmMetricQueryMetric extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric_name CloudwatchMetricAlarm#metric_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#period CloudwatchMetricAlarm#period}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPeriod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#stat CloudwatchMetricAlarm#stat}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#dimensions CloudwatchMetricAlarm#dimensions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDimensions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#namespace CloudwatchMetricAlarm#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#unit CloudwatchMetricAlarm#unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchMetricAlarmMetricQueryMetric}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchMetricAlarmMetricQueryMetric}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchMetricAlarmMetricQueryMetric> {
        java.lang.String metricName;
        java.lang.Number period;
        java.lang.String stat;
        java.util.Map<java.lang.String, java.lang.String> dimensions;
        java.lang.String namespace;
        java.lang.String unit;

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQueryMetric#getMetricName}
         * @param metricName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric_name CloudwatchMetricAlarm#metric_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricName(java.lang.String metricName) {
            this.metricName = metricName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQueryMetric#getPeriod}
         * @param period Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#period CloudwatchMetricAlarm#period}. This parameter is required.
         * @return {@code this}
         */
        public Builder period(java.lang.Number period) {
            this.period = period;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQueryMetric#getStat}
         * @param stat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#stat CloudwatchMetricAlarm#stat}. This parameter is required.
         * @return {@code this}
         */
        public Builder stat(java.lang.String stat) {
            this.stat = stat;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQueryMetric#getDimensions}
         * @param dimensions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#dimensions CloudwatchMetricAlarm#dimensions}.
         * @return {@code this}
         */
        public Builder dimensions(java.util.Map<java.lang.String, java.lang.String> dimensions) {
            this.dimensions = dimensions;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQueryMetric#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#namespace CloudwatchMetricAlarm#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricAlarmMetricQueryMetric#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#unit CloudwatchMetricAlarm#unit}.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchMetricAlarmMetricQueryMetric}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchMetricAlarmMetricQueryMetric build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchMetricAlarmMetricQueryMetric}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchMetricAlarmMetricQueryMetric {
        private final java.lang.String metricName;
        private final java.lang.Number period;
        private final java.lang.String stat;
        private final java.util.Map<java.lang.String, java.lang.String> dimensions;
        private final java.lang.String namespace;
        private final java.lang.String unit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricName = software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.period = software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stat = software.amazon.jsii.Kernel.get(this, "stat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensions = software.amazon.jsii.Kernel.get(this, "dimensions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricName = java.util.Objects.requireNonNull(builder.metricName, "metricName is required");
            this.period = java.util.Objects.requireNonNull(builder.period, "period is required");
            this.stat = java.util.Objects.requireNonNull(builder.stat, "stat is required");
            this.dimensions = builder.dimensions;
            this.namespace = builder.namespace;
            this.unit = builder.unit;
        }

        @Override
        public final java.lang.String getMetricName() {
            return this.metricName;
        }

        @Override
        public final java.lang.Number getPeriod() {
            return this.period;
        }

        @Override
        public final java.lang.String getStat() {
            return this.stat;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getDimensions() {
            return this.dimensions;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metricName", om.valueToTree(this.getMetricName()));
            data.set("period", om.valueToTree(this.getPeriod()));
            data.set("stat", om.valueToTree(this.getStat()));
            if (this.getDimensions() != null) {
                data.set("dimensions", om.valueToTree(this.getDimensions()));
            }
            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }
            if (this.getUnit() != null) {
                data.set("unit", om.valueToTree(this.getUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchMetricAlarm.CloudwatchMetricAlarmMetricQueryMetric"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchMetricAlarmMetricQueryMetric.Jsii$Proxy that = (CloudwatchMetricAlarmMetricQueryMetric.Jsii$Proxy) o;

            if (!metricName.equals(that.metricName)) return false;
            if (!period.equals(that.period)) return false;
            if (!stat.equals(that.stat)) return false;
            if (this.dimensions != null ? !this.dimensions.equals(that.dimensions) : that.dimensions != null) return false;
            if (this.namespace != null ? !this.namespace.equals(that.namespace) : that.namespace != null) return false;
            return this.unit != null ? this.unit.equals(that.unit) : that.unit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricName.hashCode();
            result = 31 * result + (this.period.hashCode());
            result = 31 * result + (this.stat.hashCode());
            result = 31 * result + (this.dimensions != null ? this.dimensions.hashCode() : 0);
            result = 31 * result + (this.namespace != null ? this.namespace.hashCode() : 0);
            result = 31 * result + (this.unit != null ? this.unit.hashCode() : 0);
            return result;
        }
    }
}
