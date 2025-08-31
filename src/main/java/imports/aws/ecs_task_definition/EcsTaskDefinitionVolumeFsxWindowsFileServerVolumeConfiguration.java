package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration.Jsii$Proxy.class)
public interface EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * authorization_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#authorization_config EcsTaskDefinition#authorization_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig getAuthorizationConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#file_system_id EcsTaskDefinition#file_system_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#root_directory EcsTaskDefinition#root_directory}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRootDirectory();

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration> {
        imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig authorizationConfig;
        java.lang.String fileSystemId;
        java.lang.String rootDirectory;

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration#getAuthorizationConfig}
         * @param authorizationConfig authorization_config block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#authorization_config EcsTaskDefinition#authorization_config}
         * @return {@code this}
         */
        public Builder authorizationConfig(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig authorizationConfig) {
            this.authorizationConfig = authorizationConfig;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration#getFileSystemId}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#file_system_id EcsTaskDefinition#file_system_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileSystemId(java.lang.String fileSystemId) {
            this.fileSystemId = fileSystemId;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration#getRootDirectory}
         * @param rootDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#root_directory EcsTaskDefinition#root_directory}. This parameter is required.
         * @return {@code this}
         */
        public Builder rootDirectory(java.lang.String rootDirectory) {
            this.rootDirectory = rootDirectory;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration {
        private final imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig authorizationConfig;
        private final java.lang.String fileSystemId;
        private final java.lang.String rootDirectory;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authorizationConfig = software.amazon.jsii.Kernel.get(this, "authorizationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig.class));
            this.fileSystemId = software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootDirectory = software.amazon.jsii.Kernel.get(this, "rootDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authorizationConfig = java.util.Objects.requireNonNull(builder.authorizationConfig, "authorizationConfig is required");
            this.fileSystemId = java.util.Objects.requireNonNull(builder.fileSystemId, "fileSystemId is required");
            this.rootDirectory = java.util.Objects.requireNonNull(builder.rootDirectory, "rootDirectory is required");
        }

        @Override
        public final imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig getAuthorizationConfig() {
            return this.authorizationConfig;
        }

        @Override
        public final java.lang.String getFileSystemId() {
            return this.fileSystemId;
        }

        @Override
        public final java.lang.String getRootDirectory() {
            return this.rootDirectory;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authorizationConfig", om.valueToTree(this.getAuthorizationConfig()));
            data.set("fileSystemId", om.valueToTree(this.getFileSystemId()));
            data.set("rootDirectory", om.valueToTree(this.getRootDirectory()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration.Jsii$Proxy that = (EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration.Jsii$Proxy) o;

            if (!authorizationConfig.equals(that.authorizationConfig)) return false;
            if (!fileSystemId.equals(that.fileSystemId)) return false;
            return this.rootDirectory.equals(that.rootDirectory);
        }

        @Override
        public final int hashCode() {
            int result = this.authorizationConfig.hashCode();
            result = 31 * result + (this.fileSystemId.hashCode());
            result = 31 * result + (this.rootDirectory.hashCode());
            return result;
        }
    }
}
