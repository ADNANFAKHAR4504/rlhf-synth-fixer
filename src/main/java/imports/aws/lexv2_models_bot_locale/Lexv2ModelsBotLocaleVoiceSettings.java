package imports.aws.lexv2_models_bot_locale;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.549Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsBotLocale.Lexv2ModelsBotLocaleVoiceSettings")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsBotLocaleVoiceSettings.Jsii$Proxy.class)
public interface Lexv2ModelsBotLocaleVoiceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_id Lexv2ModelsBotLocale#voice_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVoiceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#engine Lexv2ModelsBotLocale#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsBotLocaleVoiceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsBotLocaleVoiceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsBotLocaleVoiceSettings> {
        java.lang.String voiceId;
        java.lang.String engine;

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleVoiceSettings#getVoiceId}
         * @param voiceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#voice_id Lexv2ModelsBotLocale#voice_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder voiceId(java.lang.String voiceId) {
            this.voiceId = voiceId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotLocaleVoiceSettings#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_locale#engine Lexv2ModelsBotLocale#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsBotLocaleVoiceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsBotLocaleVoiceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsBotLocaleVoiceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsBotLocaleVoiceSettings {
        private final java.lang.String voiceId;
        private final java.lang.String engine;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.voiceId = software.amazon.jsii.Kernel.get(this, "voiceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.voiceId = java.util.Objects.requireNonNull(builder.voiceId, "voiceId is required");
            this.engine = builder.engine;
        }

        @Override
        public final java.lang.String getVoiceId() {
            return this.voiceId;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("voiceId", om.valueToTree(this.getVoiceId()));
            if (this.getEngine() != null) {
                data.set("engine", om.valueToTree(this.getEngine()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsBotLocale.Lexv2ModelsBotLocaleVoiceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsBotLocaleVoiceSettings.Jsii$Proxy that = (Lexv2ModelsBotLocaleVoiceSettings.Jsii$Proxy) o;

            if (!voiceId.equals(that.voiceId)) return false;
            return this.engine != null ? this.engine.equals(that.engine) : that.engine == null;
        }

        @Override
        public final int hashCode() {
            int result = this.voiceId.hashCode();
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            return result;
        }
    }
}
