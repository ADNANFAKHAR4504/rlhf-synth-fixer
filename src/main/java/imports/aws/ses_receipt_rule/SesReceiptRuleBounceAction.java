package imports.aws.ses_receipt_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.450Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRuleBounceAction")
@software.amazon.jsii.Jsii.Proxy(SesReceiptRuleBounceAction.Jsii$Proxy.class)
public interface SesReceiptRuleBounceAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#message SesReceiptRule#message}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMessage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPosition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sender SesReceiptRule#sender}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSender();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#smtp_reply_code SesReceiptRule#smtp_reply_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSmtpReplyCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#status_code SesReceiptRule#status_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatusCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTopicArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesReceiptRuleBounceAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesReceiptRuleBounceAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesReceiptRuleBounceAction> {
        java.lang.String message;
        java.lang.Number position;
        java.lang.String sender;
        java.lang.String smtpReplyCode;
        java.lang.String statusCode;
        java.lang.String topicArn;

        /**
         * Sets the value of {@link SesReceiptRuleBounceAction#getMessage}
         * @param message Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#message SesReceiptRule#message}. This parameter is required.
         * @return {@code this}
         */
        public Builder message(java.lang.String message) {
            this.message = message;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleBounceAction#getPosition}
         * @param position Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}. This parameter is required.
         * @return {@code this}
         */
        public Builder position(java.lang.Number position) {
            this.position = position;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleBounceAction#getSender}
         * @param sender Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sender SesReceiptRule#sender}. This parameter is required.
         * @return {@code this}
         */
        public Builder sender(java.lang.String sender) {
            this.sender = sender;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleBounceAction#getSmtpReplyCode}
         * @param smtpReplyCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#smtp_reply_code SesReceiptRule#smtp_reply_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder smtpReplyCode(java.lang.String smtpReplyCode) {
            this.smtpReplyCode = smtpReplyCode;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleBounceAction#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#status_code SesReceiptRule#status_code}.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.String statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleBounceAction#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SesReceiptRuleBounceAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesReceiptRuleBounceAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesReceiptRuleBounceAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesReceiptRuleBounceAction {
        private final java.lang.String message;
        private final java.lang.Number position;
        private final java.lang.String sender;
        private final java.lang.String smtpReplyCode;
        private final java.lang.String statusCode;
        private final java.lang.String topicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.message = software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.position = software.amazon.jsii.Kernel.get(this, "position", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sender = software.amazon.jsii.Kernel.get(this, "sender", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.smtpReplyCode = software.amazon.jsii.Kernel.get(this, "smtpReplyCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.message = java.util.Objects.requireNonNull(builder.message, "message is required");
            this.position = java.util.Objects.requireNonNull(builder.position, "position is required");
            this.sender = java.util.Objects.requireNonNull(builder.sender, "sender is required");
            this.smtpReplyCode = java.util.Objects.requireNonNull(builder.smtpReplyCode, "smtpReplyCode is required");
            this.statusCode = builder.statusCode;
            this.topicArn = builder.topicArn;
        }

        @Override
        public final java.lang.String getMessage() {
            return this.message;
        }

        @Override
        public final java.lang.Number getPosition() {
            return this.position;
        }

        @Override
        public final java.lang.String getSender() {
            return this.sender;
        }

        @Override
        public final java.lang.String getSmtpReplyCode() {
            return this.smtpReplyCode;
        }

        @Override
        public final java.lang.String getStatusCode() {
            return this.statusCode;
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("message", om.valueToTree(this.getMessage()));
            data.set("position", om.valueToTree(this.getPosition()));
            data.set("sender", om.valueToTree(this.getSender()));
            data.set("smtpReplyCode", om.valueToTree(this.getSmtpReplyCode()));
            if (this.getStatusCode() != null) {
                data.set("statusCode", om.valueToTree(this.getStatusCode()));
            }
            if (this.getTopicArn() != null) {
                data.set("topicArn", om.valueToTree(this.getTopicArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesReceiptRule.SesReceiptRuleBounceAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesReceiptRuleBounceAction.Jsii$Proxy that = (SesReceiptRuleBounceAction.Jsii$Proxy) o;

            if (!message.equals(that.message)) return false;
            if (!position.equals(that.position)) return false;
            if (!sender.equals(that.sender)) return false;
            if (!smtpReplyCode.equals(that.smtpReplyCode)) return false;
            if (this.statusCode != null ? !this.statusCode.equals(that.statusCode) : that.statusCode != null) return false;
            return this.topicArn != null ? this.topicArn.equals(that.topicArn) : that.topicArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.message.hashCode();
            result = 31 * result + (this.position.hashCode());
            result = 31 * result + (this.sender.hashCode());
            result = 31 * result + (this.smtpReplyCode.hashCode());
            result = 31 * result + (this.statusCode != null ? this.statusCode.hashCode() : 0);
            result = 31 * result + (this.topicArn != null ? this.topicArn.hashCode() : 0);
            return result;
        }
    }
}
