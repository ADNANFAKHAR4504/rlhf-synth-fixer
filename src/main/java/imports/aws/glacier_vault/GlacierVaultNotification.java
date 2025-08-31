package imports.aws.glacier_vault;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glacierVault.GlacierVaultNotification")
@software.amazon.jsii.Jsii.Proxy(GlacierVaultNotification.Jsii$Proxy.class)
public interface GlacierVaultNotification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glacier_vault#events GlacierVault#events}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEvents();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glacier_vault#sns_topic GlacierVault#sns_topic}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSnsTopic();

    /**
     * @return a {@link Builder} of {@link GlacierVaultNotification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlacierVaultNotification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlacierVaultNotification> {
        java.util.List<java.lang.String> events;
        java.lang.String snsTopic;

        /**
         * Sets the value of {@link GlacierVaultNotification#getEvents}
         * @param events Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glacier_vault#events GlacierVault#events}. This parameter is required.
         * @return {@code this}
         */
        public Builder events(java.util.List<java.lang.String> events) {
            this.events = events;
            return this;
        }

        /**
         * Sets the value of {@link GlacierVaultNotification#getSnsTopic}
         * @param snsTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glacier_vault#sns_topic GlacierVault#sns_topic}. This parameter is required.
         * @return {@code this}
         */
        public Builder snsTopic(java.lang.String snsTopic) {
            this.snsTopic = snsTopic;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlacierVaultNotification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlacierVaultNotification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlacierVaultNotification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlacierVaultNotification {
        private final java.util.List<java.lang.String> events;
        private final java.lang.String snsTopic;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.events = software.amazon.jsii.Kernel.get(this, "events", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snsTopic = software.amazon.jsii.Kernel.get(this, "snsTopic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.events = java.util.Objects.requireNonNull(builder.events, "events is required");
            this.snsTopic = java.util.Objects.requireNonNull(builder.snsTopic, "snsTopic is required");
        }

        @Override
        public final java.util.List<java.lang.String> getEvents() {
            return this.events;
        }

        @Override
        public final java.lang.String getSnsTopic() {
            return this.snsTopic;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("events", om.valueToTree(this.getEvents()));
            data.set("snsTopic", om.valueToTree(this.getSnsTopic()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glacierVault.GlacierVaultNotification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlacierVaultNotification.Jsii$Proxy that = (GlacierVaultNotification.Jsii$Proxy) o;

            if (!events.equals(that.events)) return false;
            return this.snsTopic.equals(that.snsTopic);
        }

        @Override
        public final int hashCode() {
            int result = this.events.hashCode();
            result = 31 * result + (this.snsTopic.hashCode());
            return result;
        }
    }
}
