package imports.aws.ses_receipt_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRuleS3Action")
@software.amazon.jsii.Jsii.Proxy(SesReceiptRuleS3Action.Jsii$Proxy.class)
public interface SesReceiptRuleS3Action extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bucket_name SesReceiptRule#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPosition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#iam_role_arn SesReceiptRule#iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#kms_key_arn SesReceiptRule#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#object_key_prefix SesReceiptRule#object_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectKeyPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTopicArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesReceiptRuleS3Action}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesReceiptRuleS3Action}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesReceiptRuleS3Action> {
        java.lang.String bucketName;
        java.lang.Number position;
        java.lang.String iamRoleArn;
        java.lang.String kmsKeyArn;
        java.lang.String objectKeyPrefix;
        java.lang.String topicArn;

        /**
         * Sets the value of {@link SesReceiptRuleS3Action#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bucket_name SesReceiptRule#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleS3Action#getPosition}
         * @param position Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#position SesReceiptRule#position}. This parameter is required.
         * @return {@code this}
         */
        public Builder position(java.lang.Number position) {
            this.position = position;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleS3Action#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#iam_role_arn SesReceiptRule#iam_role_arn}.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleS3Action#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#kms_key_arn SesReceiptRule#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleS3Action#getObjectKeyPrefix}
         * @param objectKeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#object_key_prefix SesReceiptRule#object_key_prefix}.
         * @return {@code this}
         */
        public Builder objectKeyPrefix(java.lang.String objectKeyPrefix) {
            this.objectKeyPrefix = objectKeyPrefix;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleS3Action#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#topic_arn SesReceiptRule#topic_arn}.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SesReceiptRuleS3Action}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesReceiptRuleS3Action build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesReceiptRuleS3Action}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesReceiptRuleS3Action {
        private final java.lang.String bucketName;
        private final java.lang.Number position;
        private final java.lang.String iamRoleArn;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String objectKeyPrefix;
        private final java.lang.String topicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.position = software.amazon.jsii.Kernel.get(this, "position", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectKeyPrefix = software.amazon.jsii.Kernel.get(this, "objectKeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.position = java.util.Objects.requireNonNull(builder.position, "position is required");
            this.iamRoleArn = builder.iamRoleArn;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.objectKeyPrefix = builder.objectKeyPrefix;
            this.topicArn = builder.topicArn;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.Number getPosition() {
            return this.position;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getObjectKeyPrefix() {
            return this.objectKeyPrefix;
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

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("position", om.valueToTree(this.getPosition()));
            if (this.getIamRoleArn() != null) {
                data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getObjectKeyPrefix() != null) {
                data.set("objectKeyPrefix", om.valueToTree(this.getObjectKeyPrefix()));
            }
            if (this.getTopicArn() != null) {
                data.set("topicArn", om.valueToTree(this.getTopicArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesReceiptRule.SesReceiptRuleS3Action"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesReceiptRuleS3Action.Jsii$Proxy that = (SesReceiptRuleS3Action.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!position.equals(that.position)) return false;
            if (this.iamRoleArn != null ? !this.iamRoleArn.equals(that.iamRoleArn) : that.iamRoleArn != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.objectKeyPrefix != null ? !this.objectKeyPrefix.equals(that.objectKeyPrefix) : that.objectKeyPrefix != null) return false;
            return this.topicArn != null ? this.topicArn.equals(that.topicArn) : that.topicArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.position.hashCode());
            result = 31 * result + (this.iamRoleArn != null ? this.iamRoleArn.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.objectKeyPrefix != null ? this.objectKeyPrefix.hashCode() : 0);
            result = 31 * result + (this.topicArn != null ? this.topicArn.hashCode() : 0);
            return result;
        }
    }
}
