package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#network_function_groups DataAwsNetworkmanagerCoreNetworkPolicyDocument#network_function_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNetworkFunctionGroups() {
        return null;
    }

    /**
     * with_edge_override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#with_edge_override DataAwsNetworkmanagerCoreNetworkPolicyDocument#with_edge_override}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWithEdgeOverride() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia> {
        java.util.List<java.lang.String> networkFunctionGroups;
        java.lang.Object withEdgeOverride;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia#getNetworkFunctionGroups}
         * @param networkFunctionGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#network_function_groups DataAwsNetworkmanagerCoreNetworkPolicyDocument#network_function_groups}.
         * @return {@code this}
         */
        public Builder networkFunctionGroups(java.util.List<java.lang.String> networkFunctionGroups) {
            this.networkFunctionGroups = networkFunctionGroups;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia#getWithEdgeOverride}
         * @param withEdgeOverride with_edge_override block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#with_edge_override DataAwsNetworkmanagerCoreNetworkPolicyDocument#with_edge_override}
         * @return {@code this}
         */
        public Builder withEdgeOverride(com.hashicorp.cdktf.IResolvable withEdgeOverride) {
            this.withEdgeOverride = withEdgeOverride;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia#getWithEdgeOverride}
         * @param withEdgeOverride with_edge_override block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#with_edge_override DataAwsNetworkmanagerCoreNetworkPolicyDocument#with_edge_override}
         * @return {@code this}
         */
        public Builder withEdgeOverride(java.util.List<? extends imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride> withEdgeOverride) {
            this.withEdgeOverride = withEdgeOverride;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia {
        private final java.util.List<java.lang.String> networkFunctionGroups;
        private final java.lang.Object withEdgeOverride;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.networkFunctionGroups = software.amazon.jsii.Kernel.get(this, "networkFunctionGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.withEdgeOverride = software.amazon.jsii.Kernel.get(this, "withEdgeOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.networkFunctionGroups = builder.networkFunctionGroups;
            this.withEdgeOverride = builder.withEdgeOverride;
        }

        @Override
        public final java.util.List<java.lang.String> getNetworkFunctionGroups() {
            return this.networkFunctionGroups;
        }

        @Override
        public final java.lang.Object getWithEdgeOverride() {
            return this.withEdgeOverride;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNetworkFunctionGroups() != null) {
                data.set("networkFunctionGroups", om.valueToTree(this.getNetworkFunctionGroups()));
            }
            if (this.getWithEdgeOverride() != null) {
                data.set("withEdgeOverride", om.valueToTree(this.getWithEdgeOverride()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia.Jsii$Proxy) o;

            if (this.networkFunctionGroups != null ? !this.networkFunctionGroups.equals(that.networkFunctionGroups) : that.networkFunctionGroups != null) return false;
            return this.withEdgeOverride != null ? this.withEdgeOverride.equals(that.withEdgeOverride) : that.withEdgeOverride == null;
        }

        @Override
        public final int hashCode() {
            int result = this.networkFunctionGroups != null ? this.networkFunctionGroups.hashCode() : 0;
            result = 31 * result + (this.withEdgeOverride != null ? this.withEdgeOverride.hashCode() : 0);
            return result;
        }
    }
}
