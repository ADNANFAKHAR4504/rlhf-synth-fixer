package imports.aws.sagemaker_device;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.303Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDevice.SagemakerDeviceDevice")
@software.amazon.jsii.Jsii.Proxy(SagemakerDeviceDevice.Jsii$Proxy.class)
public interface SagemakerDeviceDevice extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_device#device_name SagemakerDevice#device_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeviceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_device#description SagemakerDevice#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_device#iot_thing_name SagemakerDevice#iot_thing_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIotThingName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDeviceDevice}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDeviceDevice}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDeviceDevice> {
        java.lang.String deviceName;
        java.lang.String description;
        java.lang.String iotThingName;

        /**
         * Sets the value of {@link SagemakerDeviceDevice#getDeviceName}
         * @param deviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_device#device_name SagemakerDevice#device_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceName(java.lang.String deviceName) {
            this.deviceName = deviceName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDeviceDevice#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_device#description SagemakerDevice#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDeviceDevice#getIotThingName}
         * @param iotThingName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_device#iot_thing_name SagemakerDevice#iot_thing_name}.
         * @return {@code this}
         */
        public Builder iotThingName(java.lang.String iotThingName) {
            this.iotThingName = iotThingName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDeviceDevice}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDeviceDevice build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDeviceDevice}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDeviceDevice {
        private final java.lang.String deviceName;
        private final java.lang.String description;
        private final java.lang.String iotThingName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceName = software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iotThingName = software.amazon.jsii.Kernel.get(this, "iotThingName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceName = java.util.Objects.requireNonNull(builder.deviceName, "deviceName is required");
            this.description = builder.description;
            this.iotThingName = builder.iotThingName;
        }

        @Override
        public final java.lang.String getDeviceName() {
            return this.deviceName;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getIotThingName() {
            return this.iotThingName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deviceName", om.valueToTree(this.getDeviceName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getIotThingName() != null) {
                data.set("iotThingName", om.valueToTree(this.getIotThingName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDevice.SagemakerDeviceDevice"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDeviceDevice.Jsii$Proxy that = (SagemakerDeviceDevice.Jsii$Proxy) o;

            if (!deviceName.equals(that.deviceName)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            return this.iotThingName != null ? this.iotThingName.equals(that.iotThingName) : that.iotThingName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceName.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.iotThingName != null ? this.iotThingName.hashCode() : 0);
            return result;
        }
    }
}
