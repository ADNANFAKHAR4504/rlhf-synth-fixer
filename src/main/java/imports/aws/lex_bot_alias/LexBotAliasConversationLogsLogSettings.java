package imports.aws.lex_bot_alias;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.541Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexBotAlias.LexBotAliasConversationLogsLogSettings")
@software.amazon.jsii.Jsii.Proxy(LexBotAliasConversationLogsLogSettings.Jsii$Proxy.class)
public interface LexBotAliasConversationLogsLogSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#destination LexBotAlias#destination}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#log_type LexBotAlias#log_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#resource_arn LexBotAlias#resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#kms_key_arn LexBotAlias#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexBotAliasConversationLogsLogSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexBotAliasConversationLogsLogSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexBotAliasConversationLogsLogSettings> {
        java.lang.String destination;
        java.lang.String logType;
        java.lang.String resourceArn;
        java.lang.String kmsKeyArn;

        /**
         * Sets the value of {@link LexBotAliasConversationLogsLogSettings#getDestination}
         * @param destination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#destination LexBotAlias#destination}. This parameter is required.
         * @return {@code this}
         */
        public Builder destination(java.lang.String destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link LexBotAliasConversationLogsLogSettings#getLogType}
         * @param logType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#log_type LexBotAlias#log_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder logType(java.lang.String logType) {
            this.logType = logType;
            return this;
        }

        /**
         * Sets the value of {@link LexBotAliasConversationLogsLogSettings#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#resource_arn LexBotAlias#resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Sets the value of {@link LexBotAliasConversationLogsLogSettings#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#kms_key_arn LexBotAlias#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexBotAliasConversationLogsLogSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexBotAliasConversationLogsLogSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexBotAliasConversationLogsLogSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexBotAliasConversationLogsLogSettings {
        private final java.lang.String destination;
        private final java.lang.String logType;
        private final java.lang.String resourceArn;
        private final java.lang.String kmsKeyArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logType = software.amazon.jsii.Kernel.get(this, "logType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.logType = java.util.Objects.requireNonNull(builder.logType, "logType is required");
            this.resourceArn = java.util.Objects.requireNonNull(builder.resourceArn, "resourceArn is required");
            this.kmsKeyArn = builder.kmsKeyArn;
        }

        @Override
        public final java.lang.String getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getLogType() {
            return this.logType;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            data.set("logType", om.valueToTree(this.getLogType()));
            data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexBotAlias.LexBotAliasConversationLogsLogSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexBotAliasConversationLogsLogSettings.Jsii$Proxy that = (LexBotAliasConversationLogsLogSettings.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (!logType.equals(that.logType)) return false;
            if (!resourceArn.equals(that.resourceArn)) return false;
            return this.kmsKeyArn != null ? this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.logType.hashCode());
            result = 31 * result + (this.resourceArn.hashCode());
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            return result;
        }
    }
}
