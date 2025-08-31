package imports.aws.fsx_openzfs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports")
@software.amazon.jsii.Jsii.Proxy(FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports.Jsii$Proxy.class)
public interface FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports extends software.amazon.jsii.JsiiSerializable {

    /**
     * client_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#client_configurations FsxOpenzfsFileSystem#client_configurations}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getClientConfigurations();

    /**
     * @return a {@link Builder} of {@link FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports> {
        java.lang.Object clientConfigurations;

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports#getClientConfigurations}
         * @param clientConfigurations client_configurations block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#client_configurations FsxOpenzfsFileSystem#client_configurations}
         * @return {@code this}
         */
        public Builder clientConfigurations(com.hashicorp.cdktf.IResolvable clientConfigurations) {
            this.clientConfigurations = clientConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports#getClientConfigurations}
         * @param clientConfigurations client_configurations block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#client_configurations FsxOpenzfsFileSystem#client_configurations}
         * @return {@code this}
         */
        public Builder clientConfigurations(java.util.List<? extends imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExportsClientConfigurations> clientConfigurations) {
            this.clientConfigurations = clientConfigurations;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports {
        private final java.lang.Object clientConfigurations;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientConfigurations = software.amazon.jsii.Kernel.get(this, "clientConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientConfigurations = java.util.Objects.requireNonNull(builder.clientConfigurations, "clientConfigurations is required");
        }

        @Override
        public final java.lang.Object getClientConfigurations() {
            return this.clientConfigurations;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clientConfigurations", om.valueToTree(this.getClientConfigurations()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports.Jsii$Proxy that = (FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports.Jsii$Proxy) o;

            return this.clientConfigurations.equals(that.clientConfigurations);
        }

        @Override
        public final int hashCode() {
            int result = this.clientConfigurations.hashCode();
            return result;
        }
    }
}
