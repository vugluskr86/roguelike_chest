FROM node:24-alpine
WORKDIR /app
COPY analytics-server ./analytics-server
COPY package.json ./package.json
RUN mkdir -p /data
ENV ANALYTICS_DATA_DIR=/data
EXPOSE 8787
CMD ["node", "analytics-server/server.js"]
