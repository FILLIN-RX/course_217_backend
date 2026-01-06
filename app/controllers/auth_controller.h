#pragma once

#include <string>
#include <httplib.h>
#include "supabase_client.h"
#include <nlohmann/json.hpp>

class AuthController {
private:
    SupabaseClient& supabase;

public:
    AuthController(SupabaseClient& client) : supabase(client) {}

    // ---------- Sign Up ----------
    nlohmann::json signUp(const std::string& email, const std::string& password) {
        nlohmann::json body = {
            {"email", email},
            {"password", password}
        };

        auto res = supabase.post("/auth/v1/signup", body.dump());
        if (res && res->status == 200) {
            return nlohmann::json::parse(res->body);
        }
        return {{"error", "Failed to sign up"}};
    }

    // ---------- Sign In ----------
    nlohmann::json signIn(const std::string& email, const std::string& password) {
        nlohmann::json body = {
            {"email", email},
            {"password", password}
        };

        auto res = supabase.post("/auth/v1/token?grant_type=password", body.dump());
        if (res && res->status == 200) {
            return nlohmann::json::parse(res->body);
        }
        return {{"error", "Failed to sign in"}};
    }

    // ---------- Verify Token ----------
    bool verifyToken(const std::string& access_token) {
        httplib::Headers headers = {
            {"Authorization", "Bearer " + access_token}
        };
        auto res = supabase.get("/auth/v1/user");
        return res && res->status == 200;
    }
};
