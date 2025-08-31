package imports.aws.timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.557Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamwriteTable.TimestreamwriteTableSchema")
@software.amazon.jsii.Jsii.Proxy(TimestreamwriteTableSchema.Jsii$Proxy.class)
public interface TimestreamwriteTableSchema extends software.amazon.jsii.JsiiSerializable {

    /**
     * composite_partition_key block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#composite_partition_key TimestreamwriteTable#composite_partition_key}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey getCompositePartitionKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamwriteTableSchema}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamwriteTableSchema}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamwriteTableSchema> {
        imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey compositePartitionKey;

        /**
         * Sets the value of {@link TimestreamwriteTableSchema#getCompositePartitionKey}
         * @param compositePartitionKey composite_partition_key block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#composite_partition_key TimestreamwriteTable#composite_partition_key}
         * @return {@code this}
         */
        public Builder compositePartitionKey(imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey compositePartitionKey) {
            this.compositePartitionKey = compositePartitionKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamwriteTableSchema}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamwriteTableSchema build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamwriteTableSchema}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamwriteTableSchema {
        private final imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey compositePartitionKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.compositePartitionKey = software.amazon.jsii.Kernel.get(this, "compositePartitionKey", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.compositePartitionKey = builder.compositePartitionKey;
        }

        @Override
        public final imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey getCompositePartitionKey() {
            return this.compositePartitionKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCompositePartitionKey() != null) {
                data.set("compositePartitionKey", om.valueToTree(this.getCompositePartitionKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamwriteTable.TimestreamwriteTableSchema"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamwriteTableSchema.Jsii$Proxy that = (TimestreamwriteTableSchema.Jsii$Proxy) o;

            return this.compositePartitionKey != null ? this.compositePartitionKey.equals(that.compositePartitionKey) : that.compositePartitionKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.compositePartitionKey != null ? this.compositePartitionKey.hashCode() : 0;
            return result;
        }
    }
}
