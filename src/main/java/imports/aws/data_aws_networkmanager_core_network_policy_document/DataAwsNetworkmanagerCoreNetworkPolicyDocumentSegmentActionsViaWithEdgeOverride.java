package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_sets DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_sets}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEdgeSets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#use_edge DataAwsNetworkmanagerCoreNetworkPolicyDocument#use_edge}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUseEdge() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#use_edge_location DataAwsNetworkmanagerCoreNetworkPolicyDocument#use_edge_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUseEdgeLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride> {
        java.lang.Object edgeSets;
        java.lang.String useEdge;
        java.lang.String useEdgeLocation;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride#getEdgeSets}
         * @param edgeSets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_sets DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_sets}.
         * @return {@code this}
         */
        public Builder edgeSets(com.hashicorp.cdktf.IResolvable edgeSets) {
            this.edgeSets = edgeSets;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride#getEdgeSets}
         * @param edgeSets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_sets DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_sets}.
         * @return {@code this}
         */
        public Builder edgeSets(java.util.List<? extends java.util.List<java.lang.String>> edgeSets) {
            this.edgeSets = edgeSets;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride#getUseEdge}
         * @param useEdge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#use_edge DataAwsNetworkmanagerCoreNetworkPolicyDocument#use_edge}.
         * @return {@code this}
         */
        public Builder useEdge(java.lang.String useEdge) {
            this.useEdge = useEdge;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride#getUseEdgeLocation}
         * @param useEdgeLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#use_edge_location DataAwsNetworkmanagerCoreNetworkPolicyDocument#use_edge_location}.
         * @return {@code this}
         */
        public Builder useEdgeLocation(java.lang.String useEdgeLocation) {
            this.useEdgeLocation = useEdgeLocation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride {
        private final java.lang.Object edgeSets;
        private final java.lang.String useEdge;
        private final java.lang.String useEdgeLocation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.edgeSets = software.amazon.jsii.Kernel.get(this, "edgeSets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.useEdge = software.amazon.jsii.Kernel.get(this, "useEdge", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useEdgeLocation = software.amazon.jsii.Kernel.get(this, "useEdgeLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.edgeSets = builder.edgeSets;
            this.useEdge = builder.useEdge;
            this.useEdgeLocation = builder.useEdgeLocation;
        }

        @Override
        public final java.lang.Object getEdgeSets() {
            return this.edgeSets;
        }

        @Override
        public final java.lang.String getUseEdge() {
            return this.useEdge;
        }

        @Override
        public final java.lang.String getUseEdgeLocation() {
            return this.useEdgeLocation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEdgeSets() != null) {
                data.set("edgeSets", om.valueToTree(this.getEdgeSets()));
            }
            if (this.getUseEdge() != null) {
                data.set("useEdge", om.valueToTree(this.getUseEdge()));
            }
            if (this.getUseEdgeLocation() != null) {
                data.set("useEdgeLocation", om.valueToTree(this.getUseEdgeLocation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride.Jsii$Proxy) o;

            if (this.edgeSets != null ? !this.edgeSets.equals(that.edgeSets) : that.edgeSets != null) return false;
            if (this.useEdge != null ? !this.useEdge.equals(that.useEdge) : that.useEdge != null) return false;
            return this.useEdgeLocation != null ? this.useEdgeLocation.equals(that.useEdgeLocation) : that.useEdgeLocation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.edgeSets != null ? this.edgeSets.hashCode() : 0;
            result = 31 * result + (this.useEdge != null ? this.useEdge.hashCode() : 0);
            result = 31 * result + (this.useEdgeLocation != null ? this.useEdgeLocation.hashCode() : 0);
            return result;
        }
    }
}
