package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification")
@software.amazon.jsii.Jsii.Proxy(AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification.Jsii$Proxy.class)
public interface AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_scaling_metric_type AutoscalingplansScalingPlan#predefined_scaling_metric_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPredefinedScalingMetricType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#resource_label AutoscalingplansScalingPlan#resource_label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceLabel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification> {
        java.lang.String predefinedScalingMetricType;
        java.lang.String resourceLabel;

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification#getPredefinedScalingMetricType}
         * @param predefinedScalingMetricType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_scaling_metric_type AutoscalingplansScalingPlan#predefined_scaling_metric_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder predefinedScalingMetricType(java.lang.String predefinedScalingMetricType) {
            this.predefinedScalingMetricType = predefinedScalingMetricType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification#getResourceLabel}
         * @param resourceLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#resource_label AutoscalingplansScalingPlan#resource_label}.
         * @return {@code this}
         */
        public Builder resourceLabel(java.lang.String resourceLabel) {
            this.resourceLabel = resourceLabel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification {
        private final java.lang.String predefinedScalingMetricType;
        private final java.lang.String resourceLabel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.predefinedScalingMetricType = software.amazon.jsii.Kernel.get(this, "predefinedScalingMetricType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceLabel = software.amazon.jsii.Kernel.get(this, "resourceLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.predefinedScalingMetricType = java.util.Objects.requireNonNull(builder.predefinedScalingMetricType, "predefinedScalingMetricType is required");
            this.resourceLabel = builder.resourceLabel;
        }

        @Override
        public final java.lang.String getPredefinedScalingMetricType() {
            return this.predefinedScalingMetricType;
        }

        @Override
        public final java.lang.String getResourceLabel() {
            return this.resourceLabel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("predefinedScalingMetricType", om.valueToTree(this.getPredefinedScalingMetricType()));
            if (this.getResourceLabel() != null) {
                data.set("resourceLabel", om.valueToTree(this.getResourceLabel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification.Jsii$Proxy that = (AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification.Jsii$Proxy) o;

            if (!predefinedScalingMetricType.equals(that.predefinedScalingMetricType)) return false;
            return this.resourceLabel != null ? this.resourceLabel.equals(that.resourceLabel) : that.resourceLabel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.predefinedScalingMetricType.hashCode();
            result = 31 * result + (this.resourceLabel != null ? this.resourceLabel.hashCode() : 0);
            return result;
        }
    }
}
