#import "RnLitertlmChatEngine.h"
#import <React/RCTLog.h>

@implementation RnLitertlmChatEngine
RCT_EXPORT_MODULE()

// Global engine handle
static ChatEngineHandle* g_engine_handle = NULL;
static RCTResponseSenderBlock g_response_callback = NULL;
static RCTResponseSenderBlock g_metrics_callback = NULL;

// C callback functions
void chat_response_callback(const char* response, void* user_data) {
    if (g_response_callback) {
        NSString* responseStr = [NSString stringWithUTF8String:response];
        g_response_callback(@[@{@"response": responseStr}]);
    }
}

void metrics_callback(
    double total_time_ms,
    double prefill_time_ms, 
    double decode_time_ms,
    double tokens_per_second,
    uint32_t prefill_tokens,
    uint32_t decode_tokens,
    void* user_data
) {
    if (g_metrics_callback) {
        NSDictionary* metrics = @{
            @"totalTimeMs": @(total_time_ms),
            @"prefillTimeMs": @(prefill_time_ms),
            @"decodeTimeMs": @(decode_time_ms),
            @"tokensPerSecond": @(tokens_per_second),
            @"prefillTokens": @(prefill_tokens),
            @"decodeTokens": @(decode_tokens)
        };
        g_metrics_callback(@[metrics]);
    }
}

// Test function
RCT_EXPORT_METHOD(testCFunction:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        int result = test_c_function();
        resolve(@(result));
    } @catch (NSException *exception) {
        reject(@"TEST_C_FUNCTION_ERROR", exception.reason, nil);
    }
}

// Engine lifecycle
RCT_EXPORT_METHOD(createEngine:(NSDictionary*)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        // Clean up existing engine if any
        if (g_engine_handle) {
            chat_engine_destroy(g_engine_handle);
            g_engine_handle = NULL;
        }
        
        // Create configuration struct
        ChatEngineConfig c_config;
        c_config.model_path = [config[@"modelPath"] UTF8String];
        c_config.backend_type = [config[@"backendType"] intValue];
        c_config.max_tokens = [config[@"maxTokens"] intValue];
        c_config.temperature = [config[@"temperature"] floatValue];
        c_config.num_threads = [config[@"numThreads"] intValue];
        
        // Create engine
        g_engine_handle = chat_engine_create(&c_config);
        
        if (g_engine_handle == NULL) {
            reject(@"CREATE_ENGINE_ERROR", @"Failed to create chat engine", nil);
            return;
        }
        
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"CREATE_ENGINE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(destroyEngine:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            chat_engine_destroy(g_engine_handle);
            g_engine_handle = NULL;
        }
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"DESTROY_ENGINE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isReady:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            BOOL ready = chat_engine_is_ready(g_engine_handle);
            resolve(@(ready));
        } else {
            resolve(@NO);
        }
    } @catch (NSException *exception) {
        reject(@"IS_READY_ERROR", exception.reason, nil);
    }
}

// Generation
RCT_EXPORT_METHOD(generateAsync:(NSString*)inputText
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (!g_engine_handle) {
            reject(@"GENERATE_ASYNC_ERROR", @"Engine not initialized", nil);
            return;
        }
        
        const char* input_cstr = [inputText UTF8String];
        BOOL success = chat_engine_generate_async(
            g_engine_handle,
            input_cstr,
            chat_response_callback,
            metrics_callback,
            NULL
        );
        
        if (success) {
            resolve(@YES);
        } else {
            reject(@"GENERATE_ASYNC_ERROR", @"Failed to start generation", nil);
        }
    } @catch (NSException *exception) {
        reject(@"GENERATE_ASYNC_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(stopGeneration:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            chat_engine_stop_generation(g_engine_handle);
        }
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"STOP_GENERATION_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isGenerating:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            BOOL generating = chat_engine_is_generating(g_engine_handle);
            resolve(@(generating));
        } else {
            resolve(@NO);
        }
    } @catch (NSException *exception) {
        reject(@"IS_GENERATING_ERROR", exception.reason, nil);
    }
}

// History management
RCT_EXPORT_METHOD(clearHistory:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            chat_engine_clear_history(g_engine_handle);
        }
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"CLEAR_HISTORY_ERROR", exception.reason, nil);
    }
}

// Model information
RCT_EXPORT_METHOD(getModelInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            const char* model_info = chat_engine_get_model_info(g_engine_handle);
            if (model_info) {
                NSString* modelInfoStr = [NSString stringWithUTF8String:model_info];
                resolve(modelInfoStr);
            } else {
                resolve(@"");
            }
        } else {
            resolve(@"");
        }
    } @catch (NSException *exception) {
        reject(@"GET_MODEL_INFO_ERROR", exception.reason, nil);
    }
}

// Debug functions
RCT_EXPORT_METHOD(getDebugMessage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            const char* debug_msg = chat_engine_get_debug_message(g_engine_handle);
            if (debug_msg) {
                NSString* debugMsgStr = [NSString stringWithUTF8String:debug_msg];
                resolve(debugMsgStr);
            } else {
                resolve(@"");
            }
        } else {
            resolve(@"");
        }
    } @catch (NSException *exception) {
        reject(@"GET_DEBUG_MESSAGE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getDebugHistory:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (g_engine_handle) {
            const char* debug_history = chat_engine_get_debug_history(g_engine_handle);
            if (debug_history) {
                NSString* debugHistoryStr = [NSString stringWithUTF8String:debug_history];
                resolve(debugHistoryStr);
            } else {
                resolve(@"");
            }
        } else {
            resolve(@"");
        }
    } @catch (NSException *exception) {
        reject(@"GET_DEBUG_HISTORY_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(logFromSwift:(NSString*)message
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        const char* message_cstr = [message UTF8String];
        chat_engine_log_from_swift(message_cstr);
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"LOG_FROM_SWIFT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(clearDebugHistory:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        chat_engine_clear_debug_history();
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"CLEAR_DEBUG_HISTORY_ERROR", exception.reason, nil);
    }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRnLitertlmChatEngineSpecJSI>(params);
}

@end
