package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerIcebergTarget")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerIcebergTarget.Jsii$Proxy.class)
public interface GlueCrawlerIcebergTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#maximum_traversal_depth GlueCrawler#maximum_traversal_depth}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaximumTraversalDepth();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#paths GlueCrawler#paths}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPaths();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#exclusions GlueCrawler#exclusions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerIcebergTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerIcebergTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerIcebergTarget> {
        java.lang.Number maximumTraversalDepth;
        java.util.List<java.lang.String> paths;
        java.lang.String connectionName;
        java.util.List<java.lang.String> exclusions;

        /**
         * Sets the value of {@link GlueCrawlerIcebergTarget#getMaximumTraversalDepth}
         * @param maximumTraversalDepth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#maximum_traversal_depth GlueCrawler#maximum_traversal_depth}. This parameter is required.
         * @return {@code this}
         */
        public Builder maximumTraversalDepth(java.lang.Number maximumTraversalDepth) {
            this.maximumTraversalDepth = maximumTraversalDepth;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerIcebergTarget#getPaths}
         * @param paths Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#paths GlueCrawler#paths}. This parameter is required.
         * @return {@code this}
         */
        public Builder paths(java.util.List<java.lang.String> paths) {
            this.paths = paths;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerIcebergTarget#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerIcebergTarget#getExclusions}
         * @param exclusions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#exclusions GlueCrawler#exclusions}.
         * @return {@code this}
         */
        public Builder exclusions(java.util.List<java.lang.String> exclusions) {
            this.exclusions = exclusions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerIcebergTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerIcebergTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerIcebergTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerIcebergTarget {
        private final java.lang.Number maximumTraversalDepth;
        private final java.util.List<java.lang.String> paths;
        private final java.lang.String connectionName;
        private final java.util.List<java.lang.String> exclusions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumTraversalDepth = software.amazon.jsii.Kernel.get(this, "maximumTraversalDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.paths = software.amazon.jsii.Kernel.get(this, "paths", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exclusions = software.amazon.jsii.Kernel.get(this, "exclusions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumTraversalDepth = java.util.Objects.requireNonNull(builder.maximumTraversalDepth, "maximumTraversalDepth is required");
            this.paths = java.util.Objects.requireNonNull(builder.paths, "paths is required");
            this.connectionName = builder.connectionName;
            this.exclusions = builder.exclusions;
        }

        @Override
        public final java.lang.Number getMaximumTraversalDepth() {
            return this.maximumTraversalDepth;
        }

        @Override
        public final java.util.List<java.lang.String> getPaths() {
            return this.paths;
        }

        @Override
        public final java.lang.String getConnectionName() {
            return this.connectionName;
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

            data.set("maximumTraversalDepth", om.valueToTree(this.getMaximumTraversalDepth()));
            data.set("paths", om.valueToTree(this.getPaths()));
            if (this.getConnectionName() != null) {
                data.set("connectionName", om.valueToTree(this.getConnectionName()));
            }
            if (this.getExclusions() != null) {
                data.set("exclusions", om.valueToTree(this.getExclusions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerIcebergTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerIcebergTarget.Jsii$Proxy that = (GlueCrawlerIcebergTarget.Jsii$Proxy) o;

            if (!maximumTraversalDepth.equals(that.maximumTraversalDepth)) return false;
            if (!paths.equals(that.paths)) return false;
            if (this.connectionName != null ? !this.connectionName.equals(that.connectionName) : that.connectionName != null) return false;
            return this.exclusions != null ? this.exclusions.equals(that.exclusions) : that.exclusions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumTraversalDepth.hashCode();
            result = 31 * result + (this.paths.hashCode());
            result = 31 * result + (this.connectionName != null ? this.connectionName.hashCode() : 0);
            result = 31 * result + (this.exclusions != null ? this.exclusions.hashCode() : 0);
            return result;
        }
    }
}
