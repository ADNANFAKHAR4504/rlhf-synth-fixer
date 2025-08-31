package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSkewedInfo")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableStorageDescriptorSkewedInfo.Jsii$Proxy.class)
public interface GlueCatalogTableStorageDescriptorSkewedInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#skewed_column_names GlueCatalogTable#skewed_column_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSkewedColumnNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#skewed_column_value_location_maps GlueCatalogTable#skewed_column_value_location_maps}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getSkewedColumnValueLocationMaps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#skewed_column_values GlueCatalogTable#skewed_column_values}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSkewedColumnValues() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableStorageDescriptorSkewedInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableStorageDescriptorSkewedInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableStorageDescriptorSkewedInfo> {
        java.util.List<java.lang.String> skewedColumnNames;
        java.util.Map<java.lang.String, java.lang.String> skewedColumnValueLocationMaps;
        java.util.List<java.lang.String> skewedColumnValues;

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSkewedInfo#getSkewedColumnNames}
         * @param skewedColumnNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#skewed_column_names GlueCatalogTable#skewed_column_names}.
         * @return {@code this}
         */
        public Builder skewedColumnNames(java.util.List<java.lang.String> skewedColumnNames) {
            this.skewedColumnNames = skewedColumnNames;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSkewedInfo#getSkewedColumnValueLocationMaps}
         * @param skewedColumnValueLocationMaps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#skewed_column_value_location_maps GlueCatalogTable#skewed_column_value_location_maps}.
         * @return {@code this}
         */
        public Builder skewedColumnValueLocationMaps(java.util.Map<java.lang.String, java.lang.String> skewedColumnValueLocationMaps) {
            this.skewedColumnValueLocationMaps = skewedColumnValueLocationMaps;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSkewedInfo#getSkewedColumnValues}
         * @param skewedColumnValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#skewed_column_values GlueCatalogTable#skewed_column_values}.
         * @return {@code this}
         */
        public Builder skewedColumnValues(java.util.List<java.lang.String> skewedColumnValues) {
            this.skewedColumnValues = skewedColumnValues;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableStorageDescriptorSkewedInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableStorageDescriptorSkewedInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableStorageDescriptorSkewedInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableStorageDescriptorSkewedInfo {
        private final java.util.List<java.lang.String> skewedColumnNames;
        private final java.util.Map<java.lang.String, java.lang.String> skewedColumnValueLocationMaps;
        private final java.util.List<java.lang.String> skewedColumnValues;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.skewedColumnNames = software.amazon.jsii.Kernel.get(this, "skewedColumnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.skewedColumnValueLocationMaps = software.amazon.jsii.Kernel.get(this, "skewedColumnValueLocationMaps", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.skewedColumnValues = software.amazon.jsii.Kernel.get(this, "skewedColumnValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.skewedColumnNames = builder.skewedColumnNames;
            this.skewedColumnValueLocationMaps = builder.skewedColumnValueLocationMaps;
            this.skewedColumnValues = builder.skewedColumnValues;
        }

        @Override
        public final java.util.List<java.lang.String> getSkewedColumnNames() {
            return this.skewedColumnNames;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getSkewedColumnValueLocationMaps() {
            return this.skewedColumnValueLocationMaps;
        }

        @Override
        public final java.util.List<java.lang.String> getSkewedColumnValues() {
            return this.skewedColumnValues;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSkewedColumnNames() != null) {
                data.set("skewedColumnNames", om.valueToTree(this.getSkewedColumnNames()));
            }
            if (this.getSkewedColumnValueLocationMaps() != null) {
                data.set("skewedColumnValueLocationMaps", om.valueToTree(this.getSkewedColumnValueLocationMaps()));
            }
            if (this.getSkewedColumnValues() != null) {
                data.set("skewedColumnValues", om.valueToTree(this.getSkewedColumnValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSkewedInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableStorageDescriptorSkewedInfo.Jsii$Proxy that = (GlueCatalogTableStorageDescriptorSkewedInfo.Jsii$Proxy) o;

            if (this.skewedColumnNames != null ? !this.skewedColumnNames.equals(that.skewedColumnNames) : that.skewedColumnNames != null) return false;
            if (this.skewedColumnValueLocationMaps != null ? !this.skewedColumnValueLocationMaps.equals(that.skewedColumnValueLocationMaps) : that.skewedColumnValueLocationMaps != null) return false;
            return this.skewedColumnValues != null ? this.skewedColumnValues.equals(that.skewedColumnValues) : that.skewedColumnValues == null;
        }

        @Override
        public final int hashCode() {
            int result = this.skewedColumnNames != null ? this.skewedColumnNames.hashCode() : 0;
            result = 31 * result + (this.skewedColumnValueLocationMaps != null ? this.skewedColumnValueLocationMaps.hashCode() : 0);
            result = 31 * result + (this.skewedColumnValues != null ? this.skewedColumnValues.hashCode() : 0);
            return result;
        }
    }
}
