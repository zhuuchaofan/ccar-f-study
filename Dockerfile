# Cloud Run image: Next.js standalone server, Firestore storage.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 is an optionalDependency (local dev only). It needs Python and a C++ compiler to build, which this image
# does not have, so npm skips it here; production uses Firestore and never loads it.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=8080 STORAGE=firestore NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/data/questions_en.json /app/data/syllabus_ja.json ./data/
COPY --from=build /app/content ./content
USER node
EXPOSE 8080
CMD ["node", "server.js"]
