#pragma once

#include <httplib.h>
#include "../services/supabase_client.h"

// Déclare la fonction qui enregistrera toutes les routes Auth
void registerAuthRoutes(httplib::Server& server, SupabaseClient& supabase);
