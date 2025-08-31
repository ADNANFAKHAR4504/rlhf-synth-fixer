package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.110Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags extends software.amazon.jsii.JsiiSerializable {

    /**
     * column_description block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_description QuicksightDataSet#column_description}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription getColumnDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_geographic_role QuicksightDataSet#column_geographic_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getColumnGeographicRole() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags> {
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription columnDescription;
        java.lang.String columnGeographicRole;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags#getColumnDescription}
         * @param columnDescription column_description block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_description QuicksightDataSet#column_description}
         * @return {@code this}
         */
        public Builder columnDescription(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription columnDescription) {
            this.columnDescription = columnDescription;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags#getColumnGeographicRole}
         * @param columnGeographicRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_geographic_role QuicksightDataSet#column_geographic_role}.
         * @return {@code this}
         */
        public Builder columnGeographicRole(java.lang.String columnGeographicRole) {
            this.columnGeographicRole = columnGeographicRole;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags {
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription columnDescription;
        private final java.lang.String columnGeographicRole;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnDescription = software.amazon.jsii.Kernel.get(this, "columnDescription", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription.class));
            this.columnGeographicRole = software.amazon.jsii.Kernel.get(this, "columnGeographicRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnDescription = builder.columnDescription;
            this.columnGeographicRole = builder.columnGeographicRole;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription getColumnDescription() {
            return this.columnDescription;
        }

        @Override
        public final java.lang.String getColumnGeographicRole() {
            return this.columnGeographicRole;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColumnDescription() != null) {
                data.set("columnDescription", om.valueToTree(this.getColumnDescription()));
            }
            if (this.getColumnGeographicRole() != null) {
                data.set("columnGeographicRole", om.valueToTree(this.getColumnGeographicRole()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags.Jsii$Proxy) o;

            if (this.columnDescription != null ? !this.columnDescription.equals(that.columnDescription) : that.columnDescription != null) return false;
            return this.columnGeographicRole != null ? this.columnGeographicRole.equals(that.columnGeographicRole) : that.columnGeographicRole == null;
        }

        @Override
        public final int hashCode() {
            int result = this.columnDescription != null ? this.columnDescription.hashCode() : 0;
            result = 31 * result + (this.columnGeographicRole != null ? this.columnGeographicRole.hashCode() : 0);
            return result;
        }
    }
}
