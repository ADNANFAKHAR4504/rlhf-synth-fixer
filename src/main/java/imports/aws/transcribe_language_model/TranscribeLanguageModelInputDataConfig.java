package imports.aws.transcribe_language_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.557Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transcribeLanguageModel.TranscribeLanguageModelInputDataConfig")
@software.amazon.jsii.Jsii.Proxy(TranscribeLanguageModelInputDataConfig.Jsii$Proxy.class)
public interface TranscribeLanguageModelInputDataConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transcribe_language_model#data_access_role_arn TranscribeLanguageModel#data_access_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataAccessRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transcribe_language_model#s3_uri TranscribeLanguageModel#s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Uri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transcribe_language_model#tuning_data_s3_uri TranscribeLanguageModel#tuning_data_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTuningDataS3Uri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TranscribeLanguageModelInputDataConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TranscribeLanguageModelInputDataConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TranscribeLanguageModelInputDataConfig> {
        java.lang.String dataAccessRoleArn;
        java.lang.String s3Uri;
        java.lang.String tuningDataS3Uri;

        /**
         * Sets the value of {@link TranscribeLanguageModelInputDataConfig#getDataAccessRoleArn}
         * @param dataAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transcribe_language_model#data_access_role_arn TranscribeLanguageModel#data_access_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataAccessRoleArn(java.lang.String dataAccessRoleArn) {
            this.dataAccessRoleArn = dataAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link TranscribeLanguageModelInputDataConfig#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transcribe_language_model#s3_uri TranscribeLanguageModel#s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link TranscribeLanguageModelInputDataConfig#getTuningDataS3Uri}
         * @param tuningDataS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transcribe_language_model#tuning_data_s3_uri TranscribeLanguageModel#tuning_data_s3_uri}.
         * @return {@code this}
         */
        public Builder tuningDataS3Uri(java.lang.String tuningDataS3Uri) {
            this.tuningDataS3Uri = tuningDataS3Uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TranscribeLanguageModelInputDataConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TranscribeLanguageModelInputDataConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TranscribeLanguageModelInputDataConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TranscribeLanguageModelInputDataConfig {
        private final java.lang.String dataAccessRoleArn;
        private final java.lang.String s3Uri;
        private final java.lang.String tuningDataS3Uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataAccessRoleArn = software.amazon.jsii.Kernel.get(this, "dataAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tuningDataS3Uri = software.amazon.jsii.Kernel.get(this, "tuningDataS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataAccessRoleArn = java.util.Objects.requireNonNull(builder.dataAccessRoleArn, "dataAccessRoleArn is required");
            this.s3Uri = java.util.Objects.requireNonNull(builder.s3Uri, "s3Uri is required");
            this.tuningDataS3Uri = builder.tuningDataS3Uri;
        }

        @Override
        public final java.lang.String getDataAccessRoleArn() {
            return this.dataAccessRoleArn;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final java.lang.String getTuningDataS3Uri() {
            return this.tuningDataS3Uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataAccessRoleArn", om.valueToTree(this.getDataAccessRoleArn()));
            data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            if (this.getTuningDataS3Uri() != null) {
                data.set("tuningDataS3Uri", om.valueToTree(this.getTuningDataS3Uri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transcribeLanguageModel.TranscribeLanguageModelInputDataConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TranscribeLanguageModelInputDataConfig.Jsii$Proxy that = (TranscribeLanguageModelInputDataConfig.Jsii$Proxy) o;

            if (!dataAccessRoleArn.equals(that.dataAccessRoleArn)) return false;
            if (!s3Uri.equals(that.s3Uri)) return false;
            return this.tuningDataS3Uri != null ? this.tuningDataS3Uri.equals(that.tuningDataS3Uri) : that.tuningDataS3Uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataAccessRoleArn.hashCode();
            result = 31 * result + (this.s3Uri.hashCode());
            result = 31 * result + (this.tuningDataS3Uri != null ? this.tuningDataS3Uri.hashCode() : 0);
            return result;
        }
    }
}
