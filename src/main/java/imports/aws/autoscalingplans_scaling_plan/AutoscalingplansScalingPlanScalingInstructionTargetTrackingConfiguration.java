package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration")
@software.amazon.jsii.Jsii.Proxy(AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration.Jsii$Proxy.class)
public interface AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#target_value AutoscalingplansScalingPlan#target_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTargetValue();

    /**
     * customized_scaling_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#customized_scaling_metric_specification AutoscalingplansScalingPlan#customized_scaling_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification getCustomizedScalingMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#disable_scale_in AutoscalingplansScalingPlan#disable_scale_in}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableScaleIn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#estimated_instance_warmup AutoscalingplansScalingPlan#estimated_instance_warmup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getEstimatedInstanceWarmup() {
        return null;
    }

    /**
     * predefined_scaling_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_scaling_metric_specification AutoscalingplansScalingPlan#predefined_scaling_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification getPredefinedScalingMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scale_in_cooldown AutoscalingplansScalingPlan#scale_in_cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScaleInCooldown() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scale_out_cooldown AutoscalingplansScalingPlan#scale_out_cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScaleOutCooldown() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration> {
        java.lang.Number targetValue;
        imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification customizedScalingMetricSpecification;
        java.lang.Object disableScaleIn;
        java.lang.Number estimatedInstanceWarmup;
        imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification predefinedScalingMetricSpecification;
        java.lang.Number scaleInCooldown;
        java.lang.Number scaleOutCooldown;

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getTargetValue}
         * @param targetValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#target_value AutoscalingplansScalingPlan#target_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetValue(java.lang.Number targetValue) {
            this.targetValue = targetValue;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getCustomizedScalingMetricSpecification}
         * @param customizedScalingMetricSpecification customized_scaling_metric_specification block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#customized_scaling_metric_specification AutoscalingplansScalingPlan#customized_scaling_metric_specification}
         * @return {@code this}
         */
        public Builder customizedScalingMetricSpecification(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification customizedScalingMetricSpecification) {
            this.customizedScalingMetricSpecification = customizedScalingMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getDisableScaleIn}
         * @param disableScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#disable_scale_in AutoscalingplansScalingPlan#disable_scale_in}.
         * @return {@code this}
         */
        public Builder disableScaleIn(java.lang.Boolean disableScaleIn) {
            this.disableScaleIn = disableScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getDisableScaleIn}
         * @param disableScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#disable_scale_in AutoscalingplansScalingPlan#disable_scale_in}.
         * @return {@code this}
         */
        public Builder disableScaleIn(com.hashicorp.cdktf.IResolvable disableScaleIn) {
            this.disableScaleIn = disableScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getEstimatedInstanceWarmup}
         * @param estimatedInstanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#estimated_instance_warmup AutoscalingplansScalingPlan#estimated_instance_warmup}.
         * @return {@code this}
         */
        public Builder estimatedInstanceWarmup(java.lang.Number estimatedInstanceWarmup) {
            this.estimatedInstanceWarmup = estimatedInstanceWarmup;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getPredefinedScalingMetricSpecification}
         * @param predefinedScalingMetricSpecification predefined_scaling_metric_specification block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_scaling_metric_specification AutoscalingplansScalingPlan#predefined_scaling_metric_specification}
         * @return {@code this}
         */
        public Builder predefinedScalingMetricSpecification(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification predefinedScalingMetricSpecification) {
            this.predefinedScalingMetricSpecification = predefinedScalingMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getScaleInCooldown}
         * @param scaleInCooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scale_in_cooldown AutoscalingplansScalingPlan#scale_in_cooldown}.
         * @return {@code this}
         */
        public Builder scaleInCooldown(java.lang.Number scaleInCooldown) {
            this.scaleInCooldown = scaleInCooldown;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration#getScaleOutCooldown}
         * @param scaleOutCooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scale_out_cooldown AutoscalingplansScalingPlan#scale_out_cooldown}.
         * @return {@code this}
         */
        public Builder scaleOutCooldown(java.lang.Number scaleOutCooldown) {
            this.scaleOutCooldown = scaleOutCooldown;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration {
        private final java.lang.Number targetValue;
        private final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification customizedScalingMetricSpecification;
        private final java.lang.Object disableScaleIn;
        private final java.lang.Number estimatedInstanceWarmup;
        private final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification predefinedScalingMetricSpecification;
        private final java.lang.Number scaleInCooldown;
        private final java.lang.Number scaleOutCooldown;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetValue = software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.customizedScalingMetricSpecification = software.amazon.jsii.Kernel.get(this, "customizedScalingMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification.class));
            this.disableScaleIn = software.amazon.jsii.Kernel.get(this, "disableScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.estimatedInstanceWarmup = software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.predefinedScalingMetricSpecification = software.amazon.jsii.Kernel.get(this, "predefinedScalingMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification.class));
            this.scaleInCooldown = software.amazon.jsii.Kernel.get(this, "scaleInCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scaleOutCooldown = software.amazon.jsii.Kernel.get(this, "scaleOutCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetValue = java.util.Objects.requireNonNull(builder.targetValue, "targetValue is required");
            this.customizedScalingMetricSpecification = builder.customizedScalingMetricSpecification;
            this.disableScaleIn = builder.disableScaleIn;
            this.estimatedInstanceWarmup = builder.estimatedInstanceWarmup;
            this.predefinedScalingMetricSpecification = builder.predefinedScalingMetricSpecification;
            this.scaleInCooldown = builder.scaleInCooldown;
            this.scaleOutCooldown = builder.scaleOutCooldown;
        }

        @Override
        public final java.lang.Number getTargetValue() {
            return this.targetValue;
        }

        @Override
        public final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationCustomizedScalingMetricSpecification getCustomizedScalingMetricSpecification() {
            return this.customizedScalingMetricSpecification;
        }

        @Override
        public final java.lang.Object getDisableScaleIn() {
            return this.disableScaleIn;
        }

        @Override
        public final java.lang.Number getEstimatedInstanceWarmup() {
            return this.estimatedInstanceWarmup;
        }

        @Override
        public final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfigurationPredefinedScalingMetricSpecification getPredefinedScalingMetricSpecification() {
            return this.predefinedScalingMetricSpecification;
        }

        @Override
        public final java.lang.Number getScaleInCooldown() {
            return this.scaleInCooldown;
        }

        @Override
        public final java.lang.Number getScaleOutCooldown() {
            return this.scaleOutCooldown;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetValue", om.valueToTree(this.getTargetValue()));
            if (this.getCustomizedScalingMetricSpecification() != null) {
                data.set("customizedScalingMetricSpecification", om.valueToTree(this.getCustomizedScalingMetricSpecification()));
            }
            if (this.getDisableScaleIn() != null) {
                data.set("disableScaleIn", om.valueToTree(this.getDisableScaleIn()));
            }
            if (this.getEstimatedInstanceWarmup() != null) {
                data.set("estimatedInstanceWarmup", om.valueToTree(this.getEstimatedInstanceWarmup()));
            }
            if (this.getPredefinedScalingMetricSpecification() != null) {
                data.set("predefinedScalingMetricSpecification", om.valueToTree(this.getPredefinedScalingMetricSpecification()));
            }
            if (this.getScaleInCooldown() != null) {
                data.set("scaleInCooldown", om.valueToTree(this.getScaleInCooldown()));
            }
            if (this.getScaleOutCooldown() != null) {
                data.set("scaleOutCooldown", om.valueToTree(this.getScaleOutCooldown()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration.Jsii$Proxy that = (AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration.Jsii$Proxy) o;

            if (!targetValue.equals(that.targetValue)) return false;
            if (this.customizedScalingMetricSpecification != null ? !this.customizedScalingMetricSpecification.equals(that.customizedScalingMetricSpecification) : that.customizedScalingMetricSpecification != null) return false;
            if (this.disableScaleIn != null ? !this.disableScaleIn.equals(that.disableScaleIn) : that.disableScaleIn != null) return false;
            if (this.estimatedInstanceWarmup != null ? !this.estimatedInstanceWarmup.equals(that.estimatedInstanceWarmup) : that.estimatedInstanceWarmup != null) return false;
            if (this.predefinedScalingMetricSpecification != null ? !this.predefinedScalingMetricSpecification.equals(that.predefinedScalingMetricSpecification) : that.predefinedScalingMetricSpecification != null) return false;
            if (this.scaleInCooldown != null ? !this.scaleInCooldown.equals(that.scaleInCooldown) : that.scaleInCooldown != null) return false;
            return this.scaleOutCooldown != null ? this.scaleOutCooldown.equals(that.scaleOutCooldown) : that.scaleOutCooldown == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetValue.hashCode();
            result = 31 * result + (this.customizedScalingMetricSpecification != null ? this.customizedScalingMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.disableScaleIn != null ? this.disableScaleIn.hashCode() : 0);
            result = 31 * result + (this.estimatedInstanceWarmup != null ? this.estimatedInstanceWarmup.hashCode() : 0);
            result = 31 * result + (this.predefinedScalingMetricSpecification != null ? this.predefinedScalingMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.scaleInCooldown != null ? this.scaleInCooldown.hashCode() : 0);
            result = 31 * result + (this.scaleOutCooldown != null ? this.scaleOutCooldown.hashCode() : 0);
            return result;
        }
    }
}
