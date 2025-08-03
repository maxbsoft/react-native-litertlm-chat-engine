require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RnLitertlmChatEngine"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/maxbsoft/react-native-litertlm-chat-engine.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp}"
  s.private_header_files = "ios/**/*.h"

  # Add ChatEngineWrapper.xcframework
  s.vendored_frameworks = "ChatEngineWrapper.xcframework"
  
  # Ensure the framework is linked
  s.frameworks = "Foundation"
  
  # Add any additional system frameworks if needed
  # s.frameworks = "Foundation", "CoreFoundation"

  install_modules_dependencies(s)
end
