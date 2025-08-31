package imports.aws.waf_byte_match_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.638Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafByteMatchSet.WafByteMatchSetByteMatchTuples")
@software.amazon.jsii.Jsii.Proxy(WafByteMatchSetByteMatchTuples.Jsii$Proxy.class)
public interface WafByteMatchSetByteMatchTuples extends software.amazon.jsii.JsiiSerializable {

    /**
     * field_to_match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#field_to_match WafByteMatchSet#field_to_match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.waf_byte_match_set.WafByteMatchSetByteMatchTuplesFieldToMatch getFieldToMatch();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#positional_constraint WafByteMatchSet#positional_constraint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPositionalConstraint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#text_transformation WafByteMatchSet#text_transformation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTextTransformation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#target_string WafByteMatchSet#target_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetString() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WafByteMatchSetByteMatchTuples}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafByteMatchSetByteMatchTuples}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafByteMatchSetByteMatchTuples> {
        imports.aws.waf_byte_match_set.WafByteMatchSetByteMatchTuplesFieldToMatch fieldToMatch;
        java.lang.String positionalConstraint;
        java.lang.String textTransformation;
        java.lang.String targetString;

        /**
         * Sets the value of {@link WafByteMatchSetByteMatchTuples#getFieldToMatch}
         * @param fieldToMatch field_to_match block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#field_to_match WafByteMatchSet#field_to_match}
         * @return {@code this}
         */
        public Builder fieldToMatch(imports.aws.waf_byte_match_set.WafByteMatchSetByteMatchTuplesFieldToMatch fieldToMatch) {
            this.fieldToMatch = fieldToMatch;
            return this;
        }

        /**
         * Sets the value of {@link WafByteMatchSetByteMatchTuples#getPositionalConstraint}
         * @param positionalConstraint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#positional_constraint WafByteMatchSet#positional_constraint}. This parameter is required.
         * @return {@code this}
         */
        public Builder positionalConstraint(java.lang.String positionalConstraint) {
            this.positionalConstraint = positionalConstraint;
            return this;
        }

        /**
         * Sets the value of {@link WafByteMatchSetByteMatchTuples#getTextTransformation}
         * @param textTransformation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#text_transformation WafByteMatchSet#text_transformation}. This parameter is required.
         * @return {@code this}
         */
        public Builder textTransformation(java.lang.String textTransformation) {
            this.textTransformation = textTransformation;
            return this;
        }

        /**
         * Sets the value of {@link WafByteMatchSetByteMatchTuples#getTargetString}
         * @param targetString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_byte_match_set#target_string WafByteMatchSet#target_string}.
         * @return {@code this}
         */
        public Builder targetString(java.lang.String targetString) {
            this.targetString = targetString;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafByteMatchSetByteMatchTuples}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafByteMatchSetByteMatchTuples build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafByteMatchSetByteMatchTuples}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafByteMatchSetByteMatchTuples {
        private final imports.aws.waf_byte_match_set.WafByteMatchSetByteMatchTuplesFieldToMatch fieldToMatch;
        private final java.lang.String positionalConstraint;
        private final java.lang.String textTransformation;
        private final java.lang.String targetString;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fieldToMatch = software.amazon.jsii.Kernel.get(this, "fieldToMatch", software.amazon.jsii.NativeType.forClass(imports.aws.waf_byte_match_set.WafByteMatchSetByteMatchTuplesFieldToMatch.class));
            this.positionalConstraint = software.amazon.jsii.Kernel.get(this, "positionalConstraint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.textTransformation = software.amazon.jsii.Kernel.get(this, "textTransformation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetString = software.amazon.jsii.Kernel.get(this, "targetString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fieldToMatch = java.util.Objects.requireNonNull(builder.fieldToMatch, "fieldToMatch is required");
            this.positionalConstraint = java.util.Objects.requireNonNull(builder.positionalConstraint, "positionalConstraint is required");
            this.textTransformation = java.util.Objects.requireNonNull(builder.textTransformation, "textTransformation is required");
            this.targetString = builder.targetString;
        }

        @Override
        public final imports.aws.waf_byte_match_set.WafByteMatchSetByteMatchTuplesFieldToMatch getFieldToMatch() {
            return this.fieldToMatch;
        }

        @Override
        public final java.lang.String getPositionalConstraint() {
            return this.positionalConstraint;
        }

        @Override
        public final java.lang.String getTextTransformation() {
            return this.textTransformation;
        }

        @Override
        public final java.lang.String getTargetString() {
            return this.targetString;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fieldToMatch", om.valueToTree(this.getFieldToMatch()));
            data.set("positionalConstraint", om.valueToTree(this.getPositionalConstraint()));
            data.set("textTransformation", om.valueToTree(this.getTextTransformation()));
            if (this.getTargetString() != null) {
                data.set("targetString", om.valueToTree(this.getTargetString()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafByteMatchSet.WafByteMatchSetByteMatchTuples"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafByteMatchSetByteMatchTuples.Jsii$Proxy that = (WafByteMatchSetByteMatchTuples.Jsii$Proxy) o;

            if (!fieldToMatch.equals(that.fieldToMatch)) return false;
            if (!positionalConstraint.equals(that.positionalConstraint)) return false;
            if (!textTransformation.equals(that.textTransformation)) return false;
            return this.targetString != null ? this.targetString.equals(that.targetString) : that.targetString == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fieldToMatch.hashCode();
            result = 31 * result + (this.positionalConstraint.hashCode());
            result = 31 * result + (this.textTransformation.hashCode());
            result = 31 * result + (this.targetString != null ? this.targetString.hashCode() : 0);
            return result;
        }
    }
}
