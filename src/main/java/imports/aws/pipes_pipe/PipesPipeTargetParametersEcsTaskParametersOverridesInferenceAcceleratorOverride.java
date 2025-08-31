package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride.Jsii$Proxy.class)
public interface PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_name PipesPipe#device_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_type PipesPipe#device_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride> {
        java.lang.String deviceName;
        java.lang.String deviceType;

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride#getDeviceName}
         * @param deviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_name PipesPipe#device_name}.
         * @return {@code this}
         */
        public Builder deviceName(java.lang.String deviceName) {
            this.deviceName = deviceName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride#getDeviceType}
         * @param deviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_type PipesPipe#device_type}.
         * @return {@code this}
         */
        public Builder deviceType(java.lang.String deviceType) {
            this.deviceType = deviceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride {
        private final java.lang.String deviceName;
        private final java.lang.String deviceType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceName = software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceType = software.amazon.jsii.Kernel.get(this, "deviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceName = builder.deviceName;
            this.deviceType = builder.deviceType;
        }

        @Override
        public final java.lang.String getDeviceName() {
            return this.deviceName;
        }

        @Override
        public final java.lang.String getDeviceType() {
            return this.deviceType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeviceName() != null) {
                data.set("deviceName", om.valueToTree(this.getDeviceName()));
            }
            if (this.getDeviceType() != null) {
                data.set("deviceType", om.valueToTree(this.getDeviceType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride.Jsii$Proxy that = (PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride.Jsii$Proxy) o;

            if (this.deviceName != null ? !this.deviceName.equals(that.deviceName) : that.deviceName != null) return false;
            return this.deviceType != null ? this.deviceType.equals(that.deviceType) : that.deviceType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceName != null ? this.deviceName.hashCode() : 0;
            result = 31 * result + (this.deviceType != null ? this.deviceType.hashCode() : 0);
            return result;
        }
    }
}
