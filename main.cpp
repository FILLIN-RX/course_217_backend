#include <cstdlib>
#include <iostream>
#include <httplib.h>
#include "app/services/supabase_client.h"
#include "app/routes/auth_routes.h"

int main() {
    const char* url = std::getenv("SUPABASE_URL");
    const char* key = std::getenv("SUPABASE_KEY");

    if (!url || !key) {
        std::cerr << "Supabase env variables not set\n";
        return 1;
    }

    SupabaseClient supabase(url, key);
    httplib::Server server;

    // Enregistre toutes les routes Auth
    registerAuthRoutes(server, supabase);

    std::cout << "🚀 Server running on http://localhost:8080\n";
    server.listen("0.0.0.0", 8080);
}
