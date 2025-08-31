package imports.aws.vpclattice_resource_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinition")
@software.amazon.jsii.Jsii.Proxy(VpclatticeResourceConfigurationResourceConfigurationDefinition.Jsii$Proxy.class)
public interface VpclatticeResourceConfigurationResourceConfigurationDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * arn_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#arn_resource VpclatticeResourceConfiguration#arn_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getArnResource() {
        return null;
    }

    /**
     * dns_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#dns_resource VpclatticeResourceConfiguration#dns_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDnsResource() {
        return null;
    }

    /**
     * ip_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_resource VpclatticeResourceConfiguration#ip_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIpResource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeResourceConfigurationResourceConfigurationDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeResourceConfigurationResourceConfigurationDefinition> {
        java.lang.Object arnResource;
        java.lang.Object dnsResource;
        java.lang.Object ipResource;

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition#getArnResource}
         * @param arnResource arn_resource block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#arn_resource VpclatticeResourceConfiguration#arn_resource}
         * @return {@code this}
         */
        public Builder arnResource(com.hashicorp.cdktf.IResolvable arnResource) {
            this.arnResource = arnResource;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition#getArnResource}
         * @param arnResource arn_resource block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#arn_resource VpclatticeResourceConfiguration#arn_resource}
         * @return {@code this}
         */
        public Builder arnResource(java.util.List<? extends imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionArnResource> arnResource) {
            this.arnResource = arnResource;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition#getDnsResource}
         * @param dnsResource dns_resource block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#dns_resource VpclatticeResourceConfiguration#dns_resource}
         * @return {@code this}
         */
        public Builder dnsResource(com.hashicorp.cdktf.IResolvable dnsResource) {
            this.dnsResource = dnsResource;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition#getDnsResource}
         * @param dnsResource dns_resource block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#dns_resource VpclatticeResourceConfiguration#dns_resource}
         * @return {@code this}
         */
        public Builder dnsResource(java.util.List<? extends imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionDnsResource> dnsResource) {
            this.dnsResource = dnsResource;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition#getIpResource}
         * @param ipResource ip_resource block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_resource VpclatticeResourceConfiguration#ip_resource}
         * @return {@code this}
         */
        public Builder ipResource(com.hashicorp.cdktf.IResolvable ipResource) {
            this.ipResource = ipResource;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition#getIpResource}
         * @param ipResource ip_resource block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#ip_resource VpclatticeResourceConfiguration#ip_resource}
         * @return {@code this}
         */
        public Builder ipResource(java.util.List<? extends imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionIpResource> ipResource) {
            this.ipResource = ipResource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeResourceConfigurationResourceConfigurationDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeResourceConfigurationResourceConfigurationDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeResourceConfigurationResourceConfigurationDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeResourceConfigurationResourceConfigurationDefinition {
        private final java.lang.Object arnResource;
        private final java.lang.Object dnsResource;
        private final java.lang.Object ipResource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arnResource = software.amazon.jsii.Kernel.get(this, "arnResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dnsResource = software.amazon.jsii.Kernel.get(this, "dnsResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ipResource = software.amazon.jsii.Kernel.get(this, "ipResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arnResource = builder.arnResource;
            this.dnsResource = builder.dnsResource;
            this.ipResource = builder.ipResource;
        }

        @Override
        public final java.lang.Object getArnResource() {
            return this.arnResource;
        }

        @Override
        public final java.lang.Object getDnsResource() {
            return this.dnsResource;
        }

        @Override
        public final java.lang.Object getIpResource() {
            return this.ipResource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArnResource() != null) {
                data.set("arnResource", om.valueToTree(this.getArnResource()));
            }
            if (this.getDnsResource() != null) {
                data.set("dnsResource", om.valueToTree(this.getDnsResource()));
            }
            if (this.getIpResource() != null) {
                data.set("ipResource", om.valueToTree(this.getIpResource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationResourceConfigurationDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeResourceConfigurationResourceConfigurationDefinition.Jsii$Proxy that = (VpclatticeResourceConfigurationResourceConfigurationDefinition.Jsii$Proxy) o;

            if (this.arnResource != null ? !this.arnResource.equals(that.arnResource) : that.arnResource != null) return false;
            if (this.dnsResource != null ? !this.dnsResource.equals(that.dnsResource) : that.dnsResource != null) return false;
            return this.ipResource != null ? this.ipResource.equals(that.ipResource) : that.ipResource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arnResource != null ? this.arnResource.hashCode() : 0;
            result = 31 * result + (this.dnsResource != null ? this.dnsResource.hashCode() : 0);
            result = 31 * result + (this.ipResource != null ? this.ipResource.hashCode() : 0);
            return result;
        }
    }
}
