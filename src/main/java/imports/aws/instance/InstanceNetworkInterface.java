package imports.aws.instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.392Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.instance.InstanceNetworkInterface")
@software.amazon.jsii.Jsii.Proxy(InstanceNetworkInterface.Jsii$Proxy.class)
public interface InstanceNetworkInterface extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#device_index Instance#device_index}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDeviceIndex();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface_id Instance#network_interface_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#delete_on_termination Instance#delete_on_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteOnTermination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_card_index Instance#network_card_index}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNetworkCardIndex() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link InstanceNetworkInterface}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InstanceNetworkInterface}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InstanceNetworkInterface> {
        java.lang.Number deviceIndex;
        java.lang.String networkInterfaceId;
        java.lang.Object deleteOnTermination;
        java.lang.Number networkCardIndex;

        /**
         * Sets the value of {@link InstanceNetworkInterface#getDeviceIndex}
         * @param deviceIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#device_index Instance#device_index}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceIndex(java.lang.Number deviceIndex) {
            this.deviceIndex = deviceIndex;
            return this;
        }

        /**
         * Sets the value of {@link InstanceNetworkInterface#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface_id Instance#network_interface_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link InstanceNetworkInterface#getDeleteOnTermination}
         * @param deleteOnTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#delete_on_termination Instance#delete_on_termination}.
         * @return {@code this}
         */
        public Builder deleteOnTermination(java.lang.Boolean deleteOnTermination) {
            this.deleteOnTermination = deleteOnTermination;
            return this;
        }

        /**
         * Sets the value of {@link InstanceNetworkInterface#getDeleteOnTermination}
         * @param deleteOnTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#delete_on_termination Instance#delete_on_termination}.
         * @return {@code this}
         */
        public Builder deleteOnTermination(com.hashicorp.cdktf.IResolvable deleteOnTermination) {
            this.deleteOnTermination = deleteOnTermination;
            return this;
        }

        /**
         * Sets the value of {@link InstanceNetworkInterface#getNetworkCardIndex}
         * @param networkCardIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_card_index Instance#network_card_index}.
         * @return {@code this}
         */
        public Builder networkCardIndex(java.lang.Number networkCardIndex) {
            this.networkCardIndex = networkCardIndex;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link InstanceNetworkInterface}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InstanceNetworkInterface build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InstanceNetworkInterface}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InstanceNetworkInterface {
        private final java.lang.Number deviceIndex;
        private final java.lang.String networkInterfaceId;
        private final java.lang.Object deleteOnTermination;
        private final java.lang.Number networkCardIndex;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceIndex = software.amazon.jsii.Kernel.get(this, "deviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteOnTermination = software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkCardIndex = software.amazon.jsii.Kernel.get(this, "networkCardIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceIndex = java.util.Objects.requireNonNull(builder.deviceIndex, "deviceIndex is required");
            this.networkInterfaceId = java.util.Objects.requireNonNull(builder.networkInterfaceId, "networkInterfaceId is required");
            this.deleteOnTermination = builder.deleteOnTermination;
            this.networkCardIndex = builder.networkCardIndex;
        }

        @Override
        public final java.lang.Number getDeviceIndex() {
            return this.deviceIndex;
        }

        @Override
        public final java.lang.String getNetworkInterfaceId() {
            return this.networkInterfaceId;
        }

        @Override
        public final java.lang.Object getDeleteOnTermination() {
            return this.deleteOnTermination;
        }

        @Override
        public final java.lang.Number getNetworkCardIndex() {
            return this.networkCardIndex;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deviceIndex", om.valueToTree(this.getDeviceIndex()));
            data.set("networkInterfaceId", om.valueToTree(this.getNetworkInterfaceId()));
            if (this.getDeleteOnTermination() != null) {
                data.set("deleteOnTermination", om.valueToTree(this.getDeleteOnTermination()));
            }
            if (this.getNetworkCardIndex() != null) {
                data.set("networkCardIndex", om.valueToTree(this.getNetworkCardIndex()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.instance.InstanceNetworkInterface"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InstanceNetworkInterface.Jsii$Proxy that = (InstanceNetworkInterface.Jsii$Proxy) o;

            if (!deviceIndex.equals(that.deviceIndex)) return false;
            if (!networkInterfaceId.equals(that.networkInterfaceId)) return false;
            if (this.deleteOnTermination != null ? !this.deleteOnTermination.equals(that.deleteOnTermination) : that.deleteOnTermination != null) return false;
            return this.networkCardIndex != null ? this.networkCardIndex.equals(that.networkCardIndex) : that.networkCardIndex == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceIndex.hashCode();
            result = 31 * result + (this.networkInterfaceId.hashCode());
            result = 31 * result + (this.deleteOnTermination != null ? this.deleteOnTermination.hashCode() : 0);
            result = 31 * result + (this.networkCardIndex != null ? this.networkCardIndex.hashCode() : 0);
            return result;
        }
    }
}
