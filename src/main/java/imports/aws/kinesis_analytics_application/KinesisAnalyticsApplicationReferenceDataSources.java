package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.447Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSources")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationReferenceDataSources.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationReferenceDataSources extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#s3 KinesisAnalyticsApplication#s3}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 getS3();

    /**
     * schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#schema KinesisAnalyticsApplication#schema}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema getSchema();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#table_name KinesisAnalyticsApplication#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationReferenceDataSources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationReferenceDataSources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationReferenceDataSources> {
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 s3;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema schema;
        java.lang.String tableName;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSources#getS3}
         * @param s3 s3 block. This parameter is required.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#s3 KinesisAnalyticsApplication#s3}
         * @return {@code this}
         */
        public Builder s3(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSources#getSchema}
         * @param schema schema block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#schema KinesisAnalyticsApplication#schema}
         * @return {@code this}
         */
        public Builder schema(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSources#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#table_name KinesisAnalyticsApplication#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationReferenceDataSources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationReferenceDataSources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationReferenceDataSources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationReferenceDataSources {
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 s3;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema schema;
        private final java.lang.String tableName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3 = java.util.Objects.requireNonNull(builder.s3, "s3 is required");
            this.schema = java.util.Objects.requireNonNull(builder.schema, "schema is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 getS3() {
            return this.s3;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema getSchema() {
            return this.schema;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3", om.valueToTree(this.getS3()));
            data.set("schema", om.valueToTree(this.getSchema()));
            data.set("tableName", om.valueToTree(this.getTableName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationReferenceDataSources.Jsii$Proxy that = (KinesisAnalyticsApplicationReferenceDataSources.Jsii$Proxy) o;

            if (!s3.equals(that.s3)) return false;
            if (!schema.equals(that.schema)) return false;
            return this.tableName.equals(that.tableName);
        }

        @Override
        public final int hashCode() {
            int result = this.s3.hashCode();
            result = 31 * result + (this.schema.hashCode());
            result = 31 * result + (this.tableName.hashCode());
            return result;
        }
    }
}
