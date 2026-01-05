#include "crow.h"

int main() {
    crow::SimpleApp app;
    app.port(3000).run();
}
