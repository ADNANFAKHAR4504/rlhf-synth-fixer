package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.126Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfiguration")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfiguration.Jsii$Proxy.class)
public interface QuicksightThemeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * data_color_palette block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#data_color_palette QuicksightTheme#data_color_palette}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette getDataColorPalette() {
        return null;
    }

    /**
     * sheet block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#sheet QuicksightTheme#sheet}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet getSheet() {
        return null;
    }

    /**
     * typography block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#typography QuicksightTheme#typography}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography getTypography() {
        return null;
    }

    /**
     * ui_color_palette block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#ui_color_palette QuicksightTheme#ui_color_palette}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette getUiColorPalette() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfiguration> {
        imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette dataColorPalette;
        imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet sheet;
        imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography typography;
        imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette uiColorPalette;

        /**
         * Sets the value of {@link QuicksightThemeConfiguration#getDataColorPalette}
         * @param dataColorPalette data_color_palette block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#data_color_palette QuicksightTheme#data_color_palette}
         * @return {@code this}
         */
        public Builder dataColorPalette(imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette dataColorPalette) {
            this.dataColorPalette = dataColorPalette;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfiguration#getSheet}
         * @param sheet sheet block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#sheet QuicksightTheme#sheet}
         * @return {@code this}
         */
        public Builder sheet(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet sheet) {
            this.sheet = sheet;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfiguration#getTypography}
         * @param typography typography block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#typography QuicksightTheme#typography}
         * @return {@code this}
         */
        public Builder typography(imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography typography) {
            this.typography = typography;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfiguration#getUiColorPalette}
         * @param uiColorPalette ui_color_palette block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#ui_color_palette QuicksightTheme#ui_color_palette}
         * @return {@code this}
         */
        public Builder uiColorPalette(imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette uiColorPalette) {
            this.uiColorPalette = uiColorPalette;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfiguration {
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette dataColorPalette;
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet sheet;
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography typography;
        private final imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette uiColorPalette;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataColorPalette = software.amazon.jsii.Kernel.get(this, "dataColorPalette", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette.class));
            this.sheet = software.amazon.jsii.Kernel.get(this, "sheet", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet.class));
            this.typography = software.amazon.jsii.Kernel.get(this, "typography", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography.class));
            this.uiColorPalette = software.amazon.jsii.Kernel.get(this, "uiColorPalette", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataColorPalette = builder.dataColorPalette;
            this.sheet = builder.sheet;
            this.typography = builder.typography;
            this.uiColorPalette = builder.uiColorPalette;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationDataColorPalette getDataColorPalette() {
            return this.dataColorPalette;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationSheet getSheet() {
            return this.sheet;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationTypography getTypography() {
            return this.typography;
        }

        @Override
        public final imports.aws.quicksight_theme.QuicksightThemeConfigurationUiColorPalette getUiColorPalette() {
            return this.uiColorPalette;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataColorPalette() != null) {
                data.set("dataColorPalette", om.valueToTree(this.getDataColorPalette()));
            }
            if (this.getSheet() != null) {
                data.set("sheet", om.valueToTree(this.getSheet()));
            }
            if (this.getTypography() != null) {
                data.set("typography", om.valueToTree(this.getTypography()));
            }
            if (this.getUiColorPalette() != null) {
                data.set("uiColorPalette", om.valueToTree(this.getUiColorPalette()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfiguration.Jsii$Proxy that = (QuicksightThemeConfiguration.Jsii$Proxy) o;

            if (this.dataColorPalette != null ? !this.dataColorPalette.equals(that.dataColorPalette) : that.dataColorPalette != null) return false;
            if (this.sheet != null ? !this.sheet.equals(that.sheet) : that.sheet != null) return false;
            if (this.typography != null ? !this.typography.equals(that.typography) : that.typography != null) return false;
            return this.uiColorPalette != null ? this.uiColorPalette.equals(that.uiColorPalette) : that.uiColorPalette == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataColorPalette != null ? this.dataColorPalette.hashCode() : 0;
            result = 31 * result + (this.sheet != null ? this.sheet.hashCode() : 0);
            result = 31 * result + (this.typography != null ? this.typography.hashCode() : 0);
            result = 31 * result + (this.uiColorPalette != null ? this.uiColorPalette.hashCode() : 0);
            return result;
        }
    }
}
