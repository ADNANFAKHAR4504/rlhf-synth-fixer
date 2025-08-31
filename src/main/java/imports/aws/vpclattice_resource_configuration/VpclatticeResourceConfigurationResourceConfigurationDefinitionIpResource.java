package imports.aws.vpclattice_resource_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.622Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource")
@software.amazon.jsii.Jsii.Proxy(VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource.Jsii$Proxy.class)
public interface VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_address VpclatticeResourceConfiguration#ip_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIpAddress();

    /**
     * @return a {@link Builder} of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource> {
        java.lang.String ipAddress;

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource#getIpAddress}
         * @param ipAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_address VpclatticeResourceConfiguration#ip_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder ipAddress(java.lang.String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource {
        private final java.lang.String ipAddress;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipAddress = software.amazon.jsii.Kernel.get(this, "ipAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipAddress = java.util.Objects.requireNonNull(builder.ipAddress, "ipAddress is required");
        }

        @Override
        public final java.lang.String getIpAddress() {
            return this.ipAddress;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ipAddress", om.valueToTree(this.getIpAddress()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource.Jsii$Proxy that = (VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource.Jsii$Proxy) o;

            return this.ipAddress.equals(that.ipAddress);
        }

        @Override
        public final int hashCode() {
            int result = this.ipAddress.hashCode();
            return result;
        }
    }
}
