package imports.aws.m2_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.846Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.m2Environment.M2EnvironmentStorageConfigurationFsx")
@software.amazon.jsii.Jsii.Proxy(M2EnvironmentStorageConfigurationFsx.Jsii$Proxy.class)
public interface M2EnvironmentStorageConfigurationFsx extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#file_system_id M2Environment#file_system_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#mount_point M2Environment#mount_point}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMountPoint();

    /**
     * @return a {@link Builder} of {@link M2EnvironmentStorageConfigurationFsx}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link M2EnvironmentStorageConfigurationFsx}
     */
    public static final class Builder implements software.amazon.jsii.Builder<M2EnvironmentStorageConfigurationFsx> {
        java.lang.String fileSystemId;
        java.lang.String mountPoint;

        /**
         * Sets the value of {@link M2EnvironmentStorageConfigurationFsx#getFileSystemId}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#file_system_id M2Environment#file_system_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileSystemId(java.lang.String fileSystemId) {
            this.fileSystemId = fileSystemId;
            return this;
        }

        /**
         * Sets the value of {@link M2EnvironmentStorageConfigurationFsx#getMountPoint}
         * @param mountPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#mount_point M2Environment#mount_point}. This parameter is required.
         * @return {@code this}
         */
        public Builder mountPoint(java.lang.String mountPoint) {
            this.mountPoint = mountPoint;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link M2EnvironmentStorageConfigurationFsx}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public M2EnvironmentStorageConfigurationFsx build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link M2EnvironmentStorageConfigurationFsx}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements M2EnvironmentStorageConfigurationFsx {
        private final java.lang.String fileSystemId;
        private final java.lang.String mountPoint;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fileSystemId = software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mountPoint = software.amazon.jsii.Kernel.get(this, "mountPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fileSystemId = java.util.Objects.requireNonNull(builder.fileSystemId, "fileSystemId is required");
            this.mountPoint = java.util.Objects.requireNonNull(builder.mountPoint, "mountPoint is required");
        }

        @Override
        public final java.lang.String getFileSystemId() {
            return this.fileSystemId;
        }

        @Override
        public final java.lang.String getMountPoint() {
            return this.mountPoint;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fileSystemId", om.valueToTree(this.getFileSystemId()));
            data.set("mountPoint", om.valueToTree(this.getMountPoint()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.m2Environment.M2EnvironmentStorageConfigurationFsx"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            M2EnvironmentStorageConfigurationFsx.Jsii$Proxy that = (M2EnvironmentStorageConfigurationFsx.Jsii$Proxy) o;

            if (!fileSystemId.equals(that.fileSystemId)) return false;
            return this.mountPoint.equals(that.mountPoint);
        }

        @Override
        public final int hashCode() {
            int result = this.fileSystemId.hashCode();
            result = 31 * result + (this.mountPoint.hashCode());
            return result;
        }
    }
}
