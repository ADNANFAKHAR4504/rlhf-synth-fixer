package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.105Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetColumnGroups")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetColumnGroups.Jsii$Proxy.class)
public interface QuicksightDataSetColumnGroups extends software.amazon.jsii.JsiiSerializable {

    /**
     * geo_spatial_column_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#geo_spatial_column_group QuicksightDataSet#geo_spatial_column_group}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup getGeoSpatialColumnGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetColumnGroups}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetColumnGroups}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetColumnGroups> {
        imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup geoSpatialColumnGroup;

        /**
         * Sets the value of {@link QuicksightDataSetColumnGroups#getGeoSpatialColumnGroup}
         * @param geoSpatialColumnGroup geo_spatial_column_group block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#geo_spatial_column_group QuicksightDataSet#geo_spatial_column_group}
         * @return {@code this}
         */
        public Builder geoSpatialColumnGroup(imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup geoSpatialColumnGroup) {
            this.geoSpatialColumnGroup = geoSpatialColumnGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetColumnGroups}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetColumnGroups build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetColumnGroups}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetColumnGroups {
        private final imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup geoSpatialColumnGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.geoSpatialColumnGroup = software.amazon.jsii.Kernel.get(this, "geoSpatialColumnGroup", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.geoSpatialColumnGroup = builder.geoSpatialColumnGroup;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsGeoSpatialColumnGroup getGeoSpatialColumnGroup() {
            return this.geoSpatialColumnGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGeoSpatialColumnGroup() != null) {
                data.set("geoSpatialColumnGroup", om.valueToTree(this.getGeoSpatialColumnGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetColumnGroups"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetColumnGroups.Jsii$Proxy that = (QuicksightDataSetColumnGroups.Jsii$Proxy) o;

            return this.geoSpatialColumnGroup != null ? this.geoSpatialColumnGroup.equals(that.geoSpatialColumnGroup) : that.geoSpatialColumnGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.geoSpatialColumnGroup != null ? this.geoSpatialColumnGroup.hashCode() : 0;
            return result;
        }
    }
}
