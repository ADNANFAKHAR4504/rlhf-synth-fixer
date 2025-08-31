package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayout")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationSheetTileLayout.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationSheetTileLayout extends software.amazon.jsii.JsiiSerializable {

    /**
     * gutter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#gutter QuicksightTheme#gutter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter getGutter() {
        return null;
    }

    /**
     * margin block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#margin QuicksightTheme#margin}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin getMargin() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationSheetTileLayout}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationSheetTileLayout}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationSheetTileLayout> {
        imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter gutter;
        imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin margin;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheetTileLayout#getGutter}
         * @param gutter gutter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#gutter QuicksightTheme#gutter}
         * @return {@code this}
         */
        public Builder gutter(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter gutter) {
            this.gutter = gutter;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheetTileLayout#getMargin}
         * @param margin margin block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#margin QuicksightTheme#margin}
         * @return {@code this}
         */
        public Builder margin(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin margin) {
            this.margin = margin;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationSheetTileLayout}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationSheetTileLayout build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationSheetTileLayout}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationSheetTileLayout {
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter gutter;
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin margin;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gutter = software.amazon.jsii.Kernel.get(this, "gutter", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter.class));
            this.margin = software.amazon.jsii.Kernel.get(this, "margin", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gutter = builder.gutter;
            this.margin = builder.margin;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutGutter getGutter() {
            return this.gutter;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayoutMargin getMargin() {
            return this.margin;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGutter() != null) {
                data.set("gutter", om.valueToTree(this.getGutter()));
            }
            if (this.getMargin() != null) {
                data.set("margin", om.valueToTree(this.getMargin()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayout"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationSheetTileLayout.Jsii$Proxy that = (QuicksightThemeConfigurationSheetTileLayout.Jsii$Proxy) o;

            if (this.gutter != null ? !this.gutter.equals(that.gutter) : that.gutter != null) return false;
            return this.margin != null ? this.margin.equals(that.margin) : that.margin == null;
        }

        @Override
        public final int hashCode() {
            int result = this.gutter != null ? this.gutter.hashCode() : 0;
            result = 31 * result + (this.margin != null ? this.margin.hashCode() : 0);
            return result;
        }
    }
}
