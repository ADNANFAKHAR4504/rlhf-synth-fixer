package imports.aws.launch_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchConfiguration.LaunchConfigurationEphemeralBlockDevice")
@software.amazon.jsii.Jsii.Proxy(LaunchConfigurationEphemeralBlockDevice.Jsii$Proxy.class)
public interface LaunchConfigurationEphemeralBlockDevice extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#device_name LaunchConfiguration#device_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeviceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#no_device LaunchConfiguration#no_device}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNoDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#virtual_name LaunchConfiguration#virtual_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVirtualName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchConfigurationEphemeralBlockDevice}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchConfigurationEphemeralBlockDevice}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchConfigurationEphemeralBlockDevice> {
        java.lang.String deviceName;
        java.lang.Object noDevice;
        java.lang.String virtualName;

        /**
         * Sets the value of {@link LaunchConfigurationEphemeralBlockDevice#getDeviceName}
         * @param deviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#device_name LaunchConfiguration#device_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceName(java.lang.String deviceName) {
            this.deviceName = deviceName;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationEphemeralBlockDevice#getNoDevice}
         * @param noDevice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#no_device LaunchConfiguration#no_device}.
         * @return {@code this}
         */
        public Builder noDevice(java.lang.Boolean noDevice) {
            this.noDevice = noDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationEphemeralBlockDevice#getNoDevice}
         * @param noDevice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#no_device LaunchConfiguration#no_device}.
         * @return {@code this}
         */
        public Builder noDevice(com.hashicorp.cdktf.IResolvable noDevice) {
            this.noDevice = noDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationEphemeralBlockDevice#getVirtualName}
         * @param virtualName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#virtual_name LaunchConfiguration#virtual_name}.
         * @return {@code this}
         */
        public Builder virtualName(java.lang.String virtualName) {
            this.virtualName = virtualName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchConfigurationEphemeralBlockDevice}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchConfigurationEphemeralBlockDevice build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchConfigurationEphemeralBlockDevice}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchConfigurationEphemeralBlockDevice {
        private final java.lang.String deviceName;
        private final java.lang.Object noDevice;
        private final java.lang.String virtualName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceName = software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.noDevice = software.amazon.jsii.Kernel.get(this, "noDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.virtualName = software.amazon.jsii.Kernel.get(this, "virtualName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceName = java.util.Objects.requireNonNull(builder.deviceName, "deviceName is required");
            this.noDevice = builder.noDevice;
            this.virtualName = builder.virtualName;
        }

        @Override
        public final java.lang.String getDeviceName() {
            return this.deviceName;
        }

        @Override
        public final java.lang.Object getNoDevice() {
            return this.noDevice;
        }

        @Override
        public final java.lang.String getVirtualName() {
            return this.virtualName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deviceName", om.valueToTree(this.getDeviceName()));
            if (this.getNoDevice() != null) {
                data.set("noDevice", om.valueToTree(this.getNoDevice()));
            }
            if (this.getVirtualName() != null) {
                data.set("virtualName", om.valueToTree(this.getVirtualName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchConfiguration.LaunchConfigurationEphemeralBlockDevice"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchConfigurationEphemeralBlockDevice.Jsii$Proxy that = (LaunchConfigurationEphemeralBlockDevice.Jsii$Proxy) o;

            if (!deviceName.equals(that.deviceName)) return false;
            if (this.noDevice != null ? !this.noDevice.equals(that.noDevice) : that.noDevice != null) return false;
            return this.virtualName != null ? this.virtualName.equals(that.virtualName) : that.virtualName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceName.hashCode();
            result = 31 * result + (this.noDevice != null ? this.noDevice.hashCode() : 0);
            result = 31 * result + (this.virtualName != null ? this.virtualName.hashCode() : 0);
            return result;
        }
    }
}
