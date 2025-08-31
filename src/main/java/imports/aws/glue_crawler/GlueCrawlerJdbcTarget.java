package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerJdbcTarget")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerJdbcTarget.Jsii$Proxy.class)
public interface GlueCrawlerJdbcTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#enable_additional_metadata GlueCrawler#enable_additional_metadata}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnableAdditionalMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#exclusions GlueCrawler#exclusions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerJdbcTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerJdbcTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerJdbcTarget> {
        java.lang.String connectionName;
        java.lang.String path;
        java.util.List<java.lang.String> enableAdditionalMetadata;
        java.util.List<java.lang.String> exclusions;

        /**
         * Sets the value of {@link GlueCrawlerJdbcTarget#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerJdbcTarget#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}. This parameter is required.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerJdbcTarget#getEnableAdditionalMetadata}
         * @param enableAdditionalMetadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#enable_additional_metadata GlueCrawler#enable_additional_metadata}.
         * @return {@code this}
         */
        public Builder enableAdditionalMetadata(java.util.List<java.lang.String> enableAdditionalMetadata) {
            this.enableAdditionalMetadata = enableAdditionalMetadata;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerJdbcTarget#getExclusions}
         * @param exclusions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#exclusions GlueCrawler#exclusions}.
         * @return {@code this}
         */
        public Builder exclusions(java.util.List<java.lang.String> exclusions) {
            this.exclusions = exclusions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerJdbcTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerJdbcTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerJdbcTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerJdbcTarget {
        private final java.lang.String connectionName;
        private final java.lang.String path;
        private final java.util.List<java.lang.String> enableAdditionalMetadata;
        private final java.util.List<java.lang.String> exclusions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableAdditionalMetadata = software.amazon.jsii.Kernel.get(this, "enableAdditionalMetadata", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.exclusions = software.amazon.jsii.Kernel.get(this, "exclusions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionName = java.util.Objects.requireNonNull(builder.connectionName, "connectionName is required");
            this.path = java.util.Objects.requireNonNull(builder.path, "path is required");
            this.enableAdditionalMetadata = builder.enableAdditionalMetadata;
            this.exclusions = builder.exclusions;
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
        public final java.util.List<java.lang.String> getEnableAdditionalMetadata() {
            return this.enableAdditionalMetadata;
        }

        @Override
        public final java.util.List<java.lang.String> getExclusions() {
            return this.exclusions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectionName", om.valueToTree(this.getConnectionName()));
            data.set("path", om.valueToTree(this.getPath()));
            if (this.getEnableAdditionalMetadata() != null) {
                data.set("enableAdditionalMetadata", om.valueToTree(this.getEnableAdditionalMetadata()));
            }
            if (this.getExclusions() != null) {
                data.set("exclusions", om.valueToTree(this.getExclusions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerJdbcTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerJdbcTarget.Jsii$Proxy that = (GlueCrawlerJdbcTarget.Jsii$Proxy) o;

            if (!connectionName.equals(that.connectionName)) return false;
            if (!path.equals(that.path)) return false;
            if (this.enableAdditionalMetadata != null ? !this.enableAdditionalMetadata.equals(that.enableAdditionalMetadata) : that.enableAdditionalMetadata != null) return false;
            return this.exclusions != null ? this.exclusions.equals(that.exclusions) : that.exclusions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionName.hashCode();
            result = 31 * result + (this.path.hashCode());
            result = 31 * result + (this.enableAdditionalMetadata != null ? this.enableAdditionalMetadata.hashCode() : 0);
            result = 31 * result + (this.exclusions != null ? this.exclusions.hashCode() : 0);
            return result;
        }
    }
}
