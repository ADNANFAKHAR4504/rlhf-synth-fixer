package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerLineageConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerLineageConfiguration.Jsii$Proxy.class)
public interface GlueCrawlerLineageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#crawler_lineage_settings GlueCrawler#crawler_lineage_settings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCrawlerLineageSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerLineageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerLineageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerLineageConfiguration> {
        java.lang.String crawlerLineageSettings;

        /**
         * Sets the value of {@link GlueCrawlerLineageConfiguration#getCrawlerLineageSettings}
         * @param crawlerLineageSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#crawler_lineage_settings GlueCrawler#crawler_lineage_settings}.
         * @return {@code this}
         */
        public Builder crawlerLineageSettings(java.lang.String crawlerLineageSettings) {
            this.crawlerLineageSettings = crawlerLineageSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerLineageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerLineageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerLineageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerLineageConfiguration {
        private final java.lang.String crawlerLineageSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crawlerLineageSettings = software.amazon.jsii.Kernel.get(this, "crawlerLineageSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crawlerLineageSettings = builder.crawlerLineageSettings;
        }

        @Override
        public final java.lang.String getCrawlerLineageSettings() {
            return this.crawlerLineageSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrawlerLineageSettings() != null) {
                data.set("crawlerLineageSettings", om.valueToTree(this.getCrawlerLineageSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerLineageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerLineageConfiguration.Jsii$Proxy that = (GlueCrawlerLineageConfiguration.Jsii$Proxy) o;

            return this.crawlerLineageSettings != null ? this.crawlerLineageSettings.equals(that.crawlerLineageSettings) : that.crawlerLineageSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crawlerLineageSettings != null ? this.crawlerLineageSettings.hashCode() : 0;
            return result;
        }
    }
}
