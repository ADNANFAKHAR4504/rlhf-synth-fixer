package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.126Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheet")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationSheet.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationSheet extends software.amazon.jsii.JsiiSerializable {

    /**
     * tile block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile QuicksightTheme#tile}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile getTile() {
        return null;
    }

    /**
     * tile_layout block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile_layout QuicksightTheme#tile_layout}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout getTileLayout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationSheet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationSheet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationSheet> {
        imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile tile;
        imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout tileLayout;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheet#getTile}
         * @param tile tile block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile QuicksightTheme#tile}
         * @return {@code this}
         */
        public Builder tile(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile tile) {
            this.tile = tile;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheet#getTileLayout}
         * @param tileLayout tile_layout block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#tile_layout QuicksightTheme#tile_layout}
         * @return {@code this}
         */
        public Builder tileLayout(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout tileLayout) {
            this.tileLayout = tileLayout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationSheet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationSheet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationSheet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationSheet {
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile tile;
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout tileLayout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tile = software.amazon.jsii.Kernel.get(this, "tile", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile.class));
            this.tileLayout = software.amazon.jsii.Kernel.get(this, "tileLayout", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tile = builder.tile;
            this.tileLayout = builder.tileLayout;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTile getTile() {
            return this.tile;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheetTileLayout getTileLayout() {
            return this.tileLayout;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTile() != null) {
                data.set("tile", om.valueToTree(this.getTile()));
            }
            if (this.getTileLayout() != null) {
                data.set("tileLayout", om.valueToTree(this.getTileLayout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationSheet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationSheet.Jsii$Proxy that = (QuicksightThemeConfigurationSheet.Jsii$Proxy) o;

            if (this.tile != null ? !this.tile.equals(that.tile) : that.tile != null) return false;
            return this.tileLayout != null ? this.tileLayout.equals(that.tileLayout) : that.tileLayout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tile != null ? this.tile.hashCode() : 0;
            result = 31 * result + (this.tileLayout != null ? this.tileLayout.hashCode() : 0);
            return result;
        }
    }
}
