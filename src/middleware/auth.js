let jwks;
let joseModule;

function removeTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const firstClientURL = String(
  process.env.CLIENT_URL || "http://localhost:3000"
)
  .split(",")[0]
  .trim();

const authIssuer = removeTrailingSlash(
  process.env.BETTER_AUTH_ISSUER || firstClientURL
);

const authAudience = removeTrailingSlash(
  process.env.BETTER_AUTH_AUDIENCE || authIssuer
);

const jwksURL =
  process.env.BETTER_AUTH_JWKS_URL ||
  `${authIssuer}/api/auth/jwks`;

async function getJose() {
  if (!joseModule) {
    joseModule = import("jose");
  }

  return joseModule;
}

async function getJwks() {
  if (!jwks) {
    const { createRemoteJWKSet } = await getJose();

    jwks = createRemoteJWKSet(
      new URL(jwksURL)
    );
  }

  return jwks;
}

async function verifyToken(request, response, next) {
  const authorization =
    request.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return response.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return response.status(401).json({
      message: "Authentication token is missing",
    });
  }

  try {
    const { jwtVerify } = await getJose();

    const { payload } = await jwtVerify(
      token,
      await getJwks(),
      {
        issuer: authIssuer,
        audience: authAudience,
      }
    );

    if (!payload.email) {
      return response.status(401).json({
        message: "Authenticated email is missing",
      });
    }

    request.user = {
      id: String(payload.id || payload.sub || ""),
      email: String(payload.email)
        .trim()
        .toLowerCase(),
      name: String(
        payload.name || "Student"
      ).trim(),
    };

    next();
  } catch (error) {
    console.error(
      "JWT verification failed:",
      error.code || error.message
    );

    return response.status(401).json({
      message: "Invalid or expired access token",
    });
  }
}

module.exports = {
  verifyToken,
};