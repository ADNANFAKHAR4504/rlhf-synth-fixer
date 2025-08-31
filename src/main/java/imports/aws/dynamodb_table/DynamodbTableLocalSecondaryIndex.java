package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableLocalSecondaryIndex")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableLocalSecondaryIndex.Jsii$Proxy.class)
public interface DynamodbTableLocalSecondaryIndex extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#name DynamodbTable#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#projection_type DynamodbTable#projection_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProjectionType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#range_key DynamodbTable#range_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRangeKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#non_key_attributes DynamodbTable#non_key_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNonKeyAttributes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableLocalSecondaryIndex}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableLocalSecondaryIndex}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableLocalSecondaryIndex> {
        java.lang.String name;
        java.lang.String projectionType;
        java.lang.String rangeKey;
        java.util.List<java.lang.String> nonKeyAttributes;

        /**
         * Sets the value of {@link DynamodbTableLocalSecondaryIndex#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#name DynamodbTable#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableLocalSecondaryIndex#getProjectionType}
         * @param projectionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#projection_type DynamodbTable#projection_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder projectionType(java.lang.String projectionType) {
            this.projectionType = projectionType;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableLocalSecondaryIndex#getRangeKey}
         * @param rangeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#range_key DynamodbTable#range_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder rangeKey(java.lang.String rangeKey) {
            this.rangeKey = rangeKey;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableLocalSecondaryIndex#getNonKeyAttributes}
         * @param nonKeyAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#non_key_attributes DynamodbTable#non_key_attributes}.
         * @return {@code this}
         */
        public Builder nonKeyAttributes(java.util.List<java.lang.String> nonKeyAttributes) {
            this.nonKeyAttributes = nonKeyAttributes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableLocalSecondaryIndex}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableLocalSecondaryIndex build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableLocalSecondaryIndex}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableLocalSecondaryIndex {
        private final java.lang.String name;
        private final java.lang.String projectionType;
        private final java.lang.String rangeKey;
        private final java.util.List<java.lang.String> nonKeyAttributes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.projectionType = software.amazon.jsii.Kernel.get(this, "projectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rangeKey = software.amazon.jsii.Kernel.get(this, "rangeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nonKeyAttributes = software.amazon.jsii.Kernel.get(this, "nonKeyAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.projectionType = java.util.Objects.requireNonNull(builder.projectionType, "projectionType is required");
            this.rangeKey = java.util.Objects.requireNonNull(builder.rangeKey, "rangeKey is required");
            this.nonKeyAttributes = builder.nonKeyAttributes;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getProjectionType() {
            return this.projectionType;
        }

        @Override
        public final java.lang.String getRangeKey() {
            return this.rangeKey;
        }

        @Override
        public final java.util.List<java.lang.String> getNonKeyAttributes() {
            return this.nonKeyAttributes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("projectionType", om.valueToTree(this.getProjectionType()));
            data.set("rangeKey", om.valueToTree(this.getRangeKey()));
            if (this.getNonKeyAttributes() != null) {
                data.set("nonKeyAttributes", om.valueToTree(this.getNonKeyAttributes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableLocalSecondaryIndex"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableLocalSecondaryIndex.Jsii$Proxy that = (DynamodbTableLocalSecondaryIndex.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!projectionType.equals(that.projectionType)) return false;
            if (!rangeKey.equals(that.rangeKey)) return false;
            return this.nonKeyAttributes != null ? this.nonKeyAttributes.equals(that.nonKeyAttributes) : that.nonKeyAttributes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.projectionType.hashCode());
            result = 31 * result + (this.rangeKey.hashCode());
            result = 31 * result + (this.nonKeyAttributes != null ? this.nonKeyAttributes.hashCode() : 0);
            return result;
        }
    }
}
