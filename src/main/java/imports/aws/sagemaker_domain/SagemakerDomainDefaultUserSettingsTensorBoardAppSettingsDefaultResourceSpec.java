package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#instance_type SagemakerDomain#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#lifecycle_config_arn SagemakerDomain#lifecycle_config_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLifecycleConfigArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sagemaker_image_arn SagemakerDomain#sagemaker_image_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSagemakerImageArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sagemaker_image_version_alias SagemakerDomain#sagemaker_image_version_alias}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSagemakerImageVersionAlias() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sagemaker_image_version_arn SagemakerDomain#sagemaker_image_version_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSagemakerImageVersionArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec> {
        java.lang.String instanceType;
        java.lang.String lifecycleConfigArn;
        java.lang.String sagemakerImageArn;
        java.lang.String sagemakerImageVersionAlias;
        java.lang.String sagemakerImageVersionArn;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#instance_type SagemakerDomain#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec#getLifecycleConfigArn}
         * @param lifecycleConfigArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#lifecycle_config_arn SagemakerDomain#lifecycle_config_arn}.
         * @return {@code this}
         */
        public Builder lifecycleConfigArn(java.lang.String lifecycleConfigArn) {
            this.lifecycleConfigArn = lifecycleConfigArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec#getSagemakerImageArn}
         * @param sagemakerImageArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sagemaker_image_arn SagemakerDomain#sagemaker_image_arn}.
         * @return {@code this}
         */
        public Builder sagemakerImageArn(java.lang.String sagemakerImageArn) {
            this.sagemakerImageArn = sagemakerImageArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec#getSagemakerImageVersionAlias}
         * @param sagemakerImageVersionAlias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sagemaker_image_version_alias SagemakerDomain#sagemaker_image_version_alias}.
         * @return {@code this}
         */
        public Builder sagemakerImageVersionAlias(java.lang.String sagemakerImageVersionAlias) {
            this.sagemakerImageVersionAlias = sagemakerImageVersionAlias;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec#getSagemakerImageVersionArn}
         * @param sagemakerImageVersionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sagemaker_image_version_arn SagemakerDomain#sagemaker_image_version_arn}.
         * @return {@code this}
         */
        public Builder sagemakerImageVersionArn(java.lang.String sagemakerImageVersionArn) {
            this.sagemakerImageVersionArn = sagemakerImageVersionArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec {
        private final java.lang.String instanceType;
        private final java.lang.String lifecycleConfigArn;
        private final java.lang.String sagemakerImageArn;
        private final java.lang.String sagemakerImageVersionAlias;
        private final java.lang.String sagemakerImageVersionArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecycleConfigArn = software.amazon.jsii.Kernel.get(this, "lifecycleConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sagemakerImageArn = software.amazon.jsii.Kernel.get(this, "sagemakerImageArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sagemakerImageVersionAlias = software.amazon.jsii.Kernel.get(this, "sagemakerImageVersionAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sagemakerImageVersionArn = software.amazon.jsii.Kernel.get(this, "sagemakerImageVersionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceType = builder.instanceType;
            this.lifecycleConfigArn = builder.lifecycleConfigArn;
            this.sagemakerImageArn = builder.sagemakerImageArn;
            this.sagemakerImageVersionAlias = builder.sagemakerImageVersionAlias;
            this.sagemakerImageVersionArn = builder.sagemakerImageVersionArn;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getLifecycleConfigArn() {
            return this.lifecycleConfigArn;
        }

        @Override
        public final java.lang.String getSagemakerImageArn() {
            return this.sagemakerImageArn;
        }

        @Override
        public final java.lang.String getSagemakerImageVersionAlias() {
            return this.sagemakerImageVersionAlias;
        }

        @Override
        public final java.lang.String getSagemakerImageVersionArn() {
            return this.sagemakerImageVersionArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getLifecycleConfigArn() != null) {
                data.set("lifecycleConfigArn", om.valueToTree(this.getLifecycleConfigArn()));
            }
            if (this.getSagemakerImageArn() != null) {
                data.set("sagemakerImageArn", om.valueToTree(this.getSagemakerImageArn()));
            }
            if (this.getSagemakerImageVersionAlias() != null) {
                data.set("sagemakerImageVersionAlias", om.valueToTree(this.getSagemakerImageVersionAlias()));
            }
            if (this.getSagemakerImageVersionArn() != null) {
                data.set("sagemakerImageVersionArn", om.valueToTree(this.getSagemakerImageVersionArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec.Jsii$Proxy) o;

            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.lifecycleConfigArn != null ? !this.lifecycleConfigArn.equals(that.lifecycleConfigArn) : that.lifecycleConfigArn != null) return false;
            if (this.sagemakerImageArn != null ? !this.sagemakerImageArn.equals(that.sagemakerImageArn) : that.sagemakerImageArn != null) return false;
            if (this.sagemakerImageVersionAlias != null ? !this.sagemakerImageVersionAlias.equals(that.sagemakerImageVersionAlias) : that.sagemakerImageVersionAlias != null) return false;
            return this.sagemakerImageVersionArn != null ? this.sagemakerImageVersionArn.equals(that.sagemakerImageVersionArn) : that.sagemakerImageVersionArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceType != null ? this.instanceType.hashCode() : 0;
            result = 31 * result + (this.lifecycleConfigArn != null ? this.lifecycleConfigArn.hashCode() : 0);
            result = 31 * result + (this.sagemakerImageArn != null ? this.sagemakerImageArn.hashCode() : 0);
            result = 31 * result + (this.sagemakerImageVersionAlias != null ? this.sagemakerImageVersionAlias.hashCode() : 0);
            result = 31 * result + (this.sagemakerImageVersionArn != null ? this.sagemakerImageVersionArn.hashCode() : 0);
            return result;
        }
    }
}
