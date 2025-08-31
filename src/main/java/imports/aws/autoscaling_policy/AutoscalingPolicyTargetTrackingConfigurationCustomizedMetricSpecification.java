package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.108Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification")
@software.amazon.jsii.Jsii.Proxy(AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification.Jsii$Proxy.class)
public interface AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * metric_dimension block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_dimension AutoscalingPolicy#metric_dimension}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMetricDimension() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_name AutoscalingPolicy#metric_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricName() {
        return null;
    }

    /**
     * metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metrics AutoscalingPolicy#metrics}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMetrics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#namespace AutoscalingPolicy#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#period AutoscalingPolicy#period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#statistic AutoscalingPolicy#statistic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatistic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#unit AutoscalingPolicy#unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification> {
        java.lang.Object metricDimension;
        java.lang.String metricName;
        java.lang.Object metrics;
        java.lang.String namespace;
        java.lang.Number period;
        java.lang.String statistic;
        java.lang.String unit;

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getMetricDimension}
         * @param metricDimension metric_dimension block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_dimension AutoscalingPolicy#metric_dimension}
         * @return {@code this}
         */
        public Builder metricDimension(com.hashicorp.cdktf.IResolvable metricDimension) {
            this.metricDimension = metricDimension;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getMetricDimension}
         * @param metricDimension metric_dimension block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_dimension AutoscalingPolicy#metric_dimension}
         * @return {@code this}
         */
        public Builder metricDimension(java.util.List<? extends imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetricDimension> metricDimension) {
            this.metricDimension = metricDimension;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getMetricName}
         * @param metricName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_name AutoscalingPolicy#metric_name}.
         * @return {@code this}
         */
        public Builder metricName(java.lang.String metricName) {
            this.metricName = metricName;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getMetrics}
         * @param metrics metrics block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metrics AutoscalingPolicy#metrics}
         * @return {@code this}
         */
        public Builder metrics(com.hashicorp.cdktf.IResolvable metrics) {
            this.metrics = metrics;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getMetrics}
         * @param metrics metrics block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metrics AutoscalingPolicy#metrics}
         * @return {@code this}
         */
        public Builder metrics(java.util.List<? extends imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecificationMetrics> metrics) {
            this.metrics = metrics;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#namespace AutoscalingPolicy#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getPeriod}
         * @param period Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#period AutoscalingPolicy#period}.
         * @return {@code this}
         */
        public Builder period(java.lang.Number period) {
            this.period = period;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getStatistic}
         * @param statistic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#statistic AutoscalingPolicy#statistic}.
         * @return {@code this}
         */
        public Builder statistic(java.lang.String statistic) {
            this.statistic = statistic;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#unit AutoscalingPolicy#unit}.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification {
        private final java.lang.Object metricDimension;
        private final java.lang.String metricName;
        private final java.lang.Object metrics;
        private final java.lang.String namespace;
        private final java.lang.Number period;
        private final java.lang.String statistic;
        private final java.lang.String unit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricDimension = software.amazon.jsii.Kernel.get(this, "metricDimension", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.metricName = software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metrics = software.amazon.jsii.Kernel.get(this, "metrics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.period = software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.statistic = software.amazon.jsii.Kernel.get(this, "statistic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricDimension = builder.metricDimension;
            this.metricName = builder.metricName;
            this.metrics = builder.metrics;
            this.namespace = builder.namespace;
            this.period = builder.period;
            this.statistic = builder.statistic;
            this.unit = builder.unit;
        }

        @Override
        public final java.lang.Object getMetricDimension() {
            return this.metricDimension;
        }

        @Override
        public final java.lang.String getMetricName() {
            return this.metricName;
        }

        @Override
        public final java.lang.Object getMetrics() {
            return this.metrics;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.Number getPeriod() {
            return this.period;
        }

        @Override
        public final java.lang.String getStatistic() {
            return this.statistic;
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

            if (this.getMetricDimension() != null) {
                data.set("metricDimension", om.valueToTree(this.getMetricDimension()));
            }
            if (this.getMetricName() != null) {
                data.set("metricName", om.valueToTree(this.getMetricName()));
            }
            if (this.getMetrics() != null) {
                data.set("metrics", om.valueToTree(this.getMetrics()));
            }
            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }
            if (this.getPeriod() != null) {
                data.set("period", om.valueToTree(this.getPeriod()));
            }
            if (this.getStatistic() != null) {
                data.set("statistic", om.valueToTree(this.getStatistic()));
            }
            if (this.getUnit() != null) {
                data.set("unit", om.valueToTree(this.getUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification.Jsii$Proxy that = (AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification.Jsii$Proxy) o;

            if (this.metricDimension != null ? !this.metricDimension.equals(that.metricDimension) : that.metricDimension != null) return false;
            if (this.metricName != null ? !this.metricName.equals(that.metricName) : that.metricName != null) return false;
            if (this.metrics != null ? !this.metrics.equals(that.metrics) : that.metrics != null) return false;
            if (this.namespace != null ? !this.namespace.equals(that.namespace) : that.namespace != null) return false;
            if (this.period != null ? !this.period.equals(that.period) : that.period != null) return false;
            if (this.statistic != null ? !this.statistic.equals(that.statistic) : that.statistic != null) return false;
            return this.unit != null ? this.unit.equals(that.unit) : that.unit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricDimension != null ? this.metricDimension.hashCode() : 0;
            result = 31 * result + (this.metricName != null ? this.metricName.hashCode() : 0);
            result = 31 * result + (this.metrics != null ? this.metrics.hashCode() : 0);
            result = 31 * result + (this.namespace != null ? this.namespace.hashCode() : 0);
            result = 31 * result + (this.period != null ? this.period.hashCode() : 0);
            result = 31 * result + (this.statistic != null ? this.statistic.hashCode() : 0);
            result = 31 * result + (this.unit != null ? this.unit.hashCode() : 0);
            return result;
        }
    }
}
