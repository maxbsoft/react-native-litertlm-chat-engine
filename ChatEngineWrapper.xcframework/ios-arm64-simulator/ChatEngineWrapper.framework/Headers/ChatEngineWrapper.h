//
//  ChatEngineWrapper.h
//  iOS Chat App
//
//  C wrapper for integration with C++ LiteRT-LM engine
//

#ifndef ChatEngineWrapper_h
#define ChatEngineWrapper_h

#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Forward declaration
typedef struct ChatEngineHandle ChatEngineHandle;

// Callback for receiving responses
typedef void (*ChatResponseCallback)(const char* response, void* user_data);

// Callback for performance metrics
typedef void (*MetricsCallback)(
    double total_time_ms,
    double prefill_time_ms, 
    double decode_time_ms,
    double tokens_per_second,
    uint32_t prefill_tokens,
    uint32_t decode_tokens,
    void* user_data
);

// Structure for engine configuration
typedef struct {
    const char* model_path;
    int backend_type; // 0 = CPU, 1 = GPU
    int max_tokens;
    float temperature;
    int num_threads;
} ChatEngineConfig;

// Test function for checking connectivity
int test_c_function(void);

// API functions
ChatEngineHandle* chat_engine_create(const ChatEngineConfig* config);
void chat_engine_destroy(ChatEngineHandle* engine);

// Debug functions
const char* chat_engine_get_debug_message(ChatEngineHandle* engine);
const char* chat_engine_get_debug_history(ChatEngineHandle* engine);
void chat_engine_log_from_swift(const char* message);
void chat_engine_clear_debug_history(void);

bool chat_engine_is_ready(const ChatEngineHandle* engine);

// Response generation (asynchronous)
bool chat_engine_generate_async(
    ChatEngineHandle* engine,
    const char* input_text,
    ChatResponseCallback response_callback,
    MetricsCallback metrics_callback,
    void* user_data
);

// Stop generation
void chat_engine_stop_generation(ChatEngineHandle* engine);

// Check generation status
bool chat_engine_is_generating(const ChatEngineHandle* engine);

// Clear conversation history
void chat_engine_clear_history(ChatEngineHandle* engine);

// Get model information
const char* chat_engine_get_model_info(const ChatEngineHandle* engine);

#ifdef __cplusplus
}
#endif

#endif /* ChatEngineWrapper_h */