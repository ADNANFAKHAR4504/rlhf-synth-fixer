package imports.aws.vpclattice_resource_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.622Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource")
@software.amazon.jsii.Jsii.Proxy(VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource.Jsii$Proxy.class)
public interface VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#domain_name VpclatticeResourceConfiguration#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_address_type VpclatticeResourceConfiguration#ip_address_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType();

    /**
     * @return a {@link Builder} of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource> {
        java.lang.String domainName;
        java.lang.String ipAddressType;

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#domain_name VpclatticeResourceConfiguration#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_address_type VpclatticeResourceConfiguration#ip_address_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource {
        private final java.lang.String domainName;
        private final java.lang.String ipAddressType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.ipAddressType = java.util.Objects.requireNonNull(builder.ipAddressType, "ipAddressType is required");
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainName", om.valueToTree(this.getDomainName()));
            data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource.Jsii$Proxy that = (VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            return this.ipAddressType.equals(that.ipAddressType);
        }

        @Override
        public final int hashCode() {
            int result = this.domainName.hashCode();
            result = 31 * result + (this.ipAddressType.hashCode());
            return result;
        }
    }
}
