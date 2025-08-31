package imports.aws.glue_catalog_table_optimizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration.Jsii$Proxy.class)
public interface GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#clean_expired_files GlueCatalogTableOptimizer#clean_expired_files}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCleanExpiredFiles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#number_of_snapshots_to_retain GlueCatalogTableOptimizer#number_of_snapshots_to_retain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfSnapshotsToRetain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#snapshot_retention_period_in_days GlueCatalogTableOptimizer#snapshot_retention_period_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionPeriodInDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration> {
        java.lang.Object cleanExpiredFiles;
        java.lang.Number numberOfSnapshotsToRetain;
        java.lang.Number snapshotRetentionPeriodInDays;

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration#getCleanExpiredFiles}
         * @param cleanExpiredFiles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#clean_expired_files GlueCatalogTableOptimizer#clean_expired_files}.
         * @return {@code this}
         */
        public Builder cleanExpiredFiles(java.lang.Boolean cleanExpiredFiles) {
            this.cleanExpiredFiles = cleanExpiredFiles;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration#getCleanExpiredFiles}
         * @param cleanExpiredFiles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#clean_expired_files GlueCatalogTableOptimizer#clean_expired_files}.
         * @return {@code this}
         */
        public Builder cleanExpiredFiles(com.hashicorp.cdktf.IResolvable cleanExpiredFiles) {
            this.cleanExpiredFiles = cleanExpiredFiles;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration#getNumberOfSnapshotsToRetain}
         * @param numberOfSnapshotsToRetain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#number_of_snapshots_to_retain GlueCatalogTableOptimizer#number_of_snapshots_to_retain}.
         * @return {@code this}
         */
        public Builder numberOfSnapshotsToRetain(java.lang.Number numberOfSnapshotsToRetain) {
            this.numberOfSnapshotsToRetain = numberOfSnapshotsToRetain;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration#getSnapshotRetentionPeriodInDays}
         * @param snapshotRetentionPeriodInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#snapshot_retention_period_in_days GlueCatalogTableOptimizer#snapshot_retention_period_in_days}.
         * @return {@code this}
         */
        public Builder snapshotRetentionPeriodInDays(java.lang.Number snapshotRetentionPeriodInDays) {
            this.snapshotRetentionPeriodInDays = snapshotRetentionPeriodInDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration {
        private final java.lang.Object cleanExpiredFiles;
        private final java.lang.Number numberOfSnapshotsToRetain;
        private final java.lang.Number snapshotRetentionPeriodInDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cleanExpiredFiles = software.amazon.jsii.Kernel.get(this, "cleanExpiredFiles", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.numberOfSnapshotsToRetain = software.amazon.jsii.Kernel.get(this, "numberOfSnapshotsToRetain", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotRetentionPeriodInDays = software.amazon.jsii.Kernel.get(this, "snapshotRetentionPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cleanExpiredFiles = builder.cleanExpiredFiles;
            this.numberOfSnapshotsToRetain = builder.numberOfSnapshotsToRetain;
            this.snapshotRetentionPeriodInDays = builder.snapshotRetentionPeriodInDays;
        }

        @Override
        public final java.lang.Object getCleanExpiredFiles() {
            return this.cleanExpiredFiles;
        }

        @Override
        public final java.lang.Number getNumberOfSnapshotsToRetain() {
            return this.numberOfSnapshotsToRetain;
        }

        @Override
        public final java.lang.Number getSnapshotRetentionPeriodInDays() {
            return this.snapshotRetentionPeriodInDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCleanExpiredFiles() != null) {
                data.set("cleanExpiredFiles", om.valueToTree(this.getCleanExpiredFiles()));
            }
            if (this.getNumberOfSnapshotsToRetain() != null) {
                data.set("numberOfSnapshotsToRetain", om.valueToTree(this.getNumberOfSnapshotsToRetain()));
            }
            if (this.getSnapshotRetentionPeriodInDays() != null) {
                data.set("snapshotRetentionPeriodInDays", om.valueToTree(this.getSnapshotRetentionPeriodInDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration.Jsii$Proxy that = (GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration.Jsii$Proxy) o;

            if (this.cleanExpiredFiles != null ? !this.cleanExpiredFiles.equals(that.cleanExpiredFiles) : that.cleanExpiredFiles != null) return false;
            if (this.numberOfSnapshotsToRetain != null ? !this.numberOfSnapshotsToRetain.equals(that.numberOfSnapshotsToRetain) : that.numberOfSnapshotsToRetain != null) return false;
            return this.snapshotRetentionPeriodInDays != null ? this.snapshotRetentionPeriodInDays.equals(that.snapshotRetentionPeriodInDays) : that.snapshotRetentionPeriodInDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cleanExpiredFiles != null ? this.cleanExpiredFiles.hashCode() : 0;
            result = 31 * result + (this.numberOfSnapshotsToRetain != null ? this.numberOfSnapshotsToRetain.hashCode() : 0);
            result = 31 * result + (this.snapshotRetentionPeriodInDays != null ? this.snapshotRetentionPeriodInDays.hashCode() : 0);
            return result;
        }
    }
}
