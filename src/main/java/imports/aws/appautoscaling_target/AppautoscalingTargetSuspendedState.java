package imports.aws.appautoscaling_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.982Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appautoscalingTarget.AppautoscalingTargetSuspendedState")
@software.amazon.jsii.Jsii.Proxy(AppautoscalingTargetSuspendedState.Jsii$Proxy.class)
public interface AppautoscalingTargetSuspendedState extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#dynamic_scaling_in_suspended AppautoscalingTarget#dynamic_scaling_in_suspended}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDynamicScalingInSuspended() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#dynamic_scaling_out_suspended AppautoscalingTarget#dynamic_scaling_out_suspended}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDynamicScalingOutSuspended() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#scheduled_scaling_suspended AppautoscalingTarget#scheduled_scaling_suspended}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScheduledScalingSuspended() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppautoscalingTargetSuspendedState}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppautoscalingTargetSuspendedState}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppautoscalingTargetSuspendedState> {
        java.lang.Object dynamicScalingInSuspended;
        java.lang.Object dynamicScalingOutSuspended;
        java.lang.Object scheduledScalingSuspended;

        /**
         * Sets the value of {@link AppautoscalingTargetSuspendedState#getDynamicScalingInSuspended}
         * @param dynamicScalingInSuspended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#dynamic_scaling_in_suspended AppautoscalingTarget#dynamic_scaling_in_suspended}.
         * @return {@code this}
         */
        public Builder dynamicScalingInSuspended(java.lang.Boolean dynamicScalingInSuspended) {
            this.dynamicScalingInSuspended = dynamicScalingInSuspended;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingTargetSuspendedState#getDynamicScalingInSuspended}
         * @param dynamicScalingInSuspended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#dynamic_scaling_in_suspended AppautoscalingTarget#dynamic_scaling_in_suspended}.
         * @return {@code this}
         */
        public Builder dynamicScalingInSuspended(com.hashicorp.cdktf.IResolvable dynamicScalingInSuspended) {
            this.dynamicScalingInSuspended = dynamicScalingInSuspended;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingTargetSuspendedState#getDynamicScalingOutSuspended}
         * @param dynamicScalingOutSuspended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#dynamic_scaling_out_suspended AppautoscalingTarget#dynamic_scaling_out_suspended}.
         * @return {@code this}
         */
        public Builder dynamicScalingOutSuspended(java.lang.Boolean dynamicScalingOutSuspended) {
            this.dynamicScalingOutSuspended = dynamicScalingOutSuspended;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingTargetSuspendedState#getDynamicScalingOutSuspended}
         * @param dynamicScalingOutSuspended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#dynamic_scaling_out_suspended AppautoscalingTarget#dynamic_scaling_out_suspended}.
         * @return {@code this}
         */
        public Builder dynamicScalingOutSuspended(com.hashicorp.cdktf.IResolvable dynamicScalingOutSuspended) {
            this.dynamicScalingOutSuspended = dynamicScalingOutSuspended;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingTargetSuspendedState#getScheduledScalingSuspended}
         * @param scheduledScalingSuspended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#scheduled_scaling_suspended AppautoscalingTarget#scheduled_scaling_suspended}.
         * @return {@code this}
         */
        public Builder scheduledScalingSuspended(java.lang.Boolean scheduledScalingSuspended) {
            this.scheduledScalingSuspended = scheduledScalingSuspended;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingTargetSuspendedState#getScheduledScalingSuspended}
         * @param scheduledScalingSuspended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_target#scheduled_scaling_suspended AppautoscalingTarget#scheduled_scaling_suspended}.
         * @return {@code this}
         */
        public Builder scheduledScalingSuspended(com.hashicorp.cdktf.IResolvable scheduledScalingSuspended) {
            this.scheduledScalingSuspended = scheduledScalingSuspended;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppautoscalingTargetSuspendedState}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppautoscalingTargetSuspendedState build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppautoscalingTargetSuspendedState}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppautoscalingTargetSuspendedState {
        private final java.lang.Object dynamicScalingInSuspended;
        private final java.lang.Object dynamicScalingOutSuspended;
        private final java.lang.Object scheduledScalingSuspended;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dynamicScalingInSuspended = software.amazon.jsii.Kernel.get(this, "dynamicScalingInSuspended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dynamicScalingOutSuspended = software.amazon.jsii.Kernel.get(this, "dynamicScalingOutSuspended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scheduledScalingSuspended = software.amazon.jsii.Kernel.get(this, "scheduledScalingSuspended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dynamicScalingInSuspended = builder.dynamicScalingInSuspended;
            this.dynamicScalingOutSuspended = builder.dynamicScalingOutSuspended;
            this.scheduledScalingSuspended = builder.scheduledScalingSuspended;
        }

        @Override
        public final java.lang.Object getDynamicScalingInSuspended() {
            return this.dynamicScalingInSuspended;
        }

        @Override
        public final java.lang.Object getDynamicScalingOutSuspended() {
            return this.dynamicScalingOutSuspended;
        }

        @Override
        public final java.lang.Object getScheduledScalingSuspended() {
            return this.scheduledScalingSuspended;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDynamicScalingInSuspended() != null) {
                data.set("dynamicScalingInSuspended", om.valueToTree(this.getDynamicScalingInSuspended()));
            }
            if (this.getDynamicScalingOutSuspended() != null) {
                data.set("dynamicScalingOutSuspended", om.valueToTree(this.getDynamicScalingOutSuspended()));
            }
            if (this.getScheduledScalingSuspended() != null) {
                data.set("scheduledScalingSuspended", om.valueToTree(this.getScheduledScalingSuspended()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appautoscalingTarget.AppautoscalingTargetSuspendedState"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppautoscalingTargetSuspendedState.Jsii$Proxy that = (AppautoscalingTargetSuspendedState.Jsii$Proxy) o;

            if (this.dynamicScalingInSuspended != null ? !this.dynamicScalingInSuspended.equals(that.dynamicScalingInSuspended) : that.dynamicScalingInSuspended != null) return false;
            if (this.dynamicScalingOutSuspended != null ? !this.dynamicScalingOutSuspended.equals(that.dynamicScalingOutSuspended) : that.dynamicScalingOutSuspended != null) return false;
            return this.scheduledScalingSuspended != null ? this.scheduledScalingSuspended.equals(that.scheduledScalingSuspended) : that.scheduledScalingSuspended == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dynamicScalingInSuspended != null ? this.dynamicScalingInSuspended.hashCode() : 0;
            result = 31 * result + (this.dynamicScalingOutSuspended != null ? this.dynamicScalingOutSuspended.hashCode() : 0);
            result = 31 * result + (this.scheduledScalingSuspended != null ? this.scheduledScalingSuspended.hashCode() : 0);
            return result;
        }
    }
}
