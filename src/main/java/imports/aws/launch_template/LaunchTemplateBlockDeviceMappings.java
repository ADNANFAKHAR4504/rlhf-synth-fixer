package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.515Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateBlockDeviceMappings")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateBlockDeviceMappings.Jsii$Proxy.class)
public interface LaunchTemplateBlockDeviceMappings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#device_name LaunchTemplate#device_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceName() {
        return null;
    }

    /**
     * ebs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ebs LaunchTemplate#ebs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs getEbs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#no_device LaunchTemplate#no_device}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNoDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#virtual_name LaunchTemplate#virtual_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVirtualName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateBlockDeviceMappings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateBlockDeviceMappings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateBlockDeviceMappings> {
        java.lang.String deviceName;
        imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs ebs;
        java.lang.String noDevice;
        java.lang.String virtualName;

        /**
         * Sets the value of {@link LaunchTemplateBlockDeviceMappings#getDeviceName}
         * @param deviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#device_name LaunchTemplate#device_name}.
         * @return {@code this}
         */
        public Builder deviceName(java.lang.String deviceName) {
            this.deviceName = deviceName;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateBlockDeviceMappings#getEbs}
         * @param ebs ebs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ebs LaunchTemplate#ebs}
         * @return {@code this}
         */
        public Builder ebs(imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs ebs) {
            this.ebs = ebs;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateBlockDeviceMappings#getNoDevice}
         * @param noDevice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#no_device LaunchTemplate#no_device}.
         * @return {@code this}
         */
        public Builder noDevice(java.lang.String noDevice) {
            this.noDevice = noDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateBlockDeviceMappings#getVirtualName}
         * @param virtualName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#virtual_name LaunchTemplate#virtual_name}.
         * @return {@code this}
         */
        public Builder virtualName(java.lang.String virtualName) {
            this.virtualName = virtualName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateBlockDeviceMappings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateBlockDeviceMappings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateBlockDeviceMappings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateBlockDeviceMappings {
        private final java.lang.String deviceName;
        private final imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs ebs;
        private final java.lang.String noDevice;
        private final java.lang.String virtualName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceName = software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ebs = software.amazon.jsii.Kernel.get(this, "ebs", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs.class));
            this.noDevice = software.amazon.jsii.Kernel.get(this, "noDevice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.virtualName = software.amazon.jsii.Kernel.get(this, "virtualName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceName = builder.deviceName;
            this.ebs = builder.ebs;
            this.noDevice = builder.noDevice;
            this.virtualName = builder.virtualName;
        }

        @Override
        public final java.lang.String getDeviceName() {
            return this.deviceName;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs getEbs() {
            return this.ebs;
        }

        @Override
        public final java.lang.String getNoDevice() {
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

            if (this.getDeviceName() != null) {
                data.set("deviceName", om.valueToTree(this.getDeviceName()));
            }
            if (this.getEbs() != null) {
                data.set("ebs", om.valueToTree(this.getEbs()));
            }
            if (this.getNoDevice() != null) {
                data.set("noDevice", om.valueToTree(this.getNoDevice()));
            }
            if (this.getVirtualName() != null) {
                data.set("virtualName", om.valueToTree(this.getVirtualName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateBlockDeviceMappings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateBlockDeviceMappings.Jsii$Proxy that = (LaunchTemplateBlockDeviceMappings.Jsii$Proxy) o;

            if (this.deviceName != null ? !this.deviceName.equals(that.deviceName) : that.deviceName != null) return false;
            if (this.ebs != null ? !this.ebs.equals(that.ebs) : that.ebs != null) return false;
            if (this.noDevice != null ? !this.noDevice.equals(that.noDevice) : that.noDevice != null) return false;
            return this.virtualName != null ? this.virtualName.equals(that.virtualName) : that.virtualName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceName != null ? this.deviceName.hashCode() : 0;
            result = 31 * result + (this.ebs != null ? this.ebs.hashCode() : 0);
            result = 31 * result + (this.noDevice != null ? this.noDevice.hashCode() : 0);
            result = 31 * result + (this.virtualName != null ? this.virtualName.hashCode() : 0);
            return result;
        }
    }
}
