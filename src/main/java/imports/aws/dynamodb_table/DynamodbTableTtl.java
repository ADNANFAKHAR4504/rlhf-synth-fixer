package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableTtl")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableTtl.Jsii$Proxy.class)
public interface DynamodbTableTtl extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#attribute_name DynamodbTable#attribute_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAttributeName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#enabled DynamodbTable#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableTtl}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableTtl}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableTtl> {
        java.lang.String attributeName;
        java.lang.Object enabled;

        /**
         * Sets the value of {@link DynamodbTableTtl#getAttributeName}
         * @param attributeName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#attribute_name DynamodbTable#attribute_name}.
         * @return {@code this}
         */
        public Builder attributeName(java.lang.String attributeName) {
            this.attributeName = attributeName;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableTtl#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#enabled DynamodbTable#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableTtl#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#enabled DynamodbTable#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableTtl}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableTtl build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableTtl}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableTtl {
        private final java.lang.String attributeName;
        private final java.lang.Object enabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributeName = software.amazon.jsii.Kernel.get(this, "attributeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributeName = builder.attributeName;
            this.enabled = builder.enabled;
        }

        @Override
        public final java.lang.String getAttributeName() {
            return this.attributeName;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAttributeName() != null) {
                data.set("attributeName", om.valueToTree(this.getAttributeName()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableTtl"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableTtl.Jsii$Proxy that = (DynamodbTableTtl.Jsii$Proxy) o;

            if (this.attributeName != null ? !this.attributeName.equals(that.attributeName) : that.attributeName != null) return false;
            return this.enabled != null ? this.enabled.equals(that.enabled) : that.enabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attributeName != null ? this.attributeName.hashCode() : 0;
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            return result;
        }
    }
}
