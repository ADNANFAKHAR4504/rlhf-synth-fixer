package imports.aws.ecs_capacity_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCapacityProvider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling")
@software.amazon.jsii.Jsii.Proxy(EcsCapacityProviderAutoScalingGroupProviderManagedScaling.Jsii$Proxy.class)
public interface EcsCapacityProviderAutoScalingGroupProviderManagedScaling extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#instance_warmup_period EcsCapacityProvider#instance_warmup_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInstanceWarmupPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#maximum_scaling_step_size EcsCapacityProvider#maximum_scaling_step_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumScalingStepSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#minimum_scaling_step_size EcsCapacityProvider#minimum_scaling_step_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumScalingStepSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#status EcsCapacityProvider#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#target_capacity EcsCapacityProvider#target_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsCapacityProviderAutoScalingGroupProviderManagedScaling> {
        java.lang.Number instanceWarmupPeriod;
        java.lang.Number maximumScalingStepSize;
        java.lang.Number minimumScalingStepSize;
        java.lang.String status;
        java.lang.Number targetCapacity;

        /**
         * Sets the value of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling#getInstanceWarmupPeriod}
         * @param instanceWarmupPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#instance_warmup_period EcsCapacityProvider#instance_warmup_period}.
         * @return {@code this}
         */
        public Builder instanceWarmupPeriod(java.lang.Number instanceWarmupPeriod) {
            this.instanceWarmupPeriod = instanceWarmupPeriod;
            return this;
        }

        /**
         * Sets the value of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling#getMaximumScalingStepSize}
         * @param maximumScalingStepSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#maximum_scaling_step_size EcsCapacityProvider#maximum_scaling_step_size}.
         * @return {@code this}
         */
        public Builder maximumScalingStepSize(java.lang.Number maximumScalingStepSize) {
            this.maximumScalingStepSize = maximumScalingStepSize;
            return this;
        }

        /**
         * Sets the value of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling#getMinimumScalingStepSize}
         * @param minimumScalingStepSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#minimum_scaling_step_size EcsCapacityProvider#minimum_scaling_step_size}.
         * @return {@code this}
         */
        public Builder minimumScalingStepSize(java.lang.Number minimumScalingStepSize) {
            this.minimumScalingStepSize = minimumScalingStepSize;
            return this;
        }

        /**
         * Sets the value of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#status EcsCapacityProvider#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling#getTargetCapacity}
         * @param targetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_capacity_provider#target_capacity EcsCapacityProvider#target_capacity}.
         * @return {@code this}
         */
        public Builder targetCapacity(java.lang.Number targetCapacity) {
            this.targetCapacity = targetCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsCapacityProviderAutoScalingGroupProviderManagedScaling build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsCapacityProviderAutoScalingGroupProviderManagedScaling}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsCapacityProviderAutoScalingGroupProviderManagedScaling {
        private final java.lang.Number instanceWarmupPeriod;
        private final java.lang.Number maximumScalingStepSize;
        private final java.lang.Number minimumScalingStepSize;
        private final java.lang.String status;
        private final java.lang.Number targetCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceWarmupPeriod = software.amazon.jsii.Kernel.get(this, "instanceWarmupPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumScalingStepSize = software.amazon.jsii.Kernel.get(this, "maximumScalingStepSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumScalingStepSize = software.amazon.jsii.Kernel.get(this, "minimumScalingStepSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetCapacity = software.amazon.jsii.Kernel.get(this, "targetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceWarmupPeriod = builder.instanceWarmupPeriod;
            this.maximumScalingStepSize = builder.maximumScalingStepSize;
            this.minimumScalingStepSize = builder.minimumScalingStepSize;
            this.status = builder.status;
            this.targetCapacity = builder.targetCapacity;
        }

        @Override
        public final java.lang.Number getInstanceWarmupPeriod() {
            return this.instanceWarmupPeriod;
        }

        @Override
        public final java.lang.Number getMaximumScalingStepSize() {
            return this.maximumScalingStepSize;
        }

        @Override
        public final java.lang.Number getMinimumScalingStepSize() {
            return this.minimumScalingStepSize;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.Number getTargetCapacity() {
            return this.targetCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceWarmupPeriod() != null) {
                data.set("instanceWarmupPeriod", om.valueToTree(this.getInstanceWarmupPeriod()));
            }
            if (this.getMaximumScalingStepSize() != null) {
                data.set("maximumScalingStepSize", om.valueToTree(this.getMaximumScalingStepSize()));
            }
            if (this.getMinimumScalingStepSize() != null) {
                data.set("minimumScalingStepSize", om.valueToTree(this.getMinimumScalingStepSize()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getTargetCapacity() != null) {
                data.set("targetCapacity", om.valueToTree(this.getTargetCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsCapacityProvider.EcsCapacityProviderAutoScalingGroupProviderManagedScaling"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsCapacityProviderAutoScalingGroupProviderManagedScaling.Jsii$Proxy that = (EcsCapacityProviderAutoScalingGroupProviderManagedScaling.Jsii$Proxy) o;

            if (this.instanceWarmupPeriod != null ? !this.instanceWarmupPeriod.equals(that.instanceWarmupPeriod) : that.instanceWarmupPeriod != null) return false;
            if (this.maximumScalingStepSize != null ? !this.maximumScalingStepSize.equals(that.maximumScalingStepSize) : that.maximumScalingStepSize != null) return false;
            if (this.minimumScalingStepSize != null ? !this.minimumScalingStepSize.equals(that.minimumScalingStepSize) : that.minimumScalingStepSize != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            return this.targetCapacity != null ? this.targetCapacity.equals(that.targetCapacity) : that.targetCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceWarmupPeriod != null ? this.instanceWarmupPeriod.hashCode() : 0;
            result = 31 * result + (this.maximumScalingStepSize != null ? this.maximumScalingStepSize.hashCode() : 0);
            result = 31 * result + (this.minimumScalingStepSize != null ? this.minimumScalingStepSize.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.targetCapacity != null ? this.targetCapacity.hashCode() : 0);
            return result;
        }
    }
}
