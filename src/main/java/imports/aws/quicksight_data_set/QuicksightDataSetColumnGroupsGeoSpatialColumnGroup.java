package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.105Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetColumnGroupsGeoSpatialColumnGroup.Jsii$Proxy.class)
public interface QuicksightDataSetColumnGroupsGeoSpatialColumnGroup extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getColumns();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#country_code QuicksightDataSet#country_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCountryCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetColumnGroupsGeoSpatialColumnGroup> {
        java.util.List<java.lang.String> columns;
        java.lang.String countryCode;
        java.lang.String name;

        /**
         * Sets the value of {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup#getColumns}
         * @param columns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}. This parameter is required.
         * @return {@code this}
         */
        public Builder columns(java.util.List<java.lang.String> columns) {
            this.columns = columns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup#getCountryCode}
         * @param countryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#country_code QuicksightDataSet#country_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder countryCode(java.lang.String countryCode) {
            this.countryCode = countryCode;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetColumnGroupsGeoSpatialColumnGroup build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetColumnGroupsGeoSpatialColumnGroup}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetColumnGroupsGeoSpatialColumnGroup {
        private final java.util.List<java.lang.String> columns;
        private final java.lang.String countryCode;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columns = software.amazon.jsii.Kernel.get(this, "columns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.countryCode = software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columns = java.util.Objects.requireNonNull(builder.columns, "columns is required");
            this.countryCode = java.util.Objects.requireNonNull(builder.countryCode, "countryCode is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final java.util.List<java.lang.String> getColumns() {
            return this.columns;
        }

        @Override
        public final java.lang.String getCountryCode() {
            return this.countryCode;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("columns", om.valueToTree(this.getColumns()));
            data.set("countryCode", om.valueToTree(this.getCountryCode()));
            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetColumnGroupsGeoSpatialColumnGroup.Jsii$Proxy that = (QuicksightDataSetColumnGroupsGeoSpatialColumnGroup.Jsii$Proxy) o;

            if (!columns.equals(that.columns)) return false;
            if (!countryCode.equals(that.countryCode)) return false;
            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.columns.hashCode();
            result = 31 * result + (this.countryCode.hashCode());
            result = 31 * result + (this.name.hashCode());
            return result;
        }
    }
}
