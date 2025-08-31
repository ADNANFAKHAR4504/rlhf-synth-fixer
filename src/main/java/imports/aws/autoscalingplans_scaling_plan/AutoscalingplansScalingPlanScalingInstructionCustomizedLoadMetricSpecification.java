package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification")
@software.amazon.jsii.Jsii.Proxy(AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification.Jsii$Proxy.class)
public interface AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#metric_name AutoscalingplansScalingPlan#metric_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#namespace AutoscalingplansScalingPlan#namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#statistic AutoscalingplansScalingPlan#statistic}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatistic();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#dimensions AutoscalingplansScalingPlan#dimensions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDimensions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#unit AutoscalingplansScalingPlan#unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification> {
        java.lang.String metricName;
        java.lang.String namespace;
        java.lang.String statistic;
        java.util.Map<java.lang.String, java.lang.String> dimensions;
        java.lang.String unit;

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification#getMetricName}
         * @param metricName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#metric_name AutoscalingplansScalingPlan#metric_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricName(java.lang.String metricName) {
            this.metricName = metricName;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#namespace AutoscalingplansScalingPlan#namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification#getStatistic}
         * @param statistic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#statistic AutoscalingplansScalingPlan#statistic}. This parameter is required.
         * @return {@code this}
         */
        public Builder statistic(java.lang.String statistic) {
            this.statistic = statistic;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification#getDimensions}
         * @param dimensions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#dimensions AutoscalingplansScalingPlan#dimensions}.
         * @return {@code this}
         */
        public Builder dimensions(java.util.Map<java.lang.String, java.lang.String> dimensions) {
            this.dimensions = dimensions;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#unit AutoscalingplansScalingPlan#unit}.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification {
        private final java.lang.String metricName;
        private final java.lang.String namespace;
        private final java.lang.String statistic;
        private final java.util.Map<java.lang.String, java.lang.String> dimensions;
        private final java.lang.String unit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricName = software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statistic = software.amazon.jsii.Kernel.get(this, "statistic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensions = software.amazon.jsii.Kernel.get(this, "dimensions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricName = java.util.Objects.requireNonNull(builder.metricName, "metricName is required");
            this.namespace = java.util.Objects.requireNonNull(builder.namespace, "namespace is required");
            this.statistic = java.util.Objects.requireNonNull(builder.statistic, "statistic is required");
            this.dimensions = builder.dimensions;
            this.unit = builder.unit;
        }

        @Override
        public final java.lang.String getMetricName() {
            return this.metricName;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.String getStatistic() {
            return this.statistic;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getDimensions() {
            return this.dimensions;
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
            data.set("namespace", om.valueToTree(this.getNamespace()));
            data.set("statistic", om.valueToTree(this.getStatistic()));
            if (this.getDimensions() != null) {
                data.set("dimensions", om.valueToTree(this.getDimensions()));
            }
            if (this.getUnit() != null) {
                data.set("unit", om.valueToTree(this.getUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification.Jsii$Proxy that = (AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification.Jsii$Proxy) o;

            if (!metricName.equals(that.metricName)) return false;
            if (!namespace.equals(that.namespace)) return false;
            if (!statistic.equals(that.statistic)) return false;
            if (this.dimensions != null ? !this.dimensions.equals(that.dimensions) : that.dimensions != null) return false;
            return this.unit != null ? this.unit.equals(that.unit) : that.unit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricName.hashCode();
            result = 31 * result + (this.namespace.hashCode());
            result = 31 * result + (this.statistic.hashCode());
            result = 31 * result + (this.dimensions != null ? this.dimensions.hashCode() : 0);
            result = 31 * result + (this.unit != null ? this.unit.hashCode() : 0);
            return result;
        }
    }
}
