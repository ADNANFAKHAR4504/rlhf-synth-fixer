package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#name DataAwsNetworkmanagerCoreNetworkPolicyDocument#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#allow_filter DataAwsNetworkmanagerCoreNetworkPolicyDocument#allow_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#deny_filter DataAwsNetworkmanagerCoreNetworkPolicyDocument#deny_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDenyFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#description DataAwsNetworkmanagerCoreNetworkPolicyDocument#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_locations DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_locations}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEdgeLocations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#isolate_attachments DataAwsNetworkmanagerCoreNetworkPolicyDocument#isolate_attachments}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsolateAttachments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#require_attachment_acceptance DataAwsNetworkmanagerCoreNetworkPolicyDocument#require_attachment_acceptance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireAttachmentAcceptance() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments> {
        java.lang.String name;
        java.util.List<java.lang.String> allowFilter;
        java.util.List<java.lang.String> denyFilter;
        java.lang.String description;
        java.util.List<java.lang.String> edgeLocations;
        java.lang.Object isolateAttachments;
        java.lang.Object requireAttachmentAcceptance;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#name DataAwsNetworkmanagerCoreNetworkPolicyDocument#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getAllowFilter}
         * @param allowFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#allow_filter DataAwsNetworkmanagerCoreNetworkPolicyDocument#allow_filter}.
         * @return {@code this}
         */
        public Builder allowFilter(java.util.List<java.lang.String> allowFilter) {
            this.allowFilter = allowFilter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getDenyFilter}
         * @param denyFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#deny_filter DataAwsNetworkmanagerCoreNetworkPolicyDocument#deny_filter}.
         * @return {@code this}
         */
        public Builder denyFilter(java.util.List<java.lang.String> denyFilter) {
            this.denyFilter = denyFilter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#description DataAwsNetworkmanagerCoreNetworkPolicyDocument#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getEdgeLocations}
         * @param edgeLocations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#edge_locations DataAwsNetworkmanagerCoreNetworkPolicyDocument#edge_locations}.
         * @return {@code this}
         */
        public Builder edgeLocations(java.util.List<java.lang.String> edgeLocations) {
            this.edgeLocations = edgeLocations;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getIsolateAttachments}
         * @param isolateAttachments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#isolate_attachments DataAwsNetworkmanagerCoreNetworkPolicyDocument#isolate_attachments}.
         * @return {@code this}
         */
        public Builder isolateAttachments(java.lang.Boolean isolateAttachments) {
            this.isolateAttachments = isolateAttachments;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getIsolateAttachments}
         * @param isolateAttachments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#isolate_attachments DataAwsNetworkmanagerCoreNetworkPolicyDocument#isolate_attachments}.
         * @return {@code this}
         */
        public Builder isolateAttachments(com.hashicorp.cdktf.IResolvable isolateAttachments) {
            this.isolateAttachments = isolateAttachments;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getRequireAttachmentAcceptance}
         * @param requireAttachmentAcceptance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#require_attachment_acceptance DataAwsNetworkmanagerCoreNetworkPolicyDocument#require_attachment_acceptance}.
         * @return {@code this}
         */
        public Builder requireAttachmentAcceptance(java.lang.Boolean requireAttachmentAcceptance) {
            this.requireAttachmentAcceptance = requireAttachmentAcceptance;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments#getRequireAttachmentAcceptance}
         * @param requireAttachmentAcceptance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#require_attachment_acceptance DataAwsNetworkmanagerCoreNetworkPolicyDocument#require_attachment_acceptance}.
         * @return {@code this}
         */
        public Builder requireAttachmentAcceptance(com.hashicorp.cdktf.IResolvable requireAttachmentAcceptance) {
            this.requireAttachmentAcceptance = requireAttachmentAcceptance;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments {
        private final java.lang.String name;
        private final java.util.List<java.lang.String> allowFilter;
        private final java.util.List<java.lang.String> denyFilter;
        private final java.lang.String description;
        private final java.util.List<java.lang.String> edgeLocations;
        private final java.lang.Object isolateAttachments;
        private final java.lang.Object requireAttachmentAcceptance;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowFilter = software.amazon.jsii.Kernel.get(this, "allowFilter", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.denyFilter = software.amazon.jsii.Kernel.get(this, "denyFilter", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.edgeLocations = software.amazon.jsii.Kernel.get(this, "edgeLocations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.isolateAttachments = software.amazon.jsii.Kernel.get(this, "isolateAttachments", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireAttachmentAcceptance = software.amazon.jsii.Kernel.get(this, "requireAttachmentAcceptance", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.allowFilter = builder.allowFilter;
            this.denyFilter = builder.denyFilter;
            this.description = builder.description;
            this.edgeLocations = builder.edgeLocations;
            this.isolateAttachments = builder.isolateAttachments;
            this.requireAttachmentAcceptance = builder.requireAttachmentAcceptance;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowFilter() {
            return this.allowFilter;
        }

        @Override
        public final java.util.List<java.lang.String> getDenyFilter() {
            return this.denyFilter;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.util.List<java.lang.String> getEdgeLocations() {
            return this.edgeLocations;
        }

        @Override
        public final java.lang.Object getIsolateAttachments() {
            return this.isolateAttachments;
        }

        @Override
        public final java.lang.Object getRequireAttachmentAcceptance() {
            return this.requireAttachmentAcceptance;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAllowFilter() != null) {
                data.set("allowFilter", om.valueToTree(this.getAllowFilter()));
            }
            if (this.getDenyFilter() != null) {
                data.set("denyFilter", om.valueToTree(this.getDenyFilter()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEdgeLocations() != null) {
                data.set("edgeLocations", om.valueToTree(this.getEdgeLocations()));
            }
            if (this.getIsolateAttachments() != null) {
                data.set("isolateAttachments", om.valueToTree(this.getIsolateAttachments()));
            }
            if (this.getRequireAttachmentAcceptance() != null) {
                data.set("requireAttachmentAcceptance", om.valueToTree(this.getRequireAttachmentAcceptance()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegments.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.allowFilter != null ? !this.allowFilter.equals(that.allowFilter) : that.allowFilter != null) return false;
            if (this.denyFilter != null ? !this.denyFilter.equals(that.denyFilter) : that.denyFilter != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.edgeLocations != null ? !this.edgeLocations.equals(that.edgeLocations) : that.edgeLocations != null) return false;
            if (this.isolateAttachments != null ? !this.isolateAttachments.equals(that.isolateAttachments) : that.isolateAttachments != null) return false;
            return this.requireAttachmentAcceptance != null ? this.requireAttachmentAcceptance.equals(that.requireAttachmentAcceptance) : that.requireAttachmentAcceptance == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.allowFilter != null ? this.allowFilter.hashCode() : 0);
            result = 31 * result + (this.denyFilter != null ? this.denyFilter.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.edgeLocations != null ? this.edgeLocations.hashCode() : 0);
            result = 31 * result + (this.isolateAttachments != null ? this.isolateAttachments.hashCode() : 0);
            result = 31 * result + (this.requireAttachmentAcceptance != null ? this.requireAttachmentAcceptance.hashCode() : 0);
            return result;
        }
    }
}
