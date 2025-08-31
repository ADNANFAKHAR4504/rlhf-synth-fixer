package imports.aws.quicksight_theme;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutGutter")
@software.amazon.jsii.Jsii.Proxy(QuicksightThemeConfigurationSheetTileLayoutGutter.Jsii$Proxy.class)
public interface QuicksightThemeConfigurationSheetTileLayoutGutter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getShow() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightThemeConfigurationSheetTileLayoutGutter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightThemeConfigurationSheetTileLayoutGutter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightThemeConfigurationSheetTileLayoutGutter> {
        java.lang.Object show;

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheetTileLayoutGutter#getShow}
         * @param show Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
         * @return {@code this}
         */
        public Builder show(java.lang.Boolean show) {
            this.show = show;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightThemeConfigurationSheetTileLayoutGutter#getShow}
         * @param show Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_theme#show QuicksightTheme#show}.
         * @return {@code this}
         */
        public Builder show(com.hashicorp.cdktf.IResolvable show) {
            this.show = show;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightThemeConfigurationSheetTileLayoutGutter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightThemeConfigurationSheetTileLayoutGutter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightThemeConfigurationSheetTileLayoutGutter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightThemeConfigurationSheetTileLayoutGutter {
        private final java.lang.Object show;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.show = software.amazon.jsii.Kernel.get(this, "show", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.show = builder.show;
        }

        @Override
        public final java.lang.Object getShow() {
            return this.show;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getShow() != null) {
                data.set("show", om.valueToTree(this.getShow()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTheme.QuicksightThemeConfigurationSheetTileLayoutGutter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightThemeConfigurationSheetTileLayoutGutter.Jsii$Proxy that = (QuicksightThemeConfigurationSheetTileLayoutGutter.Jsii$Proxy) o;

            return this.show != null ? this.show.equals(that.show) : that.show == null;
        }

        @Override
        public final int hashCode() {
            int result = this.show != null ? this.show.hashCode() : 0;
            return result;
        }
    }
}
