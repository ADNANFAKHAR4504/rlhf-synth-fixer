package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetTile")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationSheetTile.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationSheetTile extends software.amazon.jsii.JsiiSerializable {

    /**
     * border block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#border QuicksightTheme#border}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder getBorder() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationSheetTile}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationSheetTile}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationSheetTile> {
        imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder border;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheetTile#getBorder}
         * @param border border block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#border QuicksightTheme#border}
         * @return {@code this}
         */
        public Builder border(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder border) {
            this.border = border;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationSheetTile}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationSheetTile build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationSheetTile}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationSheetTile {
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder border;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.border = software.amazon.jsii.Kernel.get(this, "border", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.border = builder.border;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileBorder getBorder() {
            return this.border;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBorder() != null) {
                data.set("border", om.valueToTree(this.getBorder()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationSheetTile"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationSheetTile.Jsii$Proxy that = (QuicksightThemeConfigurationSheetTile.Jsii$Proxy) o;

            return this.border != null ? this.border.equals(that.border) : that.border == null;
        }

        @Override
        public final int hashCode() {
            int result = this.border != null ? this.border.hashCode() : 0;
            return result;
        }
    }
}
