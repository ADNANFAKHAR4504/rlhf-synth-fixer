package imports.aws.wafregional_sql_injection_match_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.659Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafregionalSqlInjectionMatchSet.WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple")
@software.amazon.jsii.Jsii.Proxy(WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple.Jsii$Proxy.class)
public interface WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple extends software.amazon.jsii.JsiiSerializable {

    /**
     * field_to_match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_sql_injection_match_set#field_to_match WafregionalSqlInjectionMatchSet#field_to_match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.wafregional_sql_injection_match_set.WafregionalSqlInjectionMatchSetSqlInjectionMatchTupleFieldToMatch getFieldToMatch();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_sql_injection_match_set#text_transformation WafregionalSqlInjectionMatchSet#text_transformation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTextTransformation();

    /**
     * @return a {@link Builder} of {@link WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple> {
        imports.aws.wafregional_sql_injection_match_set.WafregionalSqlInjectionMatchSetSqlInjectionMatchTupleFieldToMatch fieldToMatch;
        java.lang.String textTransformation;

        /**
         * Sets the value of {@link WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple#getFieldToMatch}
         * @param fieldToMatch field_to_match block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_sql_injection_match_set#field_to_match WafregionalSqlInjectionMatchSet#field_to_match}
         * @return {@code this}
         */
        public Builder fieldToMatch(imports.aws.wafregional_sql_injection_match_set.WafregionalSqlInjectionMatchSetSqlInjectionMatchTupleFieldToMatch fieldToMatch) {
            this.fieldToMatch = fieldToMatch;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple#getTextTransformation}
         * @param textTransformation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_sql_injection_match_set#text_transformation WafregionalSqlInjectionMatchSet#text_transformation}. This parameter is required.
         * @return {@code this}
         */
        public Builder textTransformation(java.lang.String textTransformation) {
            this.textTransformation = textTransformation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple {
        private final imports.aws.wafregional_sql_injection_match_set.WafregionalSqlInjectionMatchSetSqlInjectionMatchTupleFieldToMatch fieldToMatch;
        private final java.lang.String textTransformation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fieldToMatch = software.amazon.jsii.Kernel.get(this, "fieldToMatch", software.amazon.jsii.NativeType.forClass(imports.aws.wafregional_sql_injection_match_set.WafregionalSqlInjectionMatchSetSqlInjectionMatchTupleFieldToMatch.class));
            this.textTransformation = software.amazon.jsii.Kernel.get(this, "textTransformation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fieldToMatch = java.util.Objects.requireNonNull(builder.fieldToMatch, "fieldToMatch is required");
            this.textTransformation = java.util.Objects.requireNonNull(builder.textTransformation, "textTransformation is required");
        }

        @Override
        public final imports.aws.wafregional_sql_injection_match_set.WafregionalSqlInjectionMatchSetSqlInjectionMatchTupleFieldToMatch getFieldToMatch() {
            return this.fieldToMatch;
        }

        @Override
        public final java.lang.String getTextTransformation() {
            return this.textTransformation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fieldToMatch", om.valueToTree(this.getFieldToMatch()));
            data.set("textTransformation", om.valueToTree(this.getTextTransformation()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafregionalSqlInjectionMatchSet.WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple.Jsii$Proxy that = (WafregionalSqlInjectionMatchSetSqlInjectionMatchTuple.Jsii$Proxy) o;

            if (!fieldToMatch.equals(that.fieldToMatch)) return false;
            return this.textTransformation.equals(that.textTransformation);
        }

        @Override
        public final int hashCode() {
            int result = this.fieldToMatch.hashCode();
            result = 31 * result + (this.textTransformation.hashCode());
            return result;
        }
    }
}
