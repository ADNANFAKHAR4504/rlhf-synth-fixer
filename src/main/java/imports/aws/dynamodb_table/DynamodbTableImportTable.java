package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTable")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableImportTable.Jsii$Proxy.class)
public interface DynamodbTableImportTable extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#input_format DynamodbTable#input_format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputFormat();

    /**
     * s3_bucket_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#s3_bucket_source DynamodbTable#s3_bucket_source}
     */
    @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource getS3BucketSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#input_compression_type DynamodbTable#input_compression_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputCompressionType() {
        return null;
    }

    /**
     * input_format_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#input_format_options DynamodbTable#input_format_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions getInputFormatOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableImportTable}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableImportTable}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableImportTable> {
        java.lang.String inputFormat;
        imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource s3BucketSource;
        java.lang.String inputCompressionType;
        imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions inputFormatOptions;

        /**
         * Sets the value of {@link DynamodbTableImportTable#getInputFormat}
         * @param inputFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#input_format DynamodbTable#input_format}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputFormat(java.lang.String inputFormat) {
            this.inputFormat = inputFormat;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableImportTable#getS3BucketSource}
         * @param s3BucketSource s3_bucket_source block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#s3_bucket_source DynamodbTable#s3_bucket_source}
         * @return {@code this}
         */
        public Builder s3BucketSource(imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource s3BucketSource) {
            this.s3BucketSource = s3BucketSource;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableImportTable#getInputCompressionType}
         * @param inputCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#input_compression_type DynamodbTable#input_compression_type}.
         * @return {@code this}
         */
        public Builder inputCompressionType(java.lang.String inputCompressionType) {
            this.inputCompressionType = inputCompressionType;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableImportTable#getInputFormatOptions}
         * @param inputFormatOptions input_format_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#input_format_options DynamodbTable#input_format_options}
         * @return {@code this}
         */
        public Builder inputFormatOptions(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions inputFormatOptions) {
            this.inputFormatOptions = inputFormatOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableImportTable}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableImportTable build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableImportTable}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableImportTable {
        private final java.lang.String inputFormat;
        private final imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource s3BucketSource;
        private final java.lang.String inputCompressionType;
        private final imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions inputFormatOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputFormat = software.amazon.jsii.Kernel.get(this, "inputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BucketSource = software.amazon.jsii.Kernel.get(this, "s3BucketSource", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource.class));
            this.inputCompressionType = software.amazon.jsii.Kernel.get(this, "inputCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputFormatOptions = software.amazon.jsii.Kernel.get(this, "inputFormatOptions", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputFormat = java.util.Objects.requireNonNull(builder.inputFormat, "inputFormat is required");
            this.s3BucketSource = java.util.Objects.requireNonNull(builder.s3BucketSource, "s3BucketSource is required");
            this.inputCompressionType = builder.inputCompressionType;
            this.inputFormatOptions = builder.inputFormatOptions;
        }

        @Override
        public final java.lang.String getInputFormat() {
            return this.inputFormat;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource getS3BucketSource() {
            return this.s3BucketSource;
        }

        @Override
        public final java.lang.String getInputCompressionType() {
            return this.inputCompressionType;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions getInputFormatOptions() {
            return this.inputFormatOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputFormat", om.valueToTree(this.getInputFormat()));
            data.set("s3BucketSource", om.valueToTree(this.getS3BucketSource()));
            if (this.getInputCompressionType() != null) {
                data.set("inputCompressionType", om.valueToTree(this.getInputCompressionType()));
            }
            if (this.getInputFormatOptions() != null) {
                data.set("inputFormatOptions", om.valueToTree(this.getInputFormatOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableImportTable"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableImportTable.Jsii$Proxy that = (DynamodbTableImportTable.Jsii$Proxy) o;

            if (!inputFormat.equals(that.inputFormat)) return false;
            if (!s3BucketSource.equals(that.s3BucketSource)) return false;
            if (this.inputCompressionType != null ? !this.inputCompressionType.equals(that.inputCompressionType) : that.inputCompressionType != null) return false;
            return this.inputFormatOptions != null ? this.inputFormatOptions.equals(that.inputFormatOptions) : that.inputFormatOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputFormat.hashCode();
            result = 31 * result + (this.s3BucketSource.hashCode());
            result = 31 * result + (this.inputCompressionType != null ? this.inputCompressionType.hashCode() : 0);
            result = 31 * result + (this.inputFormatOptions != null ? this.inputFormatOptions.hashCode() : 0);
            return result;
        }
    }
}
