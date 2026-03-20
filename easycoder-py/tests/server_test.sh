#!/bin/sh
# server_test.sh
# Tests for server.ecs — run while server.ecs is running in another terminal

BASE=http://localhost:8765
PASS=0
FAIL=0

check() {
    label="$1"
    expected="$2"
    actual="$3"
    if [ "$actual" = "$expected" ]; then
        echo "PASS: $label"
        PASS=$((PASS + 1))
    else
        echo "FAIL: $label"
        echo "      expected: $expected"
        echo "      actual:   $actual"
        FAIL=$((FAIL + 1))
    fi
}

echo "--- GET /hello ---"
got=$(curl -s "$BASE/hello")
check "GET /hello" "Hello from EasyCoder" "$got"

echo "--- GET unknown path ---"
got=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notapath")
check "GET /notapath status 404" "404" "$got"

echo "--- POST echo ---"
got=$(curl -s -X POST -d "hello world" "$BASE/echo")
check "POST echo" "Echo: hello world" "$got"

echo "--- POST empty body ---"
got=$(curl -s -X POST -d "" "$BASE/anything")
check "POST empty body" "Echo: " "$got"

echo ""
echo "Results: $PASS passed, $FAIL failed"

echo ""
echo "--- GET /stop (shuts down script) ---"
curl -s "$BASE/stop"
echo ""
