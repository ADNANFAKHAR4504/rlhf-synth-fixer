package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.343Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSettingsSpaceStorageSettings.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSettingsSpaceStorageSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * ebs_storage_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_storage_settings SagemakerSpace#ebs_storage_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings getEbsStorageSettings();

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSettingsSpaceStorageSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSettingsSpaceStorageSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSettingsSpaceStorageSettings> {
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings ebsStorageSettings;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsSpaceStorageSettings#getEbsStorageSettings}
         * @param ebsStorageSettings ebs_storage_settings block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_storage_settings SagemakerSpace#ebs_storage_settings}
         * @return {@code this}
         */
        public Builder ebsStorageSettings(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings ebsStorageSettings) {
            this.ebsStorageSettings = ebsStorageSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSettingsSpaceStorageSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSettingsSpaceStorageSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSettingsSpaceStorageSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSettingsSpaceStorageSettings {
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings ebsStorageSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ebsStorageSettings = software.amazon.jsii.Kernel.get(this, "ebsStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ebsStorageSettings = java.util.Objects.requireNonNull(builder.ebsStorageSettings, "ebsStorageSettings is required");
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings getEbsStorageSettings() {
            return this.ebsStorageSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ebsStorageSettings", om.valueToTree(this.getEbsStorageSettings()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSettingsSpaceStorageSettings.Jsii$Proxy that = (SagemakerSpaceSpaceSettingsSpaceStorageSettings.Jsii$Proxy) o;

            return this.ebsStorageSettings.equals(that.ebsStorageSettings);
        }

        @Override
        public final int hashCode() {
            int result = this.ebsStorageSettings.hashCode();
            return result;
        }
    }
}
