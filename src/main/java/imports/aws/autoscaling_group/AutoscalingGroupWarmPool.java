package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.099Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupWarmPool")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupWarmPool.Jsii$Proxy.class)
public interface AutoscalingGroupWarmPool extends software.amazon.jsii.JsiiSerializable {

    /**
     * instance_reuse_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_reuse_policy AutoscalingGroup#instance_reuse_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupWarmPoolInstanceReusePolicy getInstanceReusePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_group_prepared_capacity AutoscalingGroup#max_group_prepared_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxGroupPreparedCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#pool_state AutoscalingGroup#pool_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPoolState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupWarmPool}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupWarmPool}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupWarmPool> {
        imports.aws.autoscaling_group.AutoscalingGroupWarmPoolInstanceReusePolicy instanceReusePolicy;
        java.lang.Number maxGroupPreparedCapacity;
        java.lang.Number minSize;
        java.lang.String poolState;

        /**
         * Sets the value of {@link AutoscalingGroupWarmPool#getInstanceReusePolicy}
         * @param instanceReusePolicy instance_reuse_policy block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_reuse_policy AutoscalingGroup#instance_reuse_policy}
         * @return {@code this}
         */
        public Builder instanceReusePolicy(imports.aws.autoscaling_group.AutoscalingGroupWarmPoolInstanceReusePolicy instanceReusePolicy) {
            this.instanceReusePolicy = instanceReusePolicy;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupWarmPool#getMaxGroupPreparedCapacity}
         * @param maxGroupPreparedCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_group_prepared_capacity AutoscalingGroup#max_group_prepared_capacity}.
         * @return {@code this}
         */
        public Builder maxGroupPreparedCapacity(java.lang.Number maxGroupPreparedCapacity) {
            this.maxGroupPreparedCapacity = maxGroupPreparedCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupWarmPool#getMinSize}
         * @param minSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
         * @return {@code this}
         */
        public Builder minSize(java.lang.Number minSize) {
            this.minSize = minSize;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupWarmPool#getPoolState}
         * @param poolState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#pool_state AutoscalingGroup#pool_state}.
         * @return {@code this}
         */
        public Builder poolState(java.lang.String poolState) {
            this.poolState = poolState;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupWarmPool}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupWarmPool build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupWarmPool}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupWarmPool {
        private final imports.aws.autoscaling_group.AutoscalingGroupWarmPoolInstanceReusePolicy instanceReusePolicy;
        private final java.lang.Number maxGroupPreparedCapacity;
        private final java.lang.Number minSize;
        private final java.lang.String poolState;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceReusePolicy = software.amazon.jsii.Kernel.get(this, "instanceReusePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupWarmPoolInstanceReusePolicy.class));
            this.maxGroupPreparedCapacity = software.amazon.jsii.Kernel.get(this, "maxGroupPreparedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minSize = software.amazon.jsii.Kernel.get(this, "minSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.poolState = software.amazon.jsii.Kernel.get(this, "poolState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceReusePolicy = builder.instanceReusePolicy;
            this.maxGroupPreparedCapacity = builder.maxGroupPreparedCapacity;
            this.minSize = builder.minSize;
            this.poolState = builder.poolState;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupWarmPoolInstanceReusePolicy getInstanceReusePolicy() {
            return this.instanceReusePolicy;
        }

        @Override
        public final java.lang.Number getMaxGroupPreparedCapacity() {
            return this.maxGroupPreparedCapacity;
        }

        @Override
        public final java.lang.Number getMinSize() {
            return this.minSize;
        }

        @Override
        public final java.lang.String getPoolState() {
            return this.poolState;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceReusePolicy() != null) {
                data.set("instanceReusePolicy", om.valueToTree(this.getInstanceReusePolicy()));
            }
            if (this.getMaxGroupPreparedCapacity() != null) {
                data.set("maxGroupPreparedCapacity", om.valueToTree(this.getMaxGroupPreparedCapacity()));
            }
            if (this.getMinSize() != null) {
                data.set("minSize", om.valueToTree(this.getMinSize()));
            }
            if (this.getPoolState() != null) {
                data.set("poolState", om.valueToTree(this.getPoolState()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupWarmPool"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupWarmPool.Jsii$Proxy that = (AutoscalingGroupWarmPool.Jsii$Proxy) o;

            if (this.instanceReusePolicy != null ? !this.instanceReusePolicy.equals(that.instanceReusePolicy) : that.instanceReusePolicy != null) return false;
            if (this.maxGroupPreparedCapacity != null ? !this.maxGroupPreparedCapacity.equals(that.maxGroupPreparedCapacity) : that.maxGroupPreparedCapacity != null) return false;
            if (this.minSize != null ? !this.minSize.equals(that.minSize) : that.minSize != null) return false;
            return this.poolState != null ? this.poolState.equals(that.poolState) : that.poolState == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceReusePolicy != null ? this.instanceReusePolicy.hashCode() : 0;
            result = 31 * result + (this.maxGroupPreparedCapacity != null ? this.maxGroupPreparedCapacity.hashCode() : 0);
            result = 31 * result + (this.minSize != null ? this.minSize.hashCode() : 0);
            result = 31 * result + (this.poolState != null ? this.poolState.hashCode() : 0);
            return result;
        }
    }
}
