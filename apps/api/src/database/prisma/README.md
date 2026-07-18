// This file re-exports the schema from src/database/prisma/ // Prisma CLI reads schema.prisma from:
// 1. prisma/schema.prisma (default) // 2. path specified in package.json "prisma" config

// The actual schema is at: src/database/prisma/schema.prisma // The package.json points Prisma to
it via: // "prisma": { "schema": "src/database/prisma/schema.prisma" }
