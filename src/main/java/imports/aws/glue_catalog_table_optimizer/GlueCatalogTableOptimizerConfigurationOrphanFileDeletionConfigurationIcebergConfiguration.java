package imports.aws.glue_catalog_table_optimizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration.Jsii$Proxy.class)
public interface GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#location GlueCatalogTableOptimizer#location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_retention_period_in_days GlueCatalogTableOptimizer#orphan_file_retention_period_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOrphanFileRetentionPeriodInDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration> {
        java.lang.String location;
        java.lang.Number orphanFileRetentionPeriodInDays;

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration#getLocation}
         * @param location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#location GlueCatalogTableOptimizer#location}.
         * @return {@code this}
         */
        public Builder location(java.lang.String location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration#getOrphanFileRetentionPeriodInDays}
         * @param orphanFileRetentionPeriodInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#orphan_file_retention_period_in_days GlueCatalogTableOptimizer#orphan_file_retention_period_in_days}.
         * @return {@code this}
         */
        public Builder orphanFileRetentionPeriodInDays(java.lang.Number orphanFileRetentionPeriodInDays) {
            this.orphanFileRetentionPeriodInDays = orphanFileRetentionPeriodInDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration {
        private final java.lang.String location;
        private final java.lang.Number orphanFileRetentionPeriodInDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.orphanFileRetentionPeriodInDays = software.amazon.jsii.Kernel.get(this, "orphanFileRetentionPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.location = builder.location;
            this.orphanFileRetentionPeriodInDays = builder.orphanFileRetentionPeriodInDays;
        }

        @Override
        public final java.lang.String getLocation() {
            return this.location;
        }

        @Override
        public final java.lang.Number getOrphanFileRetentionPeriodInDays() {
            return this.orphanFileRetentionPeriodInDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getOrphanFileRetentionPeriodInDays() != null) {
                data.set("orphanFileRetentionPeriodInDays", om.valueToTree(this.getOrphanFileRetentionPeriodInDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration.Jsii$Proxy that = (GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationIcebergConfiguration.Jsii$Proxy) o;

            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            return this.orphanFileRetentionPeriodInDays != null ? this.orphanFileRetentionPeriodInDays.equals(that.orphanFileRetentionPeriodInDays) : that.orphanFileRetentionPeriodInDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.location != null ? this.location.hashCode() : 0;
            result = 31 * result + (this.orphanFileRetentionPeriodInDays != null ? this.orphanFileRetentionPeriodInDays.hashCode() : 0);
            return result;
        }
    }
}
