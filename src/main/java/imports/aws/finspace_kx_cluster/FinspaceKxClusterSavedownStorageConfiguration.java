package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterSavedownStorageConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterSavedownStorageConfiguration.Jsii$Proxy.class)
public interface FinspaceKxClusterSavedownStorageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#volume_name FinspaceKxCluster#volume_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterSavedownStorageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterSavedownStorageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterSavedownStorageConfiguration> {
        java.lang.Number size;
        java.lang.String type;
        java.lang.String volumeName;

        /**
         * Sets the value of {@link FinspaceKxClusterSavedownStorageConfiguration#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterSavedownStorageConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterSavedownStorageConfiguration#getVolumeName}
         * @param volumeName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#volume_name FinspaceKxCluster#volume_name}.
         * @return {@code this}
         */
        public Builder volumeName(java.lang.String volumeName) {
            this.volumeName = volumeName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterSavedownStorageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterSavedownStorageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterSavedownStorageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterSavedownStorageConfiguration {
        private final java.lang.Number size;
        private final java.lang.String type;
        private final java.lang.String volumeName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeName = software.amazon.jsii.Kernel.get(this, "volumeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.size = builder.size;
            this.type = builder.type;
            this.volumeName = builder.volumeName;
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
        public final java.lang.String getVolumeName() {
            return this.volumeName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSize() != null) {
                data.set("size", om.valueToTree(this.getSize()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getVolumeName() != null) {
                data.set("volumeName", om.valueToTree(this.getVolumeName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterSavedownStorageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterSavedownStorageConfiguration.Jsii$Proxy that = (FinspaceKxClusterSavedownStorageConfiguration.Jsii$Proxy) o;

            if (this.size != null ? !this.size.equals(that.size) : that.size != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            return this.volumeName != null ? this.volumeName.equals(that.volumeName) : that.volumeName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.size != null ? this.size.hashCode() : 0;
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.volumeName != null ? this.volumeName.hashCode() : 0);
            return result;
        }
    }
}
