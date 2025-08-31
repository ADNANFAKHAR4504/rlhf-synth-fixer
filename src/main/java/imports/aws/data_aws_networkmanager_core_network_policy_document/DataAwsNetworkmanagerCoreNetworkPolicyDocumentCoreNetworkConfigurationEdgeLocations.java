package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.776Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#location DataAwsNetworkmanagerCoreNetworkPolicyDocument#location}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#asn DataAwsNetworkmanagerCoreNetworkPolicyDocument#asn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAsn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#inside_cidr_blocks DataAwsNetworkmanagerCoreNetworkPolicyDocument#inside_cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsideCidrBlocks() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations> {
        java.lang.String location;
        java.lang.String asn;
        java.util.List<java.lang.String> insideCidrBlocks;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations#getLocation}
         * @param location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#location DataAwsNetworkmanagerCoreNetworkPolicyDocument#location}. This parameter is required.
         * @return {@code this}
         */
        public Builder location(java.lang.String location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations#getAsn}
         * @param asn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#asn DataAwsNetworkmanagerCoreNetworkPolicyDocument#asn}.
         * @return {@code this}
         */
        public Builder asn(java.lang.String asn) {
            this.asn = asn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations#getInsideCidrBlocks}
         * @param insideCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#inside_cidr_blocks DataAwsNetworkmanagerCoreNetworkPolicyDocument#inside_cidr_blocks}.
         * @return {@code this}
         */
        public Builder insideCidrBlocks(java.util.List<java.lang.String> insideCidrBlocks) {
            this.insideCidrBlocks = insideCidrBlocks;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations {
        private final java.lang.String location;
        private final java.lang.String asn;
        private final java.util.List<java.lang.String> insideCidrBlocks;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.asn = software.amazon.jsii.Kernel.get(this, "asn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.insideCidrBlocks = software.amazon.jsii.Kernel.get(this, "insideCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.location = java.util.Objects.requireNonNull(builder.location, "location is required");
            this.asn = builder.asn;
            this.insideCidrBlocks = builder.insideCidrBlocks;
        }

        @Override
        public final java.lang.String getLocation() {
            return this.location;
        }

        @Override
        public final java.lang.String getAsn() {
            return this.asn;
        }

        @Override
        public final java.util.List<java.lang.String> getInsideCidrBlocks() {
            return this.insideCidrBlocks;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("location", om.valueToTree(this.getLocation()));
            if (this.getAsn() != null) {
                data.set("asn", om.valueToTree(this.getAsn()));
            }
            if (this.getInsideCidrBlocks() != null) {
                data.set("insideCidrBlocks", om.valueToTree(this.getInsideCidrBlocks()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations.Jsii$Proxy) o;

            if (!location.equals(that.location)) return false;
            if (this.asn != null ? !this.asn.equals(that.asn) : that.asn != null) return false;
            return this.insideCidrBlocks != null ? this.insideCidrBlocks.equals(that.insideCidrBlocks) : that.insideCidrBlocks == null;
        }

        @Override
        public final int hashCode() {
            int result = this.location.hashCode();
            result = 31 * result + (this.asn != null ? this.asn.hashCode() : 0);
            result = 31 * result + (this.insideCidrBlocks != null ? this.insideCidrBlocks.hashCode() : 0);
            return result;
        }
    }
}
