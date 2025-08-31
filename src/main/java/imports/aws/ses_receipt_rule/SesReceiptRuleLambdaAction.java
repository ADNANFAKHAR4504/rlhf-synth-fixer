package imports.aws.ses_receipt_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRuleLambdaAction")
@software.amazon.jsii.Jsii.Proxy(SesReceiptRuleLambdaAction.Jsii$Proxy.class)
public interface SesReceiptRuleLambdaAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#function_arn SesReceiptRule#function_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFunctionArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPosition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#invocation_type SesReceiptRule#invocation_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInvocationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTopicArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesReceiptRuleLambdaAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesReceiptRuleLambdaAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesReceiptRuleLambdaAction> {
        java.lang.String functionArn;
        java.lang.Number position;
        java.lang.String invocationType;
        java.lang.String topicArn;

        /**
         * Sets the value of {@link SesReceiptRuleLambdaAction#getFunctionArn}
         * @param functionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#function_arn SesReceiptRule#function_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder functionArn(java.lang.String functionArn) {
            this.functionArn = functionArn;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleLambdaAction#getPosition}
         * @param position Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}. This parameter is required.
         * @return {@code this}
         */
        public Builder position(java.lang.Number position) {
            this.position = position;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleLambdaAction#getInvocationType}
         * @param invocationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#invocation_type SesReceiptRule#invocation_type}.
         * @return {@code this}
         */
        public Builder invocationType(java.lang.String invocationType) {
            this.invocationType = invocationType;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleLambdaAction#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SesReceiptRuleLambdaAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesReceiptRuleLambdaAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesReceiptRuleLambdaAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesReceiptRuleLambdaAction {
        private final java.lang.String functionArn;
        private final java.lang.Number position;
        private final java.lang.String invocationType;
        private final java.lang.String topicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.functionArn = software.amazon.jsii.Kernel.get(this, "functionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.position = software.amazon.jsii.Kernel.get(this, "position", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.invocationType = software.amazon.jsii.Kernel.get(this, "invocationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.functionArn = java.util.Objects.requireNonNull(builder.functionArn, "functionArn is required");
            this.position = java.util.Objects.requireNonNull(builder.position, "position is required");
            this.invocationType = builder.invocationType;
            this.topicArn = builder.topicArn;
        }

        @Override
        public final java.lang.String getFunctionArn() {
            return this.functionArn;
        }

        @Override
        public final java.lang.Number getPosition() {
            return this.position;
        }

        @Override
        public final java.lang.String getInvocationType() {
            return this.invocationType;
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

            data.set("functionArn", om.valueToTree(this.getFunctionArn()));
            data.set("position", om.valueToTree(this.getPosition()));
            if (this.getInvocationType() != null) {
                data.set("invocationType", om.valueToTree(this.getInvocationType()));
            }
            if (this.getTopicArn() != null) {
                data.set("topicArn", om.valueToTree(this.getTopicArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesReceiptRule.SesReceiptRuleLambdaAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesReceiptRuleLambdaAction.Jsii$Proxy that = (SesReceiptRuleLambdaAction.Jsii$Proxy) o;

            if (!functionArn.equals(that.functionArn)) return false;
            if (!position.equals(that.position)) return false;
            if (this.invocationType != null ? !this.invocationType.equals(that.invocationType) : that.invocationType != null) return false;
            return this.topicArn != null ? this.topicArn.equals(that.topicArn) : that.topicArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.functionArn.hashCode();
            result = 31 * result + (this.position.hashCode());
            result = 31 * result + (this.invocationType != null ? this.invocationType.hashCode() : 0);
            result = 31 * result + (this.topicArn != null ? this.topicArn.hashCode() : 0);
            return result;
        }
    }
}
