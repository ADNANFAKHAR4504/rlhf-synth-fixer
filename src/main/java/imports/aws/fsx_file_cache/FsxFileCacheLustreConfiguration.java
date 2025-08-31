package imports.aws.fsx_file_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxFileCache.FsxFileCacheLustreConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxFileCacheLustreConfiguration.Jsii$Proxy.class)
public interface FsxFileCacheLustreConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#deployment_type FsxFileCache#deployment_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType();

    /**
     * metadata_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#metadata_configuration FsxFileCache#metadata_configuration}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getMetadataConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#per_unit_storage_throughput FsxFileCache#per_unit_storage_throughput}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPerUnitStorageThroughput();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#weekly_maintenance_start_time FsxFileCache#weekly_maintenance_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceStartTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxFileCacheLustreConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxFileCacheLustreConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxFileCacheLustreConfiguration> {
        java.lang.String deploymentType;
        java.lang.Object metadataConfiguration;
        java.lang.Number perUnitStorageThroughput;
        java.lang.String weeklyMaintenanceStartTime;

        /**
         * Sets the value of {@link FsxFileCacheLustreConfiguration#getDeploymentType}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#deployment_type FsxFileCache#deployment_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder deploymentType(java.lang.String deploymentType) {
            this.deploymentType = deploymentType;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheLustreConfiguration#getMetadataConfiguration}
         * @param metadataConfiguration metadata_configuration block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#metadata_configuration FsxFileCache#metadata_configuration}
         * @return {@code this}
         */
        public Builder metadataConfiguration(com.hashicorp.cdktf.IResolvable metadataConfiguration) {
            this.metadataConfiguration = metadataConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheLustreConfiguration#getMetadataConfiguration}
         * @param metadataConfiguration metadata_configuration block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#metadata_configuration FsxFileCache#metadata_configuration}
         * @return {@code this}
         */
        public Builder metadataConfiguration(java.util.List<? extends imports.aws.fsx_file_cache.FsxFileCacheLustreConfigurationMetadataConfiguration> metadataConfiguration) {
            this.metadataConfiguration = metadataConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheLustreConfiguration#getPerUnitStorageThroughput}
         * @param perUnitStorageThroughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#per_unit_storage_throughput FsxFileCache#per_unit_storage_throughput}. This parameter is required.
         * @return {@code this}
         */
        public Builder perUnitStorageThroughput(java.lang.Number perUnitStorageThroughput) {
            this.perUnitStorageThroughput = perUnitStorageThroughput;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheLustreConfiguration#getWeeklyMaintenanceStartTime}
         * @param weeklyMaintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#weekly_maintenance_start_time FsxFileCache#weekly_maintenance_start_time}.
         * @return {@code this}
         */
        public Builder weeklyMaintenanceStartTime(java.lang.String weeklyMaintenanceStartTime) {
            this.weeklyMaintenanceStartTime = weeklyMaintenanceStartTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxFileCacheLustreConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxFileCacheLustreConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxFileCacheLustreConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxFileCacheLustreConfiguration {
        private final java.lang.String deploymentType;
        private final java.lang.Object metadataConfiguration;
        private final java.lang.Number perUnitStorageThroughput;
        private final java.lang.String weeklyMaintenanceStartTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deploymentType = software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadataConfiguration = software.amazon.jsii.Kernel.get(this, "metadataConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.perUnitStorageThroughput = software.amazon.jsii.Kernel.get(this, "perUnitStorageThroughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.weeklyMaintenanceStartTime = software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deploymentType = java.util.Objects.requireNonNull(builder.deploymentType, "deploymentType is required");
            this.metadataConfiguration = java.util.Objects.requireNonNull(builder.metadataConfiguration, "metadataConfiguration is required");
            this.perUnitStorageThroughput = java.util.Objects.requireNonNull(builder.perUnitStorageThroughput, "perUnitStorageThroughput is required");
            this.weeklyMaintenanceStartTime = builder.weeklyMaintenanceStartTime;
        }

        @Override
        public final java.lang.String getDeploymentType() {
            return this.deploymentType;
        }

        @Override
        public final java.lang.Object getMetadataConfiguration() {
            return this.metadataConfiguration;
        }

        @Override
        public final java.lang.Number getPerUnitStorageThroughput() {
            return this.perUnitStorageThroughput;
        }

        @Override
        public final java.lang.String getWeeklyMaintenanceStartTime() {
            return this.weeklyMaintenanceStartTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deploymentType", om.valueToTree(this.getDeploymentType()));
            data.set("metadataConfiguration", om.valueToTree(this.getMetadataConfiguration()));
            data.set("perUnitStorageThroughput", om.valueToTree(this.getPerUnitStorageThroughput()));
            if (this.getWeeklyMaintenanceStartTime() != null) {
                data.set("weeklyMaintenanceStartTime", om.valueToTree(this.getWeeklyMaintenanceStartTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxFileCache.FsxFileCacheLustreConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxFileCacheLustreConfiguration.Jsii$Proxy that = (FsxFileCacheLustreConfiguration.Jsii$Proxy) o;

            if (!deploymentType.equals(that.deploymentType)) return false;
            if (!metadataConfiguration.equals(that.metadataConfiguration)) return false;
            if (!perUnitStorageThroughput.equals(that.perUnitStorageThroughput)) return false;
            return this.weeklyMaintenanceStartTime != null ? this.weeklyMaintenanceStartTime.equals(that.weeklyMaintenanceStartTime) : that.weeklyMaintenanceStartTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deploymentType.hashCode();
            result = 31 * result + (this.metadataConfiguration.hashCode());
            result = 31 * result + (this.perUnitStorageThroughput.hashCode());
            result = 31 * result + (this.weeklyMaintenanceStartTime != null ? this.weeklyMaintenanceStartTime.hashCode() : 0);
            return result;
        }
    }
}
