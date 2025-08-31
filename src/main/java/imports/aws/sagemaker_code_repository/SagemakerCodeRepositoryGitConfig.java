package imports.aws.sagemaker_code_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerCodeRepository.SagemakerCodeRepositoryGitConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerCodeRepositoryGitConfig.Jsii$Proxy.class)
public interface SagemakerCodeRepositoryGitConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_code_repository#repository_url SagemakerCodeRepository#repository_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepositoryUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_code_repository#branch SagemakerCodeRepository#branch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBranch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_code_repository#secret_arn SagemakerCodeRepository#secret_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerCodeRepositoryGitConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerCodeRepositoryGitConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerCodeRepositoryGitConfig> {
        java.lang.String repositoryUrl;
        java.lang.String branch;
        java.lang.String secretArn;

        /**
         * Sets the value of {@link SagemakerCodeRepositoryGitConfig#getRepositoryUrl}
         * @param repositoryUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_code_repository#repository_url SagemakerCodeRepository#repository_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder repositoryUrl(java.lang.String repositoryUrl) {
            this.repositoryUrl = repositoryUrl;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerCodeRepositoryGitConfig#getBranch}
         * @param branch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_code_repository#branch SagemakerCodeRepository#branch}.
         * @return {@code this}
         */
        public Builder branch(java.lang.String branch) {
            this.branch = branch;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerCodeRepositoryGitConfig#getSecretArn}
         * @param secretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_code_repository#secret_arn SagemakerCodeRepository#secret_arn}.
         * @return {@code this}
         */
        public Builder secretArn(java.lang.String secretArn) {
            this.secretArn = secretArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerCodeRepositoryGitConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerCodeRepositoryGitConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerCodeRepositoryGitConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerCodeRepositoryGitConfig {
        private final java.lang.String repositoryUrl;
        private final java.lang.String branch;
        private final java.lang.String secretArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryUrl = software.amazon.jsii.Kernel.get(this, "repositoryUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.branch = software.amazon.jsii.Kernel.get(this, "branch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretArn = software.amazon.jsii.Kernel.get(this, "secretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryUrl = java.util.Objects.requireNonNull(builder.repositoryUrl, "repositoryUrl is required");
            this.branch = builder.branch;
            this.secretArn = builder.secretArn;
        }

        @Override
        public final java.lang.String getRepositoryUrl() {
            return this.repositoryUrl;
        }

        @Override
        public final java.lang.String getBranch() {
            return this.branch;
        }

        @Override
        public final java.lang.String getSecretArn() {
            return this.secretArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryUrl", om.valueToTree(this.getRepositoryUrl()));
            if (this.getBranch() != null) {
                data.set("branch", om.valueToTree(this.getBranch()));
            }
            if (this.getSecretArn() != null) {
                data.set("secretArn", om.valueToTree(this.getSecretArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerCodeRepository.SagemakerCodeRepositoryGitConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerCodeRepositoryGitConfig.Jsii$Proxy that = (SagemakerCodeRepositoryGitConfig.Jsii$Proxy) o;

            if (!repositoryUrl.equals(that.repositoryUrl)) return false;
            if (this.branch != null ? !this.branch.equals(that.branch) : that.branch != null) return false;
            return this.secretArn != null ? this.secretArn.equals(that.secretArn) : that.secretArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryUrl.hashCode();
            result = 31 * result + (this.branch != null ? this.branch.hashCode() : 0);
            result = 31 * result + (this.secretArn != null ? this.secretArn.hashCode() : 0);
            return result;
        }
    }
}
