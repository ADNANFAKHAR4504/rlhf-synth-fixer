package imports.aws.lex_bot_alias;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.541Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexBotAlias.LexBotAliasConversationLogs")
@software.amazon.jsii.Jsii.Proxy(LexBotAliasConversationLogs.Jsii$Proxy.class)
public interface LexBotAliasConversationLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#iam_role_arn LexBotAlias#iam_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn();

    /**
     * log_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#log_settings LexBotAlias#log_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexBotAliasConversationLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexBotAliasConversationLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexBotAliasConversationLogs> {
        java.lang.String iamRoleArn;
        java.lang.Object logSettings;

        /**
         * Sets the value of {@link LexBotAliasConversationLogs#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#iam_role_arn LexBotAlias#iam_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link LexBotAliasConversationLogs#getLogSettings}
         * @param logSettings log_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#log_settings LexBotAlias#log_settings}
         * @return {@code this}
         */
        public Builder logSettings(com.hashicorp.cdktf.IResolvable logSettings) {
            this.logSettings = logSettings;
            return this;
        }

        /**
         * Sets the value of {@link LexBotAliasConversationLogs#getLogSettings}
         * @param logSettings log_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot_alias#log_settings LexBotAlias#log_settings}
         * @return {@code this}
         */
        public Builder logSettings(java.util.List<? extends imports.aws.lex_bot_alias.LexBotAliasConversationLogsLogSettings> logSettings) {
            this.logSettings = logSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexBotAliasConversationLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexBotAliasConversationLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexBotAliasConversationLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexBotAliasConversationLogs {
        private final java.lang.String iamRoleArn;
        private final java.lang.Object logSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logSettings = software.amazon.jsii.Kernel.get(this, "logSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.iamRoleArn = java.util.Objects.requireNonNull(builder.iamRoleArn, "iamRoleArn is required");
            this.logSettings = builder.logSettings;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.Object getLogSettings() {
            return this.logSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            if (this.getLogSettings() != null) {
                data.set("logSettings", om.valueToTree(this.getLogSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexBotAlias.LexBotAliasConversationLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexBotAliasConversationLogs.Jsii$Proxy that = (LexBotAliasConversationLogs.Jsii$Proxy) o;

            if (!iamRoleArn.equals(that.iamRoleArn)) return false;
            return this.logSettings != null ? this.logSettings.equals(that.logSettings) : that.logSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.iamRoleArn.hashCode();
            result = 31 * result + (this.logSettings != null ? this.logSettings.hashCode() : 0);
            return result;
        }
    }
}
