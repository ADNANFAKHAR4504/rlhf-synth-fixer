package imports.aws.appautoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.975Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appautoscalingPolicy.AppautoscalingPolicyStepScalingPolicyConfiguration")
@software.amazon.jsii.Jsii.Proxy(AppautoscalingPolicyStepScalingPolicyConfiguration.Jsii$Proxy.class)
public interface AppautoscalingPolicyStepScalingPolicyConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#adjustment_type AppautoscalingPolicy#adjustment_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdjustmentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#cooldown AppautoscalingPolicy#cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCooldown() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#metric_aggregation_type AppautoscalingPolicy#metric_aggregation_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricAggregationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#min_adjustment_magnitude AppautoscalingPolicy#min_adjustment_magnitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinAdjustmentMagnitude() {
        return null;
    }

    /**
     * step_adjustment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#step_adjustment AppautoscalingPolicy#step_adjustment}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStepAdjustment() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppautoscalingPolicyStepScalingPolicyConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppautoscalingPolicyStepScalingPolicyConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppautoscalingPolicyStepScalingPolicyConfiguration> {
        java.lang.String adjustmentType;
        java.lang.Number cooldown;
        java.lang.String metricAggregationType;
        java.lang.Number minAdjustmentMagnitude;
        java.lang.Object stepAdjustment;

        /**
         * Sets the value of {@link AppautoscalingPolicyStepScalingPolicyConfiguration#getAdjustmentType}
         * @param adjustmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#adjustment_type AppautoscalingPolicy#adjustment_type}.
         * @return {@code this}
         */
        public Builder adjustmentType(java.lang.String adjustmentType) {
            this.adjustmentType = adjustmentType;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyStepScalingPolicyConfiguration#getCooldown}
         * @param cooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#cooldown AppautoscalingPolicy#cooldown}.
         * @return {@code this}
         */
        public Builder cooldown(java.lang.Number cooldown) {
            this.cooldown = cooldown;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyStepScalingPolicyConfiguration#getMetricAggregationType}
         * @param metricAggregationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#metric_aggregation_type AppautoscalingPolicy#metric_aggregation_type}.
         * @return {@code this}
         */
        public Builder metricAggregationType(java.lang.String metricAggregationType) {
            this.metricAggregationType = metricAggregationType;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyStepScalingPolicyConfiguration#getMinAdjustmentMagnitude}
         * @param minAdjustmentMagnitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#min_adjustment_magnitude AppautoscalingPolicy#min_adjustment_magnitude}.
         * @return {@code this}
         */
        public Builder minAdjustmentMagnitude(java.lang.Number minAdjustmentMagnitude) {
            this.minAdjustmentMagnitude = minAdjustmentMagnitude;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyStepScalingPolicyConfiguration#getStepAdjustment}
         * @param stepAdjustment step_adjustment block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#step_adjustment AppautoscalingPolicy#step_adjustment}
         * @return {@code this}
         */
        public Builder stepAdjustment(com.hashicorp.cdktf.IResolvable stepAdjustment) {
            this.stepAdjustment = stepAdjustment;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyStepScalingPolicyConfiguration#getStepAdjustment}
         * @param stepAdjustment step_adjustment block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#step_adjustment AppautoscalingPolicy#step_adjustment}
         * @return {@code this}
         */
        public Builder stepAdjustment(java.util.List<? extends imports.aws.appautoscaling_policy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustment> stepAdjustment) {
            this.stepAdjustment = stepAdjustment;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppautoscalingPolicyStepScalingPolicyConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppautoscalingPolicyStepScalingPolicyConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppautoscalingPolicyStepScalingPolicyConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppautoscalingPolicyStepScalingPolicyConfiguration {
        private final java.lang.String adjustmentType;
        private final java.lang.Number cooldown;
        private final java.lang.String metricAggregationType;
        private final java.lang.Number minAdjustmentMagnitude;
        private final java.lang.Object stepAdjustment;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.adjustmentType = software.amazon.jsii.Kernel.get(this, "adjustmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cooldown = software.amazon.jsii.Kernel.get(this, "cooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.metricAggregationType = software.amazon.jsii.Kernel.get(this, "metricAggregationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minAdjustmentMagnitude = software.amazon.jsii.Kernel.get(this, "minAdjustmentMagnitude", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stepAdjustment = software.amazon.jsii.Kernel.get(this, "stepAdjustment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.adjustmentType = builder.adjustmentType;
            this.cooldown = builder.cooldown;
            this.metricAggregationType = builder.metricAggregationType;
            this.minAdjustmentMagnitude = builder.minAdjustmentMagnitude;
            this.stepAdjustment = builder.stepAdjustment;
        }

        @Override
        public final java.lang.String getAdjustmentType() {
            return this.adjustmentType;
        }

        @Override
        public final java.lang.Number getCooldown() {
            return this.cooldown;
        }

        @Override
        public final java.lang.String getMetricAggregationType() {
            return this.metricAggregationType;
        }

        @Override
        public final java.lang.Number getMinAdjustmentMagnitude() {
            return this.minAdjustmentMagnitude;
        }

        @Override
        public final java.lang.Object getStepAdjustment() {
            return this.stepAdjustment;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAdjustmentType() != null) {
                data.set("adjustmentType", om.valueToTree(this.getAdjustmentType()));
            }
            if (this.getCooldown() != null) {
                data.set("cooldown", om.valueToTree(this.getCooldown()));
            }
            if (this.getMetricAggregationType() != null) {
                data.set("metricAggregationType", om.valueToTree(this.getMetricAggregationType()));
            }
            if (this.getMinAdjustmentMagnitude() != null) {
                data.set("minAdjustmentMagnitude", om.valueToTree(this.getMinAdjustmentMagnitude()));
            }
            if (this.getStepAdjustment() != null) {
                data.set("stepAdjustment", om.valueToTree(this.getStepAdjustment()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appautoscalingPolicy.AppautoscalingPolicyStepScalingPolicyConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppautoscalingPolicyStepScalingPolicyConfiguration.Jsii$Proxy that = (AppautoscalingPolicyStepScalingPolicyConfiguration.Jsii$Proxy) o;

            if (this.adjustmentType != null ? !this.adjustmentType.equals(that.adjustmentType) : that.adjustmentType != null) return false;
            if (this.cooldown != null ? !this.cooldown.equals(that.cooldown) : that.cooldown != null) return false;
            if (this.metricAggregationType != null ? !this.metricAggregationType.equals(that.metricAggregationType) : that.metricAggregationType != null) return false;
            if (this.minAdjustmentMagnitude != null ? !this.minAdjustmentMagnitude.equals(that.minAdjustmentMagnitude) : that.minAdjustmentMagnitude != null) return false;
            return this.stepAdjustment != null ? this.stepAdjustment.equals(that.stepAdjustment) : that.stepAdjustment == null;
        }

        @Override
        public final int hashCode() {
            int result = this.adjustmentType != null ? this.adjustmentType.hashCode() : 0;
            result = 31 * result + (this.cooldown != null ? this.cooldown.hashCode() : 0);
            result = 31 * result + (this.metricAggregationType != null ? this.metricAggregationType.hashCode() : 0);
            result = 31 * result + (this.minAdjustmentMagnitude != null ? this.minAdjustmentMagnitude.hashCode() : 0);
            result = 31 * result + (this.stepAdjustment != null ? this.stepAdjustment.hashCode() : 0);
            return result;
        }
    }
}
