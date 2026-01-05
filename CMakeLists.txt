cmake_minimum_required(VERSION 3.16)
project(crow_server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_subdirectory(third_party/crow)

include_directories(
    third_party/crow/include
    app
)

file(GLOB_RECURSE SOURCES
    main.cpp
    app/**/*.cpp
)

# Optionnel : exclure explicitement les tests Crow
list(FILTER SOURCES EXCLUDE REGEX "third_party/crow/tests/.*")


add_executable(crow_server ${SOURCES})

target_link_libraries(crow_server
    Crow::Crow
)
