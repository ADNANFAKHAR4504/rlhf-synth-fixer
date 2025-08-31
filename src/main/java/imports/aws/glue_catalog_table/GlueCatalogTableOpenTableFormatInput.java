package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableOpenTableFormatInput")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableOpenTableFormatInput.Jsii$Proxy.class)
public interface GlueCatalogTableOpenTableFormatInput extends software.amazon.jsii.JsiiSerializable {

    /**
     * iceberg_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#iceberg_input GlueCatalogTable#iceberg_input}
     */
    @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput getIcebergInput();

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableOpenTableFormatInput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableOpenTableFormatInput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableOpenTableFormatInput> {
        imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput icebergInput;

        /**
         * Sets the value of {@link GlueCatalogTableOpenTableFormatInput#getIcebergInput}
         * @param icebergInput iceberg_input block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#iceberg_input GlueCatalogTable#iceberg_input}
         * @return {@code this}
         */
        public Builder icebergInput(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput icebergInput) {
            this.icebergInput = icebergInput;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableOpenTableFormatInput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableOpenTableFormatInput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableOpenTableFormatInput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableOpenTableFormatInput {
        private final imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput icebergInput;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.icebergInput = software.amazon.jsii.Kernel.get(this, "icebergInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.icebergInput = java.util.Objects.requireNonNull(builder.icebergInput, "icebergInput is required");
        }

        @Override
        public final imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput getIcebergInput() {
            return this.icebergInput;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("icebergInput", om.valueToTree(this.getIcebergInput()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTable.GlueCatalogTableOpenTableFormatInput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableOpenTableFormatInput.Jsii$Proxy that = (GlueCatalogTableOpenTableFormatInput.Jsii$Proxy) o;

            return this.icebergInput.equals(that.icebergInput);
        }

        @Override
        public final int hashCode() {
            int result = this.icebergInput.hashCode();
            return result;
        }
    }
}
