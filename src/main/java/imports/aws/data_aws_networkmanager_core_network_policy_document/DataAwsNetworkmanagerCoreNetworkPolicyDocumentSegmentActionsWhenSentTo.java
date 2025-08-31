package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#segments DataAwsNetworkmanagerCoreNetworkPolicyDocument#segments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSegments() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo> {
        java.util.List<java.lang.String> segments;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo#getSegments}
         * @param segments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#segments DataAwsNetworkmanagerCoreNetworkPolicyDocument#segments}.
         * @return {@code this}
         */
        public Builder segments(java.util.List<java.lang.String> segments) {
            this.segments = segments;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo {
        private final java.util.List<java.lang.String> segments;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.segments = software.amazon.jsii.Kernel.get(this, "segments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.segments = builder.segments;
        }

        @Override
        public final java.util.List<java.lang.String> getSegments() {
            return this.segments;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSegments() != null) {
                data.set("segments", om.valueToTree(this.getSegments()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo.Jsii$Proxy) o;

            return this.segments != null ? this.segments.equals(that.segments) : that.segments == null;
        }

        @Override
        public final int hashCode() {
            int result = this.segments != null ? this.segments.hashCode() : 0;
            return result;
        }
    }
}
