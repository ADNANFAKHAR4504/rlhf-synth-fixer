package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetScalingConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodebuildFleetScalingConfiguration.Jsii$Proxy.class)
public interface CodebuildFleetScalingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#max_capacity CodebuildFleet#max_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#scaling_type CodebuildFleet#scaling_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScalingType() {
        return null;
    }

    /**
     * target_tracking_scaling_configs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#target_tracking_scaling_configs CodebuildFleet#target_tracking_scaling_configs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetTrackingScalingConfigs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildFleetScalingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildFleetScalingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildFleetScalingConfiguration> {
        java.lang.Number maxCapacity;
        java.lang.String scalingType;
        java.lang.Object targetTrackingScalingConfigs;

        /**
         * Sets the value of {@link CodebuildFleetScalingConfiguration#getMaxCapacity}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#max_capacity CodebuildFleet#max_capacity}.
         * @return {@code this}
         */
        public Builder maxCapacity(java.lang.Number maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetScalingConfiguration#getScalingType}
         * @param scalingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#scaling_type CodebuildFleet#scaling_type}.
         * @return {@code this}
         */
        public Builder scalingType(java.lang.String scalingType) {
            this.scalingType = scalingType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetScalingConfiguration#getTargetTrackingScalingConfigs}
         * @param targetTrackingScalingConfigs target_tracking_scaling_configs block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#target_tracking_scaling_configs CodebuildFleet#target_tracking_scaling_configs}
         * @return {@code this}
         */
        public Builder targetTrackingScalingConfigs(com.hashicorp.cdktf.IResolvable targetTrackingScalingConfigs) {
            this.targetTrackingScalingConfigs = targetTrackingScalingConfigs;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetScalingConfiguration#getTargetTrackingScalingConfigs}
         * @param targetTrackingScalingConfigs target_tracking_scaling_configs block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#target_tracking_scaling_configs CodebuildFleet#target_tracking_scaling_configs}
         * @return {@code this}
         */
        public Builder targetTrackingScalingConfigs(java.util.List<? extends imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs> targetTrackingScalingConfigs) {
            this.targetTrackingScalingConfigs = targetTrackingScalingConfigs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildFleetScalingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildFleetScalingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildFleetScalingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildFleetScalingConfiguration {
        private final java.lang.Number maxCapacity;
        private final java.lang.String scalingType;
        private final java.lang.Object targetTrackingScalingConfigs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxCapacity = software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scalingType = software.amazon.jsii.Kernel.get(this, "scalingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetTrackingScalingConfigs = software.amazon.jsii.Kernel.get(this, "targetTrackingScalingConfigs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxCapacity = builder.maxCapacity;
            this.scalingType = builder.scalingType;
            this.targetTrackingScalingConfigs = builder.targetTrackingScalingConfigs;
        }

        @Override
        public final java.lang.Number getMaxCapacity() {
            return this.maxCapacity;
        }

        @Override
        public final java.lang.String getScalingType() {
            return this.scalingType;
        }

        @Override
        public final java.lang.Object getTargetTrackingScalingConfigs() {
            return this.targetTrackingScalingConfigs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxCapacity() != null) {
                data.set("maxCapacity", om.valueToTree(this.getMaxCapacity()));
            }
            if (this.getScalingType() != null) {
                data.set("scalingType", om.valueToTree(this.getScalingType()));
            }
            if (this.getTargetTrackingScalingConfigs() != null) {
                data.set("targetTrackingScalingConfigs", om.valueToTree(this.getTargetTrackingScalingConfigs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildFleet.CodebuildFleetScalingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildFleetScalingConfiguration.Jsii$Proxy that = (CodebuildFleetScalingConfiguration.Jsii$Proxy) o;

            if (this.maxCapacity != null ? !this.maxCapacity.equals(that.maxCapacity) : that.maxCapacity != null) return false;
            if (this.scalingType != null ? !this.scalingType.equals(that.scalingType) : that.scalingType != null) return false;
            return this.targetTrackingScalingConfigs != null ? this.targetTrackingScalingConfigs.equals(that.targetTrackingScalingConfigs) : that.targetTrackingScalingConfigs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxCapacity != null ? this.maxCapacity.hashCode() : 0;
            result = 31 * result + (this.scalingType != null ? this.scalingType.hashCode() : 0);
            result = 31 * result + (this.targetTrackingScalingConfigs != null ? this.targetTrackingScalingConfigs.hashCode() : 0);
            return result;
        }
    }
}
