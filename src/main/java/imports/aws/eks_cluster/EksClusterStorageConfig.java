package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterStorageConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterStorageConfig.Jsii$Proxy.class)
public interface EksClusterStorageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * block_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#block_storage EksCluster#block_storage}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage getBlockStorage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterStorageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterStorageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterStorageConfig> {
        imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage blockStorage;

        /**
         * Sets the value of {@link EksClusterStorageConfig#getBlockStorage}
         * @param blockStorage block_storage block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#block_storage EksCluster#block_storage}
         * @return {@code this}
         */
        public Builder blockStorage(imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage blockStorage) {
            this.blockStorage = blockStorage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterStorageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterStorageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterStorageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterStorageConfig {
        private final imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage blockStorage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blockStorage = software.amazon.jsii.Kernel.get(this, "blockStorage", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blockStorage = builder.blockStorage;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterStorageConfigBlockStorage getBlockStorage() {
            return this.blockStorage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBlockStorage() != null) {
                data.set("blockStorage", om.valueToTree(this.getBlockStorage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterStorageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterStorageConfig.Jsii$Proxy that = (EksClusterStorageConfig.Jsii$Proxy) o;

            return this.blockStorage != null ? this.blockStorage.equals(that.blockStorage) : that.blockStorage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blockStorage != null ? this.blockStorage.hashCode() : 0;
            return result;
        }
    }
}
