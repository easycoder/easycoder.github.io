#pragma once

#if DEBUGGING
#define print(...) printf(__VA_ARGS__)
#else
#define print(...)
#endif