package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerMongodbTarget")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerMongodbTarget.Jsii$Proxy.class)
public interface GlueCrawlerMongodbTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_all GlueCrawler#scan_all}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScanAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerMongodbTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerMongodbTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerMongodbTarget> {
        java.lang.String connectionName;
        java.lang.String path;
        java.lang.Object scanAll;

        /**
         * Sets the value of {@link GlueCrawlerMongodbTarget#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerMongodbTarget#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}. This parameter is required.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerMongodbTarget#getScanAll}
         * @param scanAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_all GlueCrawler#scan_all}.
         * @return {@code this}
         */
        public Builder scanAll(java.lang.Boolean scanAll) {
            this.scanAll = scanAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerMongodbTarget#getScanAll}
         * @param scanAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_all GlueCrawler#scan_all}.
         * @return {@code this}
         */
        public Builder scanAll(com.hashicorp.cdktf.IResolvable scanAll) {
            this.scanAll = scanAll;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerMongodbTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerMongodbTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerMongodbTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerMongodbTarget {
        private final java.lang.String connectionName;
        private final java.lang.String path;
        private final java.lang.Object scanAll;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scanAll = software.amazon.jsii.Kernel.get(this, "scanAll", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionName = java.util.Objects.requireNonNull(builder.connectionName, "connectionName is required");
            this.path = java.util.Objects.requireNonNull(builder.path, "path is required");
            this.scanAll = builder.scanAll;
        }

        @Override
        public final java.lang.String getConnectionName() {
            return this.connectionName;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.Object getScanAll() {
            return this.scanAll;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectionName", om.valueToTree(this.getConnectionName()));
            data.set("path", om.valueToTree(this.getPath()));
            if (this.getScanAll() != null) {
                data.set("scanAll", om.valueToTree(this.getScanAll()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerMongodbTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerMongodbTarget.Jsii$Proxy that = (GlueCrawlerMongodbTarget.Jsii$Proxy) o;

            if (!connectionName.equals(that.connectionName)) return false;
            if (!path.equals(that.path)) return false;
            return this.scanAll != null ? this.scanAll.equals(that.scanAll) : that.scanAll == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionName.hashCode();
            result = 31 * result + (this.path.hashCode());
            result = 31 * result + (this.scanAll != null ? this.scanAll.hashCode() : 0);
            return result;
        }
    }
}
