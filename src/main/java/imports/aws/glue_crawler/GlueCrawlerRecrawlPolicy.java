package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerRecrawlPolicy")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerRecrawlPolicy.Jsii$Proxy.class)
public interface GlueCrawlerRecrawlPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#recrawl_behavior GlueCrawler#recrawl_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecrawlBehavior() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerRecrawlPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerRecrawlPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerRecrawlPolicy> {
        java.lang.String recrawlBehavior;

        /**
         * Sets the value of {@link GlueCrawlerRecrawlPolicy#getRecrawlBehavior}
         * @param recrawlBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#recrawl_behavior GlueCrawler#recrawl_behavior}.
         * @return {@code this}
         */
        public Builder recrawlBehavior(java.lang.String recrawlBehavior) {
            this.recrawlBehavior = recrawlBehavior;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerRecrawlPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerRecrawlPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerRecrawlPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerRecrawlPolicy {
        private final java.lang.String recrawlBehavior;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recrawlBehavior = software.amazon.jsii.Kernel.get(this, "recrawlBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recrawlBehavior = builder.recrawlBehavior;
        }

        @Override
        public final java.lang.String getRecrawlBehavior() {
            return this.recrawlBehavior;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRecrawlBehavior() != null) {
                data.set("recrawlBehavior", om.valueToTree(this.getRecrawlBehavior()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerRecrawlPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerRecrawlPolicy.Jsii$Proxy that = (GlueCrawlerRecrawlPolicy.Jsii$Proxy) o;

            return this.recrawlBehavior != null ? this.recrawlBehavior.equals(that.recrawlBehavior) : that.recrawlBehavior == null;
        }

        @Override
        public final int hashCode() {
            int result = this.recrawlBehavior != null ? this.recrawlBehavior.hashCode() : 0;
            return result;
        }
    }
}
