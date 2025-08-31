package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationTypographyFontFamilies")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationTypographyFontFamilies.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationTypographyFontFamilies extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_family QuicksightTheme#font_family}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFontFamily() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationTypographyFontFamilies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationTypographyFontFamilies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationTypographyFontFamilies> {
        java.lang.String fontFamily;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationTypographyFontFamilies#getFontFamily}
         * @param fontFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#font_family QuicksightTheme#font_family}.
         * @return {@code this}
         */
        public Builder fontFamily(java.lang.String fontFamily) {
            this.fontFamily = fontFamily;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationTypographyFontFamilies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationTypographyFontFamilies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationTypographyFontFamilies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationTypographyFontFamilies {
        private final java.lang.String fontFamily;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fontFamily = software.amazon.jsii.Kernel.get(this, "fontFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fontFamily = builder.fontFamily;
        }

        @Override
        public final java.lang.String getFontFamily() {
            return this.fontFamily;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFontFamily() != null) {
                data.set("fontFamily", om.valueToTree(this.getFontFamily()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationTypographyFontFamilies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationTypographyFontFamilies.Jsii$Proxy that = (QuicksightThemeConfigurationTypographyFontFamilies.Jsii$Proxy) o;

            return this.fontFamily != null ? this.fontFamily.equals(that.fontFamily) : that.fontFamily == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fontFamily != null ? this.fontFamily.hashCode() : 0;
            return result;
        }
    }
}
