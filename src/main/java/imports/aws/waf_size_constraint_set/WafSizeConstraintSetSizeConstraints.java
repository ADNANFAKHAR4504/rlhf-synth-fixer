package imports.aws.waf_size_constraint_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.646Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafSizeConstraintSet.WafSizeConstraintSetSizeConstraints")
@software.amazon.jsii.Jsii.Proxy(WafSizeConstraintSetSizeConstraints.Jsii$Proxy.class)
public interface WafSizeConstraintSetSizeConstraints extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#comparison_operator WafSizeConstraintSet#comparison_operator}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComparisonOperator();

    /**
     * field_to_match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#field_to_match WafSizeConstraintSet#field_to_match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.waf_size_constraint_set.WafSizeConstraintSetSizeConstraintsFieldToMatch getFieldToMatch();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#size WafSizeConstraintSet#size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#text_transformation WafSizeConstraintSet#text_transformation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTextTransformation();

    /**
     * @return a {@link Builder} of {@link WafSizeConstraintSetSizeConstraints}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafSizeConstraintSetSizeConstraints}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafSizeConstraintSetSizeConstraints> {
        java.lang.String comparisonOperator;
        imports.aws.waf_size_constraint_set.WafSizeConstraintSetSizeConstraintsFieldToMatch fieldToMatch;
        java.lang.Number size;
        java.lang.String textTransformation;

        /**
         * Sets the value of {@link WafSizeConstraintSetSizeConstraints#getComparisonOperator}
         * @param comparisonOperator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#comparison_operator WafSizeConstraintSet#comparison_operator}. This parameter is required.
         * @return {@code this}
         */
        public Builder comparisonOperator(java.lang.String comparisonOperator) {
            this.comparisonOperator = comparisonOperator;
            return this;
        }

        /**
         * Sets the value of {@link WafSizeConstraintSetSizeConstraints#getFieldToMatch}
         * @param fieldToMatch field_to_match block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#field_to_match WafSizeConstraintSet#field_to_match}
         * @return {@code this}
         */
        public Builder fieldToMatch(imports.aws.waf_size_constraint_set.WafSizeConstraintSetSizeConstraintsFieldToMatch fieldToMatch) {
            this.fieldToMatch = fieldToMatch;
            return this;
        }

        /**
         * Sets the value of {@link WafSizeConstraintSetSizeConstraints#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#size WafSizeConstraintSet#size}. This parameter is required.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Sets the value of {@link WafSizeConstraintSetSizeConstraints#getTextTransformation}
         * @param textTransformation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_size_constraint_set#text_transformation WafSizeConstraintSet#text_transformation}. This parameter is required.
         * @return {@code this}
         */
        public Builder textTransformation(java.lang.String textTransformation) {
            this.textTransformation = textTransformation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafSizeConstraintSetSizeConstraints}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafSizeConstraintSetSizeConstraints build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafSizeConstraintSetSizeConstraints}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafSizeConstraintSetSizeConstraints {
        private final java.lang.String comparisonOperator;
        private final imports.aws.waf_size_constraint_set.WafSizeConstraintSetSizeConstraintsFieldToMatch fieldToMatch;
        private final java.lang.Number size;
        private final java.lang.String textTransformation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.comparisonOperator = software.amazon.jsii.Kernel.get(this, "comparisonOperator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldToMatch = software.amazon.jsii.Kernel.get(this, "fieldToMatch", software.amazon.jsii.NativeType.forClass(imports.aws.waf_size_constraint_set.WafSizeConstraintSetSizeConstraintsFieldToMatch.class));
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.textTransformation = software.amazon.jsii.Kernel.get(this, "textTransformation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.comparisonOperator = java.util.Objects.requireNonNull(builder.comparisonOperator, "comparisonOperator is required");
            this.fieldToMatch = java.util.Objects.requireNonNull(builder.fieldToMatch, "fieldToMatch is required");
            this.size = java.util.Objects.requireNonNull(builder.size, "size is required");
            this.textTransformation = java.util.Objects.requireNonNull(builder.textTransformation, "textTransformation is required");
        }

        @Override
        public final java.lang.String getComparisonOperator() {
            return this.comparisonOperator;
        }

        @Override
        public final imports.aws.waf_size_constraint_set.WafSizeConstraintSetSizeConstraintsFieldToMatch getFieldToMatch() {
            return this.fieldToMatch;
        }

        @Override
        public final java.lang.Number getSize() {
            return this.size;
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

            data.set("comparisonOperator", om.valueToTree(this.getComparisonOperator()));
            data.set("fieldToMatch", om.valueToTree(this.getFieldToMatch()));
            data.set("size", om.valueToTree(this.getSize()));
            data.set("textTransformation", om.valueToTree(this.getTextTransformation()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafSizeConstraintSet.WafSizeConstraintSetSizeConstraints"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafSizeConstraintSetSizeConstraints.Jsii$Proxy that = (WafSizeConstraintSetSizeConstraints.Jsii$Proxy) o;

            if (!comparisonOperator.equals(that.comparisonOperator)) return false;
            if (!fieldToMatch.equals(that.fieldToMatch)) return false;
            if (!size.equals(that.size)) return false;
            return this.textTransformation.equals(that.textTransformation);
        }

        @Override
        public final int hashCode() {
            int result = this.comparisonOperator.hashCode();
            result = 31 * result + (this.fieldToMatch.hashCode());
            result = 31 * result + (this.size.hashCode());
            result = 31 * result + (this.textTransformation.hashCode());
            return result;
        }
    }
}
