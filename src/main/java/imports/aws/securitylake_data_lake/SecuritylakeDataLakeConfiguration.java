package imports.aws.securitylake_data_lake;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.419Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeDataLake.SecuritylakeDataLakeConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeDataLakeConfiguration.Jsii$Proxy.class)
public interface SecuritylakeDataLakeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#region SecuritylakeDataLake#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#encryption_configuration SecuritylakeDataLake#encryption_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionConfiguration() {
        return null;
    }

    /**
     * lifecycle_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#lifecycle_configuration SecuritylakeDataLake#lifecycle_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLifecycleConfiguration() {
        return null;
    }

    /**
     * replication_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#replication_configuration SecuritylakeDataLake#replication_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReplicationConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeDataLakeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeDataLakeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeDataLakeConfiguration> {
        java.lang.String region;
        java.lang.Object encryptionConfiguration;
        java.lang.Object lifecycleConfiguration;
        java.lang.Object replicationConfiguration;

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#region SecuritylakeDataLake#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getEncryptionConfiguration}
         * @param encryptionConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#encryption_configuration SecuritylakeDataLake#encryption_configuration}.
         * @return {@code this}
         */
        public Builder encryptionConfiguration(com.hashicorp.cdktf.IResolvable encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getEncryptionConfiguration}
         * @param encryptionConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#encryption_configuration SecuritylakeDataLake#encryption_configuration}.
         * @return {@code this}
         */
        public Builder encryptionConfiguration(java.util.List<? extends imports.aws.securitylake_data_lake.SecuritylakeDataLakeConfigurationEncryptionConfiguration> encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getLifecycleConfiguration}
         * @param lifecycleConfiguration lifecycle_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#lifecycle_configuration SecuritylakeDataLake#lifecycle_configuration}
         * @return {@code this}
         */
        public Builder lifecycleConfiguration(com.hashicorp.cdktf.IResolvable lifecycleConfiguration) {
            this.lifecycleConfiguration = lifecycleConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getLifecycleConfiguration}
         * @param lifecycleConfiguration lifecycle_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#lifecycle_configuration SecuritylakeDataLake#lifecycle_configuration}
         * @return {@code this}
         */
        public Builder lifecycleConfiguration(java.util.List<? extends imports.aws.securitylake_data_lake.SecuritylakeDataLakeConfigurationLifecycleConfiguration> lifecycleConfiguration) {
            this.lifecycleConfiguration = lifecycleConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getReplicationConfiguration}
         * @param replicationConfiguration replication_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#replication_configuration SecuritylakeDataLake#replication_configuration}
         * @return {@code this}
         */
        public Builder replicationConfiguration(com.hashicorp.cdktf.IResolvable replicationConfiguration) {
            this.replicationConfiguration = replicationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfiguration#getReplicationConfiguration}
         * @param replicationConfiguration replication_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#replication_configuration SecuritylakeDataLake#replication_configuration}
         * @return {@code this}
         */
        public Builder replicationConfiguration(java.util.List<? extends imports.aws.securitylake_data_lake.SecuritylakeDataLakeConfigurationReplicationConfiguration> replicationConfiguration) {
            this.replicationConfiguration = replicationConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeDataLakeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeDataLakeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeDataLakeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeDataLakeConfiguration {
        private final java.lang.String region;
        private final java.lang.Object encryptionConfiguration;
        private final java.lang.Object lifecycleConfiguration;
        private final java.lang.Object replicationConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lifecycleConfiguration = software.amazon.jsii.Kernel.get(this, "lifecycleConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.replicationConfiguration = software.amazon.jsii.Kernel.get(this, "replicationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
            this.encryptionConfiguration = builder.encryptionConfiguration;
            this.lifecycleConfiguration = builder.lifecycleConfiguration;
            this.replicationConfiguration = builder.replicationConfiguration;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.Object getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final java.lang.Object getLifecycleConfiguration() {
            return this.lifecycleConfiguration;
        }

        @Override
        public final java.lang.Object getReplicationConfiguration() {
            return this.replicationConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("region", om.valueToTree(this.getRegion()));
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            }
            if (this.getLifecycleConfiguration() != null) {
                data.set("lifecycleConfiguration", om.valueToTree(this.getLifecycleConfiguration()));
            }
            if (this.getReplicationConfiguration() != null) {
                data.set("replicationConfiguration", om.valueToTree(this.getReplicationConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeDataLake.SecuritylakeDataLakeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeDataLakeConfiguration.Jsii$Proxy that = (SecuritylakeDataLakeConfiguration.Jsii$Proxy) o;

            if (!region.equals(that.region)) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
            if (this.lifecycleConfiguration != null ? !this.lifecycleConfiguration.equals(that.lifecycleConfiguration) : that.lifecycleConfiguration != null) return false;
            return this.replicationConfiguration != null ? this.replicationConfiguration.equals(that.replicationConfiguration) : that.replicationConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.region.hashCode();
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.lifecycleConfiguration != null ? this.lifecycleConfiguration.hashCode() : 0);
            result = 31 * result + (this.replicationConfiguration != null ? this.replicationConfiguration.hashCode() : 0);
            return result;
        }
    }
}
