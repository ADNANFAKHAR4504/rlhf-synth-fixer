package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_artifact_path SagemakerUserProfile#s3_artifact_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ArtifactPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings> {
        java.lang.String s3ArtifactPath;
        java.lang.String s3KmsKeyId;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings#getS3ArtifactPath}
         * @param s3ArtifactPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_artifact_path SagemakerUserProfile#s3_artifact_path}.
         * @return {@code this}
         */
        public Builder s3ArtifactPath(java.lang.String s3ArtifactPath) {
            this.s3ArtifactPath = s3ArtifactPath;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings#getS3KmsKeyId}
         * @param s3KmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.
         * @return {@code this}
         */
        public Builder s3KmsKeyId(java.lang.String s3KmsKeyId) {
            this.s3KmsKeyId = s3KmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings {
        private final java.lang.String s3ArtifactPath;
        private final java.lang.String s3KmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3ArtifactPath = software.amazon.jsii.Kernel.get(this, "s3ArtifactPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KmsKeyId = software.amazon.jsii.Kernel.get(this, "s3KmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3ArtifactPath = builder.s3ArtifactPath;
            this.s3KmsKeyId = builder.s3KmsKeyId;
        }

        @Override
        public final java.lang.String getS3ArtifactPath() {
            return this.s3ArtifactPath;
        }

        @Override
        public final java.lang.String getS3KmsKeyId() {
            return this.s3KmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3ArtifactPath() != null) {
                data.set("s3ArtifactPath", om.valueToTree(this.getS3ArtifactPath()));
            }
            if (this.getS3KmsKeyId() != null) {
                data.set("s3KmsKeyId", om.valueToTree(this.getS3KmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings.Jsii$Proxy) o;

            if (this.s3ArtifactPath != null ? !this.s3ArtifactPath.equals(that.s3ArtifactPath) : that.s3ArtifactPath != null) return false;
            return this.s3KmsKeyId != null ? this.s3KmsKeyId.equals(that.s3KmsKeyId) : that.s3KmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3ArtifactPath != null ? this.s3ArtifactPath.hashCode() : 0;
            result = 31 * result + (this.s3KmsKeyId != null ? this.s3KmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
