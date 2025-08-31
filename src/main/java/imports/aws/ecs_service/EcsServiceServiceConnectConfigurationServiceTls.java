package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationServiceTls")
@software.amazon.jsii.Jsii.Proxy(EcsServiceServiceConnectConfigurationServiceTls.Jsii$Proxy.class)
public interface EcsServiceServiceConnectConfigurationServiceTls extends software.amazon.jsii.JsiiSerializable {

    /**
     * issuer_cert_authority block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#issuer_cert_authority EcsService#issuer_cert_authority}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority getIssuerCertAuthority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#kms_key EcsService#kms_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#role_arn EcsService#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceServiceConnectConfigurationServiceTls}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceServiceConnectConfigurationServiceTls}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceServiceConnectConfigurationServiceTls> {
        imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority issuerCertAuthority;
        java.lang.String kmsKey;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationServiceTls#getIssuerCertAuthority}
         * @param issuerCertAuthority issuer_cert_authority block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#issuer_cert_authority EcsService#issuer_cert_authority}
         * @return {@code this}
         */
        public Builder issuerCertAuthority(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority issuerCertAuthority) {
            this.issuerCertAuthority = issuerCertAuthority;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationServiceTls#getKmsKey}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#kms_key EcsService#kms_key}.
         * @return {@code this}
         */
        public Builder kmsKey(java.lang.String kmsKey) {
            this.kmsKey = kmsKey;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationServiceTls#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#role_arn EcsService#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceServiceConnectConfigurationServiceTls}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceServiceConnectConfigurationServiceTls build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceServiceConnectConfigurationServiceTls}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceServiceConnectConfigurationServiceTls {
        private final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority issuerCertAuthority;
        private final java.lang.String kmsKey;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.issuerCertAuthority = software.amazon.jsii.Kernel.get(this, "issuerCertAuthority", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority.class));
            this.kmsKey = software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.issuerCertAuthority = java.util.Objects.requireNonNull(builder.issuerCertAuthority, "issuerCertAuthority is required");
            this.kmsKey = builder.kmsKey;
            this.roleArn = builder.roleArn;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority getIssuerCertAuthority() {
            return this.issuerCertAuthority;
        }

        @Override
        public final java.lang.String getKmsKey() {
            return this.kmsKey;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("issuerCertAuthority", om.valueToTree(this.getIssuerCertAuthority()));
            if (this.getKmsKey() != null) {
                data.set("kmsKey", om.valueToTree(this.getKmsKey()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceServiceConnectConfigurationServiceTls"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceServiceConnectConfigurationServiceTls.Jsii$Proxy that = (EcsServiceServiceConnectConfigurationServiceTls.Jsii$Proxy) o;

            if (!issuerCertAuthority.equals(that.issuerCertAuthority)) return false;
            if (this.kmsKey != null ? !this.kmsKey.equals(that.kmsKey) : that.kmsKey != null) return false;
            return this.roleArn != null ? this.roleArn.equals(that.roleArn) : that.roleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.issuerCertAuthority.hashCode();
            result = 31 * result + (this.kmsKey != null ? this.kmsKey.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            return result;
        }
    }
}
