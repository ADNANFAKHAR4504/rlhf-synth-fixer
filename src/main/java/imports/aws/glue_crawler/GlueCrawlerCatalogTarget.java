package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerCatalogTarget")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerCatalogTarget.Jsii$Proxy.class)
public interface GlueCrawlerCatalogTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#database_name GlueCrawler#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#tables GlueCrawler#tables}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTables();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dlq_event_queue_arn GlueCrawler#dlq_event_queue_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDlqEventQueueArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#event_queue_arn GlueCrawler#event_queue_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventQueueArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerCatalogTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerCatalogTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerCatalogTarget> {
        java.lang.String databaseName;
        java.util.List<java.lang.String> tables;
        java.lang.String connectionName;
        java.lang.String dlqEventQueueArn;
        java.lang.String eventQueueArn;

        /**
         * Sets the value of {@link GlueCrawlerCatalogTarget#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#database_name GlueCrawler#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerCatalogTarget#getTables}
         * @param tables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#tables GlueCrawler#tables}. This parameter is required.
         * @return {@code this}
         */
        public Builder tables(java.util.List<java.lang.String> tables) {
            this.tables = tables;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerCatalogTarget#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerCatalogTarget#getDlqEventQueueArn}
         * @param dlqEventQueueArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dlq_event_queue_arn GlueCrawler#dlq_event_queue_arn}.
         * @return {@code this}
         */
        public Builder dlqEventQueueArn(java.lang.String dlqEventQueueArn) {
            this.dlqEventQueueArn = dlqEventQueueArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerCatalogTarget#getEventQueueArn}
         * @param eventQueueArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#event_queue_arn GlueCrawler#event_queue_arn}.
         * @return {@code this}
         */
        public Builder eventQueueArn(java.lang.String eventQueueArn) {
            this.eventQueueArn = eventQueueArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerCatalogTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerCatalogTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerCatalogTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerCatalogTarget {
        private final java.lang.String databaseName;
        private final java.util.List<java.lang.String> tables;
        private final java.lang.String connectionName;
        private final java.lang.String dlqEventQueueArn;
        private final java.lang.String eventQueueArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tables = software.amazon.jsii.Kernel.get(this, "tables", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dlqEventQueueArn = software.amazon.jsii.Kernel.get(this, "dlqEventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventQueueArn = software.amazon.jsii.Kernel.get(this, "eventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.tables = java.util.Objects.requireNonNull(builder.tables, "tables is required");
            this.connectionName = builder.connectionName;
            this.dlqEventQueueArn = builder.dlqEventQueueArn;
            this.eventQueueArn = builder.eventQueueArn;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.util.List<java.lang.String> getTables() {
            return this.tables;
        }

        @Override
        public final java.lang.String getConnectionName() {
            return this.connectionName;
        }

        @Override
        public final java.lang.String getDlqEventQueueArn() {
            return this.dlqEventQueueArn;
        }

        @Override
        public final java.lang.String getEventQueueArn() {
            return this.eventQueueArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("tables", om.valueToTree(this.getTables()));
            if (this.getConnectionName() != null) {
                data.set("connectionName", om.valueToTree(this.getConnectionName()));
            }
            if (this.getDlqEventQueueArn() != null) {
                data.set("dlqEventQueueArn", om.valueToTree(this.getDlqEventQueueArn()));
            }
            if (this.getEventQueueArn() != null) {
                data.set("eventQueueArn", om.valueToTree(this.getEventQueueArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerCatalogTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerCatalogTarget.Jsii$Proxy that = (GlueCrawlerCatalogTarget.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!tables.equals(that.tables)) return false;
            if (this.connectionName != null ? !this.connectionName.equals(that.connectionName) : that.connectionName != null) return false;
            if (this.dlqEventQueueArn != null ? !this.dlqEventQueueArn.equals(that.dlqEventQueueArn) : that.dlqEventQueueArn != null) return false;
            return this.eventQueueArn != null ? this.eventQueueArn.equals(that.eventQueueArn) : that.eventQueueArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.tables.hashCode());
            result = 31 * result + (this.connectionName != null ? this.connectionName.hashCode() : 0);
            result = 31 * result + (this.dlqEventQueueArn != null ? this.dlqEventQueueArn.hashCode() : 0);
            result = 31 * result + (this.eventQueueArn != null ? this.eventQueueArn.hashCode() : 0);
            return result;
        }
    }
}
