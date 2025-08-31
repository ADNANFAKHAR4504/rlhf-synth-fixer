package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerDynamodbTarget")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerDynamodbTarget.Jsii$Proxy.class)
public interface GlueCrawlerDynamodbTarget extends software.amazon.jsii.JsiiSerializable {

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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_rate GlueCrawler#scan_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScanRate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerDynamodbTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerDynamodbTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerDynamodbTarget> {
        java.lang.String path;
        java.lang.Object scanAll;
        java.lang.Number scanRate;

        /**
         * Sets the value of {@link GlueCrawlerDynamodbTarget#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}. This parameter is required.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDynamodbTarget#getScanAll}
         * @param scanAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_all GlueCrawler#scan_all}.
         * @return {@code this}
         */
        public Builder scanAll(java.lang.Boolean scanAll) {
            this.scanAll = scanAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDynamodbTarget#getScanAll}
         * @param scanAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_all GlueCrawler#scan_all}.
         * @return {@code this}
         */
        public Builder scanAll(com.hashicorp.cdktf.IResolvable scanAll) {
            this.scanAll = scanAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerDynamodbTarget#getScanRate}
         * @param scanRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#scan_rate GlueCrawler#scan_rate}.
         * @return {@code this}
         */
        public Builder scanRate(java.lang.Number scanRate) {
            this.scanRate = scanRate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerDynamodbTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerDynamodbTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerDynamodbTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerDynamodbTarget {
        private final java.lang.String path;
        private final java.lang.Object scanAll;
        private final java.lang.Number scanRate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scanAll = software.amazon.jsii.Kernel.get(this, "scanAll", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scanRate = software.amazon.jsii.Kernel.get(this, "scanRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.path = java.util.Objects.requireNonNull(builder.path, "path is required");
            this.scanAll = builder.scanAll;
            this.scanRate = builder.scanRate;
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
        public final java.lang.Number getScanRate() {
            return this.scanRate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("path", om.valueToTree(this.getPath()));
            if (this.getScanAll() != null) {
                data.set("scanAll", om.valueToTree(this.getScanAll()));
            }
            if (this.getScanRate() != null) {
                data.set("scanRate", om.valueToTree(this.getScanRate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerDynamodbTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerDynamodbTarget.Jsii$Proxy that = (GlueCrawlerDynamodbTarget.Jsii$Proxy) o;

            if (!path.equals(that.path)) return false;
            if (this.scanAll != null ? !this.scanAll.equals(that.scanAll) : that.scanAll != null) return false;
            return this.scanRate != null ? this.scanRate.equals(that.scanRate) : that.scanRate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.path.hashCode();
            result = 31 * result + (this.scanAll != null ? this.scanAll.hashCode() : 0);
            result = 31 * result + (this.scanRate != null ? this.scanRate.hashCode() : 0);
            return result;
        }
    }
}
