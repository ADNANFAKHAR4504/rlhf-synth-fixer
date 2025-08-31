package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstruction")
@software.amazon.jsii.Jsii.Proxy(AutoscalingplansScalingPlanScalingInstruction.Jsii$Proxy.class)
public interface AutoscalingplansScalingPlanScalingInstruction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#max_capacity AutoscalingplansScalingPlan#max_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#min_capacity AutoscalingplansScalingPlan#min_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#resource_id AutoscalingplansScalingPlan#resource_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scalable_dimension AutoscalingplansScalingPlan#scalable_dimension}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScalableDimension();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#service_namespace AutoscalingplansScalingPlan#service_namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceNamespace();

    /**
     * target_tracking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#target_tracking_configuration AutoscalingplansScalingPlan#target_tracking_configuration}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTargetTrackingConfiguration();

    /**
     * customized_load_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#customized_load_metric_specification AutoscalingplansScalingPlan#customized_load_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification getCustomizedLoadMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#disable_dynamic_scaling AutoscalingplansScalingPlan#disable_dynamic_scaling}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableDynamicScaling() {
        return null;
    }

    /**
     * predefined_load_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_load_metric_specification AutoscalingplansScalingPlan#predefined_load_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification getPredefinedLoadMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predictive_scaling_max_capacity_behavior AutoscalingplansScalingPlan#predictive_scaling_max_capacity_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPredictiveScalingMaxCapacityBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predictive_scaling_max_capacity_buffer AutoscalingplansScalingPlan#predictive_scaling_max_capacity_buffer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPredictiveScalingMaxCapacityBuffer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predictive_scaling_mode AutoscalingplansScalingPlan#predictive_scaling_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPredictiveScalingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scaling_policy_update_behavior AutoscalingplansScalingPlan#scaling_policy_update_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScalingPolicyUpdateBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scheduled_action_buffer_time AutoscalingplansScalingPlan#scheduled_action_buffer_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScheduledActionBufferTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingplansScalingPlanScalingInstruction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingplansScalingPlanScalingInstruction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingplansScalingPlanScalingInstruction> {
        java.lang.Number maxCapacity;
        java.lang.Number minCapacity;
        java.lang.String resourceId;
        java.lang.String scalableDimension;
        java.lang.String serviceNamespace;
        java.lang.Object targetTrackingConfiguration;
        imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification customizedLoadMetricSpecification;
        java.lang.Object disableDynamicScaling;
        imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification predefinedLoadMetricSpecification;
        java.lang.String predictiveScalingMaxCapacityBehavior;
        java.lang.Number predictiveScalingMaxCapacityBuffer;
        java.lang.String predictiveScalingMode;
        java.lang.String scalingPolicyUpdateBehavior;
        java.lang.Number scheduledActionBufferTime;

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getMaxCapacity}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#max_capacity AutoscalingplansScalingPlan#max_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxCapacity(java.lang.Number maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getMinCapacity}
         * @param minCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#min_capacity AutoscalingplansScalingPlan#min_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder minCapacity(java.lang.Number minCapacity) {
            this.minCapacity = minCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getResourceId}
         * @param resourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#resource_id AutoscalingplansScalingPlan#resource_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceId(java.lang.String resourceId) {
            this.resourceId = resourceId;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getScalableDimension}
         * @param scalableDimension Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scalable_dimension AutoscalingplansScalingPlan#scalable_dimension}. This parameter is required.
         * @return {@code this}
         */
        public Builder scalableDimension(java.lang.String scalableDimension) {
            this.scalableDimension = scalableDimension;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getServiceNamespace}
         * @param serviceNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#service_namespace AutoscalingplansScalingPlan#service_namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceNamespace(java.lang.String serviceNamespace) {
            this.serviceNamespace = serviceNamespace;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getTargetTrackingConfiguration}
         * @param targetTrackingConfiguration target_tracking_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#target_tracking_configuration AutoscalingplansScalingPlan#target_tracking_configuration}
         * @return {@code this}
         */
        public Builder targetTrackingConfiguration(com.hashicorp.cdktf.IResolvable targetTrackingConfiguration) {
            this.targetTrackingConfiguration = targetTrackingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getTargetTrackingConfiguration}
         * @param targetTrackingConfiguration target_tracking_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#target_tracking_configuration AutoscalingplansScalingPlan#target_tracking_configuration}
         * @return {@code this}
         */
        public Builder targetTrackingConfiguration(java.util.List<? extends imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionTargetTrackingConfiguration> targetTrackingConfiguration) {
            this.targetTrackingConfiguration = targetTrackingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getCustomizedLoadMetricSpecification}
         * @param customizedLoadMetricSpecification customized_load_metric_specification block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#customized_load_metric_specification AutoscalingplansScalingPlan#customized_load_metric_specification}
         * @return {@code this}
         */
        public Builder customizedLoadMetricSpecification(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification customizedLoadMetricSpecification) {
            this.customizedLoadMetricSpecification = customizedLoadMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getDisableDynamicScaling}
         * @param disableDynamicScaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#disable_dynamic_scaling AutoscalingplansScalingPlan#disable_dynamic_scaling}.
         * @return {@code this}
         */
        public Builder disableDynamicScaling(java.lang.Boolean disableDynamicScaling) {
            this.disableDynamicScaling = disableDynamicScaling;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getDisableDynamicScaling}
         * @param disableDynamicScaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#disable_dynamic_scaling AutoscalingplansScalingPlan#disable_dynamic_scaling}.
         * @return {@code this}
         */
        public Builder disableDynamicScaling(com.hashicorp.cdktf.IResolvable disableDynamicScaling) {
            this.disableDynamicScaling = disableDynamicScaling;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getPredefinedLoadMetricSpecification}
         * @param predefinedLoadMetricSpecification predefined_load_metric_specification block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predefined_load_metric_specification AutoscalingplansScalingPlan#predefined_load_metric_specification}
         * @return {@code this}
         */
        public Builder predefinedLoadMetricSpecification(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification predefinedLoadMetricSpecification) {
            this.predefinedLoadMetricSpecification = predefinedLoadMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getPredictiveScalingMaxCapacityBehavior}
         * @param predictiveScalingMaxCapacityBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predictive_scaling_max_capacity_behavior AutoscalingplansScalingPlan#predictive_scaling_max_capacity_behavior}.
         * @return {@code this}
         */
        public Builder predictiveScalingMaxCapacityBehavior(java.lang.String predictiveScalingMaxCapacityBehavior) {
            this.predictiveScalingMaxCapacityBehavior = predictiveScalingMaxCapacityBehavior;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getPredictiveScalingMaxCapacityBuffer}
         * @param predictiveScalingMaxCapacityBuffer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predictive_scaling_max_capacity_buffer AutoscalingplansScalingPlan#predictive_scaling_max_capacity_buffer}.
         * @return {@code this}
         */
        public Builder predictiveScalingMaxCapacityBuffer(java.lang.Number predictiveScalingMaxCapacityBuffer) {
            this.predictiveScalingMaxCapacityBuffer = predictiveScalingMaxCapacityBuffer;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getPredictiveScalingMode}
         * @param predictiveScalingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#predictive_scaling_mode AutoscalingplansScalingPlan#predictive_scaling_mode}.
         * @return {@code this}
         */
        public Builder predictiveScalingMode(java.lang.String predictiveScalingMode) {
            this.predictiveScalingMode = predictiveScalingMode;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getScalingPolicyUpdateBehavior}
         * @param scalingPolicyUpdateBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scaling_policy_update_behavior AutoscalingplansScalingPlan#scaling_policy_update_behavior}.
         * @return {@code this}
         */
        public Builder scalingPolicyUpdateBehavior(java.lang.String scalingPolicyUpdateBehavior) {
            this.scalingPolicyUpdateBehavior = scalingPolicyUpdateBehavior;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanScalingInstruction#getScheduledActionBufferTime}
         * @param scheduledActionBufferTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#scheduled_action_buffer_time AutoscalingplansScalingPlan#scheduled_action_buffer_time}.
         * @return {@code this}
         */
        public Builder scheduledActionBufferTime(java.lang.Number scheduledActionBufferTime) {
            this.scheduledActionBufferTime = scheduledActionBufferTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingplansScalingPlanScalingInstruction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingplansScalingPlanScalingInstruction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingplansScalingPlanScalingInstruction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingplansScalingPlanScalingInstruction {
        private final java.lang.Number maxCapacity;
        private final java.lang.Number minCapacity;
        private final java.lang.String resourceId;
        private final java.lang.String scalableDimension;
        private final java.lang.String serviceNamespace;
        private final java.lang.Object targetTrackingConfiguration;
        private final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification customizedLoadMetricSpecification;
        private final java.lang.Object disableDynamicScaling;
        private final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification predefinedLoadMetricSpecification;
        private final java.lang.String predictiveScalingMaxCapacityBehavior;
        private final java.lang.Number predictiveScalingMaxCapacityBuffer;
        private final java.lang.String predictiveScalingMode;
        private final java.lang.String scalingPolicyUpdateBehavior;
        private final java.lang.Number scheduledActionBufferTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxCapacity = software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minCapacity = software.amazon.jsii.Kernel.get(this, "minCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.resourceId = software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalableDimension = software.amazon.jsii.Kernel.get(this, "scalableDimension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceNamespace = software.amazon.jsii.Kernel.get(this, "serviceNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetTrackingConfiguration = software.amazon.jsii.Kernel.get(this, "targetTrackingConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customizedLoadMetricSpecification = software.amazon.jsii.Kernel.get(this, "customizedLoadMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification.class));
            this.disableDynamicScaling = software.amazon.jsii.Kernel.get(this, "disableDynamicScaling", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.predefinedLoadMetricSpecification = software.amazon.jsii.Kernel.get(this, "predefinedLoadMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification.class));
            this.predictiveScalingMaxCapacityBehavior = software.amazon.jsii.Kernel.get(this, "predictiveScalingMaxCapacityBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.predictiveScalingMaxCapacityBuffer = software.amazon.jsii.Kernel.get(this, "predictiveScalingMaxCapacityBuffer", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.predictiveScalingMode = software.amazon.jsii.Kernel.get(this, "predictiveScalingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalingPolicyUpdateBehavior = software.amazon.jsii.Kernel.get(this, "scalingPolicyUpdateBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduledActionBufferTime = software.amazon.jsii.Kernel.get(this, "scheduledActionBufferTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxCapacity = java.util.Objects.requireNonNull(builder.maxCapacity, "maxCapacity is required");
            this.minCapacity = java.util.Objects.requireNonNull(builder.minCapacity, "minCapacity is required");
            this.resourceId = java.util.Objects.requireNonNull(builder.resourceId, "resourceId is required");
            this.scalableDimension = java.util.Objects.requireNonNull(builder.scalableDimension, "scalableDimension is required");
            this.serviceNamespace = java.util.Objects.requireNonNull(builder.serviceNamespace, "serviceNamespace is required");
            this.targetTrackingConfiguration = java.util.Objects.requireNonNull(builder.targetTrackingConfiguration, "targetTrackingConfiguration is required");
            this.customizedLoadMetricSpecification = builder.customizedLoadMetricSpecification;
            this.disableDynamicScaling = builder.disableDynamicScaling;
            this.predefinedLoadMetricSpecification = builder.predefinedLoadMetricSpecification;
            this.predictiveScalingMaxCapacityBehavior = builder.predictiveScalingMaxCapacityBehavior;
            this.predictiveScalingMaxCapacityBuffer = builder.predictiveScalingMaxCapacityBuffer;
            this.predictiveScalingMode = builder.predictiveScalingMode;
            this.scalingPolicyUpdateBehavior = builder.scalingPolicyUpdateBehavior;
            this.scheduledActionBufferTime = builder.scheduledActionBufferTime;
        }

        @Override
        public final java.lang.Number getMaxCapacity() {
            return this.maxCapacity;
        }

        @Override
        public final java.lang.Number getMinCapacity() {
            return this.minCapacity;
        }

        @Override
        public final java.lang.String getResourceId() {
            return this.resourceId;
        }

        @Override
        public final java.lang.String getScalableDimension() {
            return this.scalableDimension;
        }

        @Override
        public final java.lang.String getServiceNamespace() {
            return this.serviceNamespace;
        }

        @Override
        public final java.lang.Object getTargetTrackingConfiguration() {
            return this.targetTrackingConfiguration;
        }

        @Override
        public final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionCustomizedLoadMetricSpecification getCustomizedLoadMetricSpecification() {
            return this.customizedLoadMetricSpecification;
        }

        @Override
        public final java.lang.Object getDisableDynamicScaling() {
            return this.disableDynamicScaling;
        }

        @Override
        public final imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanScalingInstructionPredefinedLoadMetricSpecification getPredefinedLoadMetricSpecification() {
            return this.predefinedLoadMetricSpecification;
        }

        @Override
        public final java.lang.String getPredictiveScalingMaxCapacityBehavior() {
            return this.predictiveScalingMaxCapacityBehavior;
        }

        @Override
        public final java.lang.Number getPredictiveScalingMaxCapacityBuffer() {
            return this.predictiveScalingMaxCapacityBuffer;
        }

        @Override
        public final java.lang.String getPredictiveScalingMode() {
            return this.predictiveScalingMode;
        }

        @Override
        public final java.lang.String getScalingPolicyUpdateBehavior() {
            return this.scalingPolicyUpdateBehavior;
        }

        @Override
        public final java.lang.Number getScheduledActionBufferTime() {
            return this.scheduledActionBufferTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxCapacity", om.valueToTree(this.getMaxCapacity()));
            data.set("minCapacity", om.valueToTree(this.getMinCapacity()));
            data.set("resourceId", om.valueToTree(this.getResourceId()));
            data.set("scalableDimension", om.valueToTree(this.getScalableDimension()));
            data.set("serviceNamespace", om.valueToTree(this.getServiceNamespace()));
            data.set("targetTrackingConfiguration", om.valueToTree(this.getTargetTrackingConfiguration()));
            if (this.getCustomizedLoadMetricSpecification() != null) {
                data.set("customizedLoadMetricSpecification", om.valueToTree(this.getCustomizedLoadMetricSpecification()));
            }
            if (this.getDisableDynamicScaling() != null) {
                data.set("disableDynamicScaling", om.valueToTree(this.getDisableDynamicScaling()));
            }
            if (this.getPredefinedLoadMetricSpecification() != null) {
                data.set("predefinedLoadMetricSpecification", om.valueToTree(this.getPredefinedLoadMetricSpecification()));
            }
            if (this.getPredictiveScalingMaxCapacityBehavior() != null) {
                data.set("predictiveScalingMaxCapacityBehavior", om.valueToTree(this.getPredictiveScalingMaxCapacityBehavior()));
            }
            if (this.getPredictiveScalingMaxCapacityBuffer() != null) {
                data.set("predictiveScalingMaxCapacityBuffer", om.valueToTree(this.getPredictiveScalingMaxCapacityBuffer()));
            }
            if (this.getPredictiveScalingMode() != null) {
                data.set("predictiveScalingMode", om.valueToTree(this.getPredictiveScalingMode()));
            }
            if (this.getScalingPolicyUpdateBehavior() != null) {
                data.set("scalingPolicyUpdateBehavior", om.valueToTree(this.getScalingPolicyUpdateBehavior()));
            }
            if (this.getScheduledActionBufferTime() != null) {
                data.set("scheduledActionBufferTime", om.valueToTree(this.getScheduledActionBufferTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanScalingInstruction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingplansScalingPlanScalingInstruction.Jsii$Proxy that = (AutoscalingplansScalingPlanScalingInstruction.Jsii$Proxy) o;

            if (!maxCapacity.equals(that.maxCapacity)) return false;
            if (!minCapacity.equals(that.minCapacity)) return false;
            if (!resourceId.equals(that.resourceId)) return false;
            if (!scalableDimension.equals(that.scalableDimension)) return false;
            if (!serviceNamespace.equals(that.serviceNamespace)) return false;
            if (!targetTrackingConfiguration.equals(that.targetTrackingConfiguration)) return false;
            if (this.customizedLoadMetricSpecification != null ? !this.customizedLoadMetricSpecification.equals(that.customizedLoadMetricSpecification) : that.customizedLoadMetricSpecification != null) return false;
            if (this.disableDynamicScaling != null ? !this.disableDynamicScaling.equals(that.disableDynamicScaling) : that.disableDynamicScaling != null) return false;
            if (this.predefinedLoadMetricSpecification != null ? !this.predefinedLoadMetricSpecification.equals(that.predefinedLoadMetricSpecification) : that.predefinedLoadMetricSpecification != null) return false;
            if (this.predictiveScalingMaxCapacityBehavior != null ? !this.predictiveScalingMaxCapacityBehavior.equals(that.predictiveScalingMaxCapacityBehavior) : that.predictiveScalingMaxCapacityBehavior != null) return false;
            if (this.predictiveScalingMaxCapacityBuffer != null ? !this.predictiveScalingMaxCapacityBuffer.equals(that.predictiveScalingMaxCapacityBuffer) : that.predictiveScalingMaxCapacityBuffer != null) return false;
            if (this.predictiveScalingMode != null ? !this.predictiveScalingMode.equals(that.predictiveScalingMode) : that.predictiveScalingMode != null) return false;
            if (this.scalingPolicyUpdateBehavior != null ? !this.scalingPolicyUpdateBehavior.equals(that.scalingPolicyUpdateBehavior) : that.scalingPolicyUpdateBehavior != null) return false;
            return this.scheduledActionBufferTime != null ? this.scheduledActionBufferTime.equals(that.scheduledActionBufferTime) : that.scheduledActionBufferTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxCapacity.hashCode();
            result = 31 * result + (this.minCapacity.hashCode());
            result = 31 * result + (this.resourceId.hashCode());
            result = 31 * result + (this.scalableDimension.hashCode());
            result = 31 * result + (this.serviceNamespace.hashCode());
            result = 31 * result + (this.targetTrackingConfiguration.hashCode());
            result = 31 * result + (this.customizedLoadMetricSpecification != null ? this.customizedLoadMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.disableDynamicScaling != null ? this.disableDynamicScaling.hashCode() : 0);
            result = 31 * result + (this.predefinedLoadMetricSpecification != null ? this.predefinedLoadMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.predictiveScalingMaxCapacityBehavior != null ? this.predictiveScalingMaxCapacityBehavior.hashCode() : 0);
            result = 31 * result + (this.predictiveScalingMaxCapacityBuffer != null ? this.predictiveScalingMaxCapacityBuffer.hashCode() : 0);
            result = 31 * result + (this.predictiveScalingMode != null ? this.predictiveScalingMode.hashCode() : 0);
            result = 31 * result + (this.scalingPolicyUpdateBehavior != null ? this.scalingPolicyUpdateBehavior.hashCode() : 0);
            result = 31 * result + (this.scheduledActionBufferTime != null ? this.scheduledActionBufferTime.hashCode() : 0);
            return result;
        }
    }
}
