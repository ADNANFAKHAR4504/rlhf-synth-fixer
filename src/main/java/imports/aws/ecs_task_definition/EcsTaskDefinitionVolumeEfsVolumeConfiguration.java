package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeEfsVolumeConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionVolumeEfsVolumeConfiguration.Jsii$Proxy.class)
public interface EcsTaskDefinitionVolumeEfsVolumeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#file_system_id EcsTaskDefinition#file_system_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId();

    /**
     * authorization_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#authorization_config EcsTaskDefinition#authorization_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig getAuthorizationConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#root_directory EcsTaskDefinition#root_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRootDirectory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#transit_encryption EcsTaskDefinition#transit_encryption}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#transit_encryption_port EcsTaskDefinition#transit_encryption_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTransitEncryptionPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionVolumeEfsVolumeConfiguration> {
        java.lang.String fileSystemId;
        imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig authorizationConfig;
        java.lang.String rootDirectory;
        java.lang.String transitEncryption;
        java.lang.Number transitEncryptionPort;

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration#getFileSystemId}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#file_system_id EcsTaskDefinition#file_system_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileSystemId(java.lang.String fileSystemId) {
            this.fileSystemId = fileSystemId;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration#getAuthorizationConfig}
         * @param authorizationConfig authorization_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#authorization_config EcsTaskDefinition#authorization_config}
         * @return {@code this}
         */
        public Builder authorizationConfig(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig authorizationConfig) {
            this.authorizationConfig = authorizationConfig;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration#getRootDirectory}
         * @param rootDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#root_directory EcsTaskDefinition#root_directory}.
         * @return {@code this}
         */
        public Builder rootDirectory(java.lang.String rootDirectory) {
            this.rootDirectory = rootDirectory;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration#getTransitEncryption}
         * @param transitEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#transit_encryption EcsTaskDefinition#transit_encryption}.
         * @return {@code this}
         */
        public Builder transitEncryption(java.lang.String transitEncryption) {
            this.transitEncryption = transitEncryption;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration#getTransitEncryptionPort}
         * @param transitEncryptionPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#transit_encryption_port EcsTaskDefinition#transit_encryption_port}.
         * @return {@code this}
         */
        public Builder transitEncryptionPort(java.lang.Number transitEncryptionPort) {
            this.transitEncryptionPort = transitEncryptionPort;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionVolumeEfsVolumeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionVolumeEfsVolumeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionVolumeEfsVolumeConfiguration {
        private final java.lang.String fileSystemId;
        private final imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig authorizationConfig;
        private final java.lang.String rootDirectory;
        private final java.lang.String transitEncryption;
        private final java.lang.Number transitEncryptionPort;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fileSystemId = software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizationConfig = software.amazon.jsii.Kernel.get(this, "authorizationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig.class));
            this.rootDirectory = software.amazon.jsii.Kernel.get(this, "rootDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitEncryption = software.amazon.jsii.Kernel.get(this, "transitEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitEncryptionPort = software.amazon.jsii.Kernel.get(this, "transitEncryptionPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fileSystemId = java.util.Objects.requireNonNull(builder.fileSystemId, "fileSystemId is required");
            this.authorizationConfig = builder.authorizationConfig;
            this.rootDirectory = builder.rootDirectory;
            this.transitEncryption = builder.transitEncryption;
            this.transitEncryptionPort = builder.transitEncryptionPort;
        }

        @Override
        public final java.lang.String getFileSystemId() {
            return this.fileSystemId;
        }

        @Override
        public final imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig getAuthorizationConfig() {
            return this.authorizationConfig;
        }

        @Override
        public final java.lang.String getRootDirectory() {
            return this.rootDirectory;
        }

        @Override
        public final java.lang.String getTransitEncryption() {
            return this.transitEncryption;
        }

        @Override
        public final java.lang.Number getTransitEncryptionPort() {
            return this.transitEncryptionPort;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fileSystemId", om.valueToTree(this.getFileSystemId()));
            if (this.getAuthorizationConfig() != null) {
                data.set("authorizationConfig", om.valueToTree(this.getAuthorizationConfig()));
            }
            if (this.getRootDirectory() != null) {
                data.set("rootDirectory", om.valueToTree(this.getRootDirectory()));
            }
            if (this.getTransitEncryption() != null) {
                data.set("transitEncryption", om.valueToTree(this.getTransitEncryption()));
            }
            if (this.getTransitEncryptionPort() != null) {
                data.set("transitEncryptionPort", om.valueToTree(this.getTransitEncryptionPort()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionVolumeEfsVolumeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionVolumeEfsVolumeConfiguration.Jsii$Proxy that = (EcsTaskDefinitionVolumeEfsVolumeConfiguration.Jsii$Proxy) o;

            if (!fileSystemId.equals(that.fileSystemId)) return false;
            if (this.authorizationConfig != null ? !this.authorizationConfig.equals(that.authorizationConfig) : that.authorizationConfig != null) return false;
            if (this.rootDirectory != null ? !this.rootDirectory.equals(that.rootDirectory) : that.rootDirectory != null) return false;
            if (this.transitEncryption != null ? !this.transitEncryption.equals(that.transitEncryption) : that.transitEncryption != null) return false;
            return this.transitEncryptionPort != null ? this.transitEncryptionPort.equals(that.transitEncryptionPort) : that.transitEncryptionPort == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fileSystemId.hashCode();
            result = 31 * result + (this.authorizationConfig != null ? this.authorizationConfig.hashCode() : 0);
            result = 31 * result + (this.rootDirectory != null ? this.rootDirectory.hashCode() : 0);
            result = 31 * result + (this.transitEncryption != null ? this.transitEncryption.hashCode() : 0);
            result = 31 * result + (this.transitEncryptionPort != null ? this.transitEncryptionPort.hashCode() : 0);
            return result;
        }
    }
}
