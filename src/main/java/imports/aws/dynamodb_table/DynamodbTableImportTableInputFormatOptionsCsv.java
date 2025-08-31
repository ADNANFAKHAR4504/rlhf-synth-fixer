package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTableInputFormatOptionsCsv")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableImportTableInputFormatOptionsCsv.Jsii$Proxy.class)
public interface DynamodbTableImportTableInputFormatOptionsCsv extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#delimiter DynamodbTable#delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#header_list DynamodbTable#header_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeaderList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableImportTableInputFormatOptionsCsv}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableImportTableInputFormatOptionsCsv}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableImportTableInputFormatOptionsCsv> {
        java.lang.String delimiter;
        java.util.List<java.lang.String> headerList;

        /**
         * Sets the value of {@link DynamodbTableImportTableInputFormatOptionsCsv#getDelimiter}
         * @param delimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#delimiter DynamodbTable#delimiter}.
         * @return {@code this}
         */
        public Builder delimiter(java.lang.String delimiter) {
            this.delimiter = delimiter;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableImportTableInputFormatOptionsCsv#getHeaderList}
         * @param headerList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#header_list DynamodbTable#header_list}.
         * @return {@code this}
         */
        public Builder headerList(java.util.List<java.lang.String> headerList) {
            this.headerList = headerList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableImportTableInputFormatOptionsCsv}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableImportTableInputFormatOptionsCsv build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableImportTableInputFormatOptionsCsv}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableImportTableInputFormatOptionsCsv {
        private final java.lang.String delimiter;
        private final java.util.List<java.lang.String> headerList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.delimiter = software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.headerList = software.amazon.jsii.Kernel.get(this, "headerList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.delimiter = builder.delimiter;
            this.headerList = builder.headerList;
        }

        @Override
        public final java.lang.String getDelimiter() {
            return this.delimiter;
        }

        @Override
        public final java.util.List<java.lang.String> getHeaderList() {
            return this.headerList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDelimiter() != null) {
                data.set("delimiter", om.valueToTree(this.getDelimiter()));
            }
            if (this.getHeaderList() != null) {
                data.set("headerList", om.valueToTree(this.getHeaderList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableImportTableInputFormatOptionsCsv"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableImportTableInputFormatOptionsCsv.Jsii$Proxy that = (DynamodbTableImportTableInputFormatOptionsCsv.Jsii$Proxy) o;

            if (this.delimiter != null ? !this.delimiter.equals(that.delimiter) : that.delimiter != null) return false;
            return this.headerList != null ? this.headerList.equals(that.headerList) : that.headerList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.delimiter != null ? this.delimiter.hashCode() : 0;
            result = 31 * result + (this.headerList != null ? this.headerList.hashCode() : 0);
            return result;
        }
    }
}
