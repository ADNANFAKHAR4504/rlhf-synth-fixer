package imports.aws.verifiedaccess_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.572Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessEndpoint.VerifiedaccessEndpointCidrOptions")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessEndpointCidrOptions.Jsii$Proxy.class)
public interface VerifiedaccessEndpointCidrOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#cidr VerifiedaccessEndpoint#cidr}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCidr();

    /**
     * port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port_range VerifiedaccessEndpoint#port_range}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPortRange();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#protocol VerifiedaccessEndpoint#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#subnet_ids VerifiedaccessEndpoint#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessEndpointCidrOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessEndpointCidrOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessEndpointCidrOptions> {
        java.lang.String cidr;
        java.lang.Object portRange;
        java.lang.String protocol;
        java.util.List<java.lang.String> subnetIds;

        /**
         * Sets the value of {@link VerifiedaccessEndpointCidrOptions#getCidr}
         * @param cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#cidr VerifiedaccessEndpoint#cidr}. This parameter is required.
         * @return {@code this}
         */
        public Builder cidr(java.lang.String cidr) {
            this.cidr = cidr;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointCidrOptions#getPortRange}
         * @param portRange port_range block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port_range VerifiedaccessEndpoint#port_range}
         * @return {@code this}
         */
        public Builder portRange(com.hashicorp.cdktf.IResolvable portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointCidrOptions#getPortRange}
         * @param portRange port_range block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port_range VerifiedaccessEndpoint#port_range}
         * @return {@code this}
         */
        public Builder portRange(java.util.List<? extends imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptionsPortRange> portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointCidrOptions#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#protocol VerifiedaccessEndpoint#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointCidrOptions#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#subnet_ids VerifiedaccessEndpoint#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessEndpointCidrOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessEndpointCidrOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessEndpointCidrOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessEndpointCidrOptions {
        private final java.lang.String cidr;
        private final java.lang.Object portRange;
        private final java.lang.String protocol;
        private final java.util.List<java.lang.String> subnetIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cidr = software.amazon.jsii.Kernel.get(this, "cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.portRange = software.amazon.jsii.Kernel.get(this, "portRange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cidr = java.util.Objects.requireNonNull(builder.cidr, "cidr is required");
            this.portRange = java.util.Objects.requireNonNull(builder.portRange, "portRange is required");
            this.protocol = builder.protocol;
            this.subnetIds = builder.subnetIds;
        }

        @Override
        public final java.lang.String getCidr() {
            return this.cidr;
        }

        @Override
        public final java.lang.Object getPortRange() {
            return this.portRange;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cidr", om.valueToTree(this.getCidr()));
            data.set("portRange", om.valueToTree(this.getPortRange()));
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessEndpoint.VerifiedaccessEndpointCidrOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessEndpointCidrOptions.Jsii$Proxy that = (VerifiedaccessEndpointCidrOptions.Jsii$Proxy) o;

            if (!cidr.equals(that.cidr)) return false;
            if (!portRange.equals(that.portRange)) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            return this.subnetIds != null ? this.subnetIds.equals(that.subnetIds) : that.subnetIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cidr.hashCode();
            result = 31 * result + (this.portRange.hashCode());
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            return result;
        }
    }
}
