package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getColumnName();

    /**
     * tags block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTags();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation> {
        java.lang.String columnName;
        java.lang.Object tags;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation#getColumnName}
         * @param columnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder columnName(java.lang.String columnName) {
            this.columnName = columnName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation#getTags}
         * @param tags tags block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}
         * @return {@code this}
         */
        public Builder tags(com.hashicorp.cdktf.IResolvable tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation#getTags}
         * @param tags tags block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}
         * @return {@code this}
         */
        public Builder tags(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation {
        private final java.lang.String columnName;
        private final java.lang.Object tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnName = software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnName = java.util.Objects.requireNonNull(builder.columnName, "columnName is required");
            this.tags = java.util.Objects.requireNonNull(builder.tags, "tags is required");
        }

        @Override
        public final java.lang.String getColumnName() {
            return this.columnName;
        }

        @Override
        public final java.lang.Object getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("columnName", om.valueToTree(this.getColumnName()));
            data.set("tags", om.valueToTree(this.getTags()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation.Jsii$Proxy) o;

            if (!columnName.equals(that.columnName)) return false;
            return this.tags.equals(that.tags);
        }

        @Override
        public final int hashCode() {
            int result = this.columnName.hashCode();
            result = 31 * result + (this.tags.hashCode());
            return result;
        }
    }
}
