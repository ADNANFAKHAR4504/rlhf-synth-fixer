package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentOutputContext")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentOutputContext.Jsii$Proxy.class)
public interface Lexv2ModelsIntentOutputContext extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#name Lexv2ModelsIntent#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#time_to_live_in_seconds Lexv2ModelsIntent#time_to_live_in_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTimeToLiveInSeconds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#turns_to_live Lexv2ModelsIntent#turns_to_live}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTurnsToLive();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentOutputContext}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentOutputContext}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentOutputContext> {
        java.lang.String name;
        java.lang.Number timeToLiveInSeconds;
        java.lang.Number turnsToLive;

        /**
         * Sets the value of {@link Lexv2ModelsIntentOutputContext#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#name Lexv2ModelsIntent#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentOutputContext#getTimeToLiveInSeconds}
         * @param timeToLiveInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#time_to_live_in_seconds Lexv2ModelsIntent#time_to_live_in_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeToLiveInSeconds(java.lang.Number timeToLiveInSeconds) {
            this.timeToLiveInSeconds = timeToLiveInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentOutputContext#getTurnsToLive}
         * @param turnsToLive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#turns_to_live Lexv2ModelsIntent#turns_to_live}. This parameter is required.
         * @return {@code this}
         */
        public Builder turnsToLive(java.lang.Number turnsToLive) {
            this.turnsToLive = turnsToLive;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentOutputContext}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentOutputContext build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentOutputContext}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentOutputContext {
        private final java.lang.String name;
        private final java.lang.Number timeToLiveInSeconds;
        private final java.lang.Number turnsToLive;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeToLiveInSeconds = software.amazon.jsii.Kernel.get(this, "timeToLiveInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.turnsToLive = software.amazon.jsii.Kernel.get(this, "turnsToLive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.timeToLiveInSeconds = java.util.Objects.requireNonNull(builder.timeToLiveInSeconds, "timeToLiveInSeconds is required");
            this.turnsToLive = java.util.Objects.requireNonNull(builder.turnsToLive, "turnsToLive is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Number getTimeToLiveInSeconds() {
            return this.timeToLiveInSeconds;
        }

        @Override
        public final java.lang.Number getTurnsToLive() {
            return this.turnsToLive;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("timeToLiveInSeconds", om.valueToTree(this.getTimeToLiveInSeconds()));
            data.set("turnsToLive", om.valueToTree(this.getTurnsToLive()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentOutputContext"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentOutputContext.Jsii$Proxy that = (Lexv2ModelsIntentOutputContext.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!timeToLiveInSeconds.equals(that.timeToLiveInSeconds)) return false;
            return this.turnsToLive.equals(that.turnsToLive);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.timeToLiveInSeconds.hashCode());
            result = 31 * result + (this.turnsToLive.hashCode());
            return result;
        }
    }
}
