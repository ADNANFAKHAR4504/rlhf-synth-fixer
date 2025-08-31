package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.776Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#asn_ranges DataAwsNetworkmanagerCoreNetworkPolicyDocument#asn_ranges}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAsnRanges();

    /**
     * edge_locations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_locations DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_locations}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEdgeLocations();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#inside_cidr_blocks DataAwsNetworkmanagerCoreNetworkPolicyDocument#inside_cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsideCidrBlocks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#vpn_ecmp_support DataAwsNetworkmanagerCoreNetworkPolicyDocument#vpn_ecmp_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpnEcmpSupport() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration> {
        java.util.List<java.lang.String> asnRanges;
        java.lang.Object edgeLocations;
        java.util.List<java.lang.String> insideCidrBlocks;
        java.lang.Object vpnEcmpSupport;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration#getAsnRanges}
         * @param asnRanges Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#asn_ranges DataAwsNetworkmanagerCoreNetworkPolicyDocument#asn_ranges}. This parameter is required.
         * @return {@code this}
         */
        public Builder asnRanges(java.util.List<java.lang.String> asnRanges) {
            this.asnRanges = asnRanges;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration#getEdgeLocations}
         * @param edgeLocations edge_locations block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_locations DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_locations}
         * @return {@code this}
         */
        public Builder edgeLocations(com.hashicorp.cdktf.IResolvable edgeLocations) {
            this.edgeLocations = edgeLocations;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration#getEdgeLocations}
         * @param edgeLocations edge_locations block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_locations DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_locations}
         * @return {@code this}
         */
        public Builder edgeLocations(java.util.List<? extends imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfigurationEdgeLocations> edgeLocations) {
            this.edgeLocations = edgeLocations;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration#getInsideCidrBlocks}
         * @param insideCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#inside_cidr_blocks DataAwsNetworkmanagerCoreNetworkPolicyDocument#inside_cidr_blocks}.
         * @return {@code this}
         */
        public Builder insideCidrBlocks(java.util.List<java.lang.String> insideCidrBlocks) {
            this.insideCidrBlocks = insideCidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration#getVpnEcmpSupport}
         * @param vpnEcmpSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#vpn_ecmp_support DataAwsNetworkmanagerCoreNetworkPolicyDocument#vpn_ecmp_support}.
         * @return {@code this}
         */
        public Builder vpnEcmpSupport(java.lang.Boolean vpnEcmpSupport) {
            this.vpnEcmpSupport = vpnEcmpSupport;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration#getVpnEcmpSupport}
         * @param vpnEcmpSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#vpn_ecmp_support DataAwsNetworkmanagerCoreNetworkPolicyDocument#vpn_ecmp_support}.
         * @return {@code this}
         */
        public Builder vpnEcmpSupport(com.hashicorp.cdktf.IResolvable vpnEcmpSupport) {
            this.vpnEcmpSupport = vpnEcmpSupport;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration {
        private final java.util.List<java.lang.String> asnRanges;
        private final java.lang.Object edgeLocations;
        private final java.util.List<java.lang.String> insideCidrBlocks;
        private final java.lang.Object vpnEcmpSupport;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.asnRanges = software.amazon.jsii.Kernel.get(this, "asnRanges", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.edgeLocations = software.amazon.jsii.Kernel.get(this, "edgeLocations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.insideCidrBlocks = software.amazon.jsii.Kernel.get(this, "insideCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpnEcmpSupport = software.amazon.jsii.Kernel.get(this, "vpnEcmpSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.asnRanges = java.util.Objects.requireNonNull(builder.asnRanges, "asnRanges is required");
            this.edgeLocations = java.util.Objects.requireNonNull(builder.edgeLocations, "edgeLocations is required");
            this.insideCidrBlocks = builder.insideCidrBlocks;
            this.vpnEcmpSupport = builder.vpnEcmpSupport;
        }

        @Override
        public final java.util.List<java.lang.String> getAsnRanges() {
            return this.asnRanges;
        }

        @Override
        public final java.lang.Object getEdgeLocations() {
            return this.edgeLocations;
        }

        @Override
        public final java.util.List<java.lang.String> getInsideCidrBlocks() {
            return this.insideCidrBlocks;
        }

        @Override
        public final java.lang.Object getVpnEcmpSupport() {
            return this.vpnEcmpSupport;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("asnRanges", om.valueToTree(this.getAsnRanges()));
            data.set("edgeLocations", om.valueToTree(this.getEdgeLocations()));
            if (this.getInsideCidrBlocks() != null) {
                data.set("insideCidrBlocks", om.valueToTree(this.getInsideCidrBlocks()));
            }
            if (this.getVpnEcmpSupport() != null) {
                data.set("vpnEcmpSupport", om.valueToTree(this.getVpnEcmpSupport()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentCoreNetworkConfiguration.Jsii$Proxy) o;

            if (!asnRanges.equals(that.asnRanges)) return false;
            if (!edgeLocations.equals(that.edgeLocations)) return false;
            if (this.insideCidrBlocks != null ? !this.insideCidrBlocks.equals(that.insideCidrBlocks) : that.insideCidrBlocks != null) return false;
            return this.vpnEcmpSupport != null ? this.vpnEcmpSupport.equals(that.vpnEcmpSupport) : that.vpnEcmpSupport == null;
        }

        @Override
        public final int hashCode() {
            int result = this.asnRanges.hashCode();
            result = 31 * result + (this.edgeLocations.hashCode());
            result = 31 * result + (this.insideCidrBlocks != null ? this.insideCidrBlocks.hashCode() : 0);
            result = 31 * result + (this.vpnEcmpSupport != null ? this.vpnEcmpSupport.hashCode() : 0);
            return result;
        }
    }
}
