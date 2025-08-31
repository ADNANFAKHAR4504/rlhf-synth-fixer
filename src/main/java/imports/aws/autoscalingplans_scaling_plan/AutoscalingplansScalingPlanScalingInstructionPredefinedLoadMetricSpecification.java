package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification")
@software.amazon.jsii.Jsii.Proxy(AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification.Jsii$Proxy.class)
public interface AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_load_metric_type AutoscalingplansScalingPlan#predefined_load_metric_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPredefinedLoadMetricType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#resource_label AutoscalingplansScalingPlan#resource_label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceLabel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification> {
        java.lang.String predefinedLoadMetricType;
        java.lang.String resourceLabel;

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification#getPredefinedLoadMetricType}
         * @param predefinedLoadMetricType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_load_metric_type AutoscalingplansScalingPlan#predefined_load_metric_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder predefinedLoadMetricType(java.lang.String predefinedLoadMetricType) {
            this.predefinedLoadMetricType = predefinedLoadMetricType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification#getResourceLabel}
         * @param resourceLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#resource_label AutoscalingplansScalingPlan#resource_label}.
         * @return {@code this}
         */
        public Builder resourceLabel(java.lang.String resourceLabel) {
            this.resourceLabel = resourceLabel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification {
        private final java.lang.String predefinedLoadMetricType;
        private final java.lang.String resourceLabel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.predefinedLoadMetricType = software.amazon.jsii.Kernel.get(this, "predefinedLoadMetricType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceLabel = software.amazon.jsii.Kernel.get(this, "resourceLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.predefinedLoadMetricType = java.util.Objects.requireNonNull(builder.predefinedLoadMetricType, "predefinedLoadMetricType is required");
            this.resourceLabel = builder.resourceLabel;
        }

        @Override
        public final java.lang.String getPredefinedLoadMetricType() {
            return this.predefinedLoadMetricType;
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

            data.set("predefinedLoadMetricType", om.valueToTree(this.getPredefinedLoadMetricType()));
            if (this.getResourceLabel() != null) {
                data.set("resourceLabel", om.valueToTree(this.getResourceLabel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification.Jsii$Proxy that = (AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification.Jsii$Proxy) o;

            if (!predefinedLoadMetricType.equals(that.predefinedLoadMetricType)) return false;
            return this.resourceLabel != null ? this.resourceLabel.equals(that.resourceLabel) : that.resourceLabel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.predefinedLoadMetricType.hashCode();
            result = 31 * result + (this.resourceLabel != null ? this.resourceLabel.hashCode() : 0);
            return result;
        }
    }
}
