package imports.aws.wafregional_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.659Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafregionalWebAcl.WafregionalWebAclLoggingConfigurationRedactedFields")
@software.amazon.jsii.Jsii.Proxy(WafregionalWebAclLoggingConfigurationRedactedFields.Jsii$Proxy.class)
public interface WafregionalWebAclLoggingConfigurationRedactedFields extends software.amazon.jsii.JsiiSerializable {

    /**
     * field_to_match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#field_to_match WafregionalWebAcl#field_to_match}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getFieldToMatch();

    /**
     * @return a {@link Builder} of {@link WafregionalWebAclLoggingConfigurationRedactedFields}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafregionalWebAclLoggingConfigurationRedactedFields}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafregionalWebAclLoggingConfigurationRedactedFields> {
        java.lang.Object fieldToMatch;

        /**
         * Sets the value of {@link WafregionalWebAclLoggingConfigurationRedactedFields#getFieldToMatch}
         * @param fieldToMatch field_to_match block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#field_to_match WafregionalWebAcl#field_to_match}
         * @return {@code this}
         */
        public Builder fieldToMatch(com.hashicorp.cdktf.IResolvable fieldToMatch) {
            this.fieldToMatch = fieldToMatch;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalWebAclLoggingConfigurationRedactedFields#getFieldToMatch}
         * @param fieldToMatch field_to_match block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_web_acl#field_to_match WafregionalWebAcl#field_to_match}
         * @return {@code this}
         */
        public Builder fieldToMatch(java.util.List<? extends imports.aws.wafregional_web_acl.WafregionalWebAclLoggingConfigurationRedactedFieldsFieldToMatch> fieldToMatch) {
            this.fieldToMatch = fieldToMatch;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafregionalWebAclLoggingConfigurationRedactedFields}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafregionalWebAclLoggingConfigurationRedactedFields build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafregionalWebAclLoggingConfigurationRedactedFields}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafregionalWebAclLoggingConfigurationRedactedFields {
        private final java.lang.Object fieldToMatch;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fieldToMatch = software.amazon.jsii.Kernel.get(this, "fieldToMatch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fieldToMatch = java.util.Objects.requireNonNull(builder.fieldToMatch, "fieldToMatch is required");
        }

        @Override
        public final java.lang.Object getFieldToMatch() {
            return this.fieldToMatch;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fieldToMatch", om.valueToTree(this.getFieldToMatch()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafregionalWebAcl.WafregionalWebAclLoggingConfigurationRedactedFields"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafregionalWebAclLoggingConfigurationRedactedFields.Jsii$Proxy that = (WafregionalWebAclLoggingConfigurationRedactedFields.Jsii$Proxy) o;

            return this.fieldToMatch.equals(that.fieldToMatch);
        }

        @Override
        public final int hashCode() {
            int result = this.fieldToMatch.hashCode();
            return result;
        }
    }
}
