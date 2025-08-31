package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectLogsConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectLogsConfig.Jsii$Proxy.class)
public interface CodebuildProjectLogsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#cloudwatch_logs CodebuildProject#cloudwatch_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs getCloudwatchLogs() {
        return null;
    }

    /**
     * s3_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#s3_logs CodebuildProject#s3_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs getS3Logs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectLogsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectLogsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectLogsConfig> {
        imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs cloudwatchLogs;
        imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs s3Logs;

        /**
         * Sets the value of {@link CodebuildProjectLogsConfig#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#cloudwatch_logs CodebuildProject#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfig#getS3Logs}
         * @param s3Logs s3_logs block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#s3_logs CodebuildProject#s3_logs}
         * @return {@code this}
         */
        public Builder s3Logs(imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs s3Logs) {
            this.s3Logs = s3Logs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectLogsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectLogsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectLogsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectLogsConfig {
        private final imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs cloudwatchLogs;
        private final imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs s3Logs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogs = software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs.class));
            this.s3Logs = software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogs = builder.cloudwatchLogs;
            this.s3Logs = builder.s3Logs;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs getCloudwatchLogs() {
            return this.cloudwatchLogs;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs getS3Logs() {
            return this.s3Logs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogs() != null) {
                data.set("cloudwatchLogs", om.valueToTree(this.getCloudwatchLogs()));
            }
            if (this.getS3Logs() != null) {
                data.set("s3Logs", om.valueToTree(this.getS3Logs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectLogsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectLogsConfig.Jsii$Proxy that = (CodebuildProjectLogsConfig.Jsii$Proxy) o;

            if (this.cloudwatchLogs != null ? !this.cloudwatchLogs.equals(that.cloudwatchLogs) : that.cloudwatchLogs != null) return false;
            return this.s3Logs != null ? this.s3Logs.equals(that.s3Logs) : that.s3Logs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogs != null ? this.cloudwatchLogs.hashCode() : 0;
            result = 31 * result + (this.s3Logs != null ? this.s3Logs.hashCode() : 0);
            return result;
        }
    }
}
