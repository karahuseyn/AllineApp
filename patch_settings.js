const fs = require('fs');
const path = 'android/settings.gradle';
try {
    let content = fs.readFileSync(path, 'utf8');
    const newBlock = `pluginManagement {
  def reactNativeGradlePlugin = new File(rootDir, "../node_modules/@react-native/gradle-plugin")
  includeBuild(reactNativeGradlePlugin)
  
  def expoPluginsPath = new File(rootDir, "../node_modules/expo-modules-autolinking/android/expo-gradle-plugin")
  includeBuild(expoPluginsPath)
}`;
    // Regex to match the pluginManagement block
    // We match from pluginManagement { up to the closing brace of that block.
    // Since there are nested braces, we need to be careful.
    // However, the original block is known.

    const originalBlockRegex = /pluginManagement \{[\s\S]*?includeBuild\(expoPluginsPath\)\s*\}/;

    if (originalBlockRegex.test(content)) {
        content = content.replace(originalBlockRegex, newBlock);
        fs.writeFileSync(path, content);
        console.log("Successfully patched settings.gradle");
    } else {
        console.error("Could not find pluginManagement block to replace");
        process.exit(1);
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}
