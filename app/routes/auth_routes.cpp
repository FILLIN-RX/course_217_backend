#include "auth_routes.h"
#include "../controllers/auth_controller.h"
#include <nlohmann/json.hpp>

void registerAuthRoutes(httplib::Server& server, SupabaseClient& supabase) {
    AuthController authController(supabase);

    // ---------- Signup ----------
    server.Post("/auth/signup", [&](const httplib::Request& req, httplib::Response& res){
        auto body = nlohmann::json::parse(req.body);
        std::string email = body["email"];
        std::string password = body["password"];
        auto result = authController.signUp(email, password);
        res.set_content(result.dump(), "application/json");
    });

    // ---------- Signin ----------
    server.Post("/auth/signin", [&](const httplib::Request& req, httplib::Response& res){
        auto body = nlohmann::json::parse(req.body);
        std::string email = body["email"];
        std::string password = body["password"];
        auto result = authController.signIn(email, password);
        res.set_content(result.dump(), "application/json");
    });
}
