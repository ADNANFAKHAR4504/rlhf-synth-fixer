package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterStorageConfigBlockStorage")
@software.amazon.jsii.Jsii.Proxy(EksClusterStorageConfigBlockStorage.Jsii$Proxy.class)
public interface EksClusterStorageConfigBlockStorage extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterStorageConfigBlockStorage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterStorageConfigBlockStorage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterStorageConfigBlockStorage> {
        java.lang.Object enabled;

        /**
         * Sets the value of {@link EksClusterStorageConfigBlockStorage#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterStorageConfigBlockStorage#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterStorageConfigBlockStorage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterStorageConfigBlockStorage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterStorageConfigBlockStorage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterStorageConfigBlockStorage {
        private final java.lang.Object enabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
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

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterStorageConfigBlockStorage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterStorageConfigBlockStorage.Jsii$Proxy that = (EksClusterStorageConfigBlockStorage.Jsii$Proxy) o;

            return this.enabled != null ? this.enabled.equals(that.enabled) : that.enabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            return result;
        }
    }
}
