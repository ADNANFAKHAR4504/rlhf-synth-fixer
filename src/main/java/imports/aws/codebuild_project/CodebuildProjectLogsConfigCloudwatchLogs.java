package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectLogsConfigCloudwatchLogs")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectLogsConfigCloudwatchLogs.Jsii$Proxy.class)
public interface CodebuildProjectLogsConfigCloudwatchLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#group_name CodebuildProject#group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#status CodebuildProject#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#stream_name CodebuildProject#stream_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectLogsConfigCloudwatchLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectLogsConfigCloudwatchLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectLogsConfigCloudwatchLogs> {
        java.lang.String groupName;
        java.lang.String status;
        java.lang.String streamName;

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigCloudwatchLogs#getGroupName}
         * @param groupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#group_name CodebuildProject#group_name}.
         * @return {@code this}
         */
        public Builder groupName(java.lang.String groupName) {
            this.groupName = groupName;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigCloudwatchLogs#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#status CodebuildProject#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigCloudwatchLogs#getStreamName}
         * @param streamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#stream_name CodebuildProject#stream_name}.
         * @return {@code this}
         */
        public Builder streamName(java.lang.String streamName) {
            this.streamName = streamName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectLogsConfigCloudwatchLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectLogsConfigCloudwatchLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectLogsConfigCloudwatchLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectLogsConfigCloudwatchLogs {
        private final java.lang.String groupName;
        private final java.lang.String status;
        private final java.lang.String streamName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.groupName = software.amazon.jsii.Kernel.get(this, "groupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.streamName = software.amazon.jsii.Kernel.get(this, "streamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.groupName = builder.groupName;
            this.status = builder.status;
            this.streamName = builder.streamName;
        }

        @Override
        public final java.lang.String getGroupName() {
            return this.groupName;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.String getStreamName() {
            return this.streamName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGroupName() != null) {
                data.set("groupName", om.valueToTree(this.getGroupName()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getStreamName() != null) {
                data.set("streamName", om.valueToTree(this.getStreamName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectLogsConfigCloudwatchLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectLogsConfigCloudwatchLogs.Jsii$Proxy that = (CodebuildProjectLogsConfigCloudwatchLogs.Jsii$Proxy) o;

            if (this.groupName != null ? !this.groupName.equals(that.groupName) : that.groupName != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            return this.streamName != null ? this.streamName.equals(that.streamName) : that.streamName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.groupName != null ? this.groupName.hashCode() : 0;
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.streamName != null ? this.streamName.hashCode() : 0);
            return result;
        }
    }
}
