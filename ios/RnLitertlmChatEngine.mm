#import "RnLitertlmChatEngine.h"
#import <React/RCTLog.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTBridge.h>

@interface RnLitertlmChatEngine ()
@end

@implementation RnLitertlmChatEngine

// Global engine handle
static ChatEngineHandle* g_engine_handle = NULL;
static RCTResponseSenderBlock g_response_callback = NULL;
static RCTResponseSenderBlock g_metrics_callback = NULL;
static RnLitertlmChatEngine* g_eventEmitter = NULL;

// C callback functions
void chat_response_callback(const char* response, void* user_data) {
    NSString* responseStr = [NSString stringWithUTF8String:response];
    
    NSLog(@"RnLitertlmChatEngine -> chat_response_callback called with response: %@, g_eventEmitter: %@", responseStr, g_eventEmitter);
    
    if (g_eventEmitter) {
        // Ensure we're dispatching on the main queue for event emitters
        dispatch_async(dispatch_get_main_queue(), ^{
            // Check if this is the end of streaming
            if ([responseStr isEqualToString:@"__STREAMING_DONE__"]) {
                NSLog(@"RnLitertlmChatEngine -> Sending streaming done event");
                [g_eventEmitter sendEventWithName:@"response" body:@{@"response": @"", @"done": @YES}];
            } else {
                NSLog(@"RnLitertlmChatEngine -> Sending streaming token: %@", responseStr);
                [g_eventEmitter sendEventWithName:@"response" body:@{@"response": responseStr, @"done": @NO}];
            }
        });
    } else {
        NSLog(@"RnLitertlmChatEngine -> ERROR: g_eventEmitter is NULL, cannot send token: %@", responseStr);
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    // Store this instance for event emitting
    g_eventEmitter = self;
    NSLog(@"RnLitertlmChatEngine -> getTurboModule called, g_eventEmitter: %@", g_eventEmitter);
    
    return std::make_shared<facebook::react::NativeRnLitertlmChatEngineSpecJSI>(params);
}

// Test function
- (void)testCFunction:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    @try {
        // Call the real C function from ChatEngineWrapper
        int c_result = test_c_function();
        // Add our own 42 to make it 84 if C function returns 42
        int result = c_result + 42;
        resolve(@(result));
    } @catch (NSException *exception) {
        reject(@"TEST_C_FUNCTION_ERROR", exception.reason, nil);
    }
}

// Engine lifecycle
- (void)createEngine:(NSString*)modelPath
         backendType:(double)backendType
           maxTokens:(double)maxTokens
         temperature:(double)temperature
          numThreads:(double)numThreads
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    @try {
        // Clean up existing engine if any
        if (g_engine_handle) {
            chat_engine_destroy(g_engine_handle);
            g_engine_handle = NULL;
        }

        // Get the full path to the model file in the app bundle
        NSString *fullModelPath = [[NSBundle mainBundle] pathForResource:modelPath ofType:nil];
        if (!fullModelPath) {
            reject(@"CREATE_ENGINE_ERROR", [NSString stringWithFormat:@"Model file not found: %@", modelPath], nil);
            return;
        }

        // Create configuration struct
        ChatEngineConfig c_config;
        c_config.model_path = [fullModelPath UTF8String];
        c_config.backend_type = (int)backendType;
        c_config.max_tokens = (int)maxTokens;
        c_config.temperature = (float)temperature;
        c_config.num_threads = (int)numThreads;

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

- (void)destroyEngine:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
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

- (void)isReady:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
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
- (void)generateAsync:(NSString*)inputText
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
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
            (__bridge void*)self  // Use bridged cast for Objective-C to C
        );
        
        if (!success) {
            reject(@"GENERATE_ASYNC_ERROR", @"Failed to start generation", nil);
        } else {
            // Resolve immediately to indicate generation started
            resolve(@{@"status": @"started"});
        }
    } @catch (NSException *exception) {
        reject(@"GENERATE_ASYNC_ERROR", exception.reason, nil);
    }
}

- (void)stopGeneration:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
    @try {
        if (g_engine_handle) {
            chat_engine_stop_generation(g_engine_handle);
        }
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"STOP_GENERATION_ERROR", exception.reason, nil);
    }
}

- (void)isGenerating:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
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
- (void)clearHistory:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
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
- (void)getModelInfo:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    @try {
        if (g_engine_handle) {
            const char* info = chat_engine_get_model_info(g_engine_handle);
            if (info) {
                NSString* infoStr = [NSString stringWithUTF8String:info];
                resolve(infoStr);
            } else {
                resolve(@"No model info available");
            }
        } else {
            resolve(@"Engine not initialized");
        }
    } @catch (NSException *exception) {
        reject(@"GET_MODEL_INFO_ERROR", exception.reason, nil);
    }
}

// Debug functions
- (void)getDebugMessage:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
    @try {
        if (g_engine_handle) {
            const char* message = chat_engine_get_debug_message(g_engine_handle);
            if (message) {
                NSString* messageStr = [NSString stringWithUTF8String:message];
                resolve(messageStr);
            } else {
                resolve(@"No debug message available");
            }
        } else {
            resolve(@"Engine not initialized");
        }
    } @catch (NSException *exception) {
        reject(@"GET_DEBUG_MESSAGE_ERROR", exception.reason, nil);
    }
}

- (void)getDebugHistory:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
    @try {
        if (g_engine_handle) {
            const char* history = chat_engine_get_debug_history(g_engine_handle);
            if (history) {
                NSString* historyStr = [NSString stringWithUTF8String:history];
                resolve(historyStr);
            } else {
                resolve(@"No debug history available");
            }
        } else {
            resolve(@"Engine not initialized");
        }
    } @catch (NSException *exception) {
        reject(@"GET_DEBUG_HISTORY_ERROR", exception.reason, nil);
    }
}

- (void)logFromSwift:(NSString*)message
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    @try {
        const char* message_cstr = [message UTF8String];
        chat_engine_log_from_swift(message_cstr);
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"LOG_FROM_SWIFT_ERROR", exception.reason, nil);
    }
}

- (void)clearDebugHistory:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    @try {
        chat_engine_clear_debug_history();
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"CLEAR_DEBUG_HISTORY_ERROR", exception.reason, nil);
    }
}

+ (NSString *)moduleName {
    return @"RnLitertlmChatEngine";
}

+ (BOOL)requiresMainQueueSetup {
    return YES;  // Required for event emitters
}

// Singleton accessor for global access
+ (instancetype)shared {
    return g_eventEmitter;
}

// Initialize method called during module setup
- (instancetype)init {
    self = [super init];
    if (self) {
        // Set global reference immediately
        g_eventEmitter = self;
        NSLog(@"RnLitertlmChatEngine -> init called, setting g_eventEmitter: %@", g_eventEmitter);
    }
    return self;
}

// Event emitter support methods
- (NSArray<NSString *> *)supportedEvents {
    return @[@"response", @"error"];
}

- (void)startObserving {
    NSLog(@"RnLitertlmChatEngine -> startObserving called");
}

- (void)stopObserving {
    NSLog(@"RnLitertlmChatEngine -> stopObserving called");
}

// TurboModule event emitter methods
- (void)addListener:(NSString *)eventName {
    NSLog(@"RnLitertlmChatEngine -> addListener called for event: %@", eventName);
    // Call the parent implementation to properly register the listener
    [super addListener:eventName];
}

- (void)removeListeners:(double)count {
    NSLog(@"RnLitertlmChatEngine -> removeListeners called with count: %f", count);
    // Call the parent implementation to properly remove listeners
    [super removeListeners:count];
}

@end
