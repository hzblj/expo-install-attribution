package com.hzblj.expoinstallattribution

import android.os.Handler
import android.os.Looper
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerClient.InstallReferrerResponse
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

class InstallReferrerException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause)

class ExpoInstallAttributionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoInstallAttribution")

    AsyncFunction("getInstallReferrer") { timeoutMs: Int, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val client = InstallReferrerClient.newBuilder(context).build()
      val timeout = Handler(Looper.getMainLooper())
      val isSettled = AtomicBoolean(false)

      fun settle(answer: () -> Unit) {
        if (!isSettled.compareAndSet(false, true)) {
          return
        }

        timeout.removeCallbacksAndMessages(null)

        thread {
          try {
            answer()
          } finally {
            client.endConnection()
          }
        }
      }

      timeout.postDelayed({ settle { promise.reject(timeoutException(timeoutMs)) } }, timeoutMs.toLong())

      client.startConnection(object : InstallReferrerStateListener {
        override fun onInstallReferrerSetupFinished(responseCode: Int) {
          settle {
            when (responseCode) {
              InstallReferrerResponse.OK -> resolveDetails(client, promise)
              InstallReferrerResponse.FEATURE_NOT_SUPPORTED -> promise.resolve(null)
              else -> promise.reject(responseException(responseCode))
            }
          }
        }

        override fun onInstallReferrerServiceDisconnected() {
          settle { promise.reject(disconnectedException()) }
        }
      })
    }
  }

  private fun resolveDetails(client: InstallReferrerClient, promise: Promise) {
    val details = try {
      client.installReferrer
    } catch (error: Exception) {
      promise.reject(
        InstallReferrerException("ERR_INSTALL_REFERRER_READ_FAILED", "Play Install Referrer could not be read", error)
      )
      return
    }

    promise.resolve(
      mapOf(
        "installReferrer" to (details.installReferrer ?: ""),
        "referrerClickTimestampSeconds" to details.referrerClickTimestampSeconds,
        "installBeginTimestampSeconds" to details.installBeginTimestampSeconds,
        "referrerClickTimestampServerSeconds" to details.referrerClickTimestampServerSeconds,
        "installBeginTimestampServerSeconds" to details.installBeginTimestampServerSeconds,
        "installVersion" to details.installVersion,
        "googlePlayInstant" to details.googlePlayInstantParam,
      )
    )
  }

  private fun responseException(responseCode: Int) = when (responseCode) {
    InstallReferrerResponse.SERVICE_UNAVAILABLE -> InstallReferrerException(
      "ERR_INSTALL_REFERRER_SERVICE_UNAVAILABLE",
      "Play Install Referrer service is unavailable"
    )
    InstallReferrerResponse.SERVICE_DISCONNECTED -> disconnectedException()
    InstallReferrerResponse.DEVELOPER_ERROR -> InstallReferrerException(
      "ERR_INSTALL_REFERRER_DEVELOPER_ERROR",
      "Play Install Referrer rejected the request as a developer error"
    )
    InstallReferrerResponse.PERMISSION_ERROR -> InstallReferrerException(
      "ERR_INSTALL_REFERRER_PERMISSION_ERROR",
      "The app is not allowed to bind to the Play Install Referrer service"
    )
    else -> InstallReferrerException(
      "ERR_INSTALL_REFERRER_UNKNOWN_RESPONSE",
      "Play Install Referrer answered with response code $responseCode"
    )
  }

  private fun disconnectedException() = InstallReferrerException(
    "ERR_INSTALL_REFERRER_SERVICE_DISCONNECTED",
    "Play Install Referrer service disconnected before it answered"
  )

  private fun timeoutException(timeoutMs: Int) = InstallReferrerException(
    "ERR_INSTALL_REFERRER_TIMEOUT",
    "Play Install Referrer did not answer within $timeoutMs ms"
  )
}
