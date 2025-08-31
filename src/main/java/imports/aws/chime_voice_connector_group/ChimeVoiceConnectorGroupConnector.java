package imports.aws.chime_voice_connector_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.203Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimeVoiceConnectorGroup.ChimeVoiceConnectorGroupConnector")
@software.amazon.jsii.Jsii.Proxy(ChimeVoiceConnectorGroupConnector.Jsii$Proxy.class)
public interface ChimeVoiceConnectorGroupConnector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_group#priority ChimeVoiceConnectorGroup#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_group#voice_connector_id ChimeVoiceConnectorGroup#voice_connector_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVoiceConnectorId();

    /**
     * @return a {@link Builder} of {@link ChimeVoiceConnectorGroupConnector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimeVoiceConnectorGroupConnector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimeVoiceConnectorGroupConnector> {
        java.lang.Number priority;
        java.lang.String voiceConnectorId;

        /**
         * Sets the value of {@link ChimeVoiceConnectorGroupConnector#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_group#priority ChimeVoiceConnectorGroup#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorGroupConnector#getVoiceConnectorId}
         * @param voiceConnectorId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_group#voice_connector_id ChimeVoiceConnectorGroup#voice_connector_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder voiceConnectorId(java.lang.String voiceConnectorId) {
            this.voiceConnectorId = voiceConnectorId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimeVoiceConnectorGroupConnector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimeVoiceConnectorGroupConnector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimeVoiceConnectorGroupConnector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimeVoiceConnectorGroupConnector {
        private final java.lang.Number priority;
        private final java.lang.String voiceConnectorId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.voiceConnectorId = software.amazon.jsii.Kernel.get(this, "voiceConnectorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.voiceConnectorId = java.util.Objects.requireNonNull(builder.voiceConnectorId, "voiceConnectorId is required");
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getVoiceConnectorId() {
            return this.voiceConnectorId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("voiceConnectorId", om.valueToTree(this.getVoiceConnectorId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimeVoiceConnectorGroup.ChimeVoiceConnectorGroupConnector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimeVoiceConnectorGroupConnector.Jsii$Proxy that = (ChimeVoiceConnectorGroupConnector.Jsii$Proxy) o;

            if (!priority.equals(that.priority)) return false;
            return this.voiceConnectorId.equals(that.voiceConnectorId);
        }

        @Override
        public final int hashCode() {
            int result = this.priority.hashCode();
            result = 31 * result + (this.voiceConnectorId.hashCode());
            return result;
        }
    }
}
