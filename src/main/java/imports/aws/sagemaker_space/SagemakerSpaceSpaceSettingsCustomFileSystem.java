package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystem")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSettingsCustomFileSystem.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSettingsCustomFileSystem extends software.amazon.jsii.JsiiSerializable {

    /**
     * efs_file_system block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#efs_file_system SagemakerSpace#efs_file_system}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem getEfsFileSystem();

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSettingsCustomFileSystem}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSettingsCustomFileSystem}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSettingsCustomFileSystem> {
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem efsFileSystem;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsCustomFileSystem#getEfsFileSystem}
         * @param efsFileSystem efs_file_system block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#efs_file_system SagemakerSpace#efs_file_system}
         * @return {@code this}
         */
        public Builder efsFileSystem(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem efsFileSystem) {
            this.efsFileSystem = efsFileSystem;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSettingsCustomFileSystem}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSettingsCustomFileSystem build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSettingsCustomFileSystem}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSettingsCustomFileSystem {
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem efsFileSystem;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.efsFileSystem = software.amazon.jsii.Kernel.get(this, "efsFileSystem", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.efsFileSystem = java.util.Objects.requireNonNull(builder.efsFileSystem, "efsFileSystem is required");
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem getEfsFileSystem() {
            return this.efsFileSystem;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("efsFileSystem", om.valueToTree(this.getEfsFileSystem()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystem"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSettingsCustomFileSystem.Jsii$Proxy that = (SagemakerSpaceSpaceSettingsCustomFileSystem.Jsii$Proxy) o;

            return this.efsFileSystem.equals(that.efsFileSystem);
        }

        @Override
        public final int hashCode() {
            int result = this.efsFileSystem.hashCode();
            return result;
        }
    }
}
