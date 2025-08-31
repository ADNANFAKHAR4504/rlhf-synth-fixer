package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.313Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#repository_url SagemakerDomain#repository_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepositoryUrl();

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository> {
        java.lang.String repositoryUrl;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository#getRepositoryUrl}
         * @param repositoryUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#repository_url SagemakerDomain#repository_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder repositoryUrl(java.lang.String repositoryUrl) {
            this.repositoryUrl = repositoryUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository {
        private final java.lang.String repositoryUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryUrl = software.amazon.jsii.Kernel.get(this, "repositoryUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryUrl = java.util.Objects.requireNonNull(builder.repositoryUrl, "repositoryUrl is required");
        }

        @Override
        public final java.lang.String getRepositoryUrl() {
            return this.repositoryUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryUrl", om.valueToTree(this.getRepositoryUrl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsJupyterServerAppSettingsCodeRepository.Jsii$Proxy) o;

            return this.repositoryUrl.equals(that.repositoryUrl);
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryUrl.hashCode();
            return result;
        }
    }
}
