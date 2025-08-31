package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3Source")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetPhysicalTableMapS3Source.Jsii$Proxy.class)
public interface QuicksightDataSetPhysicalTableMapS3Source extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSourceArn();

    /**
     * input_columns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInputColumns();

    /**
     * upload_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#upload_settings QuicksightDataSet#upload_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings getUploadSettings();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetPhysicalTableMapS3Source}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetPhysicalTableMapS3Source}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetPhysicalTableMapS3Source> {
        java.lang.String dataSourceArn;
        java.lang.Object inputColumns;
        imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings uploadSettings;

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3Source#getDataSourceArn}
         * @param dataSourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_source_arn QuicksightDataSet#data_source_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSourceArn(java.lang.String dataSourceArn) {
            this.dataSourceArn = dataSourceArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3Source#getInputColumns}
         * @param inputColumns input_columns block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
         * @return {@code this}
         */
        public Builder inputColumns(com.hashicorp.cdktf.IResolvable inputColumns) {
            this.inputColumns = inputColumns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3Source#getInputColumns}
         * @param inputColumns input_columns block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#input_columns QuicksightDataSet#input_columns}
         * @return {@code this}
         */
        public Builder inputColumns(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceInputColumns> inputColumns) {
            this.inputColumns = inputColumns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3Source#getUploadSettings}
         * @param uploadSettings upload_settings block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#upload_settings QuicksightDataSet#upload_settings}
         * @return {@code this}
         */
        public Builder uploadSettings(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings uploadSettings) {
            this.uploadSettings = uploadSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetPhysicalTableMapS3Source}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetPhysicalTableMapS3Source build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetPhysicalTableMapS3Source}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetPhysicalTableMapS3Source {
        private final java.lang.String dataSourceArn;
        private final java.lang.Object inputColumns;
        private final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings uploadSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSourceArn = software.amazon.jsii.Kernel.get(this, "dataSourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputColumns = software.amazon.jsii.Kernel.get(this, "inputColumns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.uploadSettings = software.amazon.jsii.Kernel.get(this, "uploadSettings", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSourceArn = java.util.Objects.requireNonNull(builder.dataSourceArn, "dataSourceArn is required");
            this.inputColumns = java.util.Objects.requireNonNull(builder.inputColumns, "inputColumns is required");
            this.uploadSettings = java.util.Objects.requireNonNull(builder.uploadSettings, "uploadSettings is required");
        }

        @Override
        public final java.lang.String getDataSourceArn() {
            return this.dataSourceArn;
        }

        @Override
        public final java.lang.Object getInputColumns() {
            return this.inputColumns;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings getUploadSettings() {
            return this.uploadSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataSourceArn", om.valueToTree(this.getDataSourceArn()));
            data.set("inputColumns", om.valueToTree(this.getInputColumns()));
            data.set("uploadSettings", om.valueToTree(this.getUploadSettings()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3Source"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetPhysicalTableMapS3Source.Jsii$Proxy that = (QuicksightDataSetPhysicalTableMapS3Source.Jsii$Proxy) o;

            if (!dataSourceArn.equals(that.dataSourceArn)) return false;
            if (!inputColumns.equals(that.inputColumns)) return false;
            return this.uploadSettings.equals(that.uploadSettings);
        }

        @Override
        public final int hashCode() {
            int result = this.dataSourceArn.hashCode();
            result = 31 * result + (this.inputColumns.hashCode());
            result = 31 * result + (this.uploadSettings.hashCode());
            return result;
        }
    }
}
