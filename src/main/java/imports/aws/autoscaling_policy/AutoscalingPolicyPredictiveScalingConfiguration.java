package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.101Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyPredictiveScalingConfiguration")
@software.amazon.jsii.Jsii.Proxy(AutoscalingPolicyPredictiveScalingConfiguration.Jsii$Proxy.class)
public interface AutoscalingPolicyPredictiveScalingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_specification AutoscalingPolicy#metric_specification}
     */
    @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification getMetricSpecification();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#max_capacity_breach_behavior AutoscalingPolicy#max_capacity_breach_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxCapacityBreachBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#max_capacity_buffer AutoscalingPolicy#max_capacity_buffer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxCapacityBuffer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#mode AutoscalingPolicy#mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#scheduling_buffer_time AutoscalingPolicy#scheduling_buffer_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchedulingBufferTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingPolicyPredictiveScalingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingPolicyPredictiveScalingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingPolicyPredictiveScalingConfiguration> {
        imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification metricSpecification;
        java.lang.String maxCapacityBreachBehavior;
        java.lang.String maxCapacityBuffer;
        java.lang.String mode;
        java.lang.String schedulingBufferTime;

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfiguration#getMetricSpecification}
         * @param metricSpecification metric_specification block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_specification AutoscalingPolicy#metric_specification}
         * @return {@code this}
         */
        public Builder metricSpecification(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification metricSpecification) {
            this.metricSpecification = metricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfiguration#getMaxCapacityBreachBehavior}
         * @param maxCapacityBreachBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#max_capacity_breach_behavior AutoscalingPolicy#max_capacity_breach_behavior}.
         * @return {@code this}
         */
        public Builder maxCapacityBreachBehavior(java.lang.String maxCapacityBreachBehavior) {
            this.maxCapacityBreachBehavior = maxCapacityBreachBehavior;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfiguration#getMaxCapacityBuffer}
         * @param maxCapacityBuffer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#max_capacity_buffer AutoscalingPolicy#max_capacity_buffer}.
         * @return {@code this}
         */
        public Builder maxCapacityBuffer(java.lang.String maxCapacityBuffer) {
            this.maxCapacityBuffer = maxCapacityBuffer;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfiguration#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#mode AutoscalingPolicy#mode}.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyPredictiveScalingConfiguration#getSchedulingBufferTime}
         * @param schedulingBufferTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#scheduling_buffer_time AutoscalingPolicy#scheduling_buffer_time}.
         * @return {@code this}
         */
        public Builder schedulingBufferTime(java.lang.String schedulingBufferTime) {
            this.schedulingBufferTime = schedulingBufferTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingPolicyPredictiveScalingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingPolicyPredictiveScalingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingPolicyPredictiveScalingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingPolicyPredictiveScalingConfiguration {
        private final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification metricSpecification;
        private final java.lang.String maxCapacityBreachBehavior;
        private final java.lang.String maxCapacityBuffer;
        private final java.lang.String mode;
        private final java.lang.String schedulingBufferTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricSpecification = software.amazon.jsii.Kernel.get(this, "metricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification.class));
            this.maxCapacityBreachBehavior = software.amazon.jsii.Kernel.get(this, "maxCapacityBreachBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxCapacityBuffer = software.amazon.jsii.Kernel.get(this, "maxCapacityBuffer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schedulingBufferTime = software.amazon.jsii.Kernel.get(this, "schedulingBufferTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricSpecification = java.util.Objects.requireNonNull(builder.metricSpecification, "metricSpecification is required");
            this.maxCapacityBreachBehavior = builder.maxCapacityBreachBehavior;
            this.maxCapacityBuffer = builder.maxCapacityBuffer;
            this.mode = builder.mode;
            this.schedulingBufferTime = builder.schedulingBufferTime;
        }

        @Override
        public final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationMetricSpecification getMetricSpecification() {
            return this.metricSpecification;
        }

        @Override
        public final java.lang.String getMaxCapacityBreachBehavior() {
            return this.maxCapacityBreachBehavior;
        }

        @Override
        public final java.lang.String getMaxCapacityBuffer() {
            return this.maxCapacityBuffer;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final java.lang.String getSchedulingBufferTime() {
            return this.schedulingBufferTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metricSpecification", om.valueToTree(this.getMetricSpecification()));
            if (this.getMaxCapacityBreachBehavior() != null) {
                data.set("maxCapacityBreachBehavior", om.valueToTree(this.getMaxCapacityBreachBehavior()));
            }
            if (this.getMaxCapacityBuffer() != null) {
                data.set("maxCapacityBuffer", om.valueToTree(this.getMaxCapacityBuffer()));
            }
            if (this.getMode() != null) {
                data.set("mode", om.valueToTree(this.getMode()));
            }
            if (this.getSchedulingBufferTime() != null) {
                data.set("schedulingBufferTime", om.valueToTree(this.getSchedulingBufferTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingPolicy.AutoscalingPolicyPredictiveScalingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingPolicyPredictiveScalingConfiguration.Jsii$Proxy that = (AutoscalingPolicyPredictiveScalingConfiguration.Jsii$Proxy) o;

            if (!metricSpecification.equals(that.metricSpecification)) return false;
            if (this.maxCapacityBreachBehavior != null ? !this.maxCapacityBreachBehavior.equals(that.maxCapacityBreachBehavior) : that.maxCapacityBreachBehavior != null) return false;
            if (this.maxCapacityBuffer != null ? !this.maxCapacityBuffer.equals(that.maxCapacityBuffer) : that.maxCapacityBuffer != null) return false;
            if (this.mode != null ? !this.mode.equals(that.mode) : that.mode != null) return false;
            return this.schedulingBufferTime != null ? this.schedulingBufferTime.equals(that.schedulingBufferTime) : that.schedulingBufferTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricSpecification.hashCode();
            result = 31 * result + (this.maxCapacityBreachBehavior != null ? this.maxCapacityBreachBehavior.hashCode() : 0);
            result = 31 * result + (this.maxCapacityBuffer != null ? this.maxCapacityBuffer.hashCode() : 0);
            result = 31 * result + (this.mode != null ? this.mode.hashCode() : 0);
            result = 31 * result + (this.schedulingBufferTime != null ? this.schedulingBufferTime.hashCode() : 0);
            return result;
        }
    }
}
