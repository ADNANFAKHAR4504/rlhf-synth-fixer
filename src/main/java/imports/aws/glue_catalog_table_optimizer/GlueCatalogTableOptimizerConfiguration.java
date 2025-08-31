package imports.aws.glue_catalog_table_optimizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableOptimizerConfiguration.Jsii$Proxy.class)
public interface GlueCatalogTableOptimizerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#enabled GlueCatalogTableOptimizer#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#role_arn GlueCatalogTableOptimizer#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * orphan_file_deletion_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_deletion_configuration GlueCatalogTableOptimizer#orphan_file_deletion_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOrphanFileDeletionConfiguration() {
        return null;
    }

    /**
     * retention_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#retention_configuration GlueCatalogTableOptimizer#retention_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRetentionConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableOptimizerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableOptimizerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableOptimizerConfiguration> {
        java.lang.Object enabled;
        java.lang.String roleArn;
        java.lang.Object orphanFileDeletionConfiguration;
        java.lang.Object retentionConfiguration;

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#enabled GlueCatalogTableOptimizer#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#enabled GlueCatalogTableOptimizer#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#role_arn GlueCatalogTableOptimizer#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getOrphanFileDeletionConfiguration}
         * @param orphanFileDeletionConfiguration orphan_file_deletion_configuration block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_deletion_configuration GlueCatalogTableOptimizer#orphan_file_deletion_configuration}
         * @return {@code this}
         */
        public Builder orphanFileDeletionConfiguration(com.hashicorp.cdktf.IResolvable orphanFileDeletionConfiguration) {
            this.orphanFileDeletionConfiguration = orphanFileDeletionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getOrphanFileDeletionConfiguration}
         * @param orphanFileDeletionConfiguration orphan_file_deletion_configuration block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_deletion_configuration GlueCatalogTableOptimizer#orphan_file_deletion_configuration}
         * @return {@code this}
         */
        public Builder orphanFileDeletionConfiguration(java.util.List<? extends imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration> orphanFileDeletionConfiguration) {
            this.orphanFileDeletionConfiguration = orphanFileDeletionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getRetentionConfiguration}
         * @param retentionConfiguration retention_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#retention_configuration GlueCatalogTableOptimizer#retention_configuration}
         * @return {@code this}
         */
        public Builder retentionConfiguration(com.hashicorp.cdktf.IResolvable retentionConfiguration) {
            this.retentionConfiguration = retentionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfiguration#getRetentionConfiguration}
         * @param retentionConfiguration retention_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#retention_configuration GlueCatalogTableOptimizer#retention_configuration}
         * @return {@code this}
         */
        public Builder retentionConfiguration(java.util.List<? extends imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration> retentionConfiguration) {
            this.retentionConfiguration = retentionConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableOptimizerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableOptimizerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableOptimizerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableOptimizerConfiguration {
        private final java.lang.Object enabled;
        private final java.lang.String roleArn;
        private final java.lang.Object orphanFileDeletionConfiguration;
        private final java.lang.Object retentionConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.orphanFileDeletionConfiguration = software.amazon.jsii.Kernel.get(this, "orphanFileDeletionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retentionConfiguration = software.amazon.jsii.Kernel.get(this, "retentionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.orphanFileDeletionConfiguration = builder.orphanFileDeletionConfiguration;
            this.retentionConfiguration = builder.retentionConfiguration;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getOrphanFileDeletionConfiguration() {
            return this.orphanFileDeletionConfiguration;
        }

        @Override
        public final java.lang.Object getRetentionConfiguration() {
            return this.retentionConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getOrphanFileDeletionConfiguration() != null) {
                data.set("orphanFileDeletionConfiguration", om.valueToTree(this.getOrphanFileDeletionConfiguration()));
            }
            if (this.getRetentionConfiguration() != null) {
                data.set("retentionConfiguration", om.valueToTree(this.getRetentionConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableOptimizerConfiguration.Jsii$Proxy that = (GlueCatalogTableOptimizerConfiguration.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.orphanFileDeletionConfiguration != null ? !this.orphanFileDeletionConfiguration.equals(that.orphanFileDeletionConfiguration) : that.orphanFileDeletionConfiguration != null) return false;
            return this.retentionConfiguration != null ? this.retentionConfiguration.equals(that.retentionConfiguration) : that.retentionConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.orphanFileDeletionConfiguration != null ? this.orphanFileDeletionConfiguration.hashCode() : 0);
            result = 31 * result + (this.retentionConfiguration != null ? this.retentionConfiguration.hashCode() : 0);
            return result;
        }
    }
}
