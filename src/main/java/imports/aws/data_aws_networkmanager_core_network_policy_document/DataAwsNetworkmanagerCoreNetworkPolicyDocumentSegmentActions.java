package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.776Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#action DataAwsNetworkmanagerCoreNetworkPolicyDocument#action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#segment DataAwsNetworkmanagerCoreNetworkPolicyDocument#segment}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSegment();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#description DataAwsNetworkmanagerCoreNetworkPolicyDocument#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#destination_cidr_blocks DataAwsNetworkmanagerCoreNetworkPolicyDocument#destination_cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDestinationCidrBlocks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#destinations DataAwsNetworkmanagerCoreNetworkPolicyDocument#destinations}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDestinations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#mode DataAwsNetworkmanagerCoreNetworkPolicyDocument#mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#share_with DataAwsNetworkmanagerCoreNetworkPolicyDocument#share_with}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getShareWith() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#share_with_except DataAwsNetworkmanagerCoreNetworkPolicyDocument#share_with_except}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getShareWithExcept() {
        return null;
    }

    /**
     * via block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#via DataAwsNetworkmanagerCoreNetworkPolicyDocument#via}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia getVia() {
        return null;
    }

    /**
     * when_sent_to block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#when_sent_to DataAwsNetworkmanagerCoreNetworkPolicyDocument#when_sent_to}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo getWhenSentTo() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions> {
        java.lang.String action;
        java.lang.String segment;
        java.lang.String description;
        java.util.List<java.lang.String> destinationCidrBlocks;
        java.util.List<java.lang.String> destinations;
        java.lang.String mode;
        java.util.List<java.lang.String> shareWith;
        java.util.List<java.lang.String> shareWithExcept;
        imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia via;
        imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo whenSentTo;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#action DataAwsNetworkmanagerCoreNetworkPolicyDocument#action}. This parameter is required.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getSegment}
         * @param segment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#segment DataAwsNetworkmanagerCoreNetworkPolicyDocument#segment}. This parameter is required.
         * @return {@code this}
         */
        public Builder segment(java.lang.String segment) {
            this.segment = segment;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#description DataAwsNetworkmanagerCoreNetworkPolicyDocument#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getDestinationCidrBlocks}
         * @param destinationCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#destination_cidr_blocks DataAwsNetworkmanagerCoreNetworkPolicyDocument#destination_cidr_blocks}.
         * @return {@code this}
         */
        public Builder destinationCidrBlocks(java.util.List<java.lang.String> destinationCidrBlocks) {
            this.destinationCidrBlocks = destinationCidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getDestinations}
         * @param destinations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#destinations DataAwsNetworkmanagerCoreNetworkPolicyDocument#destinations}.
         * @return {@code this}
         */
        public Builder destinations(java.util.List<java.lang.String> destinations) {
            this.destinations = destinations;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#mode DataAwsNetworkmanagerCoreNetworkPolicyDocument#mode}.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getShareWith}
         * @param shareWith Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#share_with DataAwsNetworkmanagerCoreNetworkPolicyDocument#share_with}.
         * @return {@code this}
         */
        public Builder shareWith(java.util.List<java.lang.String> shareWith) {
            this.shareWith = shareWith;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getShareWithExcept}
         * @param shareWithExcept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#share_with_except DataAwsNetworkmanagerCoreNetworkPolicyDocument#share_with_except}.
         * @return {@code this}
         */
        public Builder shareWithExcept(java.util.List<java.lang.String> shareWithExcept) {
            this.shareWithExcept = shareWithExcept;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getVia}
         * @param via via block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#via DataAwsNetworkmanagerCoreNetworkPolicyDocument#via}
         * @return {@code this}
         */
        public Builder via(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia via) {
            this.via = via;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions#getWhenSentTo}
         * @param whenSentTo when_sent_to block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#when_sent_to DataAwsNetworkmanagerCoreNetworkPolicyDocument#when_sent_to}
         * @return {@code this}
         */
        public Builder whenSentTo(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo whenSentTo) {
            this.whenSentTo = whenSentTo;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions {
        private final java.lang.String action;
        private final java.lang.String segment;
        private final java.lang.String description;
        private final java.util.List<java.lang.String> destinationCidrBlocks;
        private final java.util.List<java.lang.String> destinations;
        private final java.lang.String mode;
        private final java.util.List<java.lang.String> shareWith;
        private final java.util.List<java.lang.String> shareWithExcept;
        private final imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia via;
        private final imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo whenSentTo;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.segment = software.amazon.jsii.Kernel.get(this, "segment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationCidrBlocks = software.amazon.jsii.Kernel.get(this, "destinationCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.destinations = software.amazon.jsii.Kernel.get(this, "destinations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shareWith = software.amazon.jsii.Kernel.get(this, "shareWith", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.shareWithExcept = software.amazon.jsii.Kernel.get(this, "shareWithExcept", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.via = software.amazon.jsii.Kernel.get(this, "via", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia.class));
            this.whenSentTo = software.amazon.jsii.Kernel.get(this, "whenSentTo", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.segment = java.util.Objects.requireNonNull(builder.segment, "segment is required");
            this.description = builder.description;
            this.destinationCidrBlocks = builder.destinationCidrBlocks;
            this.destinations = builder.destinations;
            this.mode = builder.mode;
            this.shareWith = builder.shareWith;
            this.shareWithExcept = builder.shareWithExcept;
            this.via = builder.via;
            this.whenSentTo = builder.whenSentTo;
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getSegment() {
            return this.segment;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.util.List<java.lang.String> getDestinationCidrBlocks() {
            return this.destinationCidrBlocks;
        }

        @Override
        public final java.util.List<java.lang.String> getDestinations() {
            return this.destinations;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final java.util.List<java.lang.String> getShareWith() {
            return this.shareWith;
        }

        @Override
        public final java.util.List<java.lang.String> getShareWithExcept() {
            return this.shareWithExcept;
        }

        @Override
        public final imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsVia getVia() {
            return this.via;
        }

        @Override
        public final imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo getWhenSentTo() {
            return this.whenSentTo;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("segment", om.valueToTree(this.getSegment()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDestinationCidrBlocks() != null) {
                data.set("destinationCidrBlocks", om.valueToTree(this.getDestinationCidrBlocks()));
            }
            if (this.getDestinations() != null) {
                data.set("destinations", om.valueToTree(this.getDestinations()));
            }
            if (this.getMode() != null) {
                data.set("mode", om.valueToTree(this.getMode()));
            }
            if (this.getShareWith() != null) {
                data.set("shareWith", om.valueToTree(this.getShareWith()));
            }
            if (this.getShareWithExcept() != null) {
                data.set("shareWithExcept", om.valueToTree(this.getShareWithExcept()));
            }
            if (this.getVia() != null) {
                data.set("via", om.valueToTree(this.getVia()));
            }
            if (this.getWhenSentTo() != null) {
                data.set("whenSentTo", om.valueToTree(this.getWhenSentTo()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActions.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!segment.equals(that.segment)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.destinationCidrBlocks != null ? !this.destinationCidrBlocks.equals(that.destinationCidrBlocks) : that.destinationCidrBlocks != null) return false;
            if (this.destinations != null ? !this.destinations.equals(that.destinations) : that.destinations != null) return false;
            if (this.mode != null ? !this.mode.equals(that.mode) : that.mode != null) return false;
            if (this.shareWith != null ? !this.shareWith.equals(that.shareWith) : that.shareWith != null) return false;
            if (this.shareWithExcept != null ? !this.shareWithExcept.equals(that.shareWithExcept) : that.shareWithExcept != null) return false;
            if (this.via != null ? !this.via.equals(that.via) : that.via != null) return false;
            return this.whenSentTo != null ? this.whenSentTo.equals(that.whenSentTo) : that.whenSentTo == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.segment.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.destinationCidrBlocks != null ? this.destinationCidrBlocks.hashCode() : 0);
            result = 31 * result + (this.destinations != null ? this.destinations.hashCode() : 0);
            result = 31 * result + (this.mode != null ? this.mode.hashCode() : 0);
            result = 31 * result + (this.shareWith != null ? this.shareWith.hashCode() : 0);
            result = 31 * result + (this.shareWithExcept != null ? this.shareWithExcept.hashCode() : 0);
            result = 31 * result + (this.via != null ? this.via.hashCode() : 0);
            result = 31 * result + (this.whenSentTo != null ? this.whenSentTo.hashCode() : 0);
            return result;
        }
    }
}
