package imports.aws.opensearch_outbound_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnectionLocalDomainInfo")
@software.amazon.jsii.Jsii.Proxy(OpensearchOutboundConnectionLocalDomainInfo.Jsii$Proxy.class)
public interface OpensearchOutboundConnectionLocalDomainInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwnerId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * @return a {@link Builder} of {@link OpensearchOutboundConnectionLocalDomainInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchOutboundConnectionLocalDomainInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchOutboundConnectionLocalDomainInfo> {
        java.lang.String domainName;
        java.lang.String ownerId;
        java.lang.String region;

        /**
         * Sets the value of {@link OpensearchOutboundConnectionLocalDomainInfo#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionLocalDomainInfo#getOwnerId}
         * @param ownerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder ownerId(java.lang.String ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionLocalDomainInfo#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchOutboundConnectionLocalDomainInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchOutboundConnectionLocalDomainInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchOutboundConnectionLocalDomainInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchOutboundConnectionLocalDomainInfo {
        private final java.lang.String domainName;
        private final java.lang.String ownerId;
        private final java.lang.String region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ownerId = software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.ownerId = java.util.Objects.requireNonNull(builder.ownerId, "ownerId is required");
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getOwnerId() {
            return this.ownerId;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainName", om.valueToTree(this.getDomainName()));
            data.set("ownerId", om.valueToTree(this.getOwnerId()));
            data.set("region", om.valueToTree(this.getRegion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchOutboundConnection.OpensearchOutboundConnectionLocalDomainInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchOutboundConnectionLocalDomainInfo.Jsii$Proxy that = (OpensearchOutboundConnectionLocalDomainInfo.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (!ownerId.equals(that.ownerId)) return false;
            return this.region.equals(that.region);
        }

        @Override
        public final int hashCode() {
            int result = this.domainName.hashCode();
            result = 31 * result + (this.ownerId.hashCode());
            result = 31 * result + (this.region.hashCode());
            return result;
        }
    }
}
