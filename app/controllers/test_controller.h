#pragma once
#include "../../external/httplib/httplib.h"
#include "../../external/nlohmann_json/json.hpp"

using json = nlohmann::json;

class TestController {
public:
    static void hello(const httplib::Request& req, httplib::Response& res) {
        json j;
        j["message"] = "Hello world!";
        res.set_content(j.dump(), "application/json");
    }

    static void echo(const httplib::Request& req, httplib::Response& res) {
        json j = json::parse(req.body);
        json response;
        response["received"] = j;
        res.set_content(response.dump(), "application/json");
    }
};
