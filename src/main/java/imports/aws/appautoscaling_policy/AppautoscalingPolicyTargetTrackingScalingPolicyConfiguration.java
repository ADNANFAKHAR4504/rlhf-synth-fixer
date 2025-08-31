package imports.aws.appautoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.979Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appautoscalingPolicy.AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration")
@software.amazon.jsii.Jsii.Proxy(AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.Jsii$Proxy.class)
public interface AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#target_value AppautoscalingPolicy#target_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTargetValue();

    /**
     * customized_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#customized_metric_specification AppautoscalingPolicy#customized_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationCustomizedMetricSpecification getCustomizedMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#disable_scale_in AppautoscalingPolicy#disable_scale_in}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableScaleIn() {
        return null;
    }

    /**
     * predefined_metric_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#predefined_metric_specification AppautoscalingPolicy#predefined_metric_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification getPredefinedMetricSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#scale_in_cooldown AppautoscalingPolicy#scale_in_cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScaleInCooldown() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#scale_out_cooldown AppautoscalingPolicy#scale_out_cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScaleOutCooldown() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration> {
        java.lang.Number targetValue;
        imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationCustomizedMetricSpecification customizedMetricSpecification;
        java.lang.Object disableScaleIn;
        imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification predefinedMetricSpecification;
        java.lang.Number scaleInCooldown;
        java.lang.Number scaleOutCooldown;

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getTargetValue}
         * @param targetValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#target_value AppautoscalingPolicy#target_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetValue(java.lang.Number targetValue) {
            this.targetValue = targetValue;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getCustomizedMetricSpecification}
         * @param customizedMetricSpecification customized_metric_specification block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#customized_metric_specification AppautoscalingPolicy#customized_metric_specification}
         * @return {@code this}
         */
        public Builder customizedMetricSpecification(imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationCustomizedMetricSpecification customizedMetricSpecification) {
            this.customizedMetricSpecification = customizedMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getDisableScaleIn}
         * @param disableScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#disable_scale_in AppautoscalingPolicy#disable_scale_in}.
         * @return {@code this}
         */
        public Builder disableScaleIn(java.lang.Boolean disableScaleIn) {
            this.disableScaleIn = disableScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getDisableScaleIn}
         * @param disableScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#disable_scale_in AppautoscalingPolicy#disable_scale_in}.
         * @return {@code this}
         */
        public Builder disableScaleIn(com.hashicorp.cdktf.IResolvable disableScaleIn) {
            this.disableScaleIn = disableScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getPredefinedMetricSpecification}
         * @param predefinedMetricSpecification predefined_metric_specification block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#predefined_metric_specification AppautoscalingPolicy#predefined_metric_specification}
         * @return {@code this}
         */
        public Builder predefinedMetricSpecification(imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification predefinedMetricSpecification) {
            this.predefinedMetricSpecification = predefinedMetricSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getScaleInCooldown}
         * @param scaleInCooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#scale_in_cooldown AppautoscalingPolicy#scale_in_cooldown}.
         * @return {@code this}
         */
        public Builder scaleInCooldown(java.lang.Number scaleInCooldown) {
            this.scaleInCooldown = scaleInCooldown;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration#getScaleOutCooldown}
         * @param scaleOutCooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_policy#scale_out_cooldown AppautoscalingPolicy#scale_out_cooldown}.
         * @return {@code this}
         */
        public Builder scaleOutCooldown(java.lang.Number scaleOutCooldown) {
            this.scaleOutCooldown = scaleOutCooldown;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration {
        private final java.lang.Number targetValue;
        private final imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationCustomizedMetricSpecification customizedMetricSpecification;
        private final java.lang.Object disableScaleIn;
        private final imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification predefinedMetricSpecification;
        private final java.lang.Number scaleInCooldown;
        private final java.lang.Number scaleOutCooldown;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetValue = software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.customizedMetricSpecification = software.amazon.jsii.Kernel.get(this, "customizedMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationCustomizedMetricSpecification.class));
            this.disableScaleIn = software.amazon.jsii.Kernel.get(this, "disableScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.predefinedMetricSpecification = software.amazon.jsii.Kernel.get(this, "predefinedMetricSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification.class));
            this.scaleInCooldown = software.amazon.jsii.Kernel.get(this, "scaleInCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scaleOutCooldown = software.amazon.jsii.Kernel.get(this, "scaleOutCooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.scaleInCooldown = builder.scaleInCooldown;
            this.scaleOutCooldown = builder.scaleOutCooldown;
        }

        @Override
        public final java.lang.Number getTargetValue() {
            return this.targetValue;
        }

        @Override
        public final imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationCustomizedMetricSpecification getCustomizedMetricSpecification() {
            return this.customizedMetricSpecification;
        }

        @Override
        public final java.lang.Object getDisableScaleIn() {
            return this.disableScaleIn;
        }

        @Override
        public final imports.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification getPredefinedMetricSpecification() {
            return this.predefinedMetricSpecification;
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
            if (this.getCustomizedMetricSpecification() != null) {
                data.set("customizedMetricSpecification", om.valueToTree(this.getCustomizedMetricSpecification()));
            }
            if (this.getDisableScaleIn() != null) {
                data.set("disableScaleIn", om.valueToTree(this.getDisableScaleIn()));
            }
            if (this.getPredefinedMetricSpecification() != null) {
                data.set("predefinedMetricSpecification", om.valueToTree(this.getPredefinedMetricSpecification()));
            }
            if (this.getScaleInCooldown() != null) {
                data.set("scaleInCooldown", om.valueToTree(this.getScaleInCooldown()));
            }
            if (this.getScaleOutCooldown() != null) {
                data.set("scaleOutCooldown", om.valueToTree(this.getScaleOutCooldown()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appautoscalingPolicy.AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.Jsii$Proxy that = (AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.Jsii$Proxy) o;

            if (!targetValue.equals(that.targetValue)) return false;
            if (this.customizedMetricSpecification != null ? !this.customizedMetricSpecification.equals(that.customizedMetricSpecification) : that.customizedMetricSpecification != null) return false;
            if (this.disableScaleIn != null ? !this.disableScaleIn.equals(that.disableScaleIn) : that.disableScaleIn != null) return false;
            if (this.predefinedMetricSpecification != null ? !this.predefinedMetricSpecification.equals(that.predefinedMetricSpecification) : that.predefinedMetricSpecification != null) return false;
            if (this.scaleInCooldown != null ? !this.scaleInCooldown.equals(that.scaleInCooldown) : that.scaleInCooldown != null) return false;
            return this.scaleOutCooldown != null ? this.scaleOutCooldown.equals(that.scaleOutCooldown) : that.scaleOutCooldown == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetValue.hashCode();
            result = 31 * result + (this.customizedMetricSpecification != null ? this.customizedMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.disableScaleIn != null ? this.disableScaleIn.hashCode() : 0);
            result = 31 * result + (this.predefinedMetricSpecification != null ? this.predefinedMetricSpecification.hashCode() : 0);
            result = 31 * result + (this.scaleInCooldown != null ? this.scaleInCooldown.hashCode() : 0);
            result = 31 * result + (this.scaleOutCooldown != null ? this.scaleOutCooldown.hashCode() : 0);
            return result;
        }
    }
}
