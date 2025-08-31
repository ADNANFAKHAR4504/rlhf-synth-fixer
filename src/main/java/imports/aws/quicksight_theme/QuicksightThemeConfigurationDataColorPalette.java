package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.126Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationDataColorPalette")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationDataColorPalette.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationDataColorPalette extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#colors QuicksightTheme#colors}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColors() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#empty_fill_color QuicksightTheme#empty_fill_color}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmptyFillColor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#min_max_gradient QuicksightTheme#min_max_gradient}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMinMaxGradient() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationDataColorPalette}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationDataColorPalette}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationDataColorPalette> {
        java.util.List<java.lang.String> colors;
        java.lang.String emptyFillColor;
        java.util.List<java.lang.String> minMaxGradient;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationDataColorPalette#getColors}
         * @param colors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#colors QuicksightTheme#colors}.
         * @return {@code this}
         */
        public Builder colors(java.util.List<java.lang.String> colors) {
            this.colors = colors;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfigurationDataColorPalette#getEmptyFillColor}
         * @param emptyFillColor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#empty_fill_color QuicksightTheme#empty_fill_color}.
         * @return {@code this}
         */
        public Builder emptyFillColor(java.lang.String emptyFillColor) {
            this.emptyFillColor = emptyFillColor;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfigurationDataColorPalette#getMinMaxGradient}
         * @param minMaxGradient Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#min_max_gradient QuicksightTheme#min_max_gradient}.
         * @return {@code this}
         */
        public Builder minMaxGradient(java.util.List<java.lang.String> minMaxGradient) {
            this.minMaxGradient = minMaxGradient;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationDataColorPalette}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationDataColorPalette build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationDataColorPalette}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationDataColorPalette {
        private final java.util.List<java.lang.String> colors;
        private final java.lang.String emptyFillColor;
        private final java.util.List<java.lang.String> minMaxGradient;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.colors = software.amazon.jsii.Kernel.get(this, "colors", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.emptyFillColor = software.amazon.jsii.Kernel.get(this, "emptyFillColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minMaxGradient = software.amazon.jsii.Kernel.get(this, "minMaxGradient", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.colors = builder.colors;
            this.emptyFillColor = builder.emptyFillColor;
            this.minMaxGradient = builder.minMaxGradient;
        }

        @Override
        public final java.util.List<java.lang.String> getColors() {
            return this.colors;
        }

        @Override
        public final java.lang.String getEmptyFillColor() {
            return this.emptyFillColor;
        }

        @Override
        public final java.util.List<java.lang.String> getMinMaxGradient() {
            return this.minMaxGradient;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColors() != null) {
                data.set("colors", om.valueToTree(this.getColors()));
            }
            if (this.getEmptyFillColor() != null) {
                data.set("emptyFillColor", om.valueToTree(this.getEmptyFillColor()));
            }
            if (this.getMinMaxGradient() != null) {
                data.set("minMaxGradient", om.valueToTree(this.getMinMaxGradient()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationDataColorPalette"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationDataColorPalette.Jsii$Proxy that = (QuicksightThemeConfigurationDataColorPalette.Jsii$Proxy) o;

            if (this.colors != null ? !this.colors.equals(that.colors) : that.colors != null) return false;
            if (this.emptyFillColor != null ? !this.emptyFillColor.equals(that.emptyFillColor) : that.emptyFillColor != null) return false;
            return this.minMaxGradient != null ? this.minMaxGradient.equals(that.minMaxGradient) : that.minMaxGradient == null;
        }

        @Override
        public final int hashCode() {
            int result = this.colors != null ? this.colors.hashCode() : 0;
            result = 31 * result + (this.emptyFillColor != null ? this.emptyFillColor.hashCode() : 0);
            result = 31 * result + (this.minMaxGradient != null ? this.minMaxGradient.hashCode() : 0);
            return result;
        }
    }
}
