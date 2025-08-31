package imports.aws.glue_partition_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.299Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gluePartitionIndex.GluePartitionIndexPartitionIndex")
@software.amazon.jsii.Jsii.Proxy(GluePartitionIndexPartitionIndex.Jsii$Proxy.class)
public interface GluePartitionIndexPartitionIndex extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_partition_index#index_name GluePartitionIndex#index_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIndexName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_partition_index#keys GluePartitionIndex#keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeys() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GluePartitionIndexPartitionIndex}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GluePartitionIndexPartitionIndex}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GluePartitionIndexPartitionIndex> {
        java.lang.String indexName;
        java.util.List<java.lang.String> keys;

        /**
         * Sets the value of {@link GluePartitionIndexPartitionIndex#getIndexName}
         * @param indexName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_partition_index#index_name GluePartitionIndex#index_name}.
         * @return {@code this}
         */
        public Builder indexName(java.lang.String indexName) {
            this.indexName = indexName;
            return this;
        }

        /**
         * Sets the value of {@link GluePartitionIndexPartitionIndex#getKeys}
         * @param keys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_partition_index#keys GluePartitionIndex#keys}.
         * @return {@code this}
         */
        public Builder keys(java.util.List<java.lang.String> keys) {
            this.keys = keys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GluePartitionIndexPartitionIndex}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GluePartitionIndexPartitionIndex build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GluePartitionIndexPartitionIndex}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GluePartitionIndexPartitionIndex {
        private final java.lang.String indexName;
        private final java.util.List<java.lang.String> keys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.indexName = software.amazon.jsii.Kernel.get(this, "indexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keys = software.amazon.jsii.Kernel.get(this, "keys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.indexName = builder.indexName;
            this.keys = builder.keys;
        }

        @Override
        public final java.lang.String getIndexName() {
            return this.indexName;
        }

        @Override
        public final java.util.List<java.lang.String> getKeys() {
            return this.keys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIndexName() != null) {
                data.set("indexName", om.valueToTree(this.getIndexName()));
            }
            if (this.getKeys() != null) {
                data.set("keys", om.valueToTree(this.getKeys()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gluePartitionIndex.GluePartitionIndexPartitionIndex"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GluePartitionIndexPartitionIndex.Jsii$Proxy that = (GluePartitionIndexPartitionIndex.Jsii$Proxy) o;

            if (this.indexName != null ? !this.indexName.equals(that.indexName) : that.indexName != null) return false;
            return this.keys != null ? this.keys.equals(that.keys) : that.keys == null;
        }

        @Override
        public final int hashCode() {
            int result = this.indexName != null ? this.indexName.hashCode() : 0;
            result = 31 * result + (this.keys != null ? this.keys.hashCode() : 0);
            return result;
        }
    }
}
