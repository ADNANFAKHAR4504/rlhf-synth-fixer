package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerSchemaChangePolicy")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerSchemaChangePolicy.Jsii$Proxy.class)
public interface GlueCrawlerSchemaChangePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delete_behavior GlueCrawler#delete_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeleteBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#update_behavior GlueCrawler#update_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpdateBehavior() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerSchemaChangePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerSchemaChangePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerSchemaChangePolicy> {
        java.lang.String deleteBehavior;
        java.lang.String updateBehavior;

        /**
         * Sets the value of {@link GlueCrawlerSchemaChangePolicy#getDeleteBehavior}
         * @param deleteBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delete_behavior GlueCrawler#delete_behavior}.
         * @return {@code this}
         */
        public Builder deleteBehavior(java.lang.String deleteBehavior) {
            this.deleteBehavior = deleteBehavior;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerSchemaChangePolicy#getUpdateBehavior}
         * @param updateBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#update_behavior GlueCrawler#update_behavior}.
         * @return {@code this}
         */
        public Builder updateBehavior(java.lang.String updateBehavior) {
            this.updateBehavior = updateBehavior;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerSchemaChangePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerSchemaChangePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerSchemaChangePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerSchemaChangePolicy {
        private final java.lang.String deleteBehavior;
        private final java.lang.String updateBehavior;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deleteBehavior = software.amazon.jsii.Kernel.get(this, "deleteBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.updateBehavior = software.amazon.jsii.Kernel.get(this, "updateBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deleteBehavior = builder.deleteBehavior;
            this.updateBehavior = builder.updateBehavior;
        }

        @Override
        public final java.lang.String getDeleteBehavior() {
            return this.deleteBehavior;
        }

        @Override
        public final java.lang.String getUpdateBehavior() {
            return this.updateBehavior;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeleteBehavior() != null) {
                data.set("deleteBehavior", om.valueToTree(this.getDeleteBehavior()));
            }
            if (this.getUpdateBehavior() != null) {
                data.set("updateBehavior", om.valueToTree(this.getUpdateBehavior()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerSchemaChangePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerSchemaChangePolicy.Jsii$Proxy that = (GlueCrawlerSchemaChangePolicy.Jsii$Proxy) o;

            if (this.deleteBehavior != null ? !this.deleteBehavior.equals(that.deleteBehavior) : that.deleteBehavior != null) return false;
            return this.updateBehavior != null ? this.updateBehavior.equals(that.updateBehavior) : that.updateBehavior == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deleteBehavior != null ? this.deleteBehavior.hashCode() : 0;
            result = 31 * result + (this.updateBehavior != null ? this.updateBehavior.hashCode() : 0);
            return result;
        }
    }
}
