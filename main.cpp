#include <cstdlib>
#include <iostream>
#include <httplib.h>
#include "app/services/supabase_client.h"

int main() {
    const char* url = std::getenv("SUPABASE_URL");
    const char* key = std::getenv("SUPABASE_KEY");

    if (!url || !key) {
        std::cerr << "Supabase env variables not set\n";
        return 1;
    }

    SupabaseClient supabase(url, key);

    httplib::Server server;

    // ✅ ROUTE DE TEST
    server.Get("/test-supabase", [&](const httplib::Request&, httplib::Response& res) {
        auto response = supabase.get("/rest/v1/seances?select=*");

        if (response && response->status == 200) {
            res.set_content(response->body, "application/json");
            res.status = 200;
        } else {
            res.set_content("{\"error\":\"Supabase request failed\"}", "application/json");
            res.status = 500;
        }
    });

    std::cout << "🚀 Test server running on http://localhost:8080\n";
    server.listen("0.0.0.0", 8080);

    return 0;
}
