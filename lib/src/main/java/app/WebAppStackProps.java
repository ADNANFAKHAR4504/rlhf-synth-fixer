package app;

import software.amazon.awscdk.StackProps;

/**
 * Properties for the WebAppStack.
 */
public final class WebAppStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private WebAppStackProps(final String environmentSuffix, final StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public WebAppStackProps build() {
            return new WebAppStackProps(environmentSuffix, stackProps);
        }
    }
}