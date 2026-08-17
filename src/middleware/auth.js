let jwks;
let joseModule;

async function getJose(){
  if(!joseModule) joseModule = import("jose");
  return joseModule;
}

async function getJwks(){
  const authOrigin = String(process.env.CLIENT_URL || "http://localhost:3001").split(",")[0].trim();
  const url = process.env.BETTER_AUTH_JWKS_URL || `${authOrigin}/api/auth/jwks`;
  const { createRemoteJWKSet } = await getJose();
  if(!jwks) jwks = createRemoteJWKSet(new URL(url));
  return jwks;
}

async function verifyToken(req,res,next){
  const header = req.headers.authorization || "";
  if(!header.startsWith("Bearer ")) return res.status(401).json({ message:"Authentication required" });
  try{
    const { jwtVerify } = await getJose();
    const authOrigin = process.env.BETTER_AUTH_ISSUER || String(process.env.CLIENT_URL || "http://localhost:3001").split(",")[0].trim();
    const audience = process.env.BETTER_AUTH_AUDIENCE || authOrigin;
    const { payload } = await jwtVerify(header.slice(7), await getJwks(), { issuer: authOrigin, audience });
    if(!payload.email) return res.status(401).json({ message:"Authenticated email is missing" });
    req.user = {
      id: String(payload.id || payload.sub || ""),
      email: String(payload.email).trim().toLowerCase(),
      name: String(payload.name || "Student").trim(),
    };
    next();
  }catch{
    return res.status(401).json({ message:"Invalid or expired access token" });
  }
}
module.exports = { verifyToken };
