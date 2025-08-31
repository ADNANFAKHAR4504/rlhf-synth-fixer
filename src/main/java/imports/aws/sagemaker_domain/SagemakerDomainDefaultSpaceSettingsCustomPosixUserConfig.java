package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#gid SagemakerDomain#gid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getGid();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#uid SagemakerDomain#uid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getUid();

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig> {
        java.lang.Number gid;
        java.lang.Number uid;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig#getGid}
         * @param gid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#gid SagemakerDomain#gid}. This parameter is required.
         * @return {@code this}
         */
        public Builder gid(java.lang.Number gid) {
            this.gid = gid;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig#getUid}
         * @param uid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#uid SagemakerDomain#uid}. This parameter is required.
         * @return {@code this}
         */
        public Builder uid(java.lang.Number uid) {
            this.uid = uid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig {
        private final java.lang.Number gid;
        private final java.lang.Number uid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gid = software.amazon.jsii.Kernel.get(this, "gid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uid = software.amazon.jsii.Kernel.get(this, "uid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gid = java.util.Objects.requireNonNull(builder.gid, "gid is required");
            this.uid = java.util.Objects.requireNonNull(builder.uid, "uid is required");
        }

        @Override
        public final java.lang.Number getGid() {
            return this.gid;
        }

        @Override
        public final java.lang.Number getUid() {
            return this.uid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("gid", om.valueToTree(this.getGid()));
            data.set("uid", om.valueToTree(this.getUid()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig.Jsii$Proxy) o;

            if (!gid.equals(that.gid)) return false;
            return this.uid.equals(that.uid);
        }

        @Override
        public final int hashCode() {
            int result = this.gid.hashCode();
            result = 31 * result + (this.uid.hashCode());
            return result;
        }
    }
}
