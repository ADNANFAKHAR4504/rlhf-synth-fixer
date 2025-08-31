package imports.aws.ses_receipt_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRuleSnsAction")
@software.amazon.jsii.Jsii.Proxy(SesReceiptRuleSnsAction.Jsii$Proxy.class)
public interface SesReceiptRuleSnsAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPosition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#encoding SesReceiptRule#encoding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncoding() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesReceiptRuleSnsAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesReceiptRuleSnsAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesReceiptRuleSnsAction> {
        java.lang.Number position;
        java.lang.String topicArn;
        java.lang.String encoding;

        /**
         * Sets the value of {@link SesReceiptRuleSnsAction#getPosition}
         * @param position Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}. This parameter is required.
         * @return {@code this}
         */
        public Builder position(java.lang.Number position) {
            this.position = position;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleSnsAction#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleSnsAction#getEncoding}
         * @param encoding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#encoding SesReceiptRule#encoding}.
         * @return {@code this}
         */
        public Builder encoding(java.lang.String encoding) {
            this.encoding = encoding;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SesReceiptRuleSnsAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesReceiptRuleSnsAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesReceiptRuleSnsAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesReceiptRuleSnsAction {
        private final java.lang.Number position;
        private final java.lang.String topicArn;
        private final java.lang.String encoding;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.position = software.amazon.jsii.Kernel.get(this, "position", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encoding = software.amazon.jsii.Kernel.get(this, "encoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.position = java.util.Objects.requireNonNull(builder.position, "position is required");
            this.topicArn = java.util.Objects.requireNonNull(builder.topicArn, "topicArn is required");
            this.encoding = builder.encoding;
        }

        @Override
        public final java.lang.Number getPosition() {
            return this.position;
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
        }

        @Override
        public final java.lang.String getEncoding() {
            return this.encoding;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("position", om.valueToTree(this.getPosition()));
            data.set("topicArn", om.valueToTree(this.getTopicArn()));
            if (this.getEncoding() != null) {
                data.set("encoding", om.valueToTree(this.getEncoding()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesReceiptRule.SesReceiptRuleSnsAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesReceiptRuleSnsAction.Jsii$Proxy that = (SesReceiptRuleSnsAction.Jsii$Proxy) o;

            if (!position.equals(that.position)) return false;
            if (!topicArn.equals(that.topicArn)) return false;
            return this.encoding != null ? this.encoding.equals(that.encoding) : that.encoding == null;
        }

        @Override
        public final int hashCode() {
            int result = this.position.hashCode();
            result = 31 * result + (this.topicArn.hashCode());
            result = 31 * result + (this.encoding != null ? this.encoding.hashCode() : 0);
            return result;
        }
    }
}
