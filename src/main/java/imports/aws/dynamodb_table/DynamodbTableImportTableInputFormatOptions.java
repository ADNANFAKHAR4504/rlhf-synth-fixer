package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTableInputFormatOptions")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableImportTableInputFormatOptions.Jsii$Proxy.class)
public interface DynamodbTableImportTableInputFormatOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * csv block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#csv DynamodbTable#csv}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv getCsv() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableImportTableInputFormatOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableImportTableInputFormatOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableImportTableInputFormatOptions> {
        imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv csv;

        /**
         * Sets the value of {@link DynamodbTableImportTableInputFormatOptions#getCsv}
         * @param csv csv block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#csv DynamodbTable#csv}
         * @return {@code this}
         */
        public Builder csv(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv csv) {
            this.csv = csv;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableImportTableInputFormatOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableImportTableInputFormatOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableImportTableInputFormatOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableImportTableInputFormatOptions {
        private final imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv csv;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.csv = software.amazon.jsii.Kernel.get(this, "csv", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.csv = builder.csv;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv getCsv() {
            return this.csv;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCsv() != null) {
                data.set("csv", om.valueToTree(this.getCsv()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableImportTableInputFormatOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableImportTableInputFormatOptions.Jsii$Proxy that = (DynamodbTableImportTableInputFormatOptions.Jsii$Proxy) o;

            return this.csv != null ? this.csv.equals(that.csv) : that.csv == null;
        }

        @Override
        public final int hashCode() {
            int result = this.csv != null ? this.csv.hashCode() : 0;
            return result;
        }
    }
}
