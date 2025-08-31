package imports.aws.network_interface;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.941Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkInterface.NetworkInterfaceAttachment")
@software.amazon.jsii.Jsii.Proxy(NetworkInterfaceAttachment.Jsii$Proxy.class)
public interface NetworkInterfaceAttachment extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#device_index NetworkInterface#device_index}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDeviceIndex();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#instance NetworkInterface#instance}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstance();

    /**
     * @return a {@link Builder} of {@link NetworkInterfaceAttachment}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkInterfaceAttachment}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkInterfaceAttachment> {
        java.lang.Number deviceIndex;
        java.lang.String instance;

        /**
         * Sets the value of {@link NetworkInterfaceAttachment#getDeviceIndex}
         * @param deviceIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#device_index NetworkInterface#device_index}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceIndex(java.lang.Number deviceIndex) {
            this.deviceIndex = deviceIndex;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceAttachment#getInstance}
         * @param instance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#instance NetworkInterface#instance}. This parameter is required.
         * @return {@code this}
         */
        public Builder instance(java.lang.String instance) {
            this.instance = instance;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkInterfaceAttachment}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkInterfaceAttachment build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkInterfaceAttachment}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkInterfaceAttachment {
        private final java.lang.Number deviceIndex;
        private final java.lang.String instance;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceIndex = software.amazon.jsii.Kernel.get(this, "deviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instance = software.amazon.jsii.Kernel.get(this, "instance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceIndex = java.util.Objects.requireNonNull(builder.deviceIndex, "deviceIndex is required");
            this.instance = java.util.Objects.requireNonNull(builder.instance, "instance is required");
        }

        @Override
        public final java.lang.Number getDeviceIndex() {
            return this.deviceIndex;
        }

        @Override
        public final java.lang.String getInstance() {
            return this.instance;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deviceIndex", om.valueToTree(this.getDeviceIndex()));
            data.set("instance", om.valueToTree(this.getInstance()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkInterface.NetworkInterfaceAttachment"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkInterfaceAttachment.Jsii$Proxy that = (NetworkInterfaceAttachment.Jsii$Proxy) o;

            if (!deviceIndex.equals(that.deviceIndex)) return false;
            return this.instance.equals(that.instance);
        }

        @Override
        public final int hashCode() {
            int result = this.deviceIndex.hashCode();
            result = 31 * result + (this.instance.hashCode());
            return result;
        }
    }
}
