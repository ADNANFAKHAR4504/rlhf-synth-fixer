package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerDeltaTarget")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerDeltaTarget.Jsii$Proxy.class)
public interface GlueCrawlerDeltaTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delta_tables GlueCrawler#delta_tables}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDeltaTables();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#write_manifest GlueCrawler#write_manifest}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getWriteManifest();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#create_native_delta_table GlueCrawler#create_native_delta_table}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateNativeDeltaTable() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerDeltaTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerDeltaTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerDeltaTarget> {
        java.util.List<java.lang.String> deltaTables;
        java.lang.Object writeManifest;
        java.lang.String connectionName;
        java.lang.Object createNativeDeltaTable;

        /**
         * Sets the value of {@link GlueCrawlerDeltaTarget#getDeltaTables}
         * @param deltaTables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delta_tables GlueCrawler#delta_tables}. This parameter is required.
         * @return {@code this}
         */
        public Builder deltaTables(java.util.List<java.lang.String> deltaTables) {
            this.deltaTables = deltaTables;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDeltaTarget#getWriteManifest}
         * @param writeManifest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#write_manifest GlueCrawler#write_manifest}. This parameter is required.
         * @return {@code this}
         */
        public Builder writeManifest(java.lang.Boolean writeManifest) {
            this.writeManifest = writeManifest;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDeltaTarget#getWriteManifest}
         * @param writeManifest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#write_manifest GlueCrawler#write_manifest}. This parameter is required.
         * @return {@code this}
         */
        public Builder writeManifest(com.hashicorp.cdktf.IResolvable writeManifest) {
            this.writeManifest = writeManifest;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDeltaTarget#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDeltaTarget#getCreateNativeDeltaTable}
         * @param createNativeDeltaTable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#create_native_delta_table GlueCrawler#create_native_delta_table}.
         * @return {@code this}
         */
        public Builder createNativeDeltaTable(java.lang.Boolean createNativeDeltaTable) {
            this.createNativeDeltaTable = createNativeDeltaTable;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDeltaTarget#getCreateNativeDeltaTable}
         * @param createNativeDeltaTable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#create_native_delta_table GlueCrawler#create_native_delta_table}.
         * @return {@code this}
         */
        public Builder createNativeDeltaTable(com.hashicorp.cdktf.IResolvable createNativeDeltaTable) {
            this.createNativeDeltaTable = createNativeDeltaTable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerDeltaTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerDeltaTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerDeltaTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerDeltaTarget {
        private final java.util.List<java.lang.String> deltaTables;
        private final java.lang.Object writeManifest;
        private final java.lang.String connectionName;
        private final java.lang.Object createNativeDeltaTable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deltaTables = software.amazon.jsii.Kernel.get(this, "deltaTables", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.writeManifest = software.amazon.jsii.Kernel.get(this, "writeManifest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.createNativeDeltaTable = software.amazon.jsii.Kernel.get(this, "createNativeDeltaTable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deltaTables = java.util.Objects.requireNonNull(builder.deltaTables, "deltaTables is required");
            this.writeManifest = java.util.Objects.requireNonNull(builder.writeManifest, "writeManifest is required");
            this.connectionName = builder.connectionName;
            this.createNativeDeltaTable = builder.createNativeDeltaTable;
        }

        @Override
        public final java.util.List<java.lang.String> getDeltaTables() {
            return this.deltaTables;
        }

        @Override
        public final java.lang.Object getWriteManifest() {
            return this.writeManifest;
        }

        @Override
        public final java.lang.String getConnectionName() {
            return this.connectionName;
        }

        @Override
        public final java.lang.Object getCreateNativeDeltaTable() {
            return this.createNativeDeltaTable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deltaTables", om.valueToTree(this.getDeltaTables()));
            data.set("writeManifest", om.valueToTree(this.getWriteManifest()));
            if (this.getConnectionName() != null) {
                data.set("connectionName", om.valueToTree(this.getConnectionName()));
            }
            if (this.getCreateNativeDeltaTable() != null) {
                data.set("createNativeDeltaTable", om.valueToTree(this.getCreateNativeDeltaTable()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerDeltaTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerDeltaTarget.Jsii$Proxy that = (GlueCrawlerDeltaTarget.Jsii$Proxy) o;

            if (!deltaTables.equals(that.deltaTables)) return false;
            if (!writeManifest.equals(that.writeManifest)) return false;
            if (this.connectionName != null ? !this.connectionName.equals(that.connectionName) : that.connectionName != null) return false;
            return this.createNativeDeltaTable != null ? this.createNativeDeltaTable.equals(that.createNativeDeltaTable) : that.createNativeDeltaTable == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deltaTables.hashCode();
            result = 31 * result + (this.writeManifest.hashCode());
            result = 31 * result + (this.connectionName != null ? this.connectionName.hashCode() : 0);
            result = 31 * result + (this.createNativeDeltaTable != null ? this.createNativeDeltaTable.hashCode() : 0);
            return result;
        }
    }
}
