package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_ebs_volume_size_in_gb SagemakerDomain#default_ebs_volume_size_in_gb}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDefaultEbsVolumeSizeInGb();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#maximum_ebs_volume_size_in_gb SagemakerDomain#maximum_ebs_volume_size_in_gb}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaximumEbsVolumeSizeInGb();

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings> {
        java.lang.Number defaultEbsVolumeSizeInGb;
        java.lang.Number maximumEbsVolumeSizeInGb;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings#getDefaultEbsVolumeSizeInGb}
         * @param defaultEbsVolumeSizeInGb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_ebs_volume_size_in_gb SagemakerDomain#default_ebs_volume_size_in_gb}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultEbsVolumeSizeInGb(java.lang.Number defaultEbsVolumeSizeInGb) {
            this.defaultEbsVolumeSizeInGb = defaultEbsVolumeSizeInGb;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings#getMaximumEbsVolumeSizeInGb}
         * @param maximumEbsVolumeSizeInGb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#maximum_ebs_volume_size_in_gb SagemakerDomain#maximum_ebs_volume_size_in_gb}. This parameter is required.
         * @return {@code this}
         */
        public Builder maximumEbsVolumeSizeInGb(java.lang.Number maximumEbsVolumeSizeInGb) {
            this.maximumEbsVolumeSizeInGb = maximumEbsVolumeSizeInGb;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings {
        private final java.lang.Number defaultEbsVolumeSizeInGb;
        private final java.lang.Number maximumEbsVolumeSizeInGb;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultEbsVolumeSizeInGb = software.amazon.jsii.Kernel.get(this, "defaultEbsVolumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumEbsVolumeSizeInGb = software.amazon.jsii.Kernel.get(this, "maximumEbsVolumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultEbsVolumeSizeInGb = java.util.Objects.requireNonNull(builder.defaultEbsVolumeSizeInGb, "defaultEbsVolumeSizeInGb is required");
            this.maximumEbsVolumeSizeInGb = java.util.Objects.requireNonNull(builder.maximumEbsVolumeSizeInGb, "maximumEbsVolumeSizeInGb is required");
        }

        @Override
        public final java.lang.Number getDefaultEbsVolumeSizeInGb() {
            return this.defaultEbsVolumeSizeInGb;
        }

        @Override
        public final java.lang.Number getMaximumEbsVolumeSizeInGb() {
            return this.maximumEbsVolumeSizeInGb;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultEbsVolumeSizeInGb", om.valueToTree(this.getDefaultEbsVolumeSizeInGb()));
            data.set("maximumEbsVolumeSizeInGb", om.valueToTree(this.getMaximumEbsVolumeSizeInGb()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings.Jsii$Proxy) o;

            if (!defaultEbsVolumeSizeInGb.equals(that.defaultEbsVolumeSizeInGb)) return false;
            return this.maximumEbsVolumeSizeInGb.equals(that.maximumEbsVolumeSizeInGb);
        }

        @Override
        public final int hashCode() {
            int result = this.defaultEbsVolumeSizeInGb.hashCode();
            result = 31 * result + (this.maximumEbsVolumeSizeInGb.hashCode());
            return result;
        }
    }
}
