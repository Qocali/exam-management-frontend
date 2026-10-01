# Multi-stage build: bir Dockerfile bütün tətbiqlər üçün.
#   docker build -f docker/Dockerfile --build-arg APP=mfe-lessons --target remote -t exam/mfe-lessons .
#   docker build -f docker/Dockerfile --build-arg APP=shell       --target shell  -t exam/shell .
#
# Korporativ mühitdə baza image-ləri daxili registry mirror-undan götürün:
#   --build-arg NODE_IMAGE=<registry>/node:22-alpine --build-arg NGINX_IMAGE=<registry>/nginx:1.27-alpine

ARG NODE_IMAGE=node:22-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

# ---------- build ----------
FROM ${NODE_IMAGE} AS build
WORKDIR /src
# Host-da Node/npm lazım deyil: asılılıqlar konteyner daxilində quraşdırılır.
# Lock fayl varsa təkrarlana bilən `npm ci`, yoxdursa `npm install`.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY . .
ARG APP
RUN test -n "$APP" || (echo "APP build-arg mütləqdir" && exit 1)
RUN npx ng build "$APP" --configuration production

# ---------- remote (mfe-*) ----------
FROM ${NGINX_IMAGE} AS remote
ARG APP
COPY docker/nginx/remote.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/${APP}/browser /usr/share/nginx/html
EXPOSE 80

# ---------- shell (host) ----------
FROM ${NGINX_IMAGE} AS shell
COPY docker/nginx/shell.conf.template /etc/nginx/templates/default.conf.template
COPY docker/shell-entrypoint.sh /docker-entrypoint.d/40-federation-manifest.sh
RUN chmod +x /docker-entrypoint.d/40-federation-manifest.sh
COPY --from=build /src/dist/shell/browser /usr/share/nginx/html
# Default dəyərlər — docker run / compose ilə əvəz olunur.
ENV API_UPSTREAM=http://exam-api:8080 \
    MFE_LESSONS_URL=http://localhost:8081 \
    MFE_STUDENTS_URL=http://localhost:8082 \
    MFE_EXAMS_URL=http://localhost:8083
EXPOSE 80
