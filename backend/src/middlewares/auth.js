import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Vérifie si l'utilisateur est connecté (possède un token valide)
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Syntaxe "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Accès refusé : Token manquant" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token invalide ou expiré" });
        }
        
        req.user = user; // Contient l'id et le role injectés lors du login
        next();
    });
};

// Vérifie si l'utilisateur possède le bon rôle pour cette action
export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Accès interdit : rôle(s) requis [${roles}]` 
            });
        }
        next();
    };
};