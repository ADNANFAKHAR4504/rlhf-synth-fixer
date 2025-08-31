package imports.aws.glue_catalog_table_optimizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableOptimizerConfigurationRetentionConfiguration.Jsii$Proxy.class)
public interface GlueCatalogTableOptimizerConfigurationRetentionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * iceberg_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIcebergConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableOptimizerConfigurationRetentionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableOptimizerConfigurationRetentionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableOptimizerConfigurationRetentionConfiguration> {
        java.lang.Object icebergConfiguration;

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationRetentionConfiguration#getIcebergConfiguration}
         * @param icebergConfiguration iceberg_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
         * @return {@code this}
         */
        public Builder icebergConfiguration(com.hashicorp.cdktf.IResolvable icebergConfiguration) {
            this.icebergConfiguration = icebergConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableOptimizerConfigurationRetentionConfiguration#getIcebergConfiguration}
         * @param icebergConfiguration iceberg_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table_optimizer#iceberg_configuration GlueCatalogTableOptimizer#iceberg_configuration}
         * @return {@code this}
         */
        public Builder icebergConfiguration(java.util.List<? extends imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationIcebergConfiguration> icebergConfiguration) {
            this.icebergConfiguration = icebergConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableOptimizerConfigurationRetentionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableOptimizerConfigurationRetentionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableOptimizerConfigurationRetentionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableOptimizerConfigurationRetentionConfiguration {
        private final java.lang.Object icebergConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.icebergConfiguration = software.amazon.jsii.Kernel.get(this, "icebergConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.icebergConfiguration = builder.icebergConfiguration;
        }

        @Override
        public final java.lang.Object getIcebergConfiguration() {
            return this.icebergConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIcebergConfiguration() != null) {
                data.set("icebergConfiguration", om.valueToTree(this.getIcebergConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableOptimizerConfigurationRetentionConfiguration.Jsii$Proxy that = (GlueCatalogTableOptimizerConfigurationRetentionConfiguration.Jsii$Proxy) o;

            return this.icebergConfiguration != null ? this.icebergConfiguration.equals(that.icebergConfiguration) : that.icebergConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.icebergConfiguration != null ? this.icebergConfiguration.hashCode() : 0;
            return result;
        }
    }
}
