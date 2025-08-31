package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterCacheStorageConfigurations")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterCacheStorageConfigurations.Jsii$Proxy.class)
public interface FinspaceKxClusterCacheStorageConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterCacheStorageConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterCacheStorageConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterCacheStorageConfigurations> {
        java.lang.Number size;
        java.lang.String type;

        /**
         * Sets the value of {@link FinspaceKxClusterCacheStorageConfigurations#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}. This parameter is required.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterCacheStorageConfigurations#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterCacheStorageConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterCacheStorageConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterCacheStorageConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterCacheStorageConfigurations {
        private final java.lang.Number size;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.size = java.util.Objects.requireNonNull(builder.size, "size is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.Number getSize() {
            return this.size;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("size", om.valueToTree(this.getSize()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterCacheStorageConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterCacheStorageConfigurations.Jsii$Proxy that = (FinspaceKxClusterCacheStorageConfigurations.Jsii$Proxy) o;

            if (!size.equals(that.size)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.size.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
