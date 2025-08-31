package imports.aws.dynamodb_table_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTableExport.DynamodbTableExportIncrementalExportSpecification")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableExportIncrementalExportSpecification.Jsii$Proxy.class)
public interface DynamodbTableExportIncrementalExportSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_from_time DynamodbTableExport#export_from_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportFromTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_to_time DynamodbTableExport#export_to_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportToTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_view_type DynamodbTableExport#export_view_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportViewType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableExportIncrementalExportSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableExportIncrementalExportSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableExportIncrementalExportSpecification> {
        java.lang.String exportFromTime;
        java.lang.String exportToTime;
        java.lang.String exportViewType;

        /**
         * Sets the value of {@link DynamodbTableExportIncrementalExportSpecification#getExportFromTime}
         * @param exportFromTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_from_time DynamodbTableExport#export_from_time}.
         * @return {@code this}
         */
        public Builder exportFromTime(java.lang.String exportFromTime) {
            this.exportFromTime = exportFromTime;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportIncrementalExportSpecification#getExportToTime}
         * @param exportToTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_to_time DynamodbTableExport#export_to_time}.
         * @return {@code this}
         */
        public Builder exportToTime(java.lang.String exportToTime) {
            this.exportToTime = exportToTime;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportIncrementalExportSpecification#getExportViewType}
         * @param exportViewType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_view_type DynamodbTableExport#export_view_type}.
         * @return {@code this}
         */
        public Builder exportViewType(java.lang.String exportViewType) {
            this.exportViewType = exportViewType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableExportIncrementalExportSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableExportIncrementalExportSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableExportIncrementalExportSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableExportIncrementalExportSpecification {
        private final java.lang.String exportFromTime;
        private final java.lang.String exportToTime;
        private final java.lang.String exportViewType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exportFromTime = software.amazon.jsii.Kernel.get(this, "exportFromTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exportToTime = software.amazon.jsii.Kernel.get(this, "exportToTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exportViewType = software.amazon.jsii.Kernel.get(this, "exportViewType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exportFromTime = builder.exportFromTime;
            this.exportToTime = builder.exportToTime;
            this.exportViewType = builder.exportViewType;
        }

        @Override
        public final java.lang.String getExportFromTime() {
            return this.exportFromTime;
        }

        @Override
        public final java.lang.String getExportToTime() {
            return this.exportToTime;
        }

        @Override
        public final java.lang.String getExportViewType() {
            return this.exportViewType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExportFromTime() != null) {
                data.set("exportFromTime", om.valueToTree(this.getExportFromTime()));
            }
            if (this.getExportToTime() != null) {
                data.set("exportToTime", om.valueToTree(this.getExportToTime()));
            }
            if (this.getExportViewType() != null) {
                data.set("exportViewType", om.valueToTree(this.getExportViewType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTableExport.DynamodbTableExportIncrementalExportSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableExportIncrementalExportSpecification.Jsii$Proxy that = (DynamodbTableExportIncrementalExportSpecification.Jsii$Proxy) o;

            if (this.exportFromTime != null ? !this.exportFromTime.equals(that.exportFromTime) : that.exportFromTime != null) return false;
            if (this.exportToTime != null ? !this.exportToTime.equals(that.exportToTime) : that.exportToTime != null) return false;
            return this.exportViewType != null ? this.exportViewType.equals(that.exportViewType) : that.exportViewType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.exportFromTime != null ? this.exportFromTime.hashCode() : 0;
            result = 31 * result + (this.exportToTime != null ? this.exportToTime.hashCode() : 0);
            result = 31 * result + (this.exportViewType != null ? this.exportViewType.hashCode() : 0);
            return result;
        }
    }
}
