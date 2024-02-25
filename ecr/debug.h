#pragma once

#if DEBUG
#define print(...) printf(__VA_ARGS__)
#else
#define print(...)
#endif
