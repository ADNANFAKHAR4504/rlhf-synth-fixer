package imports.aws.lakeformation_data_cells_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.484Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationDataCellsFilter.LakeformationDataCellsFilterTableDataRowFilter")
@software.amazon.jsii.Jsii.Proxy(LakeformationDataCellsFilterTableDataRowFilter.Jsii$Proxy.class)
public interface LakeformationDataCellsFilterTableDataRowFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * all_rows_wildcard block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#all_rows_wildcard LakeformationDataCellsFilter#all_rows_wildcard}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllRowsWildcard() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#filter_expression LakeformationDataCellsFilter#filter_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilterExpression() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationDataCellsFilterTableDataRowFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationDataCellsFilterTableDataRowFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationDataCellsFilterTableDataRowFilter> {
        java.lang.Object allRowsWildcard;
        java.lang.String filterExpression;

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableDataRowFilter#getAllRowsWildcard}
         * @param allRowsWildcard all_rows_wildcard block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#all_rows_wildcard LakeformationDataCellsFilter#all_rows_wildcard}
         * @return {@code this}
         */
        public Builder allRowsWildcard(com.hashicorp.cdktf.IResolvable allRowsWildcard) {
            this.allRowsWildcard = allRowsWildcard;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableDataRowFilter#getAllRowsWildcard}
         * @param allRowsWildcard all_rows_wildcard block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#all_rows_wildcard LakeformationDataCellsFilter#all_rows_wildcard}
         * @return {@code this}
         */
        public Builder allRowsWildcard(java.util.List<? extends imports.aws.lakeformation_data_cells_filter.LakeformationDataCellsFilterTableDataRowFilterAllRowsWildcard> allRowsWildcard) {
            this.allRowsWildcard = allRowsWildcard;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataCellsFilterTableDataRowFilter#getFilterExpression}
         * @param filterExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_cells_filter#filter_expression LakeformationDataCellsFilter#filter_expression}.
         * @return {@code this}
         */
        public Builder filterExpression(java.lang.String filterExpression) {
            this.filterExpression = filterExpression;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationDataCellsFilterTableDataRowFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationDataCellsFilterTableDataRowFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationDataCellsFilterTableDataRowFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationDataCellsFilterTableDataRowFilter {
        private final java.lang.Object allRowsWildcard;
        private final java.lang.String filterExpression;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allRowsWildcard = software.amazon.jsii.Kernel.get(this, "allRowsWildcard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filterExpression = software.amazon.jsii.Kernel.get(this, "filterExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allRowsWildcard = builder.allRowsWildcard;
            this.filterExpression = builder.filterExpression;
        }

        @Override
        public final java.lang.Object getAllRowsWildcard() {
            return this.allRowsWildcard;
        }

        @Override
        public final java.lang.String getFilterExpression() {
            return this.filterExpression;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllRowsWildcard() != null) {
                data.set("allRowsWildcard", om.valueToTree(this.getAllRowsWildcard()));
            }
            if (this.getFilterExpression() != null) {
                data.set("filterExpression", om.valueToTree(this.getFilterExpression()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationDataCellsFilter.LakeformationDataCellsFilterTableDataRowFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationDataCellsFilterTableDataRowFilter.Jsii$Proxy that = (LakeformationDataCellsFilterTableDataRowFilter.Jsii$Proxy) o;

            if (this.allRowsWildcard != null ? !this.allRowsWildcard.equals(that.allRowsWildcard) : that.allRowsWildcard != null) return false;
            return this.filterExpression != null ? this.filterExpression.equals(that.filterExpression) : that.filterExpression == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allRowsWildcard != null ? this.allRowsWildcard.hashCode() : 0;
            result = 31 * result + (this.filterExpression != null ? this.filterExpression.hashCode() : 0);
            return result;
        }
    }
}
