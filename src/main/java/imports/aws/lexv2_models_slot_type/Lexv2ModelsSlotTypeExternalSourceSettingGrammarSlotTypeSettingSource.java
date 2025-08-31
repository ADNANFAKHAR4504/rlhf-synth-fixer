package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.813Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#kms_key_arn Lexv2ModelsSlotType#kms_key_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_bucket_name Lexv2ModelsSlotType#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_object_key Lexv2ModelsSlotType#s3_object_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3ObjectKey();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource> {
        java.lang.String kmsKeyArn;
        java.lang.String s3BucketName;
        java.lang.String s3ObjectKey;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#kms_key_arn Lexv2ModelsSlotType#kms_key_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_bucket_name Lexv2ModelsSlotType#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource#getS3ObjectKey}
         * @param s3ObjectKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_object_key Lexv2ModelsSlotType#s3_object_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3ObjectKey(java.lang.String s3ObjectKey) {
            this.s3ObjectKey = s3ObjectKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource {
        private final java.lang.String kmsKeyArn;
        private final java.lang.String s3BucketName;
        private final java.lang.String s3ObjectKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ObjectKey = software.amazon.jsii.Kernel.get(this, "s3ObjectKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyArn = java.util.Objects.requireNonNull(builder.kmsKeyArn, "kmsKeyArn is required");
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.s3ObjectKey = java.util.Objects.requireNonNull(builder.s3ObjectKey, "s3ObjectKey is required");
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3ObjectKey() {
            return this.s3ObjectKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            data.set("s3ObjectKey", om.valueToTree(this.getS3ObjectKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource.Jsii$Proxy that = (Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource.Jsii$Proxy) o;

            if (!kmsKeyArn.equals(that.kmsKeyArn)) return false;
            if (!s3BucketName.equals(that.s3BucketName)) return false;
            return this.s3ObjectKey.equals(that.s3ObjectKey);
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyArn.hashCode();
            result = 31 * result + (this.s3BucketName.hashCode());
            result = 31 * result + (this.s3ObjectKey.hashCode());
            return result;
        }
    }
}
