#pragma once

#include <string>
#include <httplib.h>
#include <memory>

class SupabaseClient {
private:
    std::string supabase_url;
    std::string anon_key;

    std::unique_ptr<httplib::SSLClient> client;

public:
    SupabaseClient(const std::string& url, const std::string& key)
        : supabase_url(url), anon_key(key)
    {
        // Supprime "https://"
        std::string host = url;
        if (host.rfind("https://", 0) == 0) {
            host.erase(0, 8);
        }

        client = std::make_unique<httplib::SSLClient>(host.c_str());

        client->set_default_headers({
            {"apikey", anon_key},
            {"Authorization", "Bearer " + anon_key},
            {"Content-Type", "application/json"}
        });
    }

    // ---------- GET ----------
    httplib::Result get(const std::string& endpoint) {
        return client->Get(endpoint.c_str());
    }

    // ---------- POST ----------
    httplib::Result post(const std::string& endpoint, const std::string& body) {
        return client->Post(endpoint.c_str(), body, "application/json");
    }

    // ---------- PATCH ----------
    httplib::Result patch(const std::string& endpoint, const std::string& body) {
        return client->Patch(endpoint.c_str(), body, "application/json");
    }

    // ---------- DELETE ----------
    httplib::Result del(const std::string& endpoint) {
        return client->Delete(endpoint.c_str());
    }
};
