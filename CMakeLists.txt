cmake_minimum_required(VERSION 3.16)
project(test_server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 🔐 Activer HTTPS pour cpp-httplib
add_definitions(-DCPPHTTPLIB_OPENSSL_SUPPORT)

# 🔐 OpenSSL (obligatoire pour https)
find_package(OpenSSL REQUIRED)

include_directories(
    external/httplib
    external/nlohmann_json
    app
)

file(GLOB_RECURSE SOURCES
    main.cpp
    app/**/*.cpp
)

add_executable(test_server ${SOURCES})

# 🔗 Link OpenSSL
target_link_libraries(test_server
    OpenSSL::SSL
    OpenSSL::Crypto
)
