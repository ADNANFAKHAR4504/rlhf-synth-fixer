package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.108Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfiguration")
@software.amazon.jsii.Jsii.Proxy(AutoscalingPolicyTargetTrackingConfiguration.Jsii$Proxy.class)
public interface AutoscalingPolicyTargetTrackingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#target_value AutoscalingPolicy#target_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTargetValue();

    /**
     * customized_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#customized_metric_specification AutoscalingPolicy#customized_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification getCustomizedMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#disable_scale_in AutoscalingPolicy#disable_scale_in}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableScaleIn() {
        return null;
    }

    /**
     * predefined_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#predefined_metric_specification AutoscalingPolicy#predefined_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification getPredefinedMetricSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingPolicyTargetTrackingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingPolicyTargetTrackingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingPolicyTargetTrackingConfiguration> {
        java.lang.Number targetValue;
        imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification customizedMetricSpecification;
        java.lang.Object disableScaleIn;
        imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification predefinedMetricSpecification;

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfiguration#getTargetValue}
         * @param targetValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#target_value AutoscalingPolicy#target_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetValue(java.lang.Number targetValue) {
            this.targetValue = targetValue;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfiguration#getCustomizedMetricSpecification}
         * @param customizedMetricSpecification customized_metric_specification block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#customized_metric_specification AutoscalingPolicy#customized_metric_specification}
         * @return {@code this}
         */
        public Builder customizedMetricSpecification(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification customizedMetricSpecification) {
            this.customizedMetricSpecification = customizedMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfiguration#getDisableScaleIn}
         * @param disableScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#disable_scale_in AutoscalingPolicy#disable_scale_in}.
         * @return {@code this}
         */
        public Builder disableScaleIn(java.lang.Boolean disableScaleIn) {
            this.disableScaleIn = disableScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfiguration#getDisableScaleIn}
         * @param disableScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#disable_scale_in AutoscalingPolicy#disable_scale_in}.
         * @return {@code this}
         */
        public Builder disableScaleIn(com.hashicorp.cdktf.IResolvable disableScaleIn) {
            this.disableScaleIn = disableScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyTargetTrackingConfiguration#getPredefinedMetricSpecification}
         * @param predefinedMetricSpecification predefined_metric_specification block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#predefined_metric_specification AutoscalingPolicy#predefined_metric_specification}
         * @return {@code this}
         */
        public Builder predefinedMetricSpecification(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification predefinedMetricSpecification) {
            this.predefinedMetricSpecification = predefinedMetricSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingPolicyTargetTrackingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingPolicyTargetTrackingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingPolicyTargetTrackingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingPolicyTargetTrackingConfiguration {
        private final java.lang.Number targetValue;
        private final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification customizedMetricSpecification;
        private final java.lang.Object disableScaleIn;
        private final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification predefinedMetricSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetValue = software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.customizedMetricSpecification = software.amazon.jsii.Kernel.get(this, "customizedMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification.class));
            this.disableScaleIn = software.amazon.jsii.Kernel.get(this, "disableScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.predefinedMetricSpecification = software.amazon.jsii.Kernel.get(this, "predefinedMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetValue = java.util.Objects.requireNonNull(builder.targetValue, "targetValue is required");
            this.customizedMetricSpecification = builder.customizedMetricSpecification;
            this.disableScaleIn = builder.disableScaleIn;
            this.predefinedMetricSpecification = builder.predefinedMetricSpecification;
        }

        @Override
        public final java.lang.Number getTargetValue() {
            return this.targetValue;
        }

        @Override
        public final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationCustomizedMetricSpecification getCustomizedMetricSpecification() {
            return this.customizedMetricSpecification;
        }

        @Override
        public final java.lang.Object getDisableScaleIn() {
            return this.disableScaleIn;
        }

        @Override
        public final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification getPredefinedMetricSpecification() {
            return this.predefinedMetricSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetValue", om.valueToTree(this.getTargetValue()));
            if (this.getCustomizedMetricSpecification() != null) {
                data.set("customizedMetricSpecification", om.valueToTree(this.getCustomizedMetricSpecification()));
            }
            if (this.getDisableScaleIn() != null) {
                data.set("disableScaleIn", om.valueToTree(this.getDisableScaleIn()));
            }
            if (this.getPredefinedMetricSpecification() != null) {
                data.set("predefinedMetricSpecification", om.valueToTree(this.getPredefinedMetricSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingPolicy.AutoscalingPolicyTargetTrackingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingPolicyTargetTrackingConfiguration.Jsii$Proxy that = (AutoscalingPolicyTargetTrackingConfiguration.Jsii$Proxy) o;

            if (!targetValue.equals(that.targetValue)) return false;
            if (this.customizedMetricSpecification != null ? !this.customizedMetricSpecification.equals(that.customizedMetricSpecification) : that.customizedMetricSpecification != null) return false;
            if (this.disableScaleIn != null ? !this.disableScaleIn.equals(that.disableScaleIn) : that.disableScaleIn != null) return false;
            return this.predefinedMetricSpecification != null ? this.predefinedMetricSpecification.equals(that.predefinedMetricSpecification) : that.predefinedMetricSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetValue.hashCode();
            result = 31 * result + (this.customizedMetricSpecification != null ? this.customizedMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.disableScaleIn != null ? this.disableScaleIn.hashCode() : 0);
            result = 31 * result + (this.predefinedMetricSpecification != null ? this.predefinedMetricSpecification.hashCode() : 0);
            return result;
        }
    }
}
