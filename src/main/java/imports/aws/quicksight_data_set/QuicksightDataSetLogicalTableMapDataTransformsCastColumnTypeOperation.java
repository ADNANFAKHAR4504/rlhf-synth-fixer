package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.107Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getColumnName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_type QuicksightDataSet#new_column_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNewColumnType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFormat() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation> {
        java.lang.String columnName;
        java.lang.String newColumnType;
        java.lang.String format;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation#getColumnName}
         * @param columnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder columnName(java.lang.String columnName) {
            this.columnName = columnName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation#getNewColumnType}
         * @param newColumnType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#new_column_type QuicksightDataSet#new_column_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder newColumnType(java.lang.String newColumnType) {
            this.newColumnType = newColumnType;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation {
        private final java.lang.String columnName;
        private final java.lang.String newColumnType;
        private final java.lang.String format;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnName = software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.newColumnType = software.amazon.jsii.Kernel.get(this, "newColumnType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnName = java.util.Objects.requireNonNull(builder.columnName, "columnName is required");
            this.newColumnType = java.util.Objects.requireNonNull(builder.newColumnType, "newColumnType is required");
            this.format = builder.format;
        }

        @Override
        public final java.lang.String getColumnName() {
            return this.columnName;
        }

        @Override
        public final java.lang.String getNewColumnType() {
            return this.newColumnType;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("columnName", om.valueToTree(this.getColumnName()));
            data.set("newColumnType", om.valueToTree(this.getNewColumnType()));
            if (this.getFormat() != null) {
                data.set("format", om.valueToTree(this.getFormat()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation.Jsii$Proxy) o;

            if (!columnName.equals(that.columnName)) return false;
            if (!newColumnType.equals(that.newColumnType)) return false;
            return this.format != null ? this.format.equals(that.format) : that.format == null;
        }

        @Override
        public final int hashCode() {
            int result = this.columnName.hashCode();
            result = 31 * result + (this.newColumnType.hashCode());
            result = 31 * result + (this.format != null ? this.format.hashCode() : 0);
            return result;
        }
    }
}
