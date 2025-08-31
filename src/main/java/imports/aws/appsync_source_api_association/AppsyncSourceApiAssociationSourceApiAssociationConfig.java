package imports.aws.appsync_source_api_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncSourceApiAssociation.AppsyncSourceApiAssociationSourceApiAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncSourceApiAssociationSourceApiAssociationConfig.Jsii$Proxy.class)
public interface AppsyncSourceApiAssociationSourceApiAssociationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merge_type AppsyncSourceApiAssociation#merge_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMergeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncSourceApiAssociationSourceApiAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncSourceApiAssociationSourceApiAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncSourceApiAssociationSourceApiAssociationConfig> {
        java.lang.String mergeType;

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationSourceApiAssociationConfig#getMergeType}
         * @param mergeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merge_type AppsyncSourceApiAssociation#merge_type}.
         * @return {@code this}
         */
        public Builder mergeType(java.lang.String mergeType) {
            this.mergeType = mergeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncSourceApiAssociationSourceApiAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncSourceApiAssociationSourceApiAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncSourceApiAssociationSourceApiAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncSourceApiAssociationSourceApiAssociationConfig {
        private final java.lang.String mergeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mergeType = software.amazon.jsii.Kernel.get(this, "mergeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mergeType = builder.mergeType;
        }

        @Override
        public final java.lang.String getMergeType() {
            return this.mergeType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMergeType() != null) {
                data.set("mergeType", om.valueToTree(this.getMergeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncSourceApiAssociation.AppsyncSourceApiAssociationSourceApiAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncSourceApiAssociationSourceApiAssociationConfig.Jsii$Proxy that = (AppsyncSourceApiAssociationSourceApiAssociationConfig.Jsii$Proxy) o;

            return this.mergeType != null ? this.mergeType.equals(that.mergeType) : that.mergeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mergeType != null ? this.mergeType.hashCode() : 0;
            return result;
        }
    }
}
