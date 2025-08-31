package imports.aws.timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.557Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamwriteTable.TimestreamwriteTableSchemaCompositePartitionKey")
@software.amazon.jsii.Jsii.Proxy(TimestreamwriteTableSchemaCompositePartitionKey.Jsii$Proxy.class)
public interface TimestreamwriteTableSchemaCompositePartitionKey extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#type TimestreamwriteTable#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#enforcement_in_record TimestreamwriteTable#enforcement_in_record}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnforcementInRecord() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#name TimestreamwriteTable#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamwriteTableSchemaCompositePartitionKey}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamwriteTableSchemaCompositePartitionKey}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamwriteTableSchemaCompositePartitionKey> {
        java.lang.String type;
        java.lang.String enforcementInRecord;
        java.lang.String name;

        /**
         * Sets the value of {@link TimestreamwriteTableSchemaCompositePartitionKey#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#type TimestreamwriteTable#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableSchemaCompositePartitionKey#getEnforcementInRecord}
         * @param enforcementInRecord Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#enforcement_in_record TimestreamwriteTable#enforcement_in_record}.
         * @return {@code this}
         */
        public Builder enforcementInRecord(java.lang.String enforcementInRecord) {
            this.enforcementInRecord = enforcementInRecord;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableSchemaCompositePartitionKey#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#name TimestreamwriteTable#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamwriteTableSchemaCompositePartitionKey}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamwriteTableSchemaCompositePartitionKey build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamwriteTableSchemaCompositePartitionKey}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamwriteTableSchemaCompositePartitionKey {
        private final java.lang.String type;
        private final java.lang.String enforcementInRecord;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enforcementInRecord = software.amazon.jsii.Kernel.get(this, "enforcementInRecord", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.enforcementInRecord = builder.enforcementInRecord;
            this.name = builder.name;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getEnforcementInRecord() {
            return this.enforcementInRecord;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getEnforcementInRecord() != null) {
                data.set("enforcementInRecord", om.valueToTree(this.getEnforcementInRecord()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamwriteTable.TimestreamwriteTableSchemaCompositePartitionKey"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamwriteTableSchemaCompositePartitionKey.Jsii$Proxy that = (TimestreamwriteTableSchemaCompositePartitionKey.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.enforcementInRecord != null ? !this.enforcementInRecord.equals(that.enforcementInRecord) : that.enforcementInRecord != null) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.enforcementInRecord != null ? this.enforcementInRecord.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}
