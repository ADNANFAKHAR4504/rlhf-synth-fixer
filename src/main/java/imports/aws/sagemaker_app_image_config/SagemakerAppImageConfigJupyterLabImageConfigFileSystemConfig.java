package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig.Jsii$Proxy.class)
public interface SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultGid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultUid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMountPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig> {
        java.lang.Number defaultGid;
        java.lang.Number defaultUid;
        java.lang.String mountPath;

        /**
         * Sets the value of {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig#getDefaultGid}
         * @param defaultGid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
         * @return {@code this}
         */
        public Builder defaultGid(java.lang.Number defaultGid) {
            this.defaultGid = defaultGid;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig#getDefaultUid}
         * @param defaultUid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
         * @return {@code this}
         */
        public Builder defaultUid(java.lang.Number defaultUid) {
            this.defaultUid = defaultUid;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig#getMountPath}
         * @param mountPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
         * @return {@code this}
         */
        public Builder mountPath(java.lang.String mountPath) {
            this.mountPath = mountPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig {
        private final java.lang.Number defaultGid;
        private final java.lang.Number defaultUid;
        private final java.lang.String mountPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultGid = software.amazon.jsii.Kernel.get(this, "defaultGid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.defaultUid = software.amazon.jsii.Kernel.get(this, "defaultUid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.mountPath = software.amazon.jsii.Kernel.get(this, "mountPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultGid = builder.defaultGid;
            this.defaultUid = builder.defaultUid;
            this.mountPath = builder.mountPath;
        }

        @Override
        public final java.lang.Number getDefaultGid() {
            return this.defaultGid;
        }

        @Override
        public final java.lang.Number getDefaultUid() {
            return this.defaultUid;
        }

        @Override
        public final java.lang.String getMountPath() {
            return this.mountPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultGid() != null) {
                data.set("defaultGid", om.valueToTree(this.getDefaultGid()));
            }
            if (this.getDefaultUid() != null) {
                data.set("defaultUid", om.valueToTree(this.getDefaultUid()));
            }
            if (this.getMountPath() != null) {
                data.set("mountPath", om.valueToTree(this.getMountPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig.Jsii$Proxy that = (SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig.Jsii$Proxy) o;

            if (this.defaultGid != null ? !this.defaultGid.equals(that.defaultGid) : that.defaultGid != null) return false;
            if (this.defaultUid != null ? !this.defaultUid.equals(that.defaultUid) : that.defaultUid != null) return false;
            return this.mountPath != null ? this.mountPath.equals(that.mountPath) : that.mountPath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultGid != null ? this.defaultGid.hashCode() : 0;
            result = 31 * result + (this.defaultUid != null ? this.defaultUid.hashCode() : 0);
            result = 31 * result + (this.mountPath != null ? this.mountPath.hashCode() : 0);
            return result;
        }
    }
}
