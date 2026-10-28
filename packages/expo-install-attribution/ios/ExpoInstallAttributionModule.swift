import AdServices
import ExpoModulesCore

internal final class AppleAdsTokenNetworkException: Exception {
  override var code: String {
    "ERR_APPLE_ADS_TOKEN_NETWORK"
  }

  override var reason: String {
    "AdServices needs a network connection to create the attribution token"
  }
}

internal final class AppleAdsTokenFailedException: GenericException<String> {
  override var code: String {
    "ERR_APPLE_ADS_TOKEN_FAILED"
  }

  override var reason: String {
    "AdServices could not create the attribution token: \(param)"
  }
}

public class ExpoInstallAttributionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoInstallAttribution")

    AsyncFunction("getAppleAdsAttributionToken") { () throws -> String? in
      do {
        return try AAAttribution.attributionToken()
      } catch let error as AAAttributionError where error.code == .platformNotSupported {
        return nil
      } catch let error as AAAttributionError where error.code == .networkError {
        throw AppleAdsTokenNetworkException()
      } catch {
        throw AppleAdsTokenFailedException(error.localizedDescription)
      }
    }
  }
}
