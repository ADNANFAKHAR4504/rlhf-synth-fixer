package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationTypography")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationTypography.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationTypography extends software.amazon.jsii.JsiiSerializable {

    /**
     * font_families block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_families QuicksightTheme#font_families}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFontFamilies() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationTypography}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationTypography}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationTypography> {
        java.lang.Object fontFamilies;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationTypography#getFontFamilies}
         * @param fontFamilies font_families block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_families QuicksightTheme#font_families}
         * @return {@code this}
         */
        public Builder fontFamilies(com.hashicorp.cdktf.IResolvable fontFamilies) {
            this.fontFamilies = fontFamilies;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfigurationTypography#getFontFamilies}
         * @param fontFamilies font_families block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_families QuicksightTheme#font_families}
         * @return {@code this}
         */
        public Builder fontFamilies(java.util.List<? extends imports.aws.quicksight_theme.QuicksightThemeConfigurationTypographyFontFamilies> fontFamilies) {
            this.fontFamilies = fontFamilies;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationTypography}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationTypography build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationTypography}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationTypography {
        private final java.lang.Object fontFamilies;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fontFamilies = software.amazon.jsii.Kernel.get(this, "fontFamilies", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fontFamilies = builder.fontFamilies;
        }

        @Override
        public final java.lang.Object getFontFamilies() {
            return this.fontFamilies;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFontFamilies() != null) {
                data.set("fontFamilies", om.valueToTree(this.getFontFamilies()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationTypography"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationTypography.Jsii$Proxy that = (QuicksightThemeConfigurationTypography.Jsii$Proxy) o;

            return this.fontFamilies != null ? this.fontFamilies.equals(that.fontFamilies) : that.fontFamilies == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fontFamilies != null ? this.fontFamilies.hashCode() : 0;
            return result;
        }
    }
}
