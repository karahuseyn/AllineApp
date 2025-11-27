const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const EXIT_MODULE_KT = `package com.anonymous.AllineApp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ExitModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "ExitModule"
    }

    @ReactMethod
    fun exitApp() {
        currentActivity?.finishAndRemoveTask()
    }
}
`;

const EXIT_PACKAGE_KT = `package com.anonymous.AllineApp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ExitPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ExitModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

const withAndroidRemoveTask = (config) => {
    // 1. Write Kotlin files
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const packagePath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'anonymous', 'AllineApp');

            // Ensure directory exists
            if (!fs.existsSync(packagePath)) {
                fs.mkdirSync(packagePath, { recursive: true });
            }

            fs.writeFileSync(path.join(packagePath, 'ExitModule.kt'), EXIT_MODULE_KT);
            fs.writeFileSync(path.join(packagePath, 'ExitPackage.kt'), EXIT_PACKAGE_KT);

            return config;
        },
    ]);

    // 2. Register Package in MainApplication.kt
    config = withMainApplication(config, (config) => {
        const appContents = config.modResults.contents;

        // Check if already registered
        if (appContents.includes('ExitPackage()')) {
            return config;
        }

        // Add import if needed (though same package, so usually not needed, but good practice if package differed)
        // Since it's in the same package com.anonymous.AllineApp, no import needed.

        // Add to getPackages()
        // Pattern: PackageList(this).getPackages().apply { add(MyPackage()) } or similar
        // Or standard RN: packages.add(new MyPackage());

        // In Kotlin MainApplication for Expo, it usually looks like:
        // override fun getPackages(): List<ReactPackage> =
        //   PackageList(this).packages.apply {
        //     // Packages that cannot be autolinked yet can be added manually here, for example:
        //     // add(MyReactNativePackage())
        //   }

        // We look for the comment or the closing brace of the apply block
        const anchor = '// add(MyReactNativePackage())';
        if (appContents.includes(anchor)) {
            config.modResults.contents = appContents.replace(
                anchor,
                `${anchor}\n            add(ExitPackage())`
            );
        } else {
            // Fallback: try to find the PackageList block
            const packageListAnchor = 'PackageList(this).packages.apply {';
            if (appContents.includes(packageListAnchor)) {
                config.modResults.contents = appContents.replace(
                    packageListAnchor,
                    `${packageListAnchor}\n            add(ExitPackage())`
                );
            }
        }

        return config;
    });

    return config;
};

module.exports = withAndroidRemoveTask;
