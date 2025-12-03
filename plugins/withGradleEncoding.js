const { withGradleProperties } = require('@expo/config-plugins');

const withGradleEncoding = (config) => {
    return withGradleProperties(config, (config) => {
        const existing = config.modResults.find(
            (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs'
        );

        if (existing) {
            if (!existing.value.includes('-Dfile.encoding=UTF-8')) {
                existing.value += ' -Dfile.encoding=UTF-8';
            }
        } else {
            config.modResults.push({
                type: 'property',
                key: 'org.gradle.jvmargs',
                value: '-Xmx2048m -Dfile.encoding=UTF-8 -XX:MaxMetaspaceSize=512m',
            });
        }

        return config;
    });
};

module.exports = withGradleEncoding;
